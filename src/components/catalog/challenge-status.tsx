import { Loader2Icon, PencilLineIcon } from "lucide-react";

import { BandLabel } from "@/components/evaluation/score-visuals";
import type { ChallengeStats } from "@/server/queries/activity";

/** Compact "where am I with this challenge" indicator for lists. */
export function ChallengeStatus({ stats }: { stats?: ChallengeStats }) {
  if (!stats || (stats.attempts === 0 && !stats.hasDraft)) {
    return <span className="text-xs text-muted-foreground">Not started</span>;
  }

  if (
    stats.latestStatus === "submitted" ||
    stats.latestStatus === "evaluating"
  ) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2Icon aria-hidden className="size-3.5 animate-spin" />
        Evaluating
      </span>
    );
  }

  if (stats.bestScore !== null) {
    return (
      <span className="inline-flex items-center gap-2 text-xs">
        <span className="font-medium">Best {stats.bestScore}</span>
        <BandLabel score={stats.bestScore} />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <PencilLineIcon aria-hidden className="size-3.5" />
      {stats.hasDraft ? "Draft saved" : "Needs retry"}
    </span>
  );
}
