import "server-only";

import { z } from "zod";

/** Treats `KEY=""` (common in .env files and dashboards) as unset. */
const emptyAsUnset = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema);

/**
 * Server-side environment, validated once at startup so a misconfigured
 * deployment fails loudly instead of at the first request that needs a value.
 */
const serverEnvSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    /** Set by Vercel: "production" | "preview" | "development". */
    VERCEL_ENV: emptyAsUnset(z.string().optional()),
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
    // Trailing slashes are stripped: origins never have one, and a mismatch
    // makes Better Auth reject sign-ins with "Invalid origin".
    BETTER_AUTH_URL: z.url().transform((url) => url.replace(/\/+$/, "")),
    /** Hostnames Vercel injects at runtime (no protocol). */
    VERCEL_URL: emptyAsUnset(z.string().optional()),
    VERCEL_BRANCH_URL: emptyAsUnset(z.string().optional()),
    VERCEL_PROJECT_PRODUCTION_URL: emptyAsUnset(z.string().optional()),
    // Optional on purpose: without it the app still works and evaluations
    // fail gracefully (retryable) instead of the whole deployment crashing.
    GOOGLE_GENERATIVE_AI_API_KEY: emptyAsUnset(z.string().min(1).optional()),
    GEMINI_MODEL: emptyAsUnset(z.string().min(1).default("gemini-3.8-flash")),
    /** Shared secret Vercel Cron sends to the housekeeping endpoint. */
    CRON_SECRET: emptyAsUnset(z.string().min(16).optional()),
    /** "1" swaps Gemini for a deterministic mock (tests/E2E only). */
    AI_MOCK: emptyAsUnset(z.enum(["0", "1"]).default("0")),
  })
  .refine((e) => !(e.AI_MOCK === "1" && e.VERCEL_ENV === "production"), {
    message: "AI_MOCK must never be enabled in production",
    path: ["AI_MOCK"],
  });

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsed.data;
