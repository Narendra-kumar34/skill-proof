import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const contentStatus = pgEnum("content_status", [
  "draft",
  "published",
  "archived",
]);

export const difficulty = pgEnum("difficulty", [
  "beginner",
  "intermediate",
  "advanced",
]);

/**
 * Submission lifecycle:
 *   draft → submitted → evaluating → evaluated
 *                                  ↘ failed → (retry) → evaluating
 */
export const submissionStatus = pgEnum("submission_status", [
  "draft",
  "submitted",
  "evaluating",
  "evaluated",
  "failed",
]);

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// ---------------------------------------------------------------------------
// Catalog (admin-managed)
// ---------------------------------------------------------------------------

export const skills = pgTable("skills", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  summary: text().notNull(),
  /** Short markdown explainer shown on the skill page (the "Learn" step). */
  conceptBrief: text().notNull(),
  status: contentStatus().notNull().default("draft"),
  sortOrder: integer().notNull().default(0),
  ...timestamps,
});

/**
 * The fixed dimensions a skill is profiled on. Every rubric criterion maps to
 * exactly one competency, which is what lets scores from different challenges
 * be aggregated into a single skill profile.
 */
export const competencies = pgTable(
  "competencies",
  {
    id: uuid().primaryKey().defaultRandom(),
    skillId: uuid()
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    key: text().notNull(),
    label: text().notNull(),
    description: text().notNull(),
    sortOrder: integer().notNull().default(0),
  },
  (t) => [uniqueIndex("competencies_skill_key_idx").on(t.skillId, t.key)],
);

export const challenges = pgTable(
  "challenges",
  {
    id: uuid().primaryKey().defaultRandom(),
    // Restrict: skills with challenges must be archived, not deleted.
    skillId: uuid()
      .notNull()
      .references(() => skills.id, { onDelete: "restrict" }),
    slug: text().notNull().unique(),
    title: text().notNull(),
    /** One-line card summary. */
    summary: text().notNull(),
    /** Markdown: the realistic workplace scenario. */
    scenario: text().notNull(),
    /** Markdown: exactly what the learner must produce. */
    task: text().notNull(),
    /** Guidance on the expected shape of a response. */
    responseGuidance: text().notNull(),
    difficulty: difficulty().notNull(),
    estimatedMinutes: integer().notNull(),
    status: contentStatus().notNull().default("draft"),
    /** Bumped whenever the rubric changes; evaluations record the version used. */
    rubricVersion: integer().notNull().default(1),
    ...timestamps,
  },
  (t) => [
    index("challenges_skill_status_idx").on(t.skillId, t.status),
    check("challenges_minutes_check", sql`${t.estimatedMinutes} > 0`),
  ],
);

export type RubricAnchors = {
  /** What a strong (80-100) response looks like for this criterion. */
  strong: string;
  /** What an adequate (50-79) response looks like. */
  adequate: string;
  /** What a weak (0-49) response looks like. */
  weak: string;
};

export const rubricCriteria = pgTable(
  "rubric_criteria",
  {
    id: uuid().primaryKey().defaultRandom(),
    challengeId: uuid()
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    competencyId: uuid()
      .notNull()
      .references(() => competencies.id, { onDelete: "restrict" }),
    key: text().notNull(),
    label: text().notNull(),
    description: text().notNull(),
    /** Relative weight within the challenge (1-5). */
    weight: integer().notNull().default(1),
    anchors: jsonb().$type<RubricAnchors>().notNull(),
    sortOrder: integer().notNull().default(0),
  },
  (t) => [
    uniqueIndex("rubric_criteria_challenge_key_idx").on(t.challengeId, t.key),
    index("rubric_criteria_competency_idx").on(t.competencyId),
    check("rubric_criteria_weight_check", sql`${t.weight} between 1 and 5`),
  ],
);

// ---------------------------------------------------------------------------
// Learner activity
// ---------------------------------------------------------------------------

