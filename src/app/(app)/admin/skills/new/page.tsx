import type { Metadata } from "next";

import { SkillForm } from "@/components/admin/skill-form";
import { Breadcrumbs, PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createSkillAction } from "@/server/actions/admin";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Admin · New skill" };

export default async function NewSkillPage() {
  await requireAdmin();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="New skill">
        <Breadcrumbs
          items={[{ label: "Skills", href: "/admin/skills" }, { label: "New" }]}
        />
      </PageHeader>
      <Card>
        <CardContent>
          <SkillForm action={createSkillAction} submitLabel="Create skill" />
        </CardContent>
      </Card>
    </div>
  );
}
