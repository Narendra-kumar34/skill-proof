import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  type LucideIcon,
} from "lucide-react";

import { bandLabel, type ScoreBand, scoreBand } from "@/domain/score-band";
import { cn } from "@/lib/utils";

const BAND_STYLES: Record<
  ScoreBand,
  { stroke: string; track: string; fill: string; icon: LucideIcon }
> = {
  strong: {
    stroke: "stroke-score-strong",
    track: "stroke-score-strong-track",
    fill: "bg-score-strong",
    icon: CheckCircle2Icon,
  },
  adequate: {
    stroke: "stroke-score-adequate",
    track: "stroke-score-adequate-track",
    fill: "bg-score-adequate",
    icon: CircleDotIcon,
  },
  weak: {
    stroke: "stroke-score-weak",
    track: "stroke-score-weak-track",
    fill: "bg-score-weak",
    icon: AlertTriangleIcon,
  },
};

const TRACK_BG: Record<ScoreBand, string> = {
  strong: "bg-score-strong-track",
  adequate: "bg-score-adequate-track",
  weak: "bg-score-weak-track",
};

/** Icon + text label for a score band; colour is never the only cue. */
export function BandLabel({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const band = scoreBand(score);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium text-muted-foreground",
        className,
      )}
    >
      <BandIcon score={score} />
      {bandLabel[band]}
    </span>
  );
}

/** Decorative band icon; pair it with visible text (label or score). */
export function BandIcon({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const band = scoreBand(score);
  const Icon = BAND_STYLES[band].icon;
  return (
    <Icon
      aria-hidden
      className={cn(
        "size-3.5 shrink-0",
        band === "strong" && "text-score-strong",
        band === "adequate" && "text-score-adequate",
        band === "weak" && "text-score-weak",
        className,
      )}
    />
  );
}

/** The hero figure: overall score as a ring with the number inside. */
export function ScoreRing({
  score,
  size = 144,
}: {
  score: number;
  size?: number;
}) {
  const band = scoreBand(score);
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Overall score ${score} out of 100, ${bandLabel[band]}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className={BAND_STYLES[band].track}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className={cn(
            BAND_STYLES[band].stroke,
            "transition-[stroke-dasharray] duration-700",
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-semibold tracking-tight">{score}</span>
        <span className="text-xs text-muted-foreground">out of 100</span>
      </div>
    </div>
  );
}

/** Horizontal meter; the track is a lighter step of the band's own hue. */
export function ScoreMeter({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const band = scoreBand(score);
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full",
        TRACK_BG[band],
        className,
      )}
      aria-hidden
    >
      <div
        className={cn("h-full rounded-full", BAND_STYLES[band].fill)}
        style={{ width: `${Math.max(score, 2)}%` }}
      />
    </div>
  );
}
