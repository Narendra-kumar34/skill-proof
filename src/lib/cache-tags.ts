/**
 * Cache tag names in one place so cached reads and invalidations never drift.
 * Tags are stored in plain text: use ids only, never personal data.
 */
export const cacheTags = {
  /** Published catalog: skills, challenges, rubrics. */
  catalog: "catalog",
  /** Everything derived from one learner's submissions and evaluations. */
  userActivity: (userId: string) => `user-activity:${userId}`,
} as const;
