"use client";

import { useEffect } from "react";

import { FOCUS_RESULT_KEY } from "./evaluation-pending";

/**
 * Moves keyboard/screen-reader focus to the result heading when the page was
 * refreshed because an evaluation just finished, so it is announced.
 */
export function FocusOnArrival({
  submissionId,
  targetId,
}: {
  submissionId: string;
  targetId: string;
}) {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(FOCUS_RESULT_KEY) !== submissionId) return;
      sessionStorage.removeItem(FOCUS_RESULT_KEY);
    } catch {
      return;
    }
    const el = document.getElementById(targetId);
    el?.focus();
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [submissionId, targetId]);

  return null;
}
