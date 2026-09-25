"use client";

import { useActionState } from "react";

import type { FormState } from "@/server/actions/admin";

import {
  FormMessage,
  SelectField,
  STATUS_OPTIONS,
  SubmitButton,
  TextAreaField,
  TextField,
} from "./form-fields";

type SkillFormProps = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: {
    name: string;
    slug: string;
    summary: string;
    conceptBrief: string;
    status: string;
    sortOrder: number;
  };
  submitLabel: string;
};

export function SkillForm({ action, defaults, submitLabel }: SkillFormProps) {
  const [state, formAction] = useActionState(action, {});
  const e = state.errors ?? {};
  // After a failed submit, keep what the admin typed (React resets the form).
  const v = { ...defaults, ...state.values };

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="name"
          label="Name"
          defaultValue={v.name}
          error={e.name}
          required
        />
        <TextField
          name="slug"
          label="Slug"
          defaultValue={v.slug}
          error={e.slug}
          hint="Used in the URL, e.g. prompt-engineering"
          required
        />
      </div>
      <TextField
        name="summary"
        label="Summary"
        defaultValue={v.summary}
        error={e.summary}
        hint="One sentence shown on skill cards."
        required
      />
      <TextAreaField
        name="conceptBrief"
        label="Concept brief (markdown)"
        defaultValue={v.conceptBrief}
        error={e.conceptBrief}
        hint="The short “Learn the essentials” explainer on the skill page."
        className="[&_textarea]:min-h-48"
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          name="status"
          label="Status"
          defaultValue={v.status ?? "draft"}
          error={e.status}
          options={STATUS_OPTIONS}
          hint={defaults ? undefined : "Publish after adding competencies."}
        />
        <TextField
          name="sortOrder"
          label="Sort order"
          type="number"
          min={0}
          defaultValue={v.sortOrder ?? 0}
          error={e.sortOrder}
        />
      </div>
      <div>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
