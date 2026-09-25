import { and, count, eq, isNull } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { evaluationConfig } from "@/config/evaluation";
import { db } from "@/db";
import { evaluationRuns, evaluations, submissions } from "@/db/schema";
import { weightedOverall } from "@/domain/scoring";
import { UserFacingError } from "@/server/errors";
import {
  deleteSubmission,
  getSubmissionStatus,
  retryEvaluation,
  runEvaluation,
  saveDraft,
  submitForEvaluation,
} from "@/server/evaluation/service";

import {
  ANSWER,
  cleanupTestUsers,
  createTestUser,
  getSeededChallenge,
} from "./helpers";

let challenge: Awaited<ReturnType<typeof getSeededChallenge>>;

beforeAll(async () => {
  challenge = await getSeededChallenge("customer-feedback-classification");
});
afterAll(cleanupTestUsers);

const getSubmission = (id: string) =>
  db.query.submissions.findFirst({ where: eq(submissions.id, id) });

describe("submission lifecycle", () => {
  it("keeps a single draft per learner and challenge", async () => {
    const u = await createTestUser();
    const a = await saveDraft(u, challenge.id, "first");
    const b = await saveDraft(u, challenge.id, "second");
    expect(b.id).toBe(a.id);
    expect((await getSubmission(a.id))?.content).toBe("second");
  });

  it("evaluates a submission end to end and stores provenance", async () => {
    const u = await createTestUser();
    const id = await submitForEvaluation(u, challenge.id, ANSWER);
    await runEvaluation(id);

    const sub = await getSubmission(id);
    const ev = await db.query.evaluations.findFirst({
      where: eq(evaluations.submissionId, id),
    });
    expect(sub?.status).toBe("evaluated");
    expect(sub?.attemptNumber).toBe(1);
    expect(ev?.criterionScores).toHaveLength(challenge.criteria.length);
    // The overall score is always the code-computed weighted mean.
    expect(ev?.overallScore).toBe(weightedOverall(ev!.criterionScores));
    expect(ev?.rubricSnapshot.version).toBe(challenge.rubricVersion);
    expect(ev?.promptVersion).toBe(evaluationConfig.promptVersion);
  });

  it("numbers repeated attempts and treats evaluated work as final", async () => {
    const u = await createTestUser();
    const first = await submitForEvaluation(u, challenge.id, ANSWER);
    await runEvaluation(first);
    const second = await submitForEvaluation(u, challenge.id, `${ANSWER} v2`);
    expect((await getSubmission(second))?.attemptNumber).toBe(2);
    await expect(retryEvaluation(u, first)).rejects.toThrow(UserFacingError);
  });

  it("runs an evaluation only once even when triggered concurrently", async () => {
    const u = await createTestUser();
    const id = await submitForEvaluation(u, challenge.id, ANSWER);
    await Promise.all([
      runEvaluation(id),
      runEvaluation(id),
      runEvaluation(id),
    ]);

    const [evs] = await db
      .select({ n: count() })
      .from(evaluations)
      .where(eq(evaluations.submissionId, id));
    const [runs] = await db
      .select({ n: count() })
      .from(evaluationRuns)
      .where(eq(evaluationRuns.submissionId, id));
    expect(evs?.n).toBe(1);
    expect(runs?.n).toBe(1);
  });

  it("marks provider failures as retryable without losing the work", async () => {
    const u = await createTestUser();
    const id = await submitForEvaluation(
      u,
      challenge.id,
      `${ANSWER} [[mock-fail]]`,
    );
    await runEvaluation(id);

    const sub = await getSubmission(id);
    expect(sub?.status).toBe("failed");
    expect(sub?.content).toContain("feedback classifier");
    expect(sub?.failureReason).toMatch(/saved/);
    expect((await getSubmissionStatus(u, id))?.canRetry).toBe(true);

    await retryEvaluation(u, id);
    expect((await getSubmission(id))?.status).toBe("submitted");
  });

  it("rejects answers that are too short to evaluate", async () => {
    const u = await createTestUser();
    await expect(
      submitForEvaluation(u, challenge.id, "too short"),
    ).rejects.toThrow(/at least/);
  });
});

describe("authorization", () => {
  it("scopes every submission operation to its owner", async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    const id = await submitForEvaluation(
      owner,
      challenge.id,
      `${ANSWER} [[mock-fail]]`,
    );
    await runEvaluation(id);

    expect(await getSubmissionStatus(other, id)).toBeNull();
    await expect(retryEvaluation(other, id)).rejects.toThrow(/not found/i);
    await expect(deleteSubmission(other, id)).rejects.toThrow(/not found/i);
    expect(await getSubmission(id)).toBeDefined();
  });
});

describe("rate limiting", () => {
  it("enforces the hourly quota, and deleting work doesn't reset it", async () => {
    const u = await createTestUser({ isAnonymous: true });
    const limit = evaluationConfig.rateLimits.perDemoUserPerHour;

    const ids: string[] = [];
    for (let i = 0; i < limit; i++) {
      const id = await submitForEvaluation(u, challenge.id, `${ANSWER} #${i}`);
      await runEvaluation(id);
      ids.push(id);
    }
    await expect(submitForEvaluation(u, challenge.id, ANSWER)).rejects.toThrow(
      /limit/,
    );

    // Deleting attempts keeps the usage records, so the quota still applies.
    for (const id of ids) await deleteSubmission(u, id);
    const [orphaned] = await db
      .select({ n: count() })
      .from(evaluationRuns)
      .where(
        and(
          eq(evaluationRuns.userId, u.id),
          isNull(evaluationRuns.submissionId),
        ),
      );
    expect(orphaned?.n).toBe(limit);
    await expect(submitForEvaluation(u, challenge.id, ANSWER)).rejects.toThrow(
      /limit/,
    );
  });
});
