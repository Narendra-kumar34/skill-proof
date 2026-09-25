"use server";

import type { Route } from "next";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  challengeInputSchema,
  competencyInputSchema,
  fieldErrors,
  rubricErrorMessages,
  rubricInputSchema,
  skillInputSchema,
} from "@/domain/admin/schemas";
import type { ActionResult } from "@/lib/action-result";
import { cacheTags } from "@/lib/cache-tags";
import * as catalog from "@/server/admin/service";
import { UserFacingError } from "@/server/errors";
import { requireAdmin } from "@/server/session";

/**
 * Admin Server Actions. Every action re-checks the admin role itself (never
 * trusting that the UI was hidden), validates input with the shared schemas,
 * and invalidates the published catalog cache after any change.
 */

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Submitted values echoed back on failure so the form keeps the input. */
  values?: Record<string, string>;
};

const idSchema = z.uuid();

function formObject(
  formData: FormData,
  keys: readonly string[],
): Record<string, string> {
  return Object.fromEntries(
    keys.map((k) => [k, String(formData.get(k) ?? "")]),
  );
}

/** Attach the submitted values to a failed state. */
const keep = (state: FormState, values: Record<string, string>): FormState =>
  state.ok ? state : { ...state, values };

async function run(fn: () => Promise<void>): Promise<FormState> {
  try {
    await fn();
    updateTag(cacheTags.catalog);
    return { ok: true, message: "Saved." };
  } catch (error) {
    if (error instanceof UserFacingError) {
      return { ok: false, message: error.message };
    }
    console.error("Admin action failed", error);
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}

async function runResult<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    updateTag(cacheTags.catalog);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof UserFacingError) {
      return { ok: false, error: error.message };
    }
    console.error("Admin action failed", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

const SKILL_FIELDS = Object.keys(skillInputSchema.shape);
const COMPETENCY_FIELDS = Object.keys(competencyInputSchema.shape);
const CHALLENGE_FIELDS = Object.keys(challengeInputSchema.shape);

// --- Skills -----------------------------------------------------------------

export async function createSkillAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = formObject(formData, SKILL_FIELDS);
  const parsed = skillInputSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error), values };
  }

  let id = "";
  const state = await run(async () => {
    id = await catalog.createSkill(parsed.data);
  });
  if (!state.ok) return keep(state, values);
  redirect(`/admin/skills/${id}` as Route);
}

export async function updateSkillAction(
  skillId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  if (!idSchema.safeParse(skillId).success)
    return { ok: false, message: "Invalid skill." };
  const values = formObject(formData, SKILL_FIELDS);
  const parsed = skillInputSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error), values };
  }
  return keep(
    await run(() => catalog.updateSkill(skillId, parsed.data)),
    values,
  );
}

export async function deleteSkillAction(input: {
  id: string;
}): Promise<ActionResult> {
  await requireAdmin();
  if (!idSchema.safeParse(input.id).success)
    return { ok: false, error: "Invalid skill." };
  return runResult(() => catalog.deleteSkill(input.id));
}

// --- Competencies -----------------------------------------------------------

export async function addCompetencyAction(
  skillId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  if (!idSchema.safeParse(skillId).success)
    return { ok: false, message: "Invalid skill." };
  const values = formObject(formData, COMPETENCY_FIELDS);
  const parsed = competencyInputSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error), values };
  }
  return keep(
    await run(() => catalog.addCompetency(skillId, parsed.data)),
    values,
  );
}

export async function updateCompetencyAction(
  competencyId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  if (!idSchema.safeParse(competencyId).success) {
    return { ok: false, message: "Invalid competency." };
  }
  const values = formObject(formData, COMPETENCY_FIELDS);
  const parsed = competencyInputSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error), values };
  }
  return keep(
    await run(() => catalog.updateCompetency(competencyId, parsed.data)),
    values,
  );
}

export async function deleteCompetencyAction(input: {
  id: string;
}): Promise<ActionResult> {
  await requireAdmin();
  if (!idSchema.safeParse(input.id).success) {
    return { ok: false, error: "Invalid competency." };
  }
  return runResult(() => catalog.deleteCompetency(input.id));
}

// --- Challenges -------------------------------------------------------------

export async function createChallengeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = {
    ...formObject(formData, CHALLENGE_FIELDS),
    status: "draft",
    skillId: String(formData.get("skillId") ?? ""),
  };
  if (!idSchema.safeParse(values.skillId).success) {
    return { ok: false, errors: { skillId: "Choose a skill" }, values };
  }
  const skillId = values.skillId;
  const parsed = challengeInputSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error), values };
  }

  let id = "";
  const state = await run(async () => {
    id = await catalog.createChallenge(skillId, parsed.data);
  });
  if (!state.ok) return keep(state, values);
  redirect(`/admin/challenges/${id}` as Route);
}

export async function updateChallengeAction(
  challengeId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  if (!idSchema.safeParse(challengeId).success) {
    return { ok: false, message: "Invalid challenge." };
  }
  const values = formObject(formData, CHALLENGE_FIELDS);
  const parsed = challengeInputSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error), values };
  }
  return keep(
    await run(() => catalog.updateChallenge(challengeId, parsed.data)),
    values,
  );
}

export async function deleteChallengeAction(input: {
  id: string;
}): Promise<ActionResult> {
  await requireAdmin();
  if (!idSchema.safeParse(input.id).success) {
    return { ok: false, error: "Invalid challenge." };
  }
  return runResult(() => catalog.deleteChallenge(input.id));
}

export async function saveRubricAction(input: {
  challengeId: string;
  criteria: unknown;
}): Promise<
  ActionResult<{ version: number; changed: boolean }> & { issues?: string[] }
> {
  await requireAdmin();
  if (!idSchema.safeParse(input.challengeId).success) {
    return { ok: false, error: "Invalid challenge." };
  }
  const parsed = rubricInputSchema.safeParse(input.criteria);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Fix the issues below and save again.",
      issues: rubricErrorMessages(parsed.error),
    };
  }
  return runResult(() => catalog.saveRubric(input.challengeId, parsed.data));
}
