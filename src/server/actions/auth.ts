"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { createDemoHistory } from "@/server/demo";
import { getCurrentUser } from "@/server/session";

/**
 * Called right after an anonymous (demo) sign-in. Populates the account with a
 * pre-evaluated history. Only acts on anonymous users and is idempotent.
 */
export async function prepareDemoAccount(): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user?.isAnonymous) return { ok: false };

  try {
    await createDemoHistory(user.id);
    return { ok: true };
  } catch (error) {
    console.error("Failed to prepare demo account", error);
    return { ok: false };
  }
}

export async function signOut(): Promise<void> {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
