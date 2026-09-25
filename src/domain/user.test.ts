import { describe, expect, it } from "vitest";

import { MAX_NAME_LENGTH, normalizeDisplayName } from "./user";

describe("normalizeDisplayName", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeDisplayName("  Ada   Lovelace ")).toBe("Ada Lovelace");
  });

  it("strips control characters", () => {
    expect(normalizeDisplayName("Ada\u0000\u0007 L")).toBe("Ada L");
  });

  it("rejects empty and over-long names", () => {
    expect(normalizeDisplayName("   ")).toBeNull();
    expect(normalizeDisplayName("a".repeat(MAX_NAME_LENGTH + 1))).toBeNull();
    expect(normalizeDisplayName("a".repeat(MAX_NAME_LENGTH))).not.toBeNull();
  });
});
