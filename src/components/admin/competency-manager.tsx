"use client";

import { useActionState, useEffect, useRef } from "react";

import { Badge } from "@/components/ui/badge";
import {
  addCompetencyAction,
  deleteCompetencyAction,
  updateCompetencyAction,
} from "@/server/actions/admin";

import { DeleteButton } from "./delete-button";
import { FormMessage, SubmitButton, TextField } from "./form-fields";

type Competency = {
  id: string;
  key: string;
  label: string;
  description: string;
  criteriaCount: number;
};

export function CompetencyManager({
  skillId,
  competencies,
}: {
  skillId: string;
  competencies: Competency[];
}) {
  return (
    <div className="flex flex-col gap-6">
      {competencies.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No competencies yet. Add the 3-5 dimensions this skill is profiled on;
          every rubric criterion will map to one of them.
        </p>
      )}
      <ul className="flex flex-col gap-4">
        {competencies.map((c) => (
          <li key={c.id} className="rounded-lg border p-4">
            <CompetencyRow competency={c} />
          </li>
        ))}
      </ul>
      <div className="rounded-lg border border-dashed p-4">
        <h3 className="mb-3 text-sm font-medium">Add a competency</h3>
        <AddCompetencyForm skillId={skillId} />
      </div>
    </div>
  );
}

function CompetencyFields({
  defaults,
  errors,
}: {
  defaults?: Partial<Competency>;
  errors: Record<string, string>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[10rem_12rem_1fr]">
      <TextField
        name="key"
        label="Key"
        defaultValue={defaults?.key}
        error={errors.key}
        required
      />
      <TextField
        name="label"
        label="Label"
        defaultValue={defaults?.label}
        error={errors.label}
        required
      />
      <TextField
        name="description"
        label="Description"
        defaultValue={defaults?.description}
        error={errors.description}
        required
      />
    </div>
  );
}

function CompetencyRow({ competency }: { competency: Competency }) {
  const [state, action] = useActionState(
    updateCompetencyAction.bind(null, competency.id),
    {},
  );
  return (
    <form action={action} className="flex flex-col gap-3">
      <CompetencyFields
        defaults={{ ...competency, ...state.values }}
        errors={state.errors ?? {}}
      />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>Save</SubmitButton>
        <DeleteButton
          id={competency.id}
          action={deleteCompetencyAction}
          entity={`competency “${competency.label}”`}
          description="It can only be deleted if no rubric criteria use it."
        />
        <Badge variant="secondary" className="font-normal">
          Used by {competency.criteriaCount} criteria
        </Badge>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

function AddCompetencyForm({ skillId }: { skillId: string }) {
  const [state, action] = useActionState(
    addCompetencyAction.bind(null, skillId),
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <CompetencyFields defaults={state.values} errors={state.errors ?? {}} />
      <div className="flex items-center gap-3">
        <SubmitButton>Add competency</SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
