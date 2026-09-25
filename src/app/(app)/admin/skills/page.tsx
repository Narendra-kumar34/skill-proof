import type { Metadata } from "next";
import Link from "next/link";

import { StatusBadge } from "@/components/admin/status-badge";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listSkillsAdmin } from "@/server/admin/queries";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Admin · Skills" };

export default async function AdminSkillsPage() {
  await requireAdmin();
  const skills = await listSkillsAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Skills"
          description="Skills group challenges and define the competencies learners are profiled on."
        />
        <Button asChild>
          <Link href="/admin/skills/new">New skill</Link>
        </Button>
      </div>
      <Card className="py-0">
        <ul className="divide-y">
          {skills.map((s) => (
            <li key={s.id}>
              <Link
                href={`/admin/skills/${s.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 hover:bg-muted/50"
              >
                <span className="flex flex-col">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-xs text-muted-foreground">
                    /{s.slug} · {s.competencyCount} competencies ·{" "}
                    {s.challengeCount} challenges
                  </span>
                </span>
                <StatusBadge status={s.status} />
              </Link>
            </li>
          ))}
          {skills.length === 0 && (
            <li className="px-6 py-10 text-center text-muted-foreground">
              No skills yet.
            </li>
          )}
        </ul>
      </Card>
    </div>
  );
}
