export type ScoreBand = "strong" | "adequate" | "weak";

/** Mirrors the rubric anchors: strong 80-100, adequate 50-79, weak 0-49. */
export function scoreBand(score: number): ScoreBand {
  if (score >= 80) return "strong";
  if (score >= 50) return "adequate";
  return "weak";
}

export const bandLabel: Record<ScoreBand, string> = {
  strong: "Strong",
  adequate: "Developing",
  weak: "Needs work",
};

/** Signed change between attempts, e.g. "+19" / "−4" / "±0". */
export function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `−${Math.abs(delta)}`;
  return "±0";
}
