export type NextAction = {
  kind: "gap" | "recommended" | "continue-draft" | "start";
  slug: string;
  title: string;
  /** Why this is the suggestion, shown to the learner. */
  reason: string;
};

export type NextActionInput = {
  /** Most severe gap first, each with its targeted challenge. */
  gaps: Array<{
    label: string;
    score: number;
    recommendation: { slug: string; title: string; reason: string } | null;
  }>;
  /** Recommendation from the most recent evaluation, if still relevant. */
  latestRecommendation: {
    slug: string;
    title: string;
    reason: string | null;
  } | null;
  drafts: Array<{ slug: string; title: string }>;
  /** Easiest challenge the learner hasn't attempted yet. */
  firstUnattempted: { slug: string; title: string } | null;
};

/**
 * Picks the single most useful thing to do next. Evidence-based suggestions
 * (a detected gap, then the AI's last recommendation) beat generic ones.
 */
export function pickNextAction(input: NextActionInput): NextAction | null {
  const gap = input.gaps.find((g) => g.recommendation);
  if (gap?.recommendation) {
    return {
      kind: "gap",
      slug: gap.recommendation.slug,
      title: gap.recommendation.title,
      reason: `${gap.label} is your weakest area (averaging ${gap.score}). ${gap.recommendation.reason}`,
    };
  }

  if (input.latestRecommendation) {
    return {
      kind: "recommended",
      slug: input.latestRecommendation.slug,
      title: input.latestRecommendation.title,
      reason:
        input.latestRecommendation.reason ??
        "Recommended after your most recent evaluation.",
    };
  }

  const draft = input.drafts[0];
  if (draft) {
    return {
      kind: "continue-draft",
      slug: draft.slug,
      title: draft.title,
      reason: "You have a draft in progress. Pick up where you left off.",
    };
  }

  if (input.firstUnattempted) {
    return {
      kind: "start",
      slug: input.firstUnattempted.slug,
      title: input.firstUnattempted.title,
      reason: "A good first challenge to establish your baseline.",
    };
  }

  return null;
}
