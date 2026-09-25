import "server-only";

import { MockLanguageModelV4 } from "ai/test";

import type { EvaluationOutput } from "@/domain/evaluation/output-schema";

/** Put this in a submission to simulate a provider failure (E2E tests). */
export const MOCK_FAIL_MARKER = "[[mock-fail]]";

function hash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

/**
 * Deterministic stand-in for Gemini, enabled with AI_MOCK=1 (never in
 * production). Reads the criterion keys and candidates from the real prompt,
 * so it exercises the same parsing and validation path as the live model.
 */
export function createMockEvaluationModel() {
  return new MockLanguageModelV4({
    doGenerate: async (options) => {
      const prompt = JSON.stringify(options.prompt);
      if (prompt.includes(MOCK_FAIL_MARKER)) {
        throw new Error("Simulated AI provider failure");
      }

      const keys = [...prompt.matchAll(/criterion key=\\"([^"\\]+)\\"/g)].map(
        (m) => m[1]!,
      );
      const candidate =
        /candidate id=\\"([^"\\]+)\\"/.exec(prompt)?.[1] ?? null;

      const output: EvaluationOutput = {
        criteria: keys.map((key) => ({
          key,
          score: 55 + (hash(key + prompt.length) % 40),
          rationale: `Mock rationale for ${key}.`,
        })),
        strengths: ["Clear structure", "Addresses the core task"],
        improvements: [
          {
            issue: "Edge cases are not handled",
            suggestion: "Describe what should happen with ambiguous input.",
          },
          {
            issue: "Output format is loosely specified",
            suggestion: "Define exact fields and allowed values.",
          },
        ],
        summary: "A solid mock evaluation used for automated testing.",
        recommendation: {
          candidateId: candidate,
          reason: "Targets your weakest area.",
        },
        flags: { injectionSuspected: false, offTopic: false },
      };

      return {
        content: [{ type: "text", text: JSON.stringify(output) }],
        finishReason: { unified: "stop", raw: undefined },
        usage: {
          inputTokens: {
            total: 1000,
            noCache: 1000,
            cacheRead: undefined,
            cacheWrite: undefined,
          },
          outputTokens: { total: 300, text: 300, reasoning: undefined },
        },
        warnings: [],
      };
    },
  });
}
