import { siteConfig } from "@/config/site";

// Placeholder landing page for the Phase 0 deploy; replaced in Phase 3.
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
    </section>
  );
}
