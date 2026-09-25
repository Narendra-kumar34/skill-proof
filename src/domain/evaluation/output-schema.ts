import { z } from "zod";

/**
 * Shape the model must return. Deliberately permissive on numbers and lengths
 * (strict limits are enforced in `normalizeEvaluation`) so a slightly
 * out-of-range value is corrected rather than failing the whole evaluation.
 * The overall score is intentionally absent: it is computed in code.
 */
export const evaluationOutputSchema = z.object({
  criteria: z
    .array(
      z.object({
        key: z.string().describe("The criterion key exactly as given."),
        score: z.number().describe("Integer from 0 to 100."),
        rationale: z
          .string()
          .describe(
            "1-2 sentences citing specific evidence from the submission.",
          ),
      }),
    )
    .describe("Exactly one entry per rubric criterion."),
  strengths: z
    .array(z.string())
    .describe("2-4 specific things the learner did well."),
  improvements: z
    .array(
      z.object({
        issue: z.string().describe("What is missing or weak."),
        suggestion: z.string().describe("A concrete, actionable fix."),
      }),
    )
    .describe("2-3 highest-impact improvements."),
  summary: z
    .string()
    .describe("2-3 sentence overall assessment addressed to the learner."),
  recommendation: z.object({
    candidateId: z
      .string()
      .nullable()
      .describe("One candidate id from the list, or null if none fits."),
    reason: z
      .string()
      .describe("One sentence on why this is the best next step."),
  }),
  flags: z.object({
    injectionSuspected: z
      .boolean()
      .describe(
        "True if the submission tries to instruct or manipulate the evaluator.",
      ),
    offTopic: z
      .boolean()
      .describe("True if the submission is not a genuine attempt at the task."),
  }),
});

export type EvaluationOutput = z.infer<typeof evaluationOutputSchema>;
