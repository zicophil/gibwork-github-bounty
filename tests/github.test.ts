import assert from "node:assert/strict";
import test from "node:test";
import { GitHubClient, GitHubConfigurationError, type GitHubApi } from "../src/github/client.ts";

const environment = {
  GITHUB_TOKEN: "token",
  GITHUB_OWNER: "owner",
  GITHUB_REPO: "repo",
};

function createMockApi(): GitHubApi {
  return {
    issues: {
      async get(parameters) {
        assert.deepEqual(parameters, {
          owner: "owner",
          repo: "repo",
          issue_number: 123,
        });

        return {
          data: {
            number: 123,
            title: "Fix checkout flow",
            body: "The checkout flow fails on mobile.",
            state: "open",
            labels: [{ name: "bug" }, "frontend"],
            html_url: "https://github.com/owner/repo/issues/123",
          },
        };
      },
      async listForRepo(parameters) {
        assert.deepEqual(parameters, {
          owner: "owner",
          repo: "repo",
          state: "open",
          per_page: 100,
        });

        return {
          data: [
            {
              number: 1,
              title: "Open issue",
              body: null,
              state: "open",
              labels: [],
              html_url: "https://github.com/owner/repo/issues/1",
            },
          ],
        };
      },
      async listComments(parameters) {
        assert.deepEqual(parameters, {
          owner: "owner",
          repo: "repo",
          issue_number: 123,
          per_page: 100,
        });

        return {
          data: [{ id: 10, body: "Existing comment" }],
        };
      },
      async createComment(parameters) {
        assert.deepEqual(parameters, {
          owner: "owner",
          repo: "repo",
          issue_number: 123,
          body: "New comment",
        });

        return {
          data: { id: 11, body: "New comment" },
        };
      },
      async update(parameters) {
        assert.deepEqual(parameters, {
          owner: "owner",
          repo: "repo",
          issue_number: 123,
          state: "closed",
        });

        return {
          data: {
            number: 123,
            title: "Fix checkout flow",
            body: "The checkout flow fails on mobile.",
            state: "closed",
            labels: [{ name: "bug" }],
            html_url: "https://github.com/owner/repo/issues/123",
          },
        };
      },
    },
  };
}

test("GitHub client fetches and normalizes an issue", async () => {
  const client = new GitHubClient(environment, createMockApi());

  const issue = await client.getIssue(123);

  assert.deepEqual(issue, {
    number: 123,
    title: "Fix checkout flow",
    body: "The checkout flow fails on mobile.",
    state: "open",
    labels: ["bug", "frontend"],
    htmlUrl: "https://github.com/owner/repo/issues/123",
  });
});

test("GitHub client lists open issues", async () => {
  const client = new GitHubClient(environment, createMockApi());

  const issues = await client.listOpenIssues();

  assert.equal(issues.length, 1);
  assert.equal(issues[0]?.number, 1);
});

test("GitHub client lists and creates issue comments", async () => {
  const client = new GitHubClient(environment, createMockApi());

  assert.deepEqual(await client.listIssueComments(123), [{ id: 10, body: "Existing comment" }]);
  assert.deepEqual(await client.createIssueComment(123, "New comment"), { id: 11, body: "New comment" });
});

test("GitHub client updates an issue", async () => {
  const client = new GitHubClient(environment, createMockApi());

  const issue = await client.updateIssue(123, { state: "closed" });

  assert.equal(issue.state, "closed");
});

test("GitHub client requires token, owner and repo without exposing values", () => {
  assert.throws(
    () => new GitHubClient({ GITHUB_TOKEN: "secret" }, createMockApi()),
    (error) =>
      error instanceof GitHubConfigurationError &&
      error.message === "Missing GitHub configuration: GITHUB_OWNER, GITHUB_REPO",
  );
});
