"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircle2Icon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useId, useState, useTransition } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { RubricAnchors } from "@/db/schema/domain";
import { saveRubricAction } from "@/server/actions/admin";

type Criterion = {
  /** Stable React key; also the DB id for saved criteria. */
  clientId: string;
  id?: string;
  key: string;
  label: string;
  description: string;
  competencyId: string;
  weight: number;
  anchors: RubricAnchors;
};

type RubricEditorProps = {
  challengeId: string;
  rubricVersion: number;
  competencies: Array<{ id: string; label: string }>;
  initial: Array<Omit<Criterion, "clientId">>;
};

let nextClientId = 0;
const blank = (competencyId: string): Criterion => ({
  clientId: `new-${nextClientId++}`,
  key: "",
  label: "",
  description: "",
  competencyId,
  weight: 3,
  anchors: { strong: "", adequate: "", weak: "" },
});

export function RubricEditor({
  challengeId,
  rubricVersion,
  competencies,
  initial,
}: RubricEditorProps) {
  const [criteria, setCriteria] = useState<Criterion[]>(() =>
    initial.map((c) => ({ ...c, clientId: c.id ?? `new-${nextClientId++}` })),
  );
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<
    | { ok: true; message: string }
    | { ok: false; message: string; issues: string[] }
    | null
  >(null);

  const totalWeight = criteria.reduce((n, c) => n + c.weight, 0);

  function update(clientId: string, patch: Partial<Criterion>) {
    setCriteria((list) =>
      list.map((c) => (c.clientId === clientId ? { ...c, ...patch } : c)),
    );
  }

  function move(index: number, delta: -1 | 1) {
    setCriteria((list) => {
      const next = [...list];
      const target = index + delta;
      if (target < 0 || target >= next.length) return list;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  function save() {
    setResult(null);
    startTransition(async () => {
      const res = await saveRubricAction({
        challengeId,
        criteria: criteria.map(
          ({ id, key, label, description, competencyId, weight, anchors }) => ({
            id,
            key,
            label,
            description,
            competencyId,
            weight,
            anchors,
          }),
        ),
      });
      if (res.ok) {
        setResult({
          ok: true,
          message: res.data.changed
            ? `Saved. Grading changed, so the rubric is now version ${res.data.version}.`
            : `Saved. Rubric version ${res.data.version}.`,
        });
      } else {
        setResult({ ok: false, message: res.error, issues: res.issues ?? [] });
      }
    });
  }

  if (competencies.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        This challenge&apos;s skill has no competencies yet. Add competencies to
        the skill first; every criterion must map to one.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Current version {rubricVersion}. Changing criteria, weights,
        competencies or anchors creates a new version; past evaluations keep the
        rubric they were scored against.
      </p>

      {result && !result.ok && (
        <Alert variant="destructive" role="alert">
          <AlertTitle>{result.message}</AlertTitle>
          {result.issues.length > 0 && (
            <AlertDescription>
              <ul className="list-disc pl-4">
                {result.issues.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </AlertDescription>
          )}
        </Alert>
      )}

      <ol className="flex flex-col gap-4">
        {criteria.map((c, i) => (
          <li key={c.clientId} className="rounded-lg border p-4">
            <CriterionFields
              index={i}
              criterion={c}
              competencies={competencies}
              share={`${c.weight}/${totalWeight}`}
              onChange={(patch) => update(c.clientId, patch)}
              onMoveUp={i > 0 ? () => move(i, -1) : undefined}
              onMoveDown={
                i < criteria.length - 1 ? () => move(i, 1) : undefined
              }
              onRemove={() =>
                setCriteria((list) =>
                  list.filter((x) => x.clientId !== c.clientId),
                )
              }
            />
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setCriteria((list) => [...list, blank(competencies[0]!.id)])
          }
          disabled={criteria.length >= 8}
        >
          <PlusIcon aria-hidden />
          Add criterion
        </Button>
        <Button type="button" onClick={save} disabled={pending}>
          {pending && <Loader2Icon aria-hidden className="animate-spin" />}
          Save rubric
        </Button>
        {result?.ok && (
          <p
            role="status"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
          >
            <CheckCircle2Icon
              aria-hidden
              className="size-4 text-score-strong"
            />
            {result.message}
          </p>
        )}
      </div>
    </div>
  );
}

function CriterionFields({
  index,
  criterion: c,
  competencies,
  share,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  index: number;
  criterion: Criterion;
  competencies: Array<{ id: string; label: string }>;
  /** Exact fraction of the total weight, e.g. "5/8" (percentages round to 101%). */
  share: string;
  onChange: (patch: Partial<Criterion>) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove: () => void;
}) {
  const id = useId();
  const field = (name: string) => `${id}-${name}`;
  const n = index + 1;

  return (
    <fieldset className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <legend className="text-sm font-medium">
          Criterion {n}
          <span className="ml-2 font-normal text-muted-foreground">
            {share} of the overall score
          </span>
        </legend>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMoveUp}
            disabled={!onMoveUp}
            aria-label={`Move criterion ${n} up`}
          >
            <ArrowUpIcon aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMoveDown}
            disabled={!onMoveDown}
            aria-label={`Move criterion ${n} down`}
          >
            <ArrowDownIcon aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label={`Remove criterion ${n}`}
          >
            <Trash2Icon aria-hidden />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_12rem_6rem]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={field("label")}>Label</Label>
          <Input
            id={field("label")}
            value={c.label}
            onChange={(e) => onChange({ label: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={field("key")}>Key</Label>
          <Input
            id={field("key")}
            value={c.key}
            onChange={(e) => onChange({ key: e.target.value })}
            placeholder="e.g. output-format"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={field("competency")}>Competency</Label>
          <select
            id={field("competency")}
            value={c.competencyId}
            onChange={(e) => onChange({ competencyId: e.target.value })}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {competencies.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={field("weight")}>Weight</Label>
          <select
            id={field("weight")}
            value={c.weight}
            onChange={(e) => onChange({ weight: Number(e.target.value) })}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {[1, 2, 3, 4, 5].map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={field("description")}>What is judged</Label>
        <Textarea
          id={field("description")}
          value={c.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="min-h-16"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {(
          [
            ["strong", "Strong (80-100)"],
            ["adequate", "Adequate (50-79)"],
            ["weak", "Weak (0-49)"],
          ] as const
        ).map(([band, label]) => (
          <div key={band} className="flex flex-col gap-1.5">
            <Label htmlFor={field(band)}>{label}</Label>
            <Textarea
              id={field(band)}
              value={c.anchors[band]}
              onChange={(e) =>
                onChange({ anchors: { ...c.anchors, [band]: e.target.value } })
              }
              className="min-h-24"
            />
          </div>
        ))}
      </div>
    </fieldset>
  );
}
