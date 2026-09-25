import { count, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Dashboard" };

// Placeholder for Phase 1 (proves auth + demo data); rebuilt in Phase 4.
export default function DashboardPage() {
  return (
    <Suspense fallback={<Skeleton className="h-24 w-full max-w-md" />}>
      <Welcome />
    </Suspense>
  );
}

async function Welcome() {
  const user = await requireUser();
  const [row] = await db
    .select({ n: count() })
    .from(submissions)
    .where(eq(submissions.userId, user.id));

  return (
    <section className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome, {user.name}
      </h1>
      <p className="text-muted-foreground">
        Role: {user.role} · Submissions: {row?.n ?? 0}
      </p>
    </section>
  );
}
