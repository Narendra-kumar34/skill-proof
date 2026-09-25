/** Maps a Better Auth client error to a message that is safe to show. */
export function authErrorMessage(
  error: { status?: number; message?: string } | null | undefined,
): string {
  if (!error) return "Something went wrong. Please try again.";
  if (error.status === 429) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  return error.message || "Something went wrong. Please try again.";
}
