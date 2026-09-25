import { timingSafeEqual } from "node:crypto";

import { connection, NextResponse } from "next/server";

import { env } from "@/env";
import { deleteExpiredDemoAccounts } from "@/server/maintenance";

/**
 * Daily housekeeping, triggered by Vercel Cron (see vercel.json), which sends
 * `Authorization: Bearer $CRON_SECRET`. Disabled unless CRON_SECRET is set.
 */
export async function GET(request: Request) {
  // Always run at request time. Without this, a build without CRON_SECRET
  // returns before touching the request and Next prerenders the 404 forever.
  await connection();

  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "Not configured" }, { status: 404 });
  }

  const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await deleteExpiredDemoAccounts();
  return NextResponse.json({ deleted });
}
