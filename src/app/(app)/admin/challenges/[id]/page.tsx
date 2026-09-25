import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { ChallengeForm } from "@/components/admin/challenge-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { RubricEditor } from "@/components/admin/rubric-editor";
import { StatusBadge } from "@/components/admin/status-badge";
import { Breadcrumbs, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  deleteChallengeAction,
  updateChallengeAction,
} from "@/server/actions/admin";
import { getChallengeAdmin } from "@/server/admin/queries";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Admin · Edit challenge" };

export default async function EditChallengePage({
  params,
}: PageProps<"/admin/challenges/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const challenge = await getChallengeAdmin(id);
  if (!challenge) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title={challenge.title}>
          <Breadcrumbs
            items={[
              { label: "Challenges", href: "/admin/challenges" },
              {
                label: challenge.skill.name,
                href: `/admin/skills/${challenge.skill.id}` as Route,
              },
              { label: challenge.title },
            ]}
          />
        </PageHeader>
        <div className="flex items-center gap-2">
          <StatusBadge status={challenge.status} />
          {challenge.status === "published" && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/challenges/${challenge.slug}`}>View live</Link>
            </Button>
          )}
          <DeleteButton
            id={challenge.id}
            action={deleteChallengeAction}
            entity={`challenge “${challenge.title}”`}
            description={
              challenge.attemptCount > 0
                ? `Learners have made ${challenge.attemptCount} attempts, so this can't be deleted. Archive it instead to hide it while keeping their evidence.`
                : "The challenge and its rubric will be permanently removed."
            }
            redirectTo="/admin/challenges"
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
          <ChallengeForm
            action={updateChallengeAction.bind(null, challenge.id)}
            defaults={challenge}
            submitLabel="Save changes"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Rubric</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RubricEditor
            challengeId={challenge.id}
            rubricVersion={challenge.rubricVersion}
            competencies={challenge.skill.competencies.map((c) => ({
              id: c.id,
              label: c.label,
            }))}
            initial={challenge.criteria.map((c) => ({
              id: c.id,
              key: c.key,
              label: c.label,
              description: c.description,
              competencyId: c.competencyId,
              weight: c.weight,
              anchors: c.anchors,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
