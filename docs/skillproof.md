# SkillProof

## What is SkillProof?

SkillProof is an AI-powered practical skill assessment platform for working professionals.

The core idea is simple:

> **Learning a concept is not enough. SkillProof helps users practice that concept in a realistic scenario, submit their solution, receive AI-powered feedback, and build evidence of what they can actually do.**

The product focuses on **learning outcomes**, not course completion.

### Core loop

**Learn → Practice → Submit → Evaluate → Identify Gaps → Improve**

---

## The Problem

Most learning platforms primarily measure:

- Courses completed
- Videos watched
- Quizzes attempted
- Progress percentages

These don't necessarily show whether someone can **apply what they learned in a real situation**.

SkillProof focuses on the missing step:

> **Can the learner actually use the skill?**

---

## Target User

Working professionals who want to build and demonstrate practical skills.

For the MVP, focus on **AI productivity / AI skills** rather than supporting many unrelated domains.

Example skills:

- Prompt Engineering
- AI Research
- AI Data Analysis
- AI Automation
- AI Workflow Design
- AI Content Generation

---

# Core Product Flow

### 1. Discover a Skill

The user sees available skills and selects one they want to improve.

Example:

> Prompt Engineering

The skill page explains the skill and shows available practical challenges.

---

### 2. Attempt a Real-World Challenge

Each challenge presents a realistic professional scenario rather than a traditional multiple-choice question.

Example:

> You are an operations manager receiving thousands of customer-support tickets every week. Design an AI workflow that categorizes the tickets, identifies recurring issues, and produces an executive summary.

The user submits their proposed solution.

Submissions can be text-based for the MVP.

---

### 3. AI Evaluates the Submission

The AI evaluates the solution against predefined criteria relevant to the challenge.

Example:

```text
Overall Score: 81/100

Clarity           85
Problem Solving   82
Practicality      78
Completeness      80
```

The evaluation should provide:

- Overall score
- Criterion-level scores
- Strengths
- Specific improvement areas
- Actionable feedback
- Recommended next concept/challenge

AI output must be structured and validated before being shown or persisted.

---

### 4. Build a Skill Profile

Every completed challenge contributes evidence toward the user's skill profile.

Do NOT represent the skill only as a generic percentage.

Show evidence behind the assessment.

Example:

```text
Prompt Engineering

Knowledge            82
Application           64
Consistency           71

Evidence
✓ Customer feedback challenge
✓ Email automation challenge
✓ Data extraction challenge
✗ Complex reasoning challenge
```

The purpose is to answer:

> **What can this learner actually demonstrate?**

---

### 5. Identify Skill Gaps

Based on challenge performance, SkillProof should identify areas where the user is struggling.

Example:

> You perform well on basic prompting but consistently lose points on complex multi-constraint tasks.

Then recommend a relevant concept or challenge.

The recommendation should be actionable rather than generic.

---

# Main Entities

Keep the domain model simple and focused.

### User

The authenticated learner.

### Skill

A practical skill that can be assessed.

Examples:

- Prompt Engineering
- AI Research
- AI Automation

### Challenge

A real-world scenario designed to test a particular skill.

A challenge should contain:

- Title
- Description/scenario
- Skill
- Difficulty
- Evaluation criteria
- Expected type of response

### Submission

A user's response to a challenge.

Contains:

- Challenge
- User
- Response
- Submission status
- Timestamp

### Evaluation

AI-generated assessment of a submission.

Contains:

- Overall score
- Criterion scores
- Strengths
- Improvements
- Feedback
- Recommended next step

### Skill Progress

Aggregated evidence of a user's performance for a skill.

---

# Important UX Principles

The application should feel like a **modern professional learning product**, not an admin dashboard.

Prioritize:

- Clear visual hierarchy
- Minimal friction
- Excellent challenge-reading/submission experience
- Strong feedback presentation
- Easy understanding of skill progress
- Responsive design
- Accessible interactions
- Useful empty/loading/error states

The evaluation result should be the emotional payoff of the product.

The user should immediately understand:

> **What did I do well? What did I do poorly? What should I do next?**

---

# Dashboard

The dashboard should answer three questions immediately:

### 1. What am I learning?

Show the user's active skills.

### 2. How am I performing?

Show skill-level progress and recent evidence.

### 3. What should I do next?

Show one or more recommended challenges/concepts based on recent performance.

Avoid filling the dashboard with meaningless analytics.

---

# Challenge Experience

The challenge page is one of the most important screens.

It should clearly separate:

### Scenario

The real-world problem.

### What is being assessed

The relevant evaluation criteria.

### Your submission

A focused workspace for writing the solution.

### Evaluation

Initially hidden until the submission is evaluated.

After evaluation, clearly show:

- Score
- What went well
- What could improve
- Criterion-level feedback
- Next recommended action

---

# AI Principles

AI is an evaluator and learning assistant, not the entire product.

Do NOT build a generic AI chatbot.

AI should perform specific product functions:

1. Evaluate challenge submissions.
2. Generate actionable feedback.
3. Identify skill gaps.
4. Recommend the next learning activity.

AI responses should be structured rather than free-form whenever possible.

The application should remain usable if the AI provider temporarily fails. Failed evaluations should be retryable without losing the user's submission.

---

# Example End-to-End Experience

```text
User selects:
"Prompt Engineering"

        ↓

Chooses:
"Customer Feedback Classification"

        ↓

Reads realistic scenario

        ↓

Submits solution

        ↓

AI evaluates

        ↓

81/100

Strengths:
✓ Clear instructions
✓ Good output structure

Improve:
⚠ Missing ambiguous-input handling
⚠ No validation/fallback strategy

        ↓

Skill profile updated

        ↓

Recommended next step:
"Human-in-the-loop AI workflows"
```

---

# Scope

## Must Have

- Authentication
- User-specific data
- Skills
- Challenges
- Challenge submissions
- AI evaluation
- Evaluation history
- Skill progress/evidence
- Skill-gap feedback
- Recommended next challenge/concept
- Full CRUD where appropriate
- Validation and secure authorization
- Responsive polished UI
- Production deployment
- Meaningful tests

## Nice to Have

Only add these after the core experience is polished:

- Challenge filtering/search
- Difficulty progression
- Submission history
- More detailed skill analytics
- Additional AI-generated challenges

## Explicitly Avoid

Do not turn SkillProof into:

- A generic LMS
- A course marketplace
- A video-learning platform
- A generic chatbot
- A social network
- A mentor marketplace
- A job application tracker
- A resume platform
- A complex multi-agent system
- A multi-domain education platform

Do not add features simply because they are technically impressive.

---

# Product Goal

The finished application should make the evaluator understand the product in under a minute:

> **SkillProof helps professionals prove that they can apply what they learn.**

CRUD is the foundation, AI provides intelligent evaluation, and the product differentiator is the **evidence-based practical skill profile**.

The priority is not maximum feature count.

The priority is a **coherent, polished, realistic product with thoughtful engineering decisions and a clear user outcome.**
