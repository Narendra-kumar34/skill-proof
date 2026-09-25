import { redirect } from "next/navigation";

import { getCurrentUser } from "@/server/session";

/** Sends already-signed-in visitors away from the auth pages. */
export async function RedirectIfSignedIn() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return null;
}
