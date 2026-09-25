import {
  ArrowRightIcon,
  CheckIcon,
  ShieldAlertIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WrenchIcon,
} from "lucide-react";
import Link from "next/link";

import { FocusOnArrival } from "@/components/challenge/focus-on-arrival";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { evaluations } from "@/db/schema";
import { formatDelta } from "@/domain/score-band";
import { cn } from "@/lib/utils";

import { BandLabel, ScoreMeter, ScoreRing } from "./score-visuals";

type Evaluation = typeof evaluations.$inferSelect;

type EvaluationResultProps = {
  submissionId: string;
  attemptNumber: number;
  content: string;
  evaluation: Evaluation;
  previous: { attemptNumber: number; score: number } | null;
  competencyLabels: ReadonlyMap<string, string>;
  recommended: { slug: string; title: string } | null;
  currentSlug: string;
};

export function EvaluationResult({
  submissionId,
  attemptNumber,
  content,
  evaluation,
  previous,
  competencyLabels,
  recommended,
  currentSlug,
}: EvaluationResultProps) {
  const delta = previous ? evaluation.overallScore - previous.score : null;
  const headingId = `result-${submissionId}`;
  const { injectionSuspected, offTopic } = evaluation.flags;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <FocusOnArrival submissionId={submissionId} targetId={headingId} />

      {/* Headline: score, band, progress, summary */}
      <Card>
        <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <ScoreRing score={evaluation.overallScore} />
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id={headingId}
                tabIndex={-1}
                className="text-xl font-semibold outline-none"
              >
                Attempt {attemptNumber} result
              </h2>
              <BandLabel score={evaluation.overallScore} className="text-sm" />
            </div>
            {delta !== null && previous && (
              <p
                className={cn(
                  "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm",
                  delta > 0 && "border-score-strong/40",
                  delta < 0 && "border-score-weak/40",
                )}
              >
                {delta >= 0 ? (
                  <TrendingUpIcon
                    aria-hidden
                    className="size-4 text-score-strong"
                  />
                ) : (
                  <TrendingDownIcon
                    aria-hidden
                    className="size-4 text-score-weak"
                  />
                )}
                <span className="font-medium">{formatDelta(delta)}</span>
                <span className="text-muted-foreground">
                  since attempt {previous.attemptNumber} ({previous.score})
                </span>
              </p>
            )}
            <p className="text-pretty">{evaluation.summary}</p>
          </div>
        </CardContent>
      </Card>

      {(injectionSuspected || offTopic) && (
        <Alert>
          <ShieldAlertIcon aria-hidden />
          <AlertTitle>
            {offTopic
              ? "This didn't look like an attempt at the task"
              : "Instructions to the evaluator were ignored"}
          </AlertTitle>
          <AlertDescription>
            {offTopic
              ? "Scores are capped for submissions that don't address the challenge. Try again with a full answer."
              : "Part of your submission addressed the evaluator directly. It was treated as text and graded on its merits."}
          </AlertDescription>
        </Alert>
      )}

      {/* What went well / what to improve */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckIcon aria-hidden className="size-4 text-score-strong" />
              What went well
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2.5 text-sm">
              {evaluation.strengths.map((s) => (
                <li key={s} className="flex gap-2">
                  <span
                    aria-hidden
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-score-strong"
                  />
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <WrenchIcon aria-hidden className="size-4 text-score-adequate" />
              What to improve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3 text-sm">
              {evaluation.improvements.map((i) => (
                <li key={i.issue} className="flex flex-col gap-0.5">
                  <span className="font-medium">{i.issue}</span>
                  <span className="text-muted-foreground">{i.suggestion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Criterion breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Score breakdown</CardTitle>
          <p className="text-sm text-muted-foreground">
            Your overall score is the weighted average of these criteria.
          </p>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y">
            {evaluation.criterionScores.map((c) => (
              <li
                key={c.criterionId}
                className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{c.label}</span>
                    {competencyLabels.get(c.competencyId) && (
                      <Badge variant="secondary" className="font-normal">
                        {competencyLabels.get(c.competencyId)}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      weight {c.weight}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BandLabel score={c.score} />
                    <span className="w-8 text-right font-semibold tabular-nums">
                      {c.score}
                    </span>
                  </div>
                </div>
                <ScoreMeter score={c.score} />
                <p className="text-sm text-muted-foreground">{c.rationale}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Next step */}
      {recommended && (
        <Card className="border-foreground/15 bg-muted/40">
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Recommended next step
              </p>
              <p className="font-semibold">
                {recommended.slug === currentSlug
                  ? "Try this challenge again"
                  : recommended.title}
              </p>
              {evaluation.recommendationReason && (
                <p className="text-sm text-muted-foreground">
                  {evaluation.recommendationReason}
                </p>
              )}
            </div>
            <Button asChild className="shrink-0">
              <Link href={`/challenges/${recommended.slug}`}>
                {recommended.slug === currentSlug
                  ? "New attempt"
                  : "Start challenge"}
                <ArrowRightIcon aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-fit">
            Show your submission
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-2">
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {content}
              </p>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
