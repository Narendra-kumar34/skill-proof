import {
  BookOpenIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  ListChecksIcon,
  type LucideIcon,
  RouteIcon,
  ScaleIcon,
  TrophyIcon,
} from "lucide-react";
import Link from "next/link";

import { DemoButton } from "@/components/auth/demo-button";
import {
  BandLabel,
  ScoreMeter,
  ScoreRing,
} from "@/components/evaluation/score-visuals";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";

const steps: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: BookOpenIcon,
    title: "Learn the essentials",
    body: "A short, practical brief on the skill: the principles that matter and the mistakes to avoid.",
  },
  {
    icon: FileTextIcon,
    title: "Tackle a real scenario",
    body: "Solve a realistic workplace problem, not a multiple-choice quiz. Your draft saves as you write.",
  },
  {
    icon: ClipboardCheckIcon,
    title: "Get rubric-based feedback",
    body: "AI grades your work against explicit criteria and tells you what worked, what didn't, and why.",
  },
  {
    icon: TrophyIcon,
    title: "Build your evidence",
    body: "Every attempt adds to a skill profile that shows what you can actually demonstrate.",
  },
];

const differentiators: Array<{
  icon: LucideIcon;
  title: string;
  body: string;
}> = [
  {
    icon: ScaleIcon,
    title: "Rubrics, not vibes",
    body: "Each challenge has weighted criteria with clear descriptions of strong, adequate and weak work. The overall score is computed transparently from them.",
  },
  {
    icon: ListChecksIcon,
    title: "Evidence, not percentages",
    body: "Your profile links every competency score to the challenges behind it, so progress is something you can point to.",
  },
  {
    icon: RouteIcon,
    title: "A clear next step",
    body: "Consistent weak spots are detected across attempts, and you're pointed to the challenge that targets them.",
  },
];

const skillAreas = [
  "Prompt Engineering",
  "AI Workflow Design",
  "AI-Assisted Data Analysis",
];

const sampleCriteria = [
  { label: "Category definitions", score: 88 },
  { label: "Machine-readable output", score: 84 },
  { label: "Ambiguous input handling", score: 58 },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <span className="font-semibold tracking-tight">{siteConfig.name}</span>
        <Button asChild variant="ghost" size="sm">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </header>

      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-2 lg:pt-16">
        <div className="flex flex-col gap-6">
          <p className="text-sm font-medium text-muted-foreground">
            Practical AI skill assessment for professionals
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {siteConfig.tagline}
          </h1>
          <p className="max-w-xl text-lg text-pretty text-muted-foreground">
            Courses measure completion. SkillProof measures application:
            practise on realistic workplace scenarios, get rubric-based AI
            feedback, and build an evidence-backed skill profile.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <DemoButton size="lg" />
            <Button asChild size="lg" variant="outline">
              <Link href="/sign-up">Create a free account</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            The demo opens a pre-filled account. No sign-up needed.
          </p>
        </div>

        <SamplePreview />
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="border-y bg-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-20 sm:px-6">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2
              id="how-heading"
              className="text-3xl font-semibold tracking-tight"
            >
              From knowing to doing
            </h2>
            <p className="text-muted-foreground">
              One loop, repeated: learn, practise, get evaluated, find your
              gaps, improve.
            </p>
          </div>
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <li key={step.title} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg border bg-background">
                    <step.icon aria-hidden className="size-4" />
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Differentiators */}
      <section
        aria-labelledby="diff-heading"
        className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-20 sm:px-6"
      >
        <h2
          id="diff-heading"
          className="max-w-2xl text-3xl font-semibold tracking-tight"
        >
          Assessment you can trust, feedback you can use
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {differentiators.map((d) => (
            <Card key={d.title}>
              <CardContent className="flex flex-col gap-3">
                <d.icon aria-hidden className="size-5" />
                <h3 className="font-semibold">{d.title}</h3>
                <p className="text-sm text-muted-foreground">{d.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Skills available now:</span>
          {skillAreas.map((s) => (
            <span key={s} className="rounded-full border px-3 py-1">
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 py-20 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              See it in under a minute
            </h2>
            <p className="text-muted-foreground">
              Open the demo to explore a learner&apos;s evaluations, profile and
              next steps.
            </p>
          </div>
          <DemoButton size="lg" />
        </div>
      </section>
    </div>
  );
}

/** Static example of an evaluation, built from the real result components. */
function SamplePreview() {
  return (
    <figure aria-label="Example evaluation result" className="relative">
      <Card className="shadow-lg">
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center gap-5">
            <ScoreRing score={81} size={112} />
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-muted-foreground">
                Prompt Engineering · Customer feedback classification
              </p>
              <p className="font-semibold">Attempt 2 result</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-score-strong">+19</span> since
                attempt 1
              </p>
            </div>
          </div>
          <ul className="flex flex-col gap-4">
            {sampleCriteria.map((c) => (
              <li key={c.label} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span>{c.label}</span>
                  <span className="flex items-center gap-2">
                    <BandLabel score={c.score} />
                    <span className="w-7 text-right font-semibold tabular-nums">
                      {c.score}
                    </span>
                  </span>
                </div>
                <ScoreMeter score={c.score} />
              </li>
            ))}
          </ul>
          <div className="rounded-lg bg-muted/60 p-3 text-sm">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Next step
            </span>
            <p className="font-medium">Support triage with fallbacks</p>
            <p className="text-muted-foreground">
              Targets ambiguous-input handling, your weakest criterion.
            </p>
          </div>
        </CardContent>
      </Card>
      <figcaption className="mt-3 text-center text-xs text-muted-foreground">
        Example evaluation
      </figcaption>
    </figure>
  );
}
