import { CircleDashedIcon } from "lucide-react";
import Link from "next/link";

import {
  BandIcon,
  BandLabel,
  ScoreMeter,
} from "@/components/evaluation/score-visuals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDelta } from "@/domain/score-band";
import type { SkillSummary } from "@/server/profile";

import { GapCallout } from "./gap-callout";

/**
 * The evidence-based profile for one skill: competency scores, each linked
 * to the attempts behind it, plus consistency and detected gaps.
 */
export function SkillProfilePanel({ summary }: { summary: SkillSummary }) {
  const { skill, profile, gaps } = summary;

  if (profile.attemptedChallenges === 0) {
    const first = skill.challenges[0];
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Your profile</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
          <p>
            No evidence yet. Complete a challenge and your competency scores
            will appear here, each linked to the work behind it.
          </p>
          {first && (
            <Button asChild size="sm">
              <Link href={`/challenges/${first.slug}`}>
                Start with {first.title}
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="gap-4">
        <CardTitle>
          <h2>Your profile</h2>
        </CardTitle>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Skill score">
            <span className="flex items-baseline gap-2">
              {profile.score}
              <BandLabel score={profile.score ?? 0} />
            </span>
          </Stat>
          <Stat
            label="Consistency"
            hint={
              profile.consistency === null
                ? "Needs 2+ challenges"
                : "Steadiness across challenges"
            }
          >
            {profile.consistency ?? "–"}
          </Stat>
          <Stat label="Evidence">
            {profile.attemptedChallenges}/{profile.totalChallenges}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              challenges
            </span>
          </Stat>
          <Stat label="From retries">
            {profile.retryGain ? (
              formatDelta(profile.retryGain.points)
            ) : (
              <span className="text-muted-foreground">–</span>
            )}
          </Stat>
        </dl>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {gaps.slice(0, 2).map((gap) => (
          <GapCallout key={gap.competencyId} gap={gap} />
        ))}

        <ul className="flex flex-col gap-5">
          {profile.competencies.map((c) => (
            <li key={c.id} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{c.label}</span>
                {c.score !== null ? (
                  <span className="flex items-center gap-2">
                    <BandLabel score={c.score} />
                    <span className="w-8 text-right font-semibold tabular-nums">
                      {c.score}
                    </span>
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Not assessed yet
                  </span>
                )}
              </div>
              {c.score !== null ? (
                <ScoreMeter score={c.score} />
              ) : (
                <div className="h-2 rounded-full bg-muted" aria-hidden />
              )}
              <div className="flex flex-wrap gap-1.5">
                {c.evidence.map((e) => (
                  <Link
                    key={e.challengeId}
                    href={`/challenges/${e.slug}?attempt=${e.submissionId}`}
                    className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs hover:bg-muted"
                  >
                    <BandIcon score={e.score} />
                    {e.title}
                    <span className="font-semibold tabular-nums">
                      {e.score}
                    </span>
                  </Link>
                ))}
                {c.untested.map((u) => (
                  <Link
                    key={u.challengeId}
                    href={`/challenges/${u.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-dashed px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                  >
                    <CircleDashedIcon aria-hidden className="size-3.5" />
                    Not yet: {u.title}
                  </Link>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-semibold tracking-tight">{children}</dd>
      {hint && <dd className="text-xs text-muted-foreground">{hint}</dd>}
    </div>
  );
}
