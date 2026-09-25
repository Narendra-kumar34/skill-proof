import type { RubricAnchors } from "@/db/schema/domain";

type ComparableCriterion = {
  key: string;
  label: string;
  description: string;
  competencyId: string;
  weight: number;
  anchors: RubricAnchors;
};

const normalize = (criteria: readonly ComparableCriterion[]) =>
  JSON.stringify(
    [...criteria]
      .map((c) => ({
        key: c.key,
        label: c.label.trim(),
        description: c.description.trim(),
        competencyId: c.competencyId,
        weight: c.weight,
        strong: c.anchors.strong.trim(),
        adequate: c.anchors.adequate.trim(),
        weak: c.anchors.weak.trim(),
      }))
      .sort((a, b) => a.key.localeCompare(b.key)),
  );

/**
 * Whether a rubric edit changes how submissions are graded. Reordering alone
 * doesn't; anything else does and bumps the rubric version, so past
 * evaluations stay tied to the rubric they were scored against.
 */
export function rubricChanged(
  before: readonly ComparableCriterion[],
  after: readonly ComparableCriterion[],
): boolean {
  return normalize(before) !== normalize(after);
}
