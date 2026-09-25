import { z } from "zod";

/** Validation for admin-authored catalog content (server-enforced). */

const kebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const text = (min: number, max: number) => z.string().trim().min(min).max(max);

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(80)
  .regex(kebab, "Use lowercase letters, numbers and single hyphens");

export const contentStatusSchema = z.enum(["draft", "published", "archived"]);

export const skillInputSchema = z.object({
  name: text(2, 80),
  slug: slugSchema,
  summary: text(10, 300),
  conceptBrief: text(20, 5000),
  status: contentStatusSchema,
  sortOrder: z.coerce.number().int().min(0).max(1000),
});

export const competencyInputSchema = z.object({
  key: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(40)
    .regex(kebab, "Use lowercase letters, numbers and single hyphens"),
  label: text(2, 60),
  description: text(10, 300),
});

export const challengeInputSchema = z.object({
  title: text(5, 120),
  slug: slugSchema,
  summary: text(10, 200),
  scenario: text(50, 8000),
  task: text(20, 4000),
  responseGuidance: text(10, 500),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  estimatedMinutes: z.coerce.number().int().min(5).max(120),
  status: contentStatusSchema,
});

export const criterionInputSchema = z.object({
  /** Present for existing criteria; absent for new ones. */
  id: z.uuid().optional(),
  key: competencyInputSchema.shape.key,
  label: text(2, 80),
  description: text(10, 400),
  competencyId: z.uuid("Choose a competency"),
  weight: z.coerce.number().int().min(1).max(5),
  anchors: z.object({
    strong: text(10, 600),
    adequate: text(10, 600),
    weak: text(10, 600),
  }),
});

export const rubricInputSchema = z
  .array(criterionInputSchema)
  .min(2, "A rubric needs at least 2 criteria")
  .max(8, "A rubric can have at most 8 criteria")
  .superRefine((criteria, ctx) => {
    const seen = new Set<string>();
    criteria.forEach((c, i) => {
      if (seen.has(c.key)) {
        ctx.addIssue({
          code: "custom",
          path: [i, "key"],
          message: `Duplicate key "${c.key}"`,
        });
      }
      seen.add(c.key);
    });
  });

export type SkillInput = z.infer<typeof skillInputSchema>;
export type CompetencyInput = z.infer<typeof competencyInputSchema>;
export type ChallengeInput = z.infer<typeof challengeInputSchema>;
export type CriterionInput = z.infer<typeof criterionInputSchema>;

/** Field errors keyed by field name, for inline form messages. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    out[key] ??= issue.message;
  }
  return out;
}

/** Human-readable list for the rubric editor ("Criterion 2 · label: …"). */
export function rubricErrorMessages(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const [index, ...rest] = issue.path;
    if (typeof index === "number") {
      const field = rest.join(".") || "criterion";
      return `Criterion ${index + 1} · ${field}: ${issue.message}`;
    }
    return issue.message;
  });
}
