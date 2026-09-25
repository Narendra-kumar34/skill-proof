/**
 * Returns `target` only if it is a same-origin relative path, otherwise the
 * fallback. Prevents open redirects via `?next=https://evil.example`.
 */
export function safeRedirectPath(
  target: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!target) return fallback;
  // Must be a single-slash absolute path: rejects "//host", "/\host",
  // "https://host" and "javascript:" style values.
  if (!target.startsWith("/") || target.startsWith("//")) return fallback;
  if (target.includes("\\")) return fallback;
  // Reject control characters (e.g. "/\t/evil.example"), which browsers strip.
  if (/[\u0000-\u001f\u007f]/.test(target)) return fallback;
  return target;
}
