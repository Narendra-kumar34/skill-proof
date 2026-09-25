import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { cacheTags } from "@/lib/cache-tags";
import { getSubmissionStatus } from "@/server/evaluation/service";
import { getCurrentUser } from "@/server/session";

const noStore = { "Cache-Control": "no-store" };

/** Polled by the challenge page while an evaluation is in flight. */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/submissions/[id]/status">,
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: noStore },
    );
  }

  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: noStore },
    );
  }

  // Scoped to the current user: another learner's id is simply "not found".
  const status = await getSubmissionStatus(user, id);
  if (!status) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: noStore },
    );
  }
  // Belt and braces: the evaluation run revalidates this tag itself, but make
  // sure the page the client is about to refresh can't show a stale state.
  if (status.status === "evaluated" || status.status === "failed") {
    revalidateTag(cacheTags.userActivity(user.id), { expire: 0 });
  }
  return NextResponse.json(status, { headers: noStore });
}
