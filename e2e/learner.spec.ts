import { expect, test } from "@playwright/test";

// Runs as the shared demo learner (see demo.setup.ts), who starts with six
// hand-written evaluations and a detected robustness gap.

test.describe("learner journey", () => {
  test("dashboard answers: what am I learning, how am I doing, what next", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page.getByText("Close a skill gap")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Your skills" }),
    ).toBeVisible();
    await expect(page.getByText(/Gap: Robustness/)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Recent evidence" }),
    ).toBeVisible();
  });

  test("skill profile links every competency score to its evidence", async ({
    page,
  }) => {
    await page.goto("/skills/prompt-engineering");
    await expect(
      page.getByRole("heading", { name: "Your profile" }),
    ).toBeVisible();
    await expect(page.getByText("Skill gap: Robustness")).toBeVisible();
    // Evidence chips link to the exact attempt behind the score.
    const evidence = page
      .getByRole("link", {
        name: /Classify Customer Feedback for a Product Team \d+/,
      })
      .first();
    await evidence.click();
    await expect(page).toHaveURL(
      /\/challenges\/customer-feedback-classification\?attempt=/,
    );
    await expect(
      page.getByRole("heading", { name: /Attempt \d result/ }),
    ).toBeVisible();
  });

  test("write, autosave, submit and get an evaluation", async ({ page }) => {
    await page.goto("/challenges/survey-open-text-analysis");
    const editor = page.getByRole("textbox", { name: "Your solution" });
    await editor.fill(
      "I would first read a sample of 50 responses to draft a codebook of themes, then ask the model to tag each response with one primary theme and sentiment as JSON, spot-check 10% by hand, and report theme frequencies with representative quotes.",
    );
    await expect(page.getByText(/Draft saved/)).toBeVisible();

    // The draft survives a reload.
    await page.reload();
    await expect(
      page.getByRole("textbox", { name: "Your solution" }),
    ).toHaveValue(/codebook of themes/);

    await page.getByRole("button", { name: "Submit for evaluation" }).click();
    await expect(page).toHaveURL(/\?attempt=/);
    await expect(
      page.getByRole("heading", { name: "Attempt 1 result" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: "Score breakdown" }),
    ).toBeVisible();
    await expect(page.getByText("Recommended next step")).toBeVisible();
  });

  test("a failed evaluation keeps the submission and can be retried", async ({
    page,
  }) => {
    await page.goto("/challenges/regional-sales-dip-investigation");
    await page
      .getByRole("textbox", { name: "Your solution" })
      .fill(
        "A deliberately failing submission used by the automated tests to simulate a provider outage. [[mock-fail]]",
      );
    await page.getByRole("button", { name: "Submit for evaluation" }).click();

    await expect(page.getByText("Evaluation didn't complete")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/Your submission is saved/)).toBeVisible();

    await page.getByRole("button", { name: "Retry evaluation" }).click();
    // The retry re-queues it; the mock fails again, proving the loop is safe.
    await expect(page.getByText("Evaluation didn't complete")).toBeVisible({
      timeout: 30_000,
    });
  });

  test("history filters by URL and deletes an attempt after confirmation", async ({
    page,
  }) => {
    await page.goto("/history?status=attention");
    await expect(
      page.getByRole("link", { name: "Needs attention" }),
    ).toHaveAttribute("aria-current", "page");
    const rows = page.getByRole("button", { name: /^Delete attempt/ });
    const before = await rows.count();
    expect(before).toBeGreaterThan(0);

    await rows.first().click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog.getByText("Delete this attempt?")).toBeVisible();
    await dialog.getByRole("button", { name: "Delete" }).click();
    await expect(dialog).toBeHidden();
    await expect(rows).toHaveCount(before - 1);
  });

  test("non-admins can't see the admin area", async ({ page }) => {
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
  });
});
