export const MAX_NAME_LENGTH = 80;

/**
 * Normalizes a user-supplied display name: strips control characters,
 * collapses whitespace and trims. Returns null if nothing usable remains
 * or it is too long.
 */
export function normalizeDisplayName(raw: string): string | null {
  const name = raw
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (name.length === 0 || name.length > MAX_NAME_LENGTH) return null;
  return name;
}
