import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { evaluationConfig } from "@/config/evaluation";
import { getAdminOverview } from "@/server/admin/queries";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const o = await getAdminOverview();
  const runs = o.runs24h.succeeded + o.runs24h.failed;
  const failureRate =
    runs > 0 ? Math.round((o.runs24h.failed / runs) * 100) : null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Overview"
        description="Catalog health and evaluation pipeline activity."
      />

      <section
        aria-labelledby="catalog-heading"
        className="flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <h2 id="catalog-heading" className="text-lg font-semibold">
            Catalog
          </h2>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/skills/new">New skill</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/admin/challenges/new">New challenge</Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile
            label="Published skills"
            value={o.skills.published ?? 0}
            sub={`${o.skills.draft ?? 0} draft · ${o.skills.archived ?? 0} archived`}
          />
          <Tile
            label="Published challenges"
            value={o.challenges.published ?? 0}
            sub={`${o.challenges.draft ?? 0} draft · ${o.challenges.archived ?? 0} archived`}
          />
          <Tile
            label="Learners"
            value={o.learners}
            sub={`${o.demoAccounts} demo accounts`}
          />
          <Tile label="Submitted attempts" value={o.attempts} />
        </div>
      </section>

      <section
        aria-labelledby="pipeline-heading"
        className="flex flex-col gap-3"
      >
        <h2 id="pipeline-heading" className="text-lg font-semibold">
          Evaluation pipeline · last 24 hours
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label="Evaluations completed" value={o.runs24h.succeeded} />
          <Tile
            label="Failed"
            value={o.runs24h.failed}
            sub={
              failureRate === null
                ? "No runs yet"
                : `${failureRate}% failure rate`
            }
          />
          <Tile
            label="Average latency"
            value={
              o.runs24h.avgLatencyMs === null
                ? "–"
                : `${(o.runs24h.avgLatencyMs / 1000).toFixed(1)}s`
            }
          />
          <Tile
            label="Daily capacity used"
            value={`${runs + o.runs24h.running} / ${evaluationConfig.rateLimits.globalPerDay}`}
            sub="Global cap protecting the AI key"
          />
        </div>
      </section>
    </div>
  );
}

function Tile({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <Card className="gap-1">
      <CardHeader>
        <CardTitle className="text-sm font-normal text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
