/** Uniform return type for Server Actions consumed by client components. */
export type ActionResult<T = void> =
  { ok: true; data: T } | { ok: false; error: string };
