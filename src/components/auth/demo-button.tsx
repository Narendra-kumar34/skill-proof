"use client";

import { Loader2Icon, SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { prepareDemoAccount } from "@/server/actions/auth";

import { authErrorMessage } from "./auth-error";

type DemoButtonProps = {
  size?: "default" | "lg";
  variant?: "default" | "outline";
  className?: string;
};

export function DemoButton({
  size = "default",
  variant = "default",
  className,
}: DemoButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function startDemo() {
    setError(null);
    startTransition(async () => {
      const { error } = await authClient.signIn.anonymous();
      if (error) {
        setError(authErrorMessage(error));
        return;
      }
      const result = await prepareDemoAccount();
      if (!result.ok) {
        setError("Could not load the demo data. Please try again.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        size={size}
        variant={variant}
        className={className}
        onClick={startDemo}
        disabled={pending}
      >
        {pending ? (
          <Loader2Icon className="animate-spin" aria-hidden />
        ) : (
          <SparklesIcon aria-hidden />
        )}
        {pending ? "Preparing your demo…" : "Try the demo"}
      </Button>
      <p role="alert" aria-live="polite" className="text-sm text-destructive">
        {error}
      </p>
    </div>
  );
}
