import Link from "next/link";
import { Suspense } from "react";

import { MainNav } from "@/components/app-shell/nav-link";
import { UserMenu } from "@/components/app-shell/user-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/config/site";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
          <nav aria-label="Main" className="flex items-center gap-2 sm:gap-6">
            <Link href="/dashboard" className="font-semibold tracking-tight">
              {siteConfig.name}
            </Link>
            <MainNav />
          </nav>
          {/* Reads the session, so it streams in behind its own boundary. */}
          <Suspense fallback={<Skeleton className="h-8 w-28" />}>
            <UserMenu />
          </Suspense>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6">
        {children}
      </div>
    </div>
  );
}
