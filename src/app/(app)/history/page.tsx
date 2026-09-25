import { AlertCircleIcon, Loader2Icon, PencilLineIcon } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { BandLabel } from "@/components/evaluation/score-visuals";
import { DeleteSubmissionButton } from "@/components/history/delete-submission-button";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  type ActivityItem,
  getMyActivityOverview,
} from "@/server/queries/activity";
import { getPublishedSkills } from "@/server/queries/catalog";

export const metadata: Metadata = { title: "History" };

const STATUS_FILTERS = {
  all: { label: "All", match: () => true },
  evaluated: {
    label: "Evaluated",
    match: (a: ActivityItem) => a.status === "evaluated",
  },
  drafts: { label: "Drafts", match: (a: ActivityItem) => a.status === "draft" },
  attention: {
    label: "Needs attention",
    match: (a: ActivityItem) =>
      ["failed", "submitted", "evaluating"].includes(a.status),
  },
} as const;
type StatusFilter = keyof typeof STATUS_FILTERS;

export default function HistoryPage({ searchParams }: PageProps<"/history">) {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="History"
        description="Every attempt and draft, with its result. Deleting an attempt removes it from your skill profile."
      />
      <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
        <HistoryList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function HistoryList({
  searchParams,
}: Pick<PageProps<"/history">, "searchParams">) {
  const params = await searchParams;
  const skillParam = typeof params.skill === "string" ? params.skill : null;
  const status: StatusFilter =
    typeof params.status === "string" && params.status in STATUS_FILTERS
      ? (params.status as StatusFilter)
      : "all";

  const [activity, skills] = await Promise.all([
    getMyActivityOverview(),
    getPublishedSkills(),
  ]);
  const rows = activity.filter(
    (a) =>
      (!skillParam || a.challenge.skill.slug === skillParam) &&
      STATUS_FILTERS[status].match(a),
  );

  // Filters live in the URL so views are shareable and survive refresh.
  const hrefFor = (next: { skill?: string | null; status?: StatusFilter }) => {
    const query = new URLSearchParams();
    const s = next.skill === undefined ? skillParam : next.skill;
    const st = next.status ?? status;
    if (s) query.set("skill", s);
    if (st !== "all") query.set("status", st);
    const qs = query.toString();
    return (qs ? `/history?${qs}` : "/history") as Route;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterGroup label="Status">
          {(Object.keys(STATUS_FILTERS) as StatusFilter[]).map((key) => (
            <FilterChip
              key={key}
              href={hrefFor({ status: key })}
              active={status === key}
            >
              {STATUS_FILTERS[key].label}
            </FilterChip>
          ))}
        </FilterGroup>
        <FilterGroup label="Skill">
          <FilterChip href={hrefFor({ skill: null })} active={!skillParam}>
            All skills
          </FilterChip>
          {skills.map((s) => (
            <FilterChip
              key={s.id}
              href={hrefFor({ skill: s.slug })}
              active={skillParam === s.slug}
            >
              {s.name}
            </FilterChip>
          ))}
        </FilterGroup>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            {activity.length === 0
              ? "You haven't attempted any challenges yet."
              : "Nothing matches these filters."}
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href={activity.length === 0 ? "/skills" : "/history"}>
              {activity.length === 0 ? "Browse skills" : "Clear filters"}
            </Link>
          </Button>
        </div>
      ) : (
        <Card className="py-0">
          <ul className="divide-y">
            {rows.map((a) => (
              <HistoryRow key={a.id} item={a} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function HistoryRow({ item: a }: { item: ActivityItem }) {
  const isDraft = a.status === "draft";
  const inFlight = a.status === "submitted" || a.status === "evaluating";
  const href = isDraft
    ? `/challenges/${a.challenge.slug}`
    : `/challenges/${a.challenge.slug}?attempt=${a.id}`;
  const label = isDraft
    ? `draft of ${a.challenge.title}`
    : `attempt ${a.attemptNumber} of ${a.challenge.title}`;

  return (
    <li className="flex items-center gap-3 px-4 py-3 sm:px-6">
      <Link
        href={href as Route}
        className="flex min-w-0 flex-1 flex-col hover:underline hover:underline-offset-4"
      >
        <span className="truncate font-medium">{a.challenge.title}</span>
        <span className="text-xs text-muted-foreground">
          {a.challenge.skill.name} ·{" "}
          {isDraft
            ? `Draft · edited ${formatDate(a.updatedAt)}`
            : `Attempt ${a.attemptNumber}${a.submittedAt ? ` · ${formatDate(a.submittedAt)}` : ""}`}
        </span>
      </Link>

      <span className="flex shrink-0 items-center gap-2 text-sm">
        {a.evaluation ? (
          <>
            <BandLabel
              score={a.evaluation.overallScore}
              className="max-sm:hidden"
            />
            <span className="w-8 text-right font-semibold tabular-nums">
              {a.evaluation.overallScore}
            </span>
          </>
        ) : isDraft ? (
          <PencilLineIcon
            aria-label="Draft"
            className="size-4 text-muted-foreground"
          />
        ) : a.status === "failed" ? (
          <span className="inline-flex items-center gap-1 text-xs text-destructive">
            <AlertCircleIcon aria-hidden className="size-4" /> Needs retry
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2Icon aria-hidden className="size-4 animate-spin" />{" "}
            Evaluating
          </span>
        )}
      </span>

      <span className="w-9 shrink-0">
        {!inFlight && (
          <DeleteSubmissionButton
            submissionId={a.id}
            label={label}
            isDraft={isDraft}
          />
        )}
      </span>
    </li>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <nav
      aria-label={`Filter by ${label.toLowerCase()}`}
      className="flex flex-wrap gap-1.5"
    >
      {children}
    </nav>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: Route;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
