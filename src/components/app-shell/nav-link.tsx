"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { cn } from "@/lib/utils";

const items: Array<{ href: Route; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/skills", label: "Skills" },
];

/**
 * Main navigation with the current section highlighted. Reading the pathname
 * is request data, so the highlighted version streams in behind Suspense and
 * the static shell renders the same links unhighlighted.
 */
export function MainNav() {
  return (
    <Suspense fallback={<NavItems pathname={null} />}>
      <ActiveNavItems />
    </Suspense>
  );
}

function ActiveNavItems() {
  return <NavItems pathname={usePathname()} />;
}

function NavItems({ pathname }: { pathname: string | null }) {
  return (
    <div className="flex items-center gap-1">
      {items.map(({ href, label }) => {
        const active =
          pathname !== null &&
          (pathname === href || pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-2 py-1 text-sm transition-colors",
              active
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
