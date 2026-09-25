import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { anonymous } from "better-auth/plugins";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { MAX_NAME_LENGTH, normalizeDisplayName } from "@/domain/user";
import { env } from "@/env";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
  },

  user: {
    additionalFields: {
      // Server-controlled: `input: false` means sign-up can never set it.
      role: {
        type: "string",
        required: false,
        defaultValue: "learner",
        input: false,
      },
    },
  },

  session: {
    // Avoid a DB round-trip on every request; the signed cookie is trusted
    // for a short window before the session is re-validated.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  rateLimit: {
    enabled: true,
    // Database-backed so limits hold across serverless instances.
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/sign-in/anonymous": { window: 60, max: 3 },
    },
  },

  databaseHooks: {
    // Better Auth validates email/password; the display name is ours to check.
    user: {
      create: {
        before: async (user) => ({
          data: { ...user, name: requireValidName(user.name) },
        }),
      },
      update: {
        before: async (user) =>
          typeof user.name === "string"
            ? { data: { ...user, name: requireValidName(user.name) } }
            : undefined,
      },
    },
  },

  plugins: [
    // Powers the one-click demo: a throwaway account per visitor.
    anonymous({
      emailDomainName: "demo.skillproof.invalid",
      generateName: () => "Demo Learner",
    }),
    // Must be last: lets Server Actions set auth cookies.
    nextCookies(),
  ],
});

function requireValidName(raw: string): string {
  const name = normalizeDisplayName(raw);
  if (!name) {
    throw new APIError("BAD_REQUEST", {
      message: `Name must be 1-${MAX_NAME_LENGTH} characters.`,
    });
  }
  return name;
}

export type Session = typeof auth.$Infer.Session;
