"use client";

import { CheckIcon, CloudOffIcon, Loader2Icon, SendIcon } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatNumber, formatTime } from "@/lib/format";
import {
  saveDraftAction,
  submitAnswerAction,
} from "@/server/actions/submissions";

const AUTOSAVE_DELAY_MS = 1500;

type SaveState = "idle" | "saving" | "saved" | "error";

type AnswerEditorProps = {
  challengeId: string;
  challengeSlug: string;
  attemptNumber: number;
  initialContent: string;
  initialSavedAt: string | null;
  minLength: number;
  maxLength: number;
};

export function AnswerEditor({
  challengeId,
  challengeSlug,
  attemptNumber,
  initialContent,
  initialSavedAt,
  minLength,
  maxLength,
}: AnswerEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [saveState, setSaveState] = useState<SaveState>(
    initialSavedAt ? "saved" : "idle",
  );
  const [savedAt, setSavedAt] = useState(initialSavedAt);
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();
  // State drives rendering (`dirty`); the ref gives async callbacks the
  // latest value without re-creating them.
  const [savedContent, setSavedContent] = useState(initialContent);
  const lastSaved = useRef(initialContent);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const length = content.trim().length;
  const tooShort = length < minLength;
  const dirty = content !== savedContent;

  const save = useCallback(
    async (value: string) => {
      if (value === lastSaved.current) return;
      setSaveState("saving");
      const result = await saveDraftAction({ challengeId, content: value });
      if (result.ok) {
        lastSaved.current = value;
        setSavedContent(value);
        setSavedAt(result.data.savedAt);
        setSaveState("saved");
      } else {
        setSaveState("error");
      }
    },
    [challengeId],
  );

  // Debounced autosave while typing.
  useEffect(() => {
    if (!dirty) return;
    timer.current = setTimeout(() => void save(content), AUTOSAVE_DELAY_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [content, dirty, save]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function submit() {
    if (submitting) return;
    if (tooShort) {
      setError(
        `Please write at least ${minLength} characters so there is something to evaluate.`,
      );
      return;
    }
    setError(null);
    if (timer.current) clearTimeout(timer.current);

    startSubmit(async () => {
      const result = await submitAnswerAction({ challengeId, content });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      lastSaved.current = content; // nothing left unsaved
      setSavedContent(content);
      router.push(
        `/challenges/${challengeSlug}?attempt=${result.data.submissionId}` as Route,
      );
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>
          <h2>Your solution</h2>
        </CardTitle>
        <Badge variant="secondary">Attempt {attemptNumber}</Badge>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Label htmlFor="answer" className="sr-only">
          Your solution
        </Label>
        <Textarea
          id="answer"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          maxLength={maxLength}
          disabled={submitting}
          placeholder="Write your solution here. Your draft saves automatically."
          aria-describedby="answer-help answer-count"
          className="min-h-88 resize-y text-[0.95rem] leading-relaxed"
        />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p id="answer-help">
            Submitting starts the AI evaluation. Each submission is a new
            attempt.
          </p>
          <p
            id="answer-count"
            className={tooShort && length > 0 ? "text-foreground" : ""}
          >
            {formatNumber(length)} / {formatNumber(maxLength)}
            {tooShort && ` · min ${minLength}`}
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-3">
        <SaveIndicator state={saveState} savedAt={savedAt} dirty={dirty} />
        <Button onClick={submit} disabled={submitting || length === 0}>
          {submitting ? (
            <Loader2Icon aria-hidden className="animate-spin" />
          ) : (
            <SendIcon aria-hidden />
          )}
          {submitting ? "Submitting…" : "Submit for evaluation"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function SaveIndicator({
  state,
  savedAt,
  dirty,
}: {
  state: SaveState;
  savedAt: string | null;
  dirty: boolean;
}) {
  let content: React.ReactNode = null;
  if (state === "saving") {
    content = (
      <>
        <Loader2Icon aria-hidden className="size-3.5 animate-spin" /> Saving…
      </>
    );
  } else if (state === "error") {
    content = (
      <>
        <CloudOffIcon aria-hidden className="size-3.5" /> Couldn&apos;t save
        draft
      </>
    );
  } else if (savedAt && !dirty) {
    content = (
      <>
        <CheckIcon aria-hidden className="size-3.5" /> Draft saved{" "}
        {formatTime(savedAt)}
      </>
    );
  }

  return (
    <p
      aria-live="polite"
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
    >
      {content}
    </p>
  );
}
