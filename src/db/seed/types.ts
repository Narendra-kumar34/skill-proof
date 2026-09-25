import type { RubricAnchors } from "../schema/domain";

export type SeedCriterion = {
  key: string;
  label: string;
  description: string;
  /** Key of a competency defined on the parent skill. */
  competency: string;
  /** Relative weight within the challenge (1-5). */
  weight: number;
  anchors: RubricAnchors;
};

export type SeedChallenge = {
  slug: string;
  title: string;
  summary: string;
  /** Markdown. */
  scenario: string;
  /** Markdown. */
  task: string;
  responseGuidance: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  criteria: SeedCriterion[];
};

export type SeedCompetency = {
  key: string;
  label: string;
  description: string;
};

export type SeedSkill = {
  slug: string;
  name: string;
  summary: string;
  /** Markdown. */
  conceptBrief: string;
  sortOrder: number;
  competencies: SeedCompetency[];
  challenges: SeedChallenge[];
};

/**
 * One pre-evaluated attempt in the demo learner's history. Evaluations are
 * hand-written (not AI-generated) so the demo is deterministic.
 */
export type DemoAttempt = {
  challengeSlug: string;
  /** How long before "now" the attempt was submitted. */
  daysAgo: number;
  content: string;
  /** Keyed by criterion key; every criterion of the challenge must appear. */
  scores: Record<string, { score: number; rationale: string }>;
  strengths: string[];
  improvements: Array<{ issue: string; suggestion: string }>;
  summary: string;
  recommendedChallengeSlug: string | null;
  recommendationReason: string | null;
};
