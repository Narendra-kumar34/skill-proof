"use client";

import { Loader2Icon, Trash2Icon } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";

type DeleteButtonProps = {
  id: string;
  action: (input: { id: string }) => Promise<ActionResult>;
  /** e.g. "skill “Prompt Engineering”" */
  entity: string;
  description: string;
  redirectTo?: Route;
  size?: "sm" | "icon";
};

/** Destructive action behind a confirmation dialog; server errors shown inline. */
export function DeleteButton({
  id,
  action,
  entity,
  description,
  redirectTo,
  size = "sm",
}: DeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await action({ id });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {size === "icon" ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Delete ${entity}`}
          >
            <Trash2Icon aria-hidden />
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive"
          >
            <Trash2Icon aria-hidden />
            Delete
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {entity}?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              confirm();
            }}
            disabled={pending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {pending && <Loader2Icon aria-hidden className="animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
