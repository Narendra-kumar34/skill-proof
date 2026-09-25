import "server-only";

import { and, eq, lt } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";

export const DEMO_RETENTION_DAYS = 7;

/**
 * Deletes demo (anonymous) accounts older than the retention window. Their
 * sessions, submissions and evaluations cascade with them.
 */
export async function deleteExpiredDemoAccounts(
  now = new Date(),
): Promise<number> {
  const cutoff = new Date(
    now.getTime() - DEMO_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );
  const deleted = await db
    .delete(user)
    .where(and(eq(user.isAnonymous, true), lt(user.createdAt, cutoff)))
    .returning({ id: user.id });
  return deleted.length;
}
