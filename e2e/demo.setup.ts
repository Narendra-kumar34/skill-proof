import { expect, test as setup } from "@playwright/test";

// One demo account shared by the learner specs (demo sign-ins are rate limited).
setup("start a demo session", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try the demo" }).first().click();
  await page.waitForURL("**/dashboard");
  await expect(page.getByText("Demo account")).toBeVisible();
  await page.context().storageState({ path: "e2e/.auth/demo.json" });
});
