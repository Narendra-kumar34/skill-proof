"use client";

import { CheckCircle2Icon, Loader2Icon } from "lucide-react";
import { useId } from "react";
import { useFormStatus } from "react-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { FormState } from "@/server/actions/admin";

type BaseProps = {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
};

function FieldShell({
  id,
  label,
  error,
  hint,
  className,
  children,
}: Omit<BaseProps, "name"> & { id: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (id: string, error?: string, hint?: string) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

export function TextField({
  name,
  label,
  error,
  hint,
  className,
  ...props
}: BaseProps & Omit<React.ComponentProps<typeof Input>, "name">) {
  const id = useId();
  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      className={className}
    >
      <Input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...props}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  name,
  label,
  error,
  hint,
  className,
  ...props
}: BaseProps & Omit<React.ComponentProps<typeof Textarea>, "name">) {
  const id = useId();
  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      className={className}
    >
      <Textarea
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  name,
  label,
  error,
  hint,
  className,
  options,
  ...props
}: BaseProps &
  Omit<React.ComponentProps<"select">, "name"> & {
    options: ReadonlyArray<{ value: string; label: string }>;
  }) {
  const id = useId();
  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      className={className}
    >
      <select
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2Icon aria-hidden className="animate-spin" />}
      {children}
    </Button>
  );
}

/** Form-level success/error message from a FormState. */
export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;
  if (state.ok) {
    return (
      <p
        role="status"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <CheckCircle2Icon aria-hidden className="size-4 text-score-strong" />
        {state.message}
      </p>
    );
  }
  return (
    <Alert variant="destructive" role="alert">
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  );
}

export const STATUS_OPTIONS = [
  { value: "draft", label: "Draft (hidden from learners)" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived (hidden, history kept)" },
] as const;

export const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;
