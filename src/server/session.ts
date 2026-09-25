import "server-only";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";

/** The narrow user shape exposed to the app; never the raw session. */
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "learner" | "admin";
  isAnonymous: boolean;
};

/**
 * Data access layer entry point: resolves the signed-in user for this request.
 * Deduplicated per request with React `cache`, so any number of components
 * and helpers can call it without extra session lookups.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const { id, name, email, role, isAnonymous } = session.user;
  return {
    id,
    name,
    email,
    role: role === "admin" ? "admin" : "learner",
    isAnonymous: isAnonymous === true,
  };
});

/** For pages and actions that need a signed-in user. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/**
 * For admin-only pages and actions. Non-admins get a 404 rather than a 403
 * so the admin surface is not discoverable.
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") notFound();
  return user;
}
