"use client";

import { CheckIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { RetryButton } from "./retry-button";

export const FOCUS_RESULT_KEY = "skillproof:focus-result";

type StatusResponse = {
  status: "draft" | "submitted" | "evaluating" | "evaluated" | "failed";
  canRetry: boolean;
};

/**
 * Shown while the AI evaluates. Polls the status endpoint and refreshes the
 * server-rendered page once the evaluation finishes (or fails).
 */
export function EvaluationPending({
  submissionId,
  criteriaCount,
}: {
  submissionId: string;
  criteriaCount: number;
}) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const started = Date.now();
    const tick = setInterval(() => setElapsed(Date.now() - started), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout>;
    const startedAt = Date.now();

    async function poll() {
      try {
        const res = await fetch(`/api/submissions/${submissionId}/status`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = (await res.json()) as StatusResponse;
          if (data.status === "evaluated" || data.status === "failed") {
            sessionStorage.setItem(FOCUS_RESULT_KEY, submissionId);
            router.refresh();
            return;
          }
          if (!cancelled) setStuck(data.canRetry);
        }
      } catch {
        // Network blip: keep polling.
      }
      if (cancelled) return;
      // Poll quickly at first, then back off.
      const delay = Date.now() - startedAt < 20_000 ? 2000 : 4000;
      timeout = setTimeout(poll, delay);
    }

    timeout = setTimeout(poll, 1500);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [router, submissionId]);

  const steps = [
    { label: "Reading your submission", doneAt: 4_000 },
    { label: `Scoring against ${criteriaCount} criteria`, doneAt: 14_000 },
    { label: "Writing feedback and next steps", doneAt: Infinity },
  ];

  return (
    <Card aria-busy="true">
      <CardContent className="flex flex-col gap-6 py-4">
        <div className="flex items-center gap-3">
          <Loader2Icon
            aria-hidden
            className="size-6 animate-spin text-muted-foreground"
          />
          <div>
            <h2 className="font-semibold">Evaluating your solution</h2>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              This usually takes 10–30 seconds. You can leave this page; the
              evaluation keeps running.
            </p>
          </div>
        </div>

        <ol className="flex flex-col gap-3">
          {steps.map((step, i) => {
            const previousDone = i === 0 ? 0 : steps[i - 1]!.doneAt;
            const done = elapsed >= step.doneAt;
            const active = !done && elapsed >= previousDone;
            return (
              <li
                key={step.label}
                className={cn(
                  "flex items-center gap-3 text-sm",
                  !done && !active && "text-muted-foreground",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full border",
                    done && "border-foreground bg-foreground text-background",
                    active && "border-foreground",
                  )}
                >
                  {done ? (
                    <CheckIcon className="size-3" />
                  ) : active ? (
                    <span className="size-1.5 animate-pulse rounded-full bg-foreground" />
                  ) : null}
                </span>
                {step.label}
              </li>
            );
          })}
        </ol>

        {stuck && (
          <div className="flex flex-col gap-3 rounded-lg border border-dashed p-4 text-sm">
            <p>
              This is taking longer than expected. Your submission is saved.
            </p>
            <RetryButton submissionId={submissionId} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
