import type { Metadata } from "next";

import { ChallengeForm } from "@/components/admin/challenge-form";
import { Breadcrumbs, PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createChallengeAction } from "@/server/actions/admin";
import { listSkillOptions } from "@/server/admin/queries";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Admin · New challenge" };

export default async function NewChallengePage({
  searchParams,
}: PageProps<"/admin/challenges/new">) {
  await requireAdmin();
  const [{ skill }, skills] = await Promise.all([
    searchParams,
    listSkillOptions(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="New challenge">
        <Breadcrumbs
          items={[
            { label: "Challenges", href: "/admin/challenges" },
            { label: "New" },
          ]}
        />
      </PageHeader>
      <Card>
        <CardContent>
          {skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Create a skill first.
            </p>
          ) : (
            <ChallengeForm
              action={createChallengeAction}
              skillOptions={skills.map((s) => ({ value: s.id, label: s.name }))}
              defaultSkillId={typeof skill === "string" ? skill : skills[0]?.id}
              submitLabel="Create challenge"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
