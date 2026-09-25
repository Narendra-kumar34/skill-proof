import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Fails on serious/critical WCAG 2.1 AA violations. */
export async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const serious = results.violations.filter((v) =>
    ["serious", "critical"].includes(v.impact ?? ""),
  );
  expect(
    serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`),
  ).toEqual([]);
}

export const uniqueEmail = () =>
  `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`;
