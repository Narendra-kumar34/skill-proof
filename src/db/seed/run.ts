/**
 * Idempotent catalog seed: `npm run db:seed`.
 *
 * Upserts skills, competencies, challenges and rubric criteria by their
 * natural keys (slugs/keys), so it is safe to re-run against any environment.
 * Optionally creates an admin account from SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD.
 */
import { randomUUID } from "node:crypto";

import { loadEnvConfig } from "@next/env";
import { hashPassword } from "better-auth/crypto";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "../schema";
import { seedSkills } from "./content";

loadEnvConfig(process.cwd());

const { account, challenges, competencies, rubricCriteria, skills, user } =
  schema;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const pool = new Pool({ connectionString: url, max: 1 });
  const db = drizzle(pool, { schema, casing: "snake_case" });

  try {
    await db.transaction(async (tx) => {
      for (const s of seedSkills) {
        const [skill] = await tx
          .insert(skills)
          .values({
            slug: s.slug,
            name: s.name,
            summary: s.summary,
            conceptBrief: s.conceptBrief,
            sortOrder: s.sortOrder,
            status: "published",
          })
          .onConflictDoUpdate({
            target: skills.slug,
            set: {
              name: s.name,
              summary: s.summary,
              conceptBrief: s.conceptBrief,
              sortOrder: s.sortOrder,
              status: "published",
            },
          })
          .returning({ id: skills.id });

        const competencyIds = new Map<string, string>();
        for (const [i, c] of s.competencies.entries()) {
          const [row] = await tx
            .insert(competencies)
            .values({ skillId: skill!.id, ...c, sortOrder: i })
            .onConflictDoUpdate({
              target: [competencies.skillId, competencies.key],
              set: { label: c.label, description: c.description, sortOrder: i },
            })
            .returning({ id: competencies.id });
          competencyIds.set(c.key, row!.id);
        }

        for (const ch of s.challenges) {
          const { criteria, ...fields } = ch;
          const [challenge] = await tx
            .insert(challenges)
            .values({ skillId: skill!.id, ...fields, status: "published" })
            .onConflictDoUpdate({
              target: challenges.slug,
              set: { skillId: skill!.id, ...fields, status: "published" },
            })
            .returning({ id: challenges.id });

          for (const [i, cr] of criteria.entries()) {
            const competencyId = competencyIds.get(cr.competency);
            if (!competencyId) {
              throw new Error(
                `Criterion "${ch.slug}/${cr.key}" references unknown competency "${cr.competency}"`,
              );
            }
            const values = {
              label: cr.label,
              description: cr.description,
              weight: cr.weight,
              anchors: cr.anchors,
              competencyId,
              sortOrder: i,
            };
            await tx
              .insert(rubricCriteria)
              .values({ challengeId: challenge!.id, key: cr.key, ...values })
              .onConflictDoUpdate({
                target: [rubricCriteria.challengeId, rubricCriteria.key],
                set: values,
              });
          }

          // Drop criteria that were removed from the seed. Past evaluations
          // keep their own rubric snapshot, so history is unaffected.
          await tx.delete(rubricCriteria).where(
            and(
              eq(rubricCriteria.challengeId, challenge!.id),
              notInArray(
                rubricCriteria.key,
                criteria.map((c) => c.key),
              ),
            ),
          );
        }
      }
    });

    const challengeCount = seedSkills.reduce(
      (n, s) => n + s.challenges.length,
      0,
    );
    console.log(
      `Seeded ${seedSkills.length} skills and ${challengeCount} challenges.`,
    );

    await seedAdmin(db);
  } finally {
    await pool.end();
  }
}

async function seedAdmin(db: ReturnType<typeof drizzle<typeof schema>>) {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("SEED_ADMIN_EMAIL/PASSWORD not set; skipping admin account.");
    return;
  }
  if (password.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters");
  }

  const existing = await db.query.user.findFirst({
    where: eq(user.email, email),
  });
  if (existing) {
    await db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.id, existing.id));
    console.log("Admin account already exists; ensured admin role.");
    return;
  }

  const id = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(user).values({
      id,
      name: "Admin",
      email,
      emailVerified: true,
      role: "admin",
    });
    // Matches what Better Auth writes for email/password sign-up.
    await tx.insert(account).values({
      id: randomUUID(),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: await hashPassword(password),
      updatedAt: sql`now()`,
    });
  });
  console.log("Created admin account.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
