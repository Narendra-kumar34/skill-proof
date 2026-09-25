import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against a production build (`next start`) with
 * AI_MOCK=1, so evaluations are deterministic and free. They need a migrated,
 * seeded Postgres (see the CI workflow).
 *
 * Tests run serially: they share one demo account and respect the app's own
 * auth rate limits and evaluation quotas.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // Locally you can reuse an installed browser, e.g. PW_CHANNEL=msedge.
    channel: process.env.PW_CHANNEL || undefined,
  },
  projects: [
    { name: "setup", testMatch: /demo\.setup\.ts/ },
    {
      name: "public",
      testMatch: /public\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.PW_CHANNEL || undefined,
      },
    },
    {
      name: "learner",
      testMatch: /(learner|a11y)\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.PW_CHANNEL || undefined,
        storageState: "e2e/.auth/demo.json",
      },
    },
  ],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { AI_MOCK: "1", BETTER_AUTH_URL: baseURL },
  },
});
