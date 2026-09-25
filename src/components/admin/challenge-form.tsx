"use client";

import { useActionState } from "react";

import type { FormState } from "@/server/actions/admin";

import {
  DIFFICULTY_OPTIONS,
  FormMessage,
  SelectField,
  STATUS_OPTIONS,
  SubmitButton,
  TextAreaField,
  TextField,
} from "./form-fields";

type ChallengeDefaults = {
  title: string;
  slug: string;
  summary: string;
  scenario: string;
  task: string;
  responseGuidance: string;
  difficulty: string;
  estimatedMinutes: number;
  status: string;
};

type ChallengeFormProps = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: ChallengeDefaults;
  /** Shown only when creating: the skill is fixed after creation. */
  skillOptions?: ReadonlyArray<{ value: string; label: string }>;
  defaultSkillId?: string;
  submitLabel: string;
};

export function ChallengeForm({
  action,
  defaults,
  skillOptions,
  defaultSkillId,
  submitLabel,
}: ChallengeFormProps) {
  const [state, formAction] = useActionState(action, {});
  const e = state.errors ?? {};
  // After a failed submit, keep what the admin typed (React resets the form).
  const v = { ...defaults, ...state.values };
  const creating = !defaults;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormMessage state={state} />
      {creating && skillOptions && (
        <SelectField
          name="skillId"
          label="Skill"
          defaultValue={state.values?.skillId ?? defaultSkillId}
          error={e.skillId}
          options={skillOptions}
          hint="Can't be changed later: the rubric maps to this skill's competencies."
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name="title"
          label="Title"
          defaultValue={v.title}
          error={e.title}
          required
        />
        <TextField
          name="slug"
          label="Slug"
          defaultValue={v.slug}
          error={e.slug}
          required
        />
      </div>
      <TextField
        name="summary"
        label="Summary"
        defaultValue={v.summary}
        error={e.summary}
        hint="One line shown on challenge cards."
        required
      />
      <TextAreaField
        name="scenario"
        label="Scenario (markdown)"
        defaultValue={v.scenario}
        error={e.scenario}
        hint="The realistic workplace situation, with concrete details."
        className="[&_textarea]:min-h-56"
        required
      />
      <TextAreaField
        name="task"
        label="Task (markdown)"
        defaultValue={v.task}
        error={e.task}
        hint="Exactly what the learner must produce."
        className="[&_textarea]:min-h-32"
        required
      />
      <TextField
        name="responseGuidance"
        label="Response guidance"
        defaultValue={v.responseGuidance}
        error={e.responseGuidance}
        hint="Expected format and length."
        required
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField
          name="difficulty"
          label="Difficulty"
          defaultValue={v.difficulty ?? "beginner"}
          error={e.difficulty}
          options={DIFFICULTY_OPTIONS}
        />
        <TextField
          name="estimatedMinutes"
          label="Estimated minutes"
          type="number"
          min={5}
          max={120}
          defaultValue={v.estimatedMinutes ?? 15}
          error={e.estimatedMinutes}
        />
        {!creating && (
          <SelectField
            name="status"
            label="Status"
            defaultValue={v.status}
            error={e.status}
            options={STATUS_OPTIONS}
          />
        )}
      </div>
      {creating && (
        <p className="text-sm text-muted-foreground">
          New challenges start as drafts. Add a rubric, then publish.
        </p>
      )}
      <div>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
