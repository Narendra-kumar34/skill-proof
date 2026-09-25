"use client";

import { Loader2Icon, Trash2Icon } from "lucide-react";
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
import { deleteSubmissionAction } from "@/server/actions/submissions";

export function DeleteSubmissionButton({
  submissionId,
  label,
  isDraft,
}: {
  submissionId: string;
  /** Used in the accessible name, e.g. "Attempt 2 of Classify feedback". */
  label: string;
  isDraft: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteSubmissionAction({ submissionId });
      if (result.ok) setOpen(false);
      else setError(result.error);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Delete ${label}`}>
          <Trash2Icon aria-hidden />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isDraft ? "Delete this draft?" : "Delete this attempt?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDraft
              ? "Your unsubmitted work on this challenge will be removed."
              : "The submission and its evaluation will be removed, and your skill profile will no longer count it as evidence. This can't be undone."}
          </AlertDialogDescription>
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
              e.preventDefault(); // keep the dialog open until the action completes
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
