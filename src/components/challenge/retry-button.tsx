"use client";

import { Loader2Icon, RotateCwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { retryEvaluationAction } from "@/server/actions/submissions";

export function RetryButton({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function retry() {
    setError(null);
    startTransition(async () => {
      const result = await retryEvaluationAction({ submissionId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={retry} disabled={pending} variant="outline" size="sm">
        {pending ? (
          <Loader2Icon aria-hidden className="animate-spin" />
        ) : (
          <RotateCwIcon aria-hidden />
        )}
        Retry evaluation
      </Button>
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
    </div>
  );
}
