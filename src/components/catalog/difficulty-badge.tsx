import { Badge } from "@/components/ui/badge";

const LABEL = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
} as const;

// Filled dots give difficulty a non-colour cue: ●○○ / ●●○ / ●●●.
const DOTS = { beginner: 1, intermediate: 2, advanced: 3 } as const;

export function DifficultyBadge({
  difficulty,
}: {
  difficulty: keyof typeof LABEL;
}) {
  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span aria-hidden className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={
              i <= DOTS[difficulty]
                ? "size-1.5 rounded-full bg-foreground"
                : "size-1.5 rounded-full bg-muted-foreground/30"
            }
          />
        ))}
      </span>
      {LABEL[difficulty]}
    </Badge>
  );
}
