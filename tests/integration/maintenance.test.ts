import { inArray } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { db } from "@/db";
import { user } from "@/db/schema";
import { deleteExpiredDemoAccounts } from "@/server/maintenance";

import { cleanupTestUsers, createTestUser } from "./helpers";

afterAll(cleanupTestUsers);

describe("demo account cleanup", () => {
  it("deletes only demo accounts past the retention window", async () => {
    const oldDemo = await createTestUser({ isAnonymous: true });
    const newDemo = await createTestUser({ isAnonymous: true });
    const oldLearner = await createTestUser();

    // Pretend "now" is 30 days ahead: both test accounts are then "old".
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const newDemoOnlyCutoff = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    // 3 days ahead: nothing is past the 7-day window yet.
    await deleteExpiredDemoAccounts(newDemoOnlyCutoff);
    let remaining = await db
      .select({ id: user.id })
      .from(user)
      .where(inArray(user.id, [oldDemo.id, newDemo.id, oldLearner.id]));
    expect(remaining).toHaveLength(3);

    // 30 days ahead: demo accounts expire, real learners never do.
    await deleteExpiredDemoAccounts(future);
    remaining = await db
      .select({ id: user.id })
      .from(user)
      .where(inArray(user.id, [oldDemo.id, newDemo.id, oldLearner.id]));
    expect(remaining.map((r) => r.id)).toEqual([oldLearner.id]);
  });
});
