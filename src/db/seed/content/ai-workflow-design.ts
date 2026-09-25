import type { SeedSkill } from "../types";

export const aiWorkflowDesign: SeedSkill = {
  slug: "ai-workflow-design",
  name: "AI Workflow Design",
  summary:
    "Design multi-step processes where AI and people each handle the work they are best at, with clear checkpoints and recovery paths.",
  sortOrder: 2,
  conceptBrief: `AI workflow design is the skill of turning a business process into a sequence of steps where AI models, conventional software, and people each do the part they are suited for. The goal is not "use AI everywhere" but a process that is faster, cheaper, or more consistent than today, and that fails safely when something goes wrong.

**Key principles**

- **Decompose before you automate.** Break the process into discrete steps with clear inputs and outputs. Many steps are better served by rules, lookups, or existing systems than by a language model.
- **Match the tool to the step.** Use models for judgment on unstructured content (classifying, summarizing, drafting), deterministic code for calculations and validation, and integrations for moving data between systems.
- **Put humans where the risk is.** Decide explicitly which decisions need human approval, based on cost of error, reversibility, and regulation. Make review efficient by showing the reviewer what the AI saw and why it decided.
- **Design for failure.** Assume the model will sometimes be wrong, slow, or unavailable. Define confidence thresholds, validation checks, retries, and a manual fallback path.
- **Measure it.** Track accuracy, override rates, and turnaround so you know whether the workflow is actually working.

**Common mistake**

Designing the happy path only: a neat diagram of AI steps with no answer to "what happens when the output is wrong?" Reviewers, escalation rules, and monitoring are what make a workflow trustworthy enough to run in production.`,
  competencies: [
    {
      key: "problem-decomposition",
      label: "Problem Decomposition",
      description:
        "Breaks a business process into discrete, well-ordered steps with clear inputs, outputs, and owners.",
    },
    {
      key: "tool-selection",
      label: "Tool Selection",
      description:
        "Chooses the right mechanism for each step, whether a model, deterministic code, an integration, or a person.",
    },
    {
      key: "human-oversight",
      label: "Human Oversight",
      description:
        "Places human review and approval where risk warrants it and makes that review practical and accountable.",
    },
    {
      key: "failure-handling",
      label: "Failure Handling",
      description:
        "Anticipates wrong, low-confidence, or missing outputs and defines validation, fallbacks, and monitoring.",
    },
  ],
  challenges: [
    {
      slug: "support-ticket-insights-workflow",
      title: "Turn Weekly Support Tickets into an Executive Summary",
      summary:
        "Design a workflow that categorizes support tickets, spots recurring issues, and briefs leadership every week.",
      difficulty: "beginner",
      estimatedMinutes: 15,
      scenario: `You are an operations manager at a home-appliance retailer with an online store. The support team handles about **4,500 tickets per week** across email and chat, stored in a helpdesk tool that can export tickets as CSV (ticket ID, created date, channel, subject, full text, agent tags, resolution status).

Agent tags are inconsistent: over 300 different tags are in use, many overlapping ("delivery-late", "late delivery", "shipping delay"). The leadership team meets every Monday at 9:00 and wants a one-page summary covering:

- the top recurring issues and how they changed versus last week
- any new or fast-growing problem (for example, a spike in complaints about one product)
- two or three representative customer quotes

Today a team lead spends most of Friday building this by hand, and it is often late or based on a sample of a few hundred tickets. You have access to a general-purpose AI model through your company's approved platform, a spreadsheet tool, and a basic automation tool that can run scheduled jobs and move files between systems. Nobody on the team writes code regularly.`,
      task: `- Describe the workflow step by step, from ticket export to the summary landing with leadership.
- For each step, say what does the work (AI model, spreadsheet, automation tool, or a person) and why.
- Identify where a person should check the output before it reaches leadership, and what they check.`,
      responseGuidance:
        "A numbered list of workflow steps with a short rationale for each, plus a brief note on review. 200–450 words.",
      criteria: [
        {
          key: "pipeline-steps",
          label: "Workflow steps",
          description:
            "Whether the process is broken into a logical, complete sequence from export to delivery.",
          competency: "problem-decomposition",
          weight: 4,
          anchors: {
            strong:
              "Steps cover scheduled export, a fixed category list replacing the 300 messy tags, per-ticket classification, week-over-week aggregation, spike detection, quote selection, drafting, review, and delivery before Monday 9:00, each with a clear input and output.",
            adequate:
              "The main stages are present, but one important step is missing or merged (e.g. no fixed category list, or no week-over-week comparison), making the output less reliable.",
            weak: "The workflow is essentially 'send all tickets to AI and ask for a summary', with no meaningful decomposition.",
          },
        },
        {
          key: "tool-choices",
          label: "Tool choices",
          description:
            "Whether each step uses an appropriate tool given the team's no-code constraint.",
          competency: "tool-selection",
          weight: 3,
          anchors: {
            strong:
              "Uses the AI model for classification and drafting, the spreadsheet for counts and comparisons, and the automation tool for scheduling and file movement; explicitly avoids asking the model to do arithmetic across 4,500 tickets; all choices are feasible without coding.",
            adequate:
              "Tool choices are mostly sensible, but some steps are assigned to the model that a spreadsheet would do more reliably, or feasibility for a no-code team is unclear.",
            weak: "Relies on a single tool for everything or proposes tools the team cannot realistically operate.",
          },
        },
        {
          key: "review-checkpoint",
          label: "Review checkpoint",
          description:
            "Whether a person checks the summary before leadership sees it, and the check is specific.",
          competency: "human-oversight",
          weight: 3,
          anchors: {
            strong:
              "Names who reviews, when (e.g. Friday afternoon), and what they check: spot-checking a sample of classifications, verifying that quoted text is real and anonymized, and confirming any flagged spike against raw tickets.",
            adequate:
              "Includes a human review step, but it is generic ('someone checks the summary') without saying what to verify.",
            weak: "No human review; the AI-generated summary goes straight to leadership.",
          },
        },
      ],
    },
    {
      slug: "invoice-approval-automation",
      title: "Automate Invoice Processing Without Losing Control",
      summary:
        "Design an AI-assisted accounts payable workflow that speeds up approvals while keeping payment risk in check.",
      difficulty: "intermediate",
      estimatedMinutes: 25,
      scenario: `You are the finance systems lead at a manufacturing company with three plants. Accounts payable processes about **2,200 supplier invoices per month**, arriving as PDF attachments, scanned paper, and email text. Current cycle time is 11 days from receipt to approval, and the company regularly misses early-payment discounts worth an estimated **$180,000 per year**.

The existing process: a clerk keys invoice data into the ERP, matches it against the purchase order and goods receipt ("three-way match"), and emails the budget owner for approval if the amount exceeds $5,000. About 15% of invoices have a mismatch (price, quantity, or missing PO).

The CFO wants to cut cycle time to 3 days using AI, with constraints:

- No payment may be released without a matched PO or an explicit human approval.
- Internal audit must be able to see who (or what) approved each invoice and why.
- The ERP has an API for reading POs and goods receipts and for creating draft invoices, but not for releasing payments.
- Last year the company received two fraudulent invoices that changed a supplier's bank details.`,
      task: `- Lay out the end-to-end workflow from invoice arrival to approved payment.
- Specify which steps use AI, which use deterministic rules or the ERP, and which require a person.
- Define which invoices can be approved with minimal human effort and which must be escalated, with the criteria.
- Describe how the workflow handles extraction errors, mismatches, suspected fraud, and system outages.`,
      responseGuidance:
        "Structured sections or a numbered workflow with short explanations. 350–700 words.",
      criteria: [
        {
          key: "process-breakdown",
          label: "Process breakdown",
          description:
            "Whether the workflow is decomposed into clear stages covering intake through approval.",
          competency: "problem-decomposition",
          weight: 3,
          anchors: {
            strong:
              "Distinct stages for intake from all three channels, extraction, validation, three-way match, routing, approval, and audit logging, each with defined inputs, outputs, and owners.",
            adequate:
              "Covers the main flow but merges or skips stages (e.g. no separate validation after extraction, or scanned paper is ignored).",
            weak: "Describes AI 'processing invoices' end to end without distinguishing stages.",
          },
        },
        {
          key: "automation-boundaries",
          label: "Automation boundaries and approval",
          description:
            "Whether the design draws sensible lines between automated and human decisions and keeps them auditable.",
          competency: "human-oversight",
          weight: 4,
          anchors: {
            strong:
              "Defines explicit criteria for low-touch approval (e.g. full three-way match, known supplier, unchanged bank details, under threshold) and escalation for everything else; any bank-detail change always requires human verification; every decision records approver identity, AI output, and rationale for audit.",
            adequate:
              "Keeps humans in the loop for mismatches and large amounts, but criteria are loose or the audit trail and bank-detail risk are not addressed.",
            weak: "Lets AI approve invoices broadly without clear boundaries, or adds humans everywhere so cycle time would not improve.",
          },
        },
        {
          key: "exception-handling",
          label: "Exceptions and failure modes",
          description:
            "Whether mismatches, extraction errors, fraud signals, and outages have defined handling.",
          competency: "failure-handling",
          weight: 4,
          anchors: {
            strong:
              "Specifies validation of extracted fields (totals add up, PO exists), confidence thresholds that send uncertain extractions to a clerk, mismatch routing by type, fraud checks on bank details against the vendor master, and a manual fallback queue when the model or ERP API is unavailable.",
            adequate:
              "Handles mismatches and mentions review for low confidence, but omits fraud signals or outage handling.",
            weak: "Little or no exception handling; assumes extraction and matching always succeed.",
          },
        },
        {
          key: "system-integration",
          label: "Tools and integration",
          description:
            "Whether the design uses AI, rules, and the ERP API appropriately and respects stated system limits.",
          competency: "tool-selection",
          weight: 3,
          anchors: {
            strong:
              "Uses a document-extraction model for PDFs and scans, deterministic rules for matching and thresholds, the ERP API for PO lookups and draft invoices, and correctly keeps payment release as a manual ERP step given the API limit.",
            adequate:
              "Tool choices are mostly appropriate but some deterministic work (matching, threshold checks) is given to the model, or the API limitation is overlooked.",
            weak: "Tool choices are vague ('use AI') or assume capabilities the ERP does not have.",
          },
        },
      ],
    },
    {
      slug: "contract-review-pipeline",
      title: "Design a Contract Intake and Review Pipeline for Legal Ops",
      summary:
        "Architect an AI-assisted contract review process that handles confidential documents, risk scoring, and lawyer escalation.",
      difficulty: "advanced",
      estimatedMinutes: 30,
      scenario: `You are the legal operations manager at a software company with 1,400 employees. The in-house legal team (five lawyers, two paralegals) receives about **350 contracts per month**: customer agreements on customer paper, NDAs, vendor contracts, and data processing agreements. Median turnaround is 9 business days, and sales leadership says slow reviews are delaying deals.

About 60% of volume is low-risk (standard NDAs, small vendor renewals), but the rest can contain serious issues: uncapped liability, unusual indemnities, data transfer terms that conflict with the company's privacy commitments, or auto-renewal clauses.

Leadership has approved an AI-assisted pipeline with these constraints:

- Contracts are confidential; only models approved under the company's data agreement may process them.
- The legal team maintains a **playbook** of preferred positions and fallback positions for 40 common clauses.
- The general counsel must remain accountable for every signed contract; no contract may be signed on AI review alone.
- The company must be able to show regulators how data-processing terms were reviewed.
- Sales wants status visibility without emailing lawyers.`,
      task: `- Design the pipeline from contract submission to signature-ready status.
- Specify the role of AI at each stage (e.g. classification, clause extraction, playbook comparison, redline drafting) and what it must not do.
- Define the escalation model: which contracts can be fast-tracked, who reviews what, and how accountability is recorded.
- Describe the main failure modes (missed clauses, hallucinated clause text, model outage, playbook drift) and how the pipeline detects and recovers from them.
- Propose three metrics to judge whether the pipeline is working after three months.`,
      responseGuidance:
        "Structured sections with headings for pipeline, escalation, failure modes, and metrics. 500–900 words.",
      criteria: [
        {
          key: "stage-design",
          label: "Pipeline stages",
          description:
            "Whether the pipeline is decomposed into clear stages with appropriate sequencing for different contract types.",
          competency: "problem-decomposition",
          weight: 3,
          anchors: {
            strong:
              "Defines intake, classification by type and risk, clause extraction, playbook comparison, triage, review, redline, and approval stages, with different paths for low-risk and high-risk contracts and a status feed for sales.",
            adequate:
              "Covers the main stages but uses one path for all contracts or omits sales visibility.",
            weak: "A single 'AI reviews the contract' step followed by lawyer review, with little structure.",
          },
        },
        {
          key: "model-and-tool-fit",
          label: "Model and tool fit",
          description:
            "Whether AI is used for tasks it does well, with approved models, and deterministic tools where precision matters.",
          competency: "tool-selection",
          weight: 3,
          anchors: {
            strong:
              "Restricts processing to approved models; uses AI for classification, extraction, and playbook comparison with clause citations; uses deterministic checks (e.g. verifying quoted clause text exists verbatim) and a contract management system for status and audit; states that AI never approves or signs.",
            adequate:
              "AI roles are reasonable but data-agreement constraints or verification of AI-quoted text are not addressed.",
            weak: "AI roles are vague or include inappropriate tasks such as final approval.",
          },
        },
        {
          key: "escalation-and-accountability",
          label: "Escalation and accountability",
          description:
            "Whether review responsibility is matched to risk and accountability is clear and recorded.",
          competency: "human-oversight",
          weight: 5,
          anchors: {
            strong:
              "Defines risk tiers with concrete triggers (e.g. any deviation from playbook fallback, uncapped liability, data transfer terms) mapped to paralegal, lawyer, or general counsel review; fast-track still has a named human sign-off; every decision logs reviewer, AI findings, and overrides, supporting regulator inquiries on data terms.",
            adequate:
              "Includes human review tiers but triggers are vague, or accountability and the regulatory record are only mentioned in passing.",
            weak: "Human review is generic or optional for low-risk contracts, leaving accountability unclear.",
          },
        },
        {
          key: "failure-modes-and-monitoring",
          label: "Failure modes and monitoring",
          description:
            "Whether the design detects and recovers from AI errors and operational failures, and measures success.",
          competency: "failure-handling",
          weight: 4,
          anchors: {
            strong:
              "Addresses each named failure mode with a concrete control (sampled second review of fast-tracked contracts, verbatim citation checks, manual queue on outage, scheduled playbook review) and proposes measurable metrics such as turnaround, missed-issue rate from audits, and lawyer override rate.",
            adequate:
              "Covers some failure modes and gives metrics, but controls are generic or metrics are hard to measure.",
            weak: "Failure modes are not addressed or metrics are absent.",
          },
        },
      ],
    },
  ],
};
