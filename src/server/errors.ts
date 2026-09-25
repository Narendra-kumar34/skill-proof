/**
 * An error whose message is safe to show the user as-is. Anything else that
 * reaches a Server Action boundary is logged and replaced with a generic message.
 */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

/** SQLSTATE code of a Postgres error, whether raw or wrapped by Drizzle. */
function pgErrorCode(error: unknown): unknown {
  const code = (e: unknown) =>
    typeof e === "object" && e !== null && "code" in e ? e.code : undefined;
  const cause =
    typeof error === "object" && error !== null && "cause" in error
      ? error.cause
      : undefined;
  return code(error) ?? code(cause);
}

/** Postgres unique_violation. */
export const isUniqueViolation = (error: unknown) =>
  pgErrorCode(error) === "23505";

/**
 * Deleting a row that is still referenced. `ON DELETE RESTRICT` raises
 * restrict_violation (23001); `NO ACTION` raises foreign_key_violation (23503).
 */
export const isForeignKeyViolation = (error: unknown) => {
  const code = pgErrorCode(error);
  return code === "23503" || code === "23001";
};
