"use server";

import { updateTag } from "next/cache";
import { after } from "next/server";
import { z } from "zod";

import { evaluationConfig } from "@/config/evaluation";
import type { ActionResult } from "@/lib/action-result";
import { cacheTags } from "@/lib/cache-tags";
import { UserFacingError } from "@/server/errors";
import {
  retryEvaluation,
  runEvaluation,
  saveDraft,
  submitForEvaluation,
} from "@/server/evaluation/service";
import { requireUser } from "@/server/session";

const answerSchema = z.object({
  challengeId: z.uuid(),
  content: z.string().max(evaluationConfig.submission.maxLength),
});

const submissionIdSchema = z.object({ submissionId: z.uuid() });

/** Runs an action body, converting failures into a safe ActionResult. */
async function safely<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof UserFacingError) {
      return { ok: false, error: error.message };
    }
    console.error("Server action failed", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export async function saveDraftAction(
  input: z.input<typeof answerSchema>,
): Promise<ActionResult<{ savedAt: string }>> {
  const parsed = answerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid draft." };

  const user = await requireUser();
  return safely(async () => {
    const row = await saveDraft(
      user,
      parsed.data.challengeId,
      parsed.data.content,
    );
    updateTag(cacheTags.userActivity(user.id));
    return { savedAt: row.updatedAt.toISOString() };
  });
}

export async function submitAnswerAction(
  input: z.input<typeof answerSchema>,
): Promise<ActionResult<{ submissionId: string }>> {
  const parsed = answerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid submission." };

  const user = await requireUser();
  const result = await safely(() =>
    submitForEvaluation(user, parsed.data.challengeId, parsed.data.content),
  );
  if (result.ok) {
    const submissionId = result.data;
    // Respond immediately; the evaluation continues after the response.
    after(() => runEvaluation(submissionId));
    updateTag(cacheTags.userActivity(user.id));
    return { ok: true, data: { submissionId } };
  }
  return result;
}

export async function retryEvaluationAction(
  input: z.input<typeof submissionIdSchema>,
): Promise<ActionResult> {
  const parsed = submissionIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid submission." };

  const user = await requireUser();
  const result = await safely(() =>
    retryEvaluation(user, parsed.data.submissionId),
  );
  if (result.ok) {
    after(() => runEvaluation(parsed.data.submissionId));
    updateTag(cacheTags.userActivity(user.id));
  }
  return result;
}
