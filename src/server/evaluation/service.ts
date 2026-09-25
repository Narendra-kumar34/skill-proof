import "server-only";

import type { GoogleLanguageModelOptions } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { and, asc, count, eq, gt, lt, max, or, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";

import { evaluationConfig } from "@/config/evaluation";
import { db } from "@/db";
import {
  challenges,
  evaluationRuns,
  evaluations,
  type RubricSnapshot,
  submissions,
} from "@/db/schema";
import { classifyEvaluationError } from "@/domain/evaluation/errors";
import { canRetryEvaluation } from "@/domain/evaluation/lifecycle";
import {
  normalizeEvaluation,
  type NormalizedEvaluation,
} from "@/domain/evaluation/normalize";
import { evaluationOutputSchema } from "@/domain/evaluation/output-schema";
import {
  buildEvaluationPrompt,
  EVALUATION_SYSTEM_PROMPT,
} from "@/domain/evaluation/prompt";
import { checkEvaluationQuota } from "@/domain/evaluation/quota";
import { rankNextChallenges } from "@/domain/evaluation/recommend";
import { cacheTags } from "@/lib/cache-tags";
import { getEvaluationModel } from "@/server/ai/model";
import { isUniqueViolation, UserFacingError } from "@/server/errors";
import type { CurrentUser } from "@/server/session";

const { submission: limits, staleAfterMs } = evaluationConfig;

// ---------------------------------------------------------------------------
// Learner-triggered operations (called from Server Actions)
// ---------------------------------------------------------------------------

async function getPublishedChallenge(challengeId: string) {
  const challenge = await db.query.challenges.findFirst({
    where: and(
      eq(challenges.id, challengeId),
      eq(challenges.status, "published"),
    ),
    columns: { id: true },
  });
  if (!challenge) throw new UserFacingError("This challenge is not available.");
  return challenge;
}

/** Creates or updates the learner's single open draft for a challenge. */
export async function saveDraft(
  user: CurrentUser,
  challengeId: string,
  content: string,
) {
  if (content.length > limits.maxLength) {
    throw new UserFacingError(
      `Your answer can be at most ${limits.maxLength.toLocaleString()} characters.`,
    );
  }
  await getPublishedChallenge(challengeId);

  const [row] = await db
    .insert(submissions)
    .values({ userId: user.id, challengeId, content, status: "draft" })
    .onConflictDoUpdate({
      target: [submissions.userId, submissions.challengeId],
      targetWhere: sql`${submissions.status} = 'draft'`,
      set: { content, updatedAt: new Date() },
    })
    .returning({ id: submissions.id, updatedAt: submissions.updatedAt });
  return row!;
}

/**
 * Turns the draft (or fresh content) into a numbered, immutable attempt and
 * marks it ready for evaluation. The caller schedules `runEvaluation`.
 */
export async function submitForEvaluation(
  user: CurrentUser,
  challengeId: string,
  rawContent: string,
): Promise<string> {
  const content = rawContent.trim();
  if (content.length < limits.minLength) {
    throw new UserFacingError(
      `Please write at least ${limits.minLength} characters so there is something to evaluate.`,
    );
  }
  if (content.length > limits.maxLength) {
    throw new UserFacingError(
      `Your answer can be at most ${limits.maxLength.toLocaleString()} characters.`,
    );
  }
  await getPublishedChallenge(challengeId);
  await assertQuota(user);

  try {
    return await db.transaction(async (tx) => {
      const [latest] = await tx
        .select({ n: max(submissions.attemptNumber) })
        .from(submissions)
        .where(
          and(
            eq(submissions.userId, user.id),
            eq(submissions.challengeId, challengeId),
          ),
        );

      const values = {
        content,
        status: "submitted" as const,
        attemptNumber: (latest?.n ?? 0) + 1,
        submittedAt: new Date(),
        evaluationStartedAt: null,
        failureReason: null,
      };

      // Promote the open draft if there is one, otherwise create the attempt.
      const [promoted] = await tx
        .update(submissions)
        .set(values)
        .where(
          and(
            eq(submissions.userId, user.id),
            eq(submissions.challengeId, challengeId),
            eq(submissions.status, "draft"),
          ),
        )
        .returning({ id: submissions.id });
      if (promoted) return promoted.id;

      const [created] = await tx
        .insert(submissions)
        .values({ userId: user.id, challengeId, ...values })
        .returning({ id: submissions.id });
      return created!.id;
    });
  } catch (error) {
    // Two concurrent submits race for the same attempt number.
    if (isUniqueViolation(error)) {
      throw new UserFacingError("This attempt has already been submitted.");
    }
    throw error;
  }
}

/** Re-queues a failed (or stuck) evaluation. The caller schedules the run. */
export async function retryEvaluation(
  user: CurrentUser,
  submissionId: string,
): Promise<void> {
  const submission = await db.query.submissions.findFirst({
    where: and(
      eq(submissions.id, submissionId),
      eq(submissions.userId, user.id),
    ),
  });
  if (!submission) throw new UserFacingError("Submission not found.");
  if (!canRetryEvaluation(submission, new Date(), staleAfterMs)) {
    throw new UserFacingError("This submission can't be retried right now.");
  }
  await assertQuota(user);

  // Conditional on the status we just read, so concurrent retries can't both win.
  const [row] = await db
    .update(submissions)
    .set({
      status: "submitted",
      evaluationStartedAt: new Date(),
      failureReason: null,
    })
    .where(
      and(
        eq(submissions.id, submissionId),
        eq(submissions.status, submission.status),
      ),
    )
    .returning({ id: submissions.id });
  if (!row) {
    throw new UserFacingError("This submission is already being evaluated.");
  }
}

export type SubmissionStatusView = {
  status: (typeof submissions.$inferSelect)["status"];
  failureReason: string | null;
  canRetry: boolean;
};

/** Lightweight status for polling. Returns null if not the user's submission. */
export async function getSubmissionStatus(
  user: CurrentUser,
  submissionId: string,
): Promise<SubmissionStatusView | null> {
  const submission = await db.query.submissions.findFirst({
    where: and(
      eq(submissions.id, submissionId),
      eq(submissions.userId, user.id),
    ),
    columns: {
      status: true,
      failureReason: true,
      submittedAt: true,
      evaluationStartedAt: true,
    },
  });
  if (!submission) return null;
  return {
    status: submission.status,
    failureReason: submission.failureReason,
    canRetry: canRetryEvaluation(submission, new Date(), staleAfterMs),
  };
}

async function assertQuota(user: CurrentUser) {
  const now = Date.now();
  const [[userRuns], [globalRuns]] = await Promise.all([
    db
      .select({ n: count() })
      .from(evaluationRuns)
      .where(
        and(
          eq(evaluationRuns.userId, user.id),
          gt(evaluationRuns.startedAt, new Date(now - 60 * 60 * 1000)),
        ),
      ),
    db
      .select({ n: count() })
      .from(evaluationRuns)
      .where(gt(evaluationRuns.startedAt, new Date(now - 24 * 60 * 60 * 1000))),
  ]);

  const decision = checkEvaluationQuota(
    {
      userRunsLastHour: userRuns?.n ?? 0,
      globalRunsToday: globalRuns?.n ?? 0,
      isAnonymous: user.isAnonymous,
    },
    evaluationConfig.rateLimits,
  );
  if (!decision.allowed) throw new UserFacingError(decision.message);
}

// ---------------------------------------------------------------------------
// The evaluation run (scheduled with `after()`, never awaited by the user)
// ---------------------------------------------------------------------------

/**
 * Evaluates one submission end to end. Safe to call more than once: the
 * atomic claim below ensures only one run works on a submission at a time,
 * and a stale run can be taken over after `staleAfterMs`.
 */
export async function runEvaluation(submissionId: string): Promise<void> {
  const staleCutoff = new Date(Date.now() - staleAfterMs);
  const [claimed] = await db
    .update(submissions)
    .set({ status: "evaluating", evaluationStartedAt: new Date() })
    .where(
      and(
        eq(submissions.id, submissionId),
        or(
          eq(submissions.status, "submitted"),
          and(
            eq(submissions.status, "evaluating"),
            lt(submissions.evaluationStartedAt, staleCutoff),
          ),
        ),
      ),
    )
    .returning();
  if (!claimed) return; // Already evaluated, or another run owns it.

  const startedAt = Date.now();
  let runId: string | undefined;

  try {
    const { model, modelId } = await getEvaluationModel();
    const [run] = await db
      .insert(evaluationRuns)
      .values({
        submissionId,
        userId: claimed.userId,
        model: modelId,
        promptVersion: evaluationConfig.promptVersion,
      })
      .returning({ id: evaluationRuns.id });
    runId = run!.id;

    const context = await loadEvaluationContext(
      claimed.userId,
      claimed.challengeId,
    );
    const prompt = buildEvaluationPrompt({
      skillName: context.challenge.skill.name,
      challenge: context.challenge,
      criteria: context.challenge.criteria.map((c) => ({
        key: c.key,
        label: c.label,
        description: c.description,
        weight: c.weight,
        competencyLabel: c.competency.label,
        anchors: c.anchors,
      })),
      candidates: context.candidates.map((c) => ({
        alias: c.alias,
        title: c.title,
        difficulty: c.difficulty,
        focus: c.focus,
      })),
      submission: claimed.content,
    });

    let normalized: NormalizedEvaluation | undefined;
    let inputTokens = 0;
    let outputTokens = 0;

    // One extra attempt for malformed output; transient HTTP errors are
    // already retried inside the SDK via `maxRetries`.
    for (let attempt = 1; !normalized; attempt++) {
      try {
        const result = await generateText({
          model,
          system: EVALUATION_SYSTEM_PROMPT,
          prompt,
          output: Output.object({ schema: evaluationOutputSchema }),
          maxRetries: evaluationConfig.aiMaxRetries,
          timeout: evaluationConfig.aiTimeoutMs,
          providerOptions: {
            google: {
              thinkingConfig: { thinkingLevel: "low" },
            } satisfies GoogleLanguageModelOptions,
          },
        });
        inputTokens += result.usage.inputTokens ?? 0;
        outputTokens += result.usage.outputTokens ?? 0;
        normalized = normalizeWithRecommendation(
          result.output,
          context,
          claimed.challengeId,
        );
      } catch (error) {
        if (attempt < 2 && classifyEvaluationError(error).retryInRun) continue;
        throw error;
      }
    }

    const latencyMs = Date.now() - startedAt;
    await db.transaction(async (tx) => {
      await tx
        .insert(evaluations)
        .values({
          submissionId,
          ...normalized,
          rubricVersion: context.challenge.rubricVersion,
          rubricSnapshot: context.rubricSnapshot,
          model: modelId,
          promptVersion: evaluationConfig.promptVersion,
          latencyMs,
        })
        .onConflictDoNothing({ target: evaluations.submissionId });
      await tx
        .update(submissions)
        .set({ status: "evaluated", failureReason: null })
        .where(eq(submissions.id, submissionId));
      await tx
        .update(evaluationRuns)
        .set({
          outcome: "succeeded",
          latencyMs,
          inputTokens,
          outputTokens,
          finishedAt: new Date(),
        })
        .where(eq(evaluationRuns.id, runId!));
    });
  } catch (error) {
    const classified = classifyEvaluationError(error);
    // Log the classification and ids only; never the learner's content.
    console.error("Evaluation failed", {
      submissionId,
      code: classified.code,
      error: error instanceof Error ? error.message : String(error),
    });

    await db
      .update(submissions)
      .set({ status: "failed", failureReason: classified.userMessage })
      .where(
        and(
          eq(submissions.id, submissionId),
          eq(submissions.status, "evaluating"),
        ),
      );
    if (runId) {
      await db
        .update(evaluationRuns)
        .set({
          outcome: "failed",
          errorCode: classified.code,
          latencyMs: Date.now() - startedAt,
          finishedAt: new Date(),
        })
        .where(eq(evaluationRuns.id, runId));
    }
  } finally {
    try {
      revalidateTag(cacheTags.userActivity(claimed.userId), { expire: 0 });
    } catch {
      // Outside a request scope (e.g. scripts); nothing to revalidate.
    }
  }
}

type EvaluationContext = Awaited<ReturnType<typeof loadEvaluationContext>>;

async function loadEvaluationContext(userId: string, challengeId: string) {
  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId),
    with: {
      skill: true,
      criteria: {
        with: { competency: true },
        orderBy: (c) => asc(c.sortOrder),
      },
    },
  });
  if (!challenge) throw new Error(`Challenge ${challengeId} not found`);
  if (challenge.criteria.length === 0) {
    throw new Error(`Challenge ${challengeId} has no rubric criteria`);
  }

  const [skillChallenges, best] = await Promise.all([
    db.query.challenges.findMany({
      where: and(
        eq(challenges.skillId, challenge.skillId),
        eq(challenges.status, "published"),
      ),
      columns: { id: true, title: true, difficulty: true },
      with: {
        criteria: {
          columns: { competencyId: true },
          with: { competency: true },
        },
      },
    }),
    db
      .select({
        challengeId: submissions.challengeId,
        best: max(evaluations.overallScore),
      })
      .from(evaluations)
      .innerJoin(submissions, eq(submissions.id, evaluations.submissionId))
      .where(eq(submissions.userId, userId))
      .groupBy(submissions.challengeId),
  ]);

  const bestScores = new Map(
    best.flatMap((b) => (b.best === null ? [] : [[b.challengeId, b.best]])),
  );

  const catalog = skillChallenges.map((c) => ({
    id: c.id,
    title: c.title,
    difficulty: c.difficulty,
    competencyIds: [...new Set(c.criteria.map((cr) => cr.competencyId))],
    focus: [...new Set(c.criteria.map((cr) => cr.competency.label))],
  }));

  // Offer the model every challenge not yet mastered; the final pick is
  // re-validated against the ranking computed from the actual scores.
  const candidates = catalog
    .filter((c) => (bestScores.get(c.id) ?? 0) < 80)
    .slice(0, evaluationConfig.maxRecommendationCandidates + 1)
    .map((c, i) => ({ ...c, alias: `C${i + 1}` }));

  const rubricSnapshot: RubricSnapshot = {
    version: challenge.rubricVersion,
    criteria: challenge.criteria.map((c) => ({
      id: c.id,
      key: c.key,
      label: c.label,
      description: c.description,
      competencyId: c.competencyId,
      weight: c.weight,
      anchors: c.anchors,
    })),
  };

  return { challenge, catalog, candidates, bestScores, rubricSnapshot };
}

