import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Optimistic auth gate: only checks that a session cookie exists, so signed-out
 * visitors are redirected before any rendering. The real session validation
 * happens in the data access layer (`src/server/session.ts`) on every page and
 * Server Action; this is a UX shortcut, not a security boundary.
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const signIn = new URL("/sign-in", request.url);
  const { pathname, search } = request.nextUrl;
  signIn.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/skills/:path*",
    "/challenges/:path*",
    "/history/:path*",
    "/admin/:path*",
  ],
};
