import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ClockIcon,
  Loader2Icon,
} from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DifficultyBadge } from "@/components/catalog/difficulty-badge";
import { AnswerEditor } from "@/components/challenge/answer-editor";
import { EvaluationPending } from "@/components/challenge/evaluation-pending";
import { RetryButton } from "@/components/challenge/retry-button";
import { EvaluationResult } from "@/components/evaluation/evaluation-result";
import { BandLabel } from "@/components/evaluation/score-visuals";
import { Markdown } from "@/components/markdown";
import { Breadcrumbs, PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { evaluationConfig } from "@/config/evaluation";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  type Attempt,
  getMyChallengeActivity,
} from "@/server/queries/activity";
import {
  type ChallengeDetail,
  getChallengeBySlug,
} from "@/server/queries/catalog";

// Server Actions on this page schedule the AI evaluation with `after()`,
// which runs within this route's duration budget.
export const maxDuration = 60;

type Props = PageProps<"/challenges/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const challenge = await getChallengeBySlug((await params).slug);
  return { title: challenge?.title ?? "Challenge not found" };
}

export default function ChallengePage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<ChallengeSkeleton />}>
      <ChallengeView params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ChallengeView({ params, searchParams }: Props) {
  const challenge = await getChallengeBySlug((await params).slug);
  if (!challenge) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={challenge.title}>
        <Breadcrumbs
          items={[
            { label: "Skills", href: "/skills" },
            {
              label: challenge.skill.name,
              href: `/skills/${challenge.skill.slug}` as Route,
            },
            { label: challenge.title },
          ]}
        />
      </PageHeader>
      <div className="-mt-5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <DifficultyBadge difficulty={challenge.difficulty} />
        <span className="inline-flex items-center gap-1">
          <ClockIcon aria-hidden className="size-4" />
          About {challenge.estimatedMinutes} min
        </span>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <ChallengeBrief challenge={challenge} />
        <Suspense fallback={<Skeleton className="h-128 rounded-xl" />}>
          <Workspace challenge={challenge} searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

function ChallengeBrief({ challenge }: { challenge: ChallengeDetail }) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Scenario</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Markdown className="prose-sm">{challenge.scenario}</Markdown>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Your task</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Markdown className="prose-sm">{challenge.task}</Markdown>
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            {challenge.responseGuidance}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>What&apos;s assessed</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3 text-sm">
            {challenge.criteria.map((c) => (
              <li key={c.id} className="flex flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{c.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {c.competency.label} · weight {c.weight}
                  </span>
                </div>
                <span className="text-muted-foreground">{c.description}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

async function Workspace({
  challenge,
  searchParams,
}: {
  challenge: ChallengeDetail;
  searchParams: Props["searchParams"];
}) {
  const { attempt: attemptParam } = await searchParams;
  const { draft, attempts } = await getMyChallengeActivity(challenge.id);
  const selected =
    typeof attemptParam === "string"
      ? attempts.find((a) => a.id === attemptParam)
      : undefined;

  if (selected) {
    return (
      <AttemptView
        challenge={challenge}
        attempt={selected}
        attempts={attempts}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <AnswerEditor
        challengeId={challenge.id}
        challengeSlug={challenge.slug}
        attemptNumber={(attempts[0]?.attemptNumber ?? 0) + 1}
        initialContent={draft?.content ?? ""}
        initialSavedAt={draft ? draft.updatedAt.toISOString() : null}
        minLength={evaluationConfig.submission.minLength}
        maxLength={evaluationConfig.submission.maxLength}
      />
      {attempts.length > 0 && (
        <AttemptList slug={challenge.slug} attempts={attempts} />
      )}
    </div>
  );
}

function AttemptView({
  challenge,
  attempt,
  attempts,
}: {
  challenge: ChallengeDetail;
  attempt: Attempt;
  attempts: Attempt[];
}) {
  // Attempts are newest first; the previous scored attempt is further down.
  const previous = attempts
    .filter(
      (a) =>
        (a.attemptNumber ?? 0) < (attempt.attemptNumber ?? 0) && a.evaluation,
    )
    .map((a) => ({
      attemptNumber: a.attemptNumber ?? 0,
      score: a.evaluation!.overallScore,
    }))[0];

  const competencyLabels = new Map(
    challenge.criteria.map((c) => [c.competencyId, c.competency.label]),
  );

  // On small screens the result comes before the long brief.
  return (
    <div className="flex flex-col gap-4 max-lg:order-first">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/challenges/${challenge.slug}`}>
            <ArrowLeftIcon aria-hidden />
            {attempt.status === "evaluated"
              ? "Start a new attempt"
              : "Back to editor"}
          </Link>
        </Button>
        {attempts.length > 1 && (
          <nav aria-label="Attempts" className="flex flex-wrap gap-1">
            {attempts.map((a) => (
              <Link
                key={a.id}
                href={`/challenges/${challenge.slug}?attempt=${a.id}`}
                aria-current={a.id === attempt.id ? "page" : undefined}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs",
                  a.id === attempt.id
                    ? "border-foreground bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                #{a.attemptNumber}
                {a.evaluation && ` · ${a.evaluation.overallScore}`}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {attempt.status === "evaluated" && attempt.evaluation ? (
        <EvaluationResult
          submissionId={attempt.id}
          attemptNumber={attempt.attemptNumber ?? 0}
          content={attempt.content}
          evaluation={attempt.evaluation}
          previous={previous ?? null}
          competencyLabels={competencyLabels}
          recommended={attempt.evaluation.recommendedChallenge}
          currentSlug={challenge.slug}
        />
      ) : attempt.status === "failed" ? (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden />
          <AlertTitle>Evaluation didn&apos;t complete</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <p>
              {attempt.failureReason ??
                "Something went wrong. Your submission is saved."}
            </p>
            <RetryButton submissionId={attempt.id} />
          </AlertDescription>
        </Alert>
      ) : (
        <EvaluationPending
          submissionId={attempt.id}
          criteriaCount={challenge.criteria.length}
        />
      )}
    </div>
  );
}

function AttemptList({
  slug,
  attempts,
}: {
  slug: string;
  attempts: Attempt[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Previous attempts</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y">
          {attempts.map((a) => (
            <li key={a.id}>
              <Link
                href={`/challenges/${slug}?attempt=${a.id}`}
                className="flex items-center justify-between gap-3 py-3 text-sm hover:underline hover:underline-offset-4"
              >
                <span>
                  <span className="font-medium">Attempt {a.attemptNumber}</span>
                  {a.submittedAt && (
                    <span className="text-muted-foreground">
                      {" "}
                      · {formatDate(a.submittedAt)}
                    </span>
                  )}
                </span>
                {a.evaluation ? (
                  <span className="flex items-center gap-2">
                    <BandLabel score={a.evaluation.overallScore} />
                    <span className="w-8 text-right font-semibold tabular-nums">
                      {a.evaluation.overallScore}
                    </span>
                  </span>
                ) : a.status === "failed" ? (
                  <span className="text-xs text-destructive">Needs retry</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2Icon
                      aria-hidden
                      className="size-3.5 animate-spin"
                    />{" "}
                    Evaluating
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ChallengeSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-9 w-full max-w-lg" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Skeleton className="h-128 rounded-xl" />
        <Skeleton className="h-128 rounded-xl" />
      </div>
    </div>
  );
}
