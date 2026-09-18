import { Octokit } from "@octokit/rest";
import type { Environment } from "../config/config.js";

export interface GitHubIssue {
  number: number;
  title: string;
  body?: string | null;
  state: string;
  labels: string[];
  htmlUrl: string;
}

export interface GitHubIssueComment {
  id: number;
  body?: string | null;
}

export interface UpdateIssueData {
  title?: string;
  body?: string;
  state?: "open" | "closed";
  labels?: string[];
}

export interface GitHubApi {
  issues: {
    get(parameters: { owner: string; repo: string; issue_number: number }): Promise<{ data: RawGitHubIssue }>;
    listForRepo(parameters: {
      owner: string;
      repo: string;
      state: "open";
      per_page: number;
    }): Promise<{ data: RawGitHubIssue[] }>;
    listComments(parameters: {
      owner: string;
      repo: string;
      issue_number: number;
      per_page: number;
    }): Promise<{ data: RawGitHubIssueComment[] }>;
    createComment(parameters: {
      owner: string;
      repo: string;
      issue_number: number;
      body: string;
    }): Promise<{ data: RawGitHubIssueComment }>;
    update(parameters: {
      owner: string;
      repo: string;
      issue_number: number;
    } & UpdateIssueData): Promise<{ data: RawGitHubIssue }>;
  };
}

interface RawGitHubIssue {
  number: number;
  title: string;
  body?: string | null;
  state: string;
  labels: Array<string | { name?: string | null }>;
  html_url: string;
}

interface RawGitHubIssueComment {
  id: number;
  body?: string | null;
}

export class GitHubConfigurationError extends Error {
  constructor(missing: string[]) {
    super(`Missing GitHub configuration: ${missing.join(", ")}`);
    this.name = "GitHubConfigurationError";
  }
}

export class GitHubClient {
  private readonly owner: string;
  private readonly repo: string;
  private readonly api: GitHubApi;

  constructor(environment: Environment, api?: GitHubApi) {
    const token = environment.GITHUB_TOKEN?.trim();
    this.owner = environment.GITHUB_OWNER?.trim() ?? "";
    this.repo = environment.GITHUB_REPO?.trim() ?? "";

    const missing = [
      ["GITHUB_TOKEN", token],
      ["GITHUB_OWNER", this.owner],
      ["GITHUB_REPO", this.repo],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => String(name));

    if (missing.length > 0) {
      throw new GitHubConfigurationError(missing);
    }

    this.api = api ?? (new Octokit({ auth: token }) as GitHubApi);
  }

  async getIssue(issueNumber: number): Promise<GitHubIssue> {
    const response = await this.api.issues.get({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
    });

    return normalizeIssue(response.data);
  }

  async listOpenIssues(): Promise<GitHubIssue[]> {
    const response = await this.api.issues.listForRepo({
      owner: this.owner,
      repo: this.repo,
      state: "open",
      per_page: 100,
    });

    return response.data.map(normalizeIssue);
  }

  async listIssueComments(issueNumber: number): Promise<GitHubIssueComment[]> {
    const response = await this.api.issues.listComments({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      per_page: 100,
    });

    return response.data.map((comment) => ({
      id: comment.id,
      body: comment.body,
    }));
  }

  async createIssueComment(issueNumber: number, body: string): Promise<GitHubIssueComment> {
    const response = await this.api.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      body,
    });

    return {
      id: response.data.id,
      body: response.data.body,
    };
  }

  async updateIssue(issueNumber: number, data: UpdateIssueData): Promise<GitHubIssue> {
    const response = await this.api.issues.update({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      ...data,
    });

    return normalizeIssue(response.data);
  }
}

export function normalizeIssue(issue: RawGitHubIssue): GitHubIssue {
  return {
    number: issue.number,
    title: issue.title,
    body: issue.body,
    state: issue.state,
    labels: issue.labels.map((label) => (typeof label === "string" ? label : label.name ?? "")).filter(Boolean),
    htmlUrl: issue.html_url,
  };
}

