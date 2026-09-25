import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Integration tests: real services against a real, migrated and seeded
 * Postgres (DATABASE_URL). The AI provider is the deterministic mock.
 */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      // `server-only` throws outside the React Server environment.
      "server-only": fileURLToPath(
        new URL("./tests/integration/server-only-stub.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    env: { AI_MOCK: "1" },
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
