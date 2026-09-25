import { ClockIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ChallengeStatus } from "@/components/catalog/challenge-status";
import { DifficultyBadge } from "@/components/catalog/difficulty-badge";
import { Markdown } from "@/components/markdown";
import { Breadcrumbs, PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyChallengeStats } from "@/server/queries/activity";
import { getSkillBySlug, type SkillDetail } from "@/server/queries/catalog";
import { getMySkillSummaries } from "@/server/profile";
import { SkillProfilePanel } from "@/components/profile/skill-profile-panel";

export async function generateMetadata({
  params,
}: PageProps<"/skills/[slug]">): Promise<Metadata> {
  const skill = await getSkillBySlug((await params).slug);
  return { title: skill?.name ?? "Skill not found" };
}

export default function SkillPage({ params }: PageProps<"/skills/[slug]">) {
  return (
    <Suspense fallback={<SkillSkeleton />}>
      <SkillView params={params} />
    </Suspense>
  );
}

async function SkillView({
  params,
}: Pick<PageProps<"/skills/[slug]">, "params">) {
  const skill = await getSkillBySlug((await params).slug);
  if (!skill) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={skill.name} description={skill.summary}>
        <Breadcrumbs
          items={[{ label: "Skills", href: "/skills" }, { label: skill.name }]}
        />
      </PageHeader>

      <Suspense fallback={<Skeleton className="h-72 rounded-xl" />}>
        <SkillProfileSection skillId={skill.id} />
      </Suspense>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <section
          aria-labelledby="challenges-heading"
          className="flex flex-col gap-4"
        >
          <h2 id="challenges-heading" className="text-lg font-semibold">
            Challenges
          </h2>
          <Suspense fallback={<ChallengeList skill={skill} />}>
            <ChallengeListWithProgress skill={skill} />
          </Suspense>
        </section>

        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Learn the essentials</CardTitle>
            </CardHeader>
            <CardContent>
              <Markdown className="prose-sm">{skill.conceptBrief}</Markdown>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>What you&apos;re assessed on</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-3 text-sm">
                {skill.competencies.map((c) => (
                  <div key={c.id}>
                    <dt className="font-medium">{c.label}</dt>
                    <dd className="text-muted-foreground">{c.description}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

async function SkillProfileSection({ skillId }: { skillId: string }) {
  const { summaries } = await getMySkillSummaries();
  const summary = summaries.find((s) => s.skill.id === skillId);
  return summary ? <SkillProfilePanel summary={summary} /> : null;
}

async function ChallengeListWithProgress({ skill }: { skill: SkillDetail }) {
  const stats = await getMyChallengeStats();
  return <ChallengeList skill={skill} stats={stats} />;
}

function ChallengeList({
  skill,
  stats,
}: {
  skill: SkillDetail;
  stats?: Awaited<ReturnType<typeof getMyChallengeStats>>;
}) {
  const competencyLabel = new Map(
    skill.competencies.map((c) => [c.id, c.label]),
  );

  return (
    <ol className="flex flex-col gap-3">
      {skill.challenges.map((challenge) => {
        const assessed = [
          ...new Set(
            challenge.criteria.map((c) => competencyLabel.get(c.competencyId)),
          ),
        ].filter(Boolean);

        return (
          <li key={challenge.id}>
            <Link
              href={`/challenges/${challenge.slug}`}
              className="group block rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Card className="gap-3 transition-colors group-hover:border-foreground/20">
                <CardHeader className="gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <DifficultyBadge difficulty={challenge.difficulty} />
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <ClockIcon aria-hidden className="size-3.5" />
                      {challenge.estimatedMinutes} min
                    </span>
                  </div>
                  <CardTitle className="text-base group-hover:underline group-hover:underline-offset-4">
                    {challenge.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {challenge.summary}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    Assesses: {assessed.join(", ")}
                  </span>
                  {stats ? (
                    <ChallengeStatus stats={stats[challenge.id]} />
                  ) : (
                    <Skeleton className="h-4 w-20" />
                  )}
                </CardContent>
              </Card>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function SkillSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}
