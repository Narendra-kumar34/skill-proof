import { APICallError, RetryError } from "ai";
import { describe, expect, it } from "vitest";

import { AiNotConfiguredError, classifyEvaluationError } from "./errors";
import { EvaluationOutputError } from "./normalize";

const apiError = (statusCode: number) =>
  new APICallError({
    message: "provider said no",
    url: "https://example.test",
    requestBodyValues: {},
    statusCode,
  });

describe("classifyEvaluationError", () => {
  it("retries invalid model output once within the run", () => {
    expect(
      classifyEvaluationError(new EvaluationOutputError("x")),
    ).toMatchObject({
      code: "invalid_output",
      retryInRun: true,
    });
  });

  it.each([
    [429, "rate_limited"],
    [401, "provider_auth"],
    [503, "provider_error"],
  ])("maps HTTP %i to %s", (status, code) => {
    expect(classifyEvaluationError(apiError(status)).code).toBe(code);
  });

  it("unwraps the last error from an SDK RetryError", () => {
    const error = new RetryError({
      message: "gave up",
      reason: "maxRetriesExceeded",
      errors: [apiError(500), apiError(429)],
    });
    expect(classifyEvaluationError(error).code).toBe("rate_limited");
  });

  it("recognises timeouts and missing configuration", () => {
    const timeout = new Error("timed out");
    timeout.name = "TimeoutError";
    expect(classifyEvaluationError(timeout).code).toBe("timeout");
    expect(classifyEvaluationError(new AiNotConfiguredError()).code).toBe(
      "not_configured",
    );
  });

  it("never leaks provider details to the learner", () => {
    const { userMessage } = classifyEvaluationError(apiError(500));
    expect(userMessage).not.toContain("provider said no");
    expect(userMessage).toContain("saved");
  });
});
