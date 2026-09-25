import Link from "next/link";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/server/session";

/**
 * Everything under /admin renders inside AdminGate, so non-admins get a 404
 * and never see the admin UI. Each Server Action re-checks the role too.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
      <AdminGate>
        <div className="flex flex-col gap-6">
          <nav
            aria-label="Admin"
            className="flex flex-wrap items-center gap-1 border-b pb-3 text-sm"
          >
            <span className="mr-3 rounded-md bg-foreground px-2 py-0.5 text-xs font-medium text-background">
              Admin
            </span>
            <Link
              href="/admin"
              className="rounded-md px-2 py-1 text-muted-foreground hover:text-foreground"
            >
              Overview
            </Link>
            <Link
              href="/admin/skills"
              className="rounded-md px-2 py-1 text-muted-foreground hover:text-foreground"
            >
              Skills
            </Link>
            <Link
              href="/admin/challenges"
              className="rounded-md px-2 py-1 text-muted-foreground hover:text-foreground"
            >
              Challenges
            </Link>
          </nav>
          {children}
        </div>
      </AdminGate>
    </Suspense>
  );
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}
