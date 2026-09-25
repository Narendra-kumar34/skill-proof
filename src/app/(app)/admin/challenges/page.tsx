import type { Metadata, Route } from "next";
import Link from "next/link";
import { z } from "zod";

import { StatusBadge } from "@/components/admin/status-badge";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { listChallengesAdmin, listSkillOptions } from "@/server/admin/queries";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Admin · Challenges" };

export default async function AdminChallengesPage({
  searchParams,
}: PageProps<"/admin/challenges">) {
  await requireAdmin();
  const { skill } = await searchParams;
  const skillId =
    typeof skill === "string" && z.uuid().safeParse(skill).success
      ? skill
      : undefined;
  const [challenges, skills] = await Promise.all([
    listChallengesAdmin(skillId),
    listSkillOptions(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Challenges"
          description="Realistic scenarios with a weighted rubric. Publish once the rubric is complete."
        />
        <Button asChild>
          <Link
            href={
              (skillId
                ? `/admin/challenges/new?skill=${skillId}`
                : "/admin/challenges/new") as Route
            }
          >
            New challenge
          </Link>
        </Button>
      </div>

      <nav aria-label="Filter by skill" className="flex flex-wrap gap-1.5">
        {[{ id: undefined, name: "All skills" }, ...skills].map((s) => (
          <Link
            key={s.id ?? "all"}
            href={
              (s.id
                ? `/admin/challenges?skill=${s.id}`
                : "/admin/challenges") as Route
            }
            aria-current={s.id === skillId ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              s.id === skillId
                ? "border-foreground bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s.name}
          </Link>
        ))}
      </nav>

      <Card className="py-0">
        <ul className="divide-y">
          {challenges.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/challenges/${c.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 hover:bg-muted/50"
              >
                <span className="flex flex-col">
                  <span className="font-medium">{c.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {c.skillName} · {c.difficulty} · {c.criteriaCount} criteria
                    · rubric v{c.rubricVersion} · {c.attemptCount} attempts
                  </span>
                </span>
                <StatusBadge status={c.status} />
              </Link>
            </li>
          ))}
          {challenges.length === 0 && (
            <li className="px-6 py-10 text-center text-muted-foreground">
              No challenges yet.
            </li>
          )}
        </ul>
      </Card>
    </div>
  );
}
