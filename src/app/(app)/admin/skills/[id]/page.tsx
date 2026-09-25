import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { CompetencyManager } from "@/components/admin/competency-manager";
import { DeleteButton } from "@/components/admin/delete-button";
import { SkillForm } from "@/components/admin/skill-form";
import { StatusBadge } from "@/components/admin/status-badge";
import { Breadcrumbs, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteSkillAction, updateSkillAction } from "@/server/actions/admin";
import { getSkillAdmin } from "@/server/admin/queries";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Admin · Edit skill" };

export default async function EditSkillPage({
  params,
}: PageProps<"/admin/skills/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const skill = await getSkillAdmin(id);
  if (!skill) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title={skill.name}>
          <Breadcrumbs
            items={[
              { label: "Skills", href: "/admin/skills" },
              { label: skill.name },
            ]}
          />
        </PageHeader>
        <div className="flex items-center gap-2">
          <StatusBadge status={skill.status} />
          {skill.status === "published" && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/skills/${skill.slug}`}>View live</Link>
            </Button>
          )}
          <DeleteButton
            id={skill.id}
            action={deleteSkillAction}
            entity={`skill “${skill.name}”`}
            description="Only skills without challenges can be deleted. Its competencies are deleted too. To hide a skill but keep history, archive it instead."
            redirectTo="/admin/skills"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Details</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SkillForm
            action={updateSkillAction.bind(null, skill.id)}
            defaults={skill}
            submitLabel="Save changes"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Competencies</h2>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            The fixed dimensions learners are profiled on for this skill.
          </p>
        </CardHeader>
        <CardContent>
          <CompetencyManager
            skillId={skill.id}
            competencies={skill.competencies}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            <h2>Challenges</h2>
          </CardTitle>
          <Button asChild size="sm">
            <Link href={`/admin/challenges/new?skill=${skill.id}`}>
              New challenge
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {skill.challenges.length === 0 ? (
            <p className="text-sm text-muted-foreground">No challenges yet.</p>
          ) : (
            <ul className="divide-y">
              {skill.challenges.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/admin/challenges/${c.id}`}
                    className="flex items-center justify-between gap-3 py-3 text-sm hover:underline hover:underline-offset-4"
                  >
                    {c.title}
                    <StatusBadge status={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
