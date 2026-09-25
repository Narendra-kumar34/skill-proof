import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "./safe-redirect";

describe("safeRedirectPath", () => {
  it("allows same-origin paths with query strings", () => {
    expect(safeRedirectPath("/skills/prompt-engineering?tab=profile")).toBe(
      "/skills/prompt-engineering?tab=profile",
    );
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["absolute URL", "https://evil.example"],
    ["protocol-relative", "//evil.example"],
    ["backslash trick", "/\\evil.example"],
    ["javascript scheme", "javascript:alert(1)"],
    ["control character", "/\t/evil.example"],
    ["relative path", "dashboard"],
  ])("falls back for %s", (_, value) => {
    expect(safeRedirectPath(value)).toBe("/dashboard");
  });

  it("uses a custom fallback", () => {
    expect(safeRedirectPath("//x", "/")).toBe("/");
  });
});
