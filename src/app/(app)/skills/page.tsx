import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyChallengeStats } from "@/server/queries/activity";
import { getPublishedSkills } from "@/server/queries/catalog";

export const metadata: Metadata = { title: "Skills" };

export default function SkillsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Skills"
        description="Each skill is assessed through realistic workplace challenges. Pick one to practise, get rubric-based feedback, and build evidence of what you can do."
      />
      <Suspense fallback={<SkillGridSkeleton />}>
        <SkillGrid />
      </Suspense>
    </div>
  );
}

async function SkillGrid() {
  const [skills, stats] = await Promise.all([
    getPublishedSkills(),
    getMyChallengeStats(),
  ]);

  if (skills.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        No skills are published yet. Check back soon.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {skills.map((skill) => {
        const total = skill.challenges.length;
        const attempted = skill.challenges.filter(
          (c) => (stats[c.id]?.attempts ?? 0) > 0,
        ).length;
        const minutes = skill.challenges.map((c) => c.estimatedMinutes);

        return (
          <li key={skill.id}>
            <Link
              href={`/skills/${skill.slug}`}
              className="group block h-full rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Card className="h-full transition-colors group-hover:border-foreground/20">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2 text-lg">
                    {skill.name}
                    <ArrowRightIcon
                      aria-hidden
                      className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    />
                  </CardTitle>
                  <p className="text-sm text-pretty text-muted-foreground">
                    {skill.summary}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-wrap content-start gap-1.5">
                  {skill.competencies.map((c) => (
                    <Badge
                      key={c.id}
                      variant="secondary"
                      className="font-normal"
                    >
                      {c.label}
                    </Badge>
                  ))}
                </CardContent>
                <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {total} challenges
                    {minutes.length > 0 &&
                      ` · ${Math.min(...minutes)}–${Math.max(...minutes)} min`}
                  </span>
                  <span
                    className={
                      attempted > 0 ? "font-medium text-foreground" : ""
                    }
                  >
                    {attempted > 0
                      ? `${attempted} of ${total} attempted`
                      : "Not started"}
                  </span>
                </CardFooter>
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function SkillGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-56 rounded-xl" />
      ))}
    </div>
  );
}