/**
 * Normalizes the output, then constrains the model's recommendation to the
 * deterministic ranking so it can never point at a mastered challenge (or
 * back at this one after a good attempt).
 */
function normalizeWithRecommendation(
  output: Parameters<typeof normalizeEvaluation>[0],
  context: EvaluationContext,
  currentChallengeId: string,
): NormalizedEvaluation {
  const { challenge, catalog, candidates, bestScores } = context;
  const baseCtx = {
    criteria: challenge.criteria.map((c) => ({
      id: c.id,
      key: c.key,
      label: c.label,
      competencyId: c.competencyId,
      weight: c.weight,
    })),
  };

  // First pass computes the real scores that drive the ranking.
  const firstPass = normalizeEvaluation(output, {
    ...baseCtx,
    candidates: [],
    fallback: null,
  });

  const allowed = rankNextChallenges(
    {
      current: {
        id: currentChallengeId,
        difficulty: challenge.difficulty,
        overallScore: firstPass.overallScore,
      },
      criterionScores: firstPass.criterionScores,
      challenges: catalog,
      bestScores,
    },
    catalog.length,
  );
  const allowedIds = new Set(allowed.map((c) => c.id));
  const top = allowed[0];

  return normalizeEvaluation(output, {
    ...baseCtx,
    candidates: candidates
      .filter((c) => allowedIds.has(c.id))
      .map((c) => ({ alias: c.alias, challengeId: c.id })),
    fallback: top ? { challengeId: top.id, reason: top.reason } : null,
  });
}
