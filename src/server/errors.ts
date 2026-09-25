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

/** Postgres unique_violation, whether raw or wrapped by Drizzle. */
export function isUniqueViolation(error: unknown): boolean {
  const code = (e: unknown) =>
    typeof e === "object" && e !== null && "code" in e ? e.code : undefined;
  const cause =
    typeof error === "object" && error !== null && "cause" in error
      ? error.cause
      : undefined;
  return code(error) === "23505" || code(cause) === "23505";
}
