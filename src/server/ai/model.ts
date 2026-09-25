import "server-only";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

import { AiNotConfiguredError } from "@/domain/evaluation/errors";
import { env } from "@/env";

export type EvaluationModel = { model: LanguageModel; modelId: string };

/**
 * The model used for evaluations. Resolved per call so a missing key fails
 * one evaluation (retryable) rather than crashing the app at startup.
 */
export async function getEvaluationModel(): Promise<EvaluationModel> {
  if (env.AI_MOCK === "1") {
    const { createMockEvaluationModel } = await import("./mock-model");
    return { model: createMockEvaluationModel(), modelId: "mock" };
  }

  if (!env.GOOGLE_GENERATIVE_AI_API_KEY) throw new AiNotConfiguredError();

  const google = createGoogleGenerativeAI({
    apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
  });
  return { model: google(env.GEMINI_MODEL), modelId: env.GEMINI_MODEL };
}
