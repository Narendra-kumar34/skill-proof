import {
  AlertCircleIcon,
  ArrowRightIcon,
  Loader2Icon,
  PencilLineIcon,
  TargetIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import {
  BandIcon,
  BandLabel,
  ScoreMeter,
} from "@/components/evaluation/score-visuals";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type NextAction, pickNextAction } from "@/domain/next-action";
import { formatDate } from "@/lib/format";
import { getMySkillSummaries, type SkillSummary } from "@/server/profile";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

const NEXT_LABEL: Record<NextAction["kind"], string> = {
  gap: "Close a skill gap",
  recommended: "Recommended for you",
  "continue-draft": "Continue your draft",
  start: "Start here",
};

async function Dashboard() {
  const [user, { catalog, activity, summaries }] = await Promise.all([
    requireUser(),
    getMySkillSummaries(),
  ]);

  const latestScores = summaries[0]?.latestScores ?? new Map<string, number>();
  const evaluated = activity
    .filter((a) => a.status === "evaluated" && a.evaluation)
    .sort(
      (a, b) =>
        (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0),
    );
  const drafts = activity.filter((a) => a.status === "draft");
  const attention = activity.filter((a) =>
    ["failed", "submitted", "evaluating"].includes(a.status),
  );
  const active = summaries.filter((s) => s.profile.attemptedChallenges > 0);
  const notStarted = summaries.filter(
    (s) => s.profile.attemptedChallenges === 0,
  );

  const latestRec = evaluated[0]?.evaluation?.recommendedChallenge;
  const next = pickNextAction({
    gaps: active.flatMap((s) => s.gaps).sort((a, b) => a.score - b.score),
    latestRecommendation:
      latestRec && (latestScores.get(latestRec.id) ?? 0) < 80
        ? {
            slug: latestRec.slug,
            title: latestRec.title,
            reason: evaluated[0]?.evaluation?.recommendationReason ?? null,
          }
        : null,
    drafts: drafts.map((d) => ({
      slug: d.challenge.slug,
      title: d.challenge.title,
    })),
    firstUnattempted:
      catalog
        .flatMap((s) => s.challenges)
        .find((c) => !latestScores.has(c.id)) ?? null,
  });

  const firstName = user.name.split(" ")[0] ?? user.name;

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title={
          evaluated.length > 0
            ? `Welcome back, ${firstName}`
            : `Welcome, ${firstName}`
        }
        description={
          evaluated.length > 0
            ? "Here's what you can demonstrate so far, and what to work on next."
            : "Complete your first challenge to start building evidence of your skills."
        }
      />

      {/* What should I do next? */}
      <section aria-labelledby="next-heading" className="flex flex-col gap-4">
        <h2 id="next-heading" className="sr-only">
          What to do next
        </h2>
        {next && (
          <Card className="border-foreground/15 bg-muted/40">
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <TargetIcon aria-hidden className="mt-1 size-5 shrink-0" />
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {NEXT_LABEL[next.kind]}
                  </p>
                  <p className="text-lg font-semibold">{next.title}</p>
                  <p className="text-sm text-muted-foreground">{next.reason}</p>
                </div>
              </div>
              <Button asChild className="shrink-0">
                <Link href={`/challenges/${next.slug}`}>
                  {next.kind === "continue-draft"
                    ? "Continue"
                    : "Start challenge"}
                  <ArrowRightIcon aria-hidden />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {(attention.length > 0 ||
          (drafts.length > 0 && next?.kind !== "continue-draft")) && (
          <ul className="flex flex-col gap-2">
            {attention.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/challenges/${a.challenge.slug}?attempt=${a.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm hover:bg-muted"
                >
                  <span className="flex items-center gap-2">
                    {a.status === "failed" ? (
                      <AlertCircleIcon
                        aria-hidden
                        className="size-4 text-destructive"
                      />
                    ) : (
                      <Loader2Icon
                        aria-hidden
                        className="size-4 animate-spin"
                      />
                    )}
                    {a.challenge.title} · Attempt {a.attemptNumber}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {a.status === "failed" ? "Needs retry" : "Evaluating"}
                  </span>
                </Link>
              </li>
            ))}
            {next?.kind !== "continue-draft" &&
              drafts.slice(0, 2).map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/challenges/${d.challenge.slug}`}
                    className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm hover:bg-muted"
                  >
                    <span className="flex items-center gap-2">
                      <PencilLineIcon aria-hidden className="size-4" />
                      {d.challenge.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Draft saved {formatDate(d.updatedAt)}
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        )}
      </section>

      {/* How am I performing? */}
      <section aria-labelledby="skills-heading" className="flex flex-col gap-4">
        <h2 id="skills-heading" className="text-lg font-semibold">
          {active.length > 0 ? "Your skills" : "Choose a skill"}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {active.map((s) => (
            <ActiveSkillCard key={s.skill.id} summary={s} />
          ))}
          {notStarted.map((s) => (
            <Link
              key={s.skill.id}
              href={`/skills/${s.skill.slug}`}
              className="group rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Card className="h-full border-dashed transition-colors group-hover:border-foreground/30">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {s.skill.name}
                    <Badge variant="outline" className="font-normal">
                      Not started
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {s.skill.summary}
                  </p>
                </CardHeader>
                <CardFooter className="text-sm text-muted-foreground">
                  {s.skill.challenges.length} challenges · Start with{" "}
                  {s.skill.challenges[0]?.title}
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent evidence */}
      {evaluated.length > 0 && (
        <section
          aria-labelledby="evidence-heading"
          className="flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <h2 id="evidence-heading" className="text-lg font-semibold">
              Recent evidence
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/history">View all</Link>
            </Button>
          </div>
          <Card className="py-2">
            <ul className="divide-y">
              {evaluated.slice(0, 5).map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/challenges/${a.challenge.slug}?attempt=${a.id}`}
                    className="flex items-center justify-between gap-4 px-6 py-3 hover:bg-muted/50"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">
                        {a.challenge.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {a.challenge.skill.name} · Attempt {a.attemptNumber}
                        {a.submittedAt && ` · ${formatDate(a.submittedAt)}`}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <BandLabel
                        score={a.evaluation!.overallScore}
                        className="max-sm:hidden"
                      />
                      <BandIcon
                        score={a.evaluation!.overallScore}
                        className="sm:hidden"
                      />
                      <span className="w-8 text-right font-semibold tabular-nums">
                        {a.evaluation!.overallScore}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}

function ActiveSkillCard({ summary }: { summary: SkillSummary }) {
  const { skill, profile, gaps } = summary;
  return (
    <Link
      href={`/skills/${skill.slug}`}
      className="group rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Card className="h-full transition-colors group-hover:border-foreground/20">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle>{skill.name}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {profile.attemptedChallenges} of {profile.totalChallenges}{" "}
                challenges
                {profile.consistency !== null &&
                  ` · consistency ${profile.consistency}`}
              </p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-3xl font-semibold tracking-tight">
                {profile.score}
              </span>
              <BandLabel score={profile.score ?? 0} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2.5">
            {profile.competencies.map((c) => (
              <li
                key={c.id}
                className="grid grid-cols-[minmax(0,9rem)_1fr_2rem] items-center gap-3 text-xs"
              >
                <span className="truncate text-muted-foreground">
                  {c.label}
                </span>
                {c.score !== null ? (
                  <ScoreMeter score={c.score} />
                ) : (
                  <div className="h-2 rounded-full bg-muted" aria-hidden />
                )}
                <span className="text-right font-medium tabular-nums">
                  {c.score ?? "–"}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
        {gaps[0] && (
          <CardFooter className="gap-2 text-xs">
            <TargetIcon
              aria-hidden
              className="size-3.5 shrink-0 text-score-weak"
            />
            <span>
              Gap: <span className="font-medium">{gaps[0].label}</span>{" "}
              <span className="text-muted-foreground">
                (averaging {gaps[0].score} across {gaps[0].evidenceCount}{" "}
                challenges)
              </span>
            </span>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <Skeleton className="h-28 rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
