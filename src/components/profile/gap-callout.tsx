import { ArrowRightIcon, TargetIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { SkillGap } from "@/domain/gaps";

export function GapCallout({ gap }: { gap: SkillGap }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-score-weak/30 bg-score-weak-track/40 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <TargetIcon
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-score-weak"
        />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Skill gap: {gap.label}</p>
          <p className="text-sm text-muted-foreground">{gap.message}</p>
        </div>
      </div>
      {gap.recommendation && (
        <Button
          asChild
          size="sm"
          variant="outline"
          className="shrink-0 bg-background"
        >
          <Link
            href={`/challenges/${gap.recommendation.slug}`}
            title={gap.recommendation.reason}
          >
            {gap.recommendation.title}
            <ArrowRightIcon aria-hidden />
          </Link>
        </Button>
      )}
    </div>
  );
}
