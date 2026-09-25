import { expect, test } from "@playwright/test";

import { expectNoA11yViolations, uniqueEmail } from "./helpers";

test.describe("public pages and authentication", () => {
  test("landing page explains the product and is accessible", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Prove you can apply what you learn.",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Try the demo" }).first(),
    ).toBeVisible();
    // Submission requirement: author details in the footer.
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "GitHub" }),
    ).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test("protected pages redirect to sign-in and keep the destination", async ({
    page,
  }) => {
    await page.goto("/skills/prompt-engineering");
    await expect(page).toHaveURL(
      /\/sign-in\?next=%2Fskills%2Fprompt-engineering/,
    );
    await expectNoA11yViolations(page);
  });

  test("a new user can sign up, is sent to the dashboard, and can sign out", async ({
    page,
  }) => {
    await page.goto("/sign-up");
    await page.getByRole("textbox", { name: "Name" }).fill("Test Learner");
    await page.getByRole("textbox", { name: "Email" }).fill(uniqueEmail());
    await page.getByLabel("Password").fill("correct-horse-battery");
    await page.getByRole("button", { name: "Create account" }).click();

    await page.waitForURL("**/dashboard");
    await expect(
      page.getByRole("heading", { name: "Welcome, Test" }),
    ).toBeVisible();
    await expect(page.getByText("Start here")).toBeVisible();

    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await page.waitForURL((url) => url.pathname === "/");
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("sign-in rejects wrong credentials without revealing which part was wrong", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    await page
      .getByRole("textbox", { name: "Email" })
      .fill("nobody@example.test");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: /invalid email or password/i }),
    ).toBeVisible();
  });
});
