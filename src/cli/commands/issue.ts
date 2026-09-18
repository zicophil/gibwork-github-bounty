import { getEnvironment } from "../../config/config.js";
import { GitHubClient, GitHubConfigurationError, type GitHubIssue } from "../../github/client.js";

export function formatIssue(issue: GitHubIssue): string {
  return [
    `GitHub Issue #${issue.number}`,
    "",
    "Title:",
    issue.title,
    "",
    "State:",
    issue.state,
    "",
    "Labels:",
    issue.labels.length > 0 ? issue.labels.join(", ") : "none",
    "",
    "URL:",
    issue.htmlUrl,
  ].join("\n");
}

export async function showIssue(issueNumber: number): Promise<string> {
  const client = new GitHubClient(getEnvironment());
  const issue = await client.getIssue(issueNumber);

  return formatIssue(issue);
}

export function formatIssueError(error: unknown, issueNumber: number): string {
  if (error instanceof GitHubConfigurationError) {
    return "GitHub authentication failed.\n\nCheck GITHUB_TOKEN, GITHUB_OWNER and GITHUB_REPO.";
  }

  if (isRequestError(error, 404)) {
    return `GitHub issue #${issueNumber} was not found.`;
  }

  if (isRequestError(error, 401) || isRequestError(error, 403)) {
    return "GitHub authentication failed.\n\nCheck GITHUB_TOKEN.";
  }

  return "GitHub issue retrieval failed.";
}

function isRequestError(error: unknown, status: number): boolean {
  return typeof error === "object" && error !== null && "status" in error && error.status === status;
}
