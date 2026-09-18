import assert from "node:assert/strict";
import test from "node:test";
import { formatIssue } from "../src/cli/commands/issue.ts";

test("issue command formats GitHub issue details", () => {
  const output = formatIssue({
    number: 123,
    title: "Fix checkout flow",
    body: "The checkout flow fails on mobile.",
    state: "open",
    labels: ["bug", "frontend"],
    htmlUrl: "https://github.com/owner/repo/issues/123",
  });

  assert.equal(
    output,
    [
      "GitHub Issue #123",
      "",
      "Title:",
      "Fix checkout flow",
      "",
      "State:",
      "open",
      "",
      "Labels:",
      "bug, frontend",
      "",
      "URL:",
      "https://github.com/owner/repo/issues/123",
    ].join("\n"),
  );
});
