import type { SeedSkill } from "../types";

export const aiDataAnalysis: SeedSkill = {
  slug: "ai-data-analysis",
  name: "AI-Assisted Data Analysis",
  summary:
    "Use AI tools to analyze data faster while keeping the questions sharp, the data sound, and the conclusions defensible.",
  sortOrder: 3,
  conceptBrief: `AI-assisted data analysis means using AI models and AI-enabled tools to clean data, run analyses, and draft findings, while you remain responsible for whether the conclusions are true. AI can write a query or chart in seconds; it cannot tell you whether you asked the right question or whether the data can support the answer.

**Key principles**

- **Frame the decision first.** Start from the business decision and turn it into specific, answerable questions with a defined metric, time period, and comparison.
- **Inspect the data before trusting it.** Ask the AI to profile the dataset (row counts, missing values, duplicates, date ranges, outliers) and check definitions before running any analysis.
- **Verify, don't just accept.** Reproduce key numbers independently, ask for the code or method behind each result, and spot-check AI-coded samples by hand.
- **Separate correlation from cause.** Be explicit about confounders, selection effects, and what an analysis can and cannot show.
- **Communicate for the decision.** Lead with the answer, quantify uncertainty, and state limitations and next steps in plain language.

**Common mistake**

Pasting a dataset into an AI tool, asking "what insights are in this data?", and forwarding the confident-sounding output. Without a framed question and verification, you get plausible narratives built on duplicated rows, mismatched definitions, or coincidental correlations, and the error becomes yours once it is in a leadership deck.`,
  competencies: [
    {
      key: "question-framing",
      label: "Question Framing",
      description:
        "Turns a business problem into specific, measurable questions tied to a decision.",
    },
    {
      key: "data-preparation",
      label: "Data Preparation",
      description:
        "Profiles, cleans, and validates data, and checks definitions before analysis begins.",
    },
    {
      key: "analytical-rigor",
      label: "Analytical Rigor",
      description:
        "Verifies AI-generated results and draws conclusions the evidence can actually support.",
    },
    {
      key: "insight-communication",
      label: "Insight Communication",
      description:
        "Presents findings clearly for the audience, with quantified uncertainty and recommended actions.",
    },
  ],
  challenges: [
    {
      slug: "regional-sales-dip-investigation",
      title: "Investigate a Regional Sales Dip with an AI Assistant",
      summary:
        "Plan how to use an AI assistant to find out why one region's sales fell and brief the sales director.",
      difficulty: "beginner",
      estimatedMinutes: 15,
      scenario: `You are a business analyst at a national office-supplies wholesaler. The sales director messages you on Monday:

> "Northeast revenue was down 14% last quarter while every other region grew. I need to know why before Thursday's leadership meeting."

You have a CSV export from the sales system with **186,000 order lines** for the last six quarters:

| order_date | region | customer_id | customer_segment | product_category | units | net_revenue | sales_rep |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-04-03 | Northeast | C-10442 | Education | Paper | 40 | 612.00 | R-17 |

You also know a few things informally: two Northeast sales reps left in the spring, the company raised paper prices by 6% nationally at the start of the quarter, and the sales system was migrated in May (some orders may have been recorded twice during the cutover).

You can use an AI assistant that can read the CSV, run analyses in Python, and create charts. You have about four hours of working time before you need to send the director a summary.`,
      task: `- Write down the specific questions you will investigate and why each matters.
- Describe the data checks you will ask the AI assistant to run before analyzing the drop.
- Outline the analysis steps, including example instructions you would give the AI.
- Draft a short summary structure for the sales director (you may use placeholder numbers).`,
      responseGuidance:
        "Use short headed sections for questions, data checks, analysis plan, and summary draft. 250–500 words.",
      criteria: [
        {
          key: "question-definition",
          label: "Question definition",
          description:
            "Whether the vague request is turned into specific, testable questions linked to plausible explanations.",
          competency: "question-framing",
          weight: 4,
          anchors: {
            strong:
              "Breaks the drop into testable questions (volume vs. price vs. mix; which segments, categories, or customers drove it; whether it aligns with the rep departures; whether the migration distorted the numbers), each with the comparison that would confirm or rule it out.",
            adequate:
              "Lists relevant questions but some are vague ('look at trends') or the known context (rep departures, price rise, migration) is only partly used.",
            weak: "Restates the request ('find out why sales fell') or asks the AI for general insights without defining questions.",
          },
        },
        {
          key: "data-checks",
          label: "Data checks",
          description:
            "Whether data quality is verified before analysis, especially the migration duplicate risk.",
          competency: "data-preparation",
          weight: 3,
          anchors: {
            strong:
              "Asks the AI to profile the data (row counts by quarter and region, nulls, date range), explicitly checks for duplicated orders around the May cutover with a defined duplicate rule, and confirms net_revenue is comparable across quarters.",
            adequate:
              "Mentions checking for duplicates or missing values, but not specifically tied to the migration or without a clear method.",
            weak: "No data checks; analysis starts directly on the raw export.",
          },
        },
        {
          key: "findings-summary",
          label: "Summary for the director",
          description:
            "Whether the draft summary is decision-ready for a busy sales director.",
          competency: "insight-communication",
          weight: 3,
          anchors: {
            strong:
              "Leads with the answer, attributes the drop to drivers with approximate sizes, states confidence and caveats (e.g. migration adjustment), and ends with recommended actions, all on roughly half a page.",
            adequate:
              "Presents findings clearly but buries the main answer, omits caveats, or lacks recommended actions.",
            weak: "A list of charts or observations with no conclusion or structure for the director.",
          },
        },
      ],
    },
    {
      slug: "survey-open-text-analysis",
      title: "Analyze 2,400 Open-Text Survey Comments with an LLM",
      summary:
        "Design a reliable process for theme-coding employee survey comments with an LLM and reporting the results to HR leadership.",
      difficulty: "intermediate",
      estimatedMinutes: 25,
      scenario: `You are a people analytics specialist at a healthcare services company with 6,000 employees. The annual engagement survey closed last week with **2,400 responses** to the open-text question: "What one thing would most improve your experience working here?"

HR leadership wants to know the top themes, how they differ between clinical and non-clinical staff, and whether any themes are rising compared with last year (last year's comments were coded manually into 12 themes, with the codebook available).

Constraints and details:

- Comments range from one word ("pay") to 400 words; about 8% are in Spanish.
- Some comments contain names of managers or patients, which must not appear in any report.
- You have an approved LLM that can process the comments in batches, plus a spreadsheet tool.
- Leadership will make decisions on retention funding based on this, so they want to know how confident you are in the numbers.
- You have one week and no additional analysts.

A colleague suggests: "Just paste them all in and ask the AI for the top five themes."`,
      task: `- Explain how you will define the themes, including how you will use last year's codebook.
- Describe how you will prepare the comments before and during AI coding (cleaning, anonymization, language handling, batching).
- Explain how you will check that the AI's coding is accurate enough to report.
- Outline what you will present to HR leadership and how you will express confidence.`,
      responseGuidance:
        "Headed sections for each task item; include example instructions you would give the LLM. 400–750 words.",
      criteria: [
        {
          key: "theme-framework",
          label: "Theme framework",
          description:
            "Whether themes are defined in a way that answers leadership's questions, including year-over-year comparison.",
          competency: "question-framing",
          weight: 3,
          anchors: {
            strong:
              "Starts from last year's 12-theme codebook for comparability, allows a controlled way to add emerging themes, allows multiple themes per comment, and ties the framework to the three leadership questions (top themes, clinical vs. non-clinical, rising themes).",
            adequate:
              "Uses a sensible theme list but ignores comparability with last year or does not address multi-theme comments.",
            weak: "Lets the AI invent themes freely, making year-over-year comparison impossible.",
          },
        },
        {
          key: "text-preparation",
          label: "Text preparation",
          description:
            "Whether comments are cleaned, anonymized, and handled appropriately before and during AI processing.",
          competency: "data-preparation",
          weight: 4,
          anchors: {
            strong:
              "Removes or masks names before coding, handles Spanish comments explicitly (code directly with a bilingual check, or translate with a verification sample), links comments to staff group without exposing identity, batches consistently with the same instructions, and handles very short comments.",
            adequate:
              "Covers anonymization and batching but treats Spanish comments or very short comments superficially.",
            weak: "No preparation; raw comments including names are sent in one pass.",
          },
        },
        {
          key: "coding-validation",
          label: "Validation of AI coding",
          description:
            "Whether the process verifies that AI theme assignments are accurate before results are reported.",
          competency: "analytical-rigor",
          weight: 5,
          anchors: {
            strong:
              "Hand-codes a random sample (e.g. 150–200 comments) and compares with the AI's codes to estimate agreement per theme, refines the codebook where agreement is low, reruns, and reports theme counts with an error margin; checks that year-over-year changes exceed coding uncertainty.",
            adequate:
              "Includes spot-checking of AI output, but the sample is small or unsystematic and results do not feed into confidence levels.",
            weak: "Accepts AI coding without checking, or checking is limited to reading a few examples.",
          },
        },
        {
          key: "leadership-readout",
          label: "Leadership readout",
          description:
            "Whether findings are presented clearly for decision-makers with honest confidence levels.",
          competency: "insight-communication",
          weight: 3,
          anchors: {
            strong:
              "Proposes a concise readout: top themes with share and confidence, clinical vs. non-clinical differences, rising themes with caveats, anonymized representative quotes, and explicit implications for retention funding.",
            adequate:
              "Presents themes and counts but does not convey confidence or connect findings to the funding decision.",
            weak: "Readout is a list of themes or a word cloud with no quantification or implications.",
          },
        },
      ],
    },
    {
      slug: "churn-driver-analysis-critique",
      title: "Challenge an AI-Generated Churn Analysis",
      summary:
        "Critique a confident but flawed AI churn analysis and design a sounder approach before it reaches the executive team.",
      difficulty: "advanced",
      estimatedMinutes: 30,
      scenario: `You are a senior analyst at a B2B software company selling project-management subscriptions (about **9,200 customer accounts**). The head of customer success used an AI tool on a joined dataset of accounts, product usage, and support tickets, and is about to present this to the executive team:

> **AI summary:** "Customers who submit more than 5 support tickets in a quarter are 3.1x more likely to churn. Customers who use the reporting feature churn 40% less. Recommendation: reduce support contact by expanding self-service, and require all new customers to enable reporting during onboarding."

What you know about the data:

- Accounts were joined to support tickets on company name, not account ID; roughly 300 accounts share names with others.
- "Churned" was defined as any account with a cancellation date, including accounts that downgraded to the free plan.
- Usage data covers the last 12 months, but churned accounts stop generating usage at cancellation, so the analysis compared full-year usage for retained accounts with partial-year usage for churned ones.
- Reporting is only available on the Business and Enterprise plans, which also include a dedicated success manager.
- Annual contracts can only churn at renewal; monthly contracts can churn any time.

The executive meeting is in five days.`,
      task: `- Identify the key flaws in the analysis and explain how each could distort the conclusions.
- Reframe the business question the executives actually need answered.
- Describe the data corrections and analysis you would run instead, including how you would use AI tools and verify their output.
- Write a short memo (under 200 words) to the head of customer success recommending what to present on Thursday.`,
      responseGuidance:
        "Headed sections for flaws, reframed question, revised approach, and the memo. 500–900 words.",
      criteria: [
        {
          key: "hypothesis-framing",
          label: "Reframed question",
          description:
            "Whether the business question is reframed around a decision and a defensible definition of churn.",
          competency: "question-framing",
          weight: 3,
          anchors: {
            strong:
              "Reframes toward a decision-relevant question (e.g. which modifiable factors predict revenue churn at renewal, by plan and contract type) and separates downgrades from cancellations with a clear churn definition.",
            adequate:
              "Improves the question but leaves the churn definition or segmentation by plan and contract type unresolved.",
            weak: "Accepts the original framing and focuses only on refining the numbers.",
          },
        },
        {
          key: "join-and-window-fixes",
          label: "Data corrections",
          description:
            "Whether the join, churn definition, and usage-window problems are identified and corrected.",
          competency: "data-preparation",
          weight: 4,
          anchors: {
            strong:
              "Re-joins on account ID (or a verified mapping for the 300 shared names), redefines churn, aligns usage windows (e.g. usage in the 90 days before renewal or cancellation for all accounts), and verifies row counts after each fix.",
            adequate:
              "Identifies two of the three data problems with sensible fixes but misses one, most often the usage-window mismatch.",
            weak: "Misses most data problems or mentions them without proposing fixes.",
          },
        },
        {
          key: "causal-reasoning",
          label: "Causal reasoning and verification",
          description:
            "Whether the response separates correlation from causation and verifies AI-produced results.",
          competency: "analytical-rigor",
          weight: 5,
          anchors: {
            strong:
              "Explains that reporting use is confounded by plan tier and success managers, and ticket volume may be a symptom of problems rather than a cause; proposes stratifying by plan and contract type or a controlled model; requires the AI to show code and reproduces key figures; notes that only an experiment could establish the onboarding effect.",
            adequate:
              "Flags correlation vs. causation and at least one confounder, but the revised analysis would not fully control for it, or AI verification is not addressed.",
            weak: "Treats the correlations as causal or offers generic cautions without specifics.",
          },
        },
        {
          key: "decision-memo",
          label: "Memo to customer success",
          description:
            "Whether the memo is concise, diplomatic, and gives a clear recommendation for Thursday.",
          competency: "insight-communication",
          weight: 3,
          anchors: {
            strong:
              "Under 200 words; states plainly that the current recommendations are not supported, gives the two most important reasons, proposes what to present instead (e.g. preliminary findings plus a corrected analysis timeline), and keeps a constructive tone.",
            adequate:
              "Communicates the concerns but is too long, too technical, or lacks a clear recommendation for the meeting.",
            weak: "Missing, far over length, or confrontational without actionable guidance.",
          },
        },
      ],
    },
  ],
};
