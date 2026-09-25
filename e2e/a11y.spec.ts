import { test } from "@playwright/test";

import { expectNoA11yViolations } from "./helpers";

// Automated WCAG 2.1 AA checks on the main signed-in screens.
const pages = [
  ["dashboard", "/dashboard"],
  ["skills catalog", "/skills"],
  ["skill profile", "/skills/prompt-engineering"],
  ["challenge workspace", "/challenges/customer-feedback-classification"],
  ["history", "/history"],
] as const;

test.describe("accessibility", () => {
  for (const [name, path] of pages) {
    test(`${name} has no serious violations`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expectNoA11yViolations(page);
    });
  }

  test("evaluation result has no serious violations", async ({ page }) => {
    await page.goto("/challenges/customer-feedback-classification");
    await page
      .getByRole("link", { name: /Attempt 2/ })
      .first()
      .click();
    await page.getByRole("heading", { name: /Attempt 2 result/ }).waitFor();
    await expectNoA11yViolations(page);
  });
});