export const submissions = pgTable(
  "submissions",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Restrict: challenges with attempts must be archived, not deleted,
    // so learners never lose their evidence.
    challengeId: uuid()
      .notNull()
      .references(() => challenges.id, { onDelete: "restrict" }),
    content: text().notNull().default(""),
    status: submissionStatus().notNull().default("draft"),
    /** 1-based attempt number per user+challenge, assigned on submit. */
    attemptNumber: integer(),
    submittedAt: timestamp({ withTimezone: true }),
    /** Set when an evaluation run starts; used to detect stuck runs. */
    evaluationStartedAt: timestamp({ withTimezone: true }),
    /** User-safe reason for the most recent failed evaluation. */
    failureReason: text(),
    ...timestamps,
  },
  (t) => [
    index("submissions_user_challenge_idx").on(t.userId, t.challengeId),
    index("submissions_user_status_idx").on(t.userId, t.status),
    // At most one open draft per learner per challenge.
    uniqueIndex("submissions_one_draft_idx")
      .on(t.userId, t.challengeId)
      .where(sql`${t.status} = 'draft'`),
    uniqueIndex("submissions_attempt_idx")
      .on(t.userId, t.challengeId, t.attemptNumber)
      .where(sql`${t.attemptNumber} is not null`),
  ],
);

export type CriterionScore = {
  criterionId: string;
  key: string;
  label: string;
  competencyId: string;
  weight: number;
  score: number;
  rationale: string;
};

export type ImprovementPoint = {
  issue: string;
  suggestion: string;
};

export type RubricSnapshot = {
  version: number;
  criteria: Array<{
    id: string;
    key: string;
    label: string;
    description: string;
    competencyId: string;
    weight: number;
    anchors: RubricAnchors;
  }>;
};

export type EvaluationFlags = {
  /** The submission appeared to try to manipulate the evaluator. */
  injectionSuspected: boolean;
  /** The submission did not seriously attempt the task. */
  offTopic: boolean;
};

export const evaluations = pgTable(
  "evaluations",
  {
    id: uuid().primaryKey().defaultRandom(),
    submissionId: uuid()
      .notNull()
      .unique()
      .references(() => submissions.id, { onDelete: "cascade" }),
    /** Weighted mean of criterion scores, computed in code (0-100). */
    overallScore: integer().notNull(),
    criterionScores: jsonb().$type<CriterionScore[]>().notNull(),
    strengths: jsonb().$type<string[]>().notNull(),
    improvements: jsonb().$type<ImprovementPoint[]>().notNull(),
    summary: text().notNull(),
    recommendedChallengeId: uuid().references(() => challenges.id, {
      onDelete: "set null",
    }),
    recommendationReason: text(),
    flags: jsonb().$type<EvaluationFlags>().notNull(),
    // Provenance: which rubric, model and prompt produced this result.
    rubricVersion: integer().notNull(),
    rubricSnapshot: jsonb().$type<RubricSnapshot>().notNull(),
    model: text().notNull(),
    promptVersion: text().notNull(),
    latencyMs: integer(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("evaluations_score_check", sql`${t.overallScore} between 0 and 100`),
  ],
);

// ---------------------------------------------------------------------------
// Relations (for the relational query API)
// ---------------------------------------------------------------------------

export const skillsRelations = relations(skills, ({ many }) => ({
  competencies: many(competencies),
  challenges: many(challenges),
}));

export const competenciesRelations = relations(competencies, ({ one }) => ({
  skill: one(skills, {
    fields: [competencies.skillId],
    references: [skills.id],
  }),
}));

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  skill: one(skills, { fields: [challenges.skillId], references: [skills.id] }),
  criteria: many(rubricCriteria),
  submissions: many(submissions),
}));

export const rubricCriteriaRelations = relations(rubricCriteria, ({ one }) => ({
  challenge: one(challenges, {
    fields: [rubricCriteria.challengeId],
    references: [challenges.id],
  }),
  competency: one(competencies, {
    fields: [rubricCriteria.competencyId],
    references: [competencies.id],
  }),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  user: one(user, { fields: [submissions.userId], references: [user.id] }),
  challenge: one(challenges, {
    fields: [submissions.challengeId],
    references: [challenges.id],
  }),
  evaluation: one(evaluations, {
    fields: [submissions.id],
    references: [evaluations.submissionId],
  }),
}));

export const evaluationsRelations = relations(evaluations, ({ one }) => ({
  submission: one(submissions, {
    fields: [evaluations.submissionId],
    references: [submissions.id],
  }),
  recommendedChallenge: one(challenges, {
    fields: [evaluations.recommendedChallengeId],
    references: [challenges.id],
  }),
}));
