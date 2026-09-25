import Link from "next/link";

import { DemoButton } from "@/components/auth/demo-button";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

// Minimal landing page; the full version lands in Phase 3.
export default function Home() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-4 py-24 sm:px-6">
      <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
        {siteConfig.name}
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        {siteConfig.tagline}
      </h1>
      <p className="max-w-xl text-lg text-pretty text-muted-foreground">
        {siteConfig.description}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <DemoButton size="lg" />
        <Button asChild size="lg" variant="outline">
          <Link href="/sign-in">Sign in</Link>
        </Button>
        <Button asChild size="lg" variant="ghost">
          <Link href="/sign-up">Create account</Link>
        </Button>
      </div>
    </section>
  );
}
