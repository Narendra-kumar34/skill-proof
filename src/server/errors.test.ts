import { describe, expect, it } from "vitest";

import { isForeignKeyViolation, isUniqueViolation } from "./errors";

// Drizzle wraps driver errors, keeping the original as `cause`.
const wrapped = (code: string) =>
  Object.assign(new Error("Failed query"), { cause: { code } });

describe("Postgres error helpers", () => {
  it("detects unique violations, raw or wrapped", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
    expect(isUniqueViolation(wrapped("23505"))).toBe(true);
    expect(isUniqueViolation(wrapped("23503"))).toBe(false);
  });

  it("treats both RESTRICT and NO ACTION violations as still-referenced", () => {
    expect(isForeignKeyViolation(wrapped("23001"))).toBe(true);
    expect(isForeignKeyViolation(wrapped("23503"))).toBe(true);
    expect(isForeignKeyViolation(new Error("other"))).toBe(false);
  });
});
