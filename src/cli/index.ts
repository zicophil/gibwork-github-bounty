#!/usr/bin/env node

import { Command } from "commander";
import { getConfigurationStatus, isConfigurationReady } from "../config/config.js";
import { formatIssueError, showIssue } from "./commands/issue.js";
import { formatStatus } from "./commands/status.js";

const program = new Command();

program
  .name("gibwork")
  .description("Local CLI for automating Gibwork GitHub bounty workflows.")
  .version("1.0.0");

program
  .command("status")
  .description("Show configuration and local state status")
  .option("--json", "Output machine-readable JSON")
  .action(async (options: { json?: boolean }) => {
    const status = await getConfigurationStatus();

    if (options.json) {
      console.log(JSON.stringify({ ok: isConfigurationReady(status), status }));
    } else {
      console.log(formatStatus(status));
    }

    if (!isConfigurationReady(status)) {
      process.exitCode = 1;
    }
  });

program
  .command("issue")
  .description("Fetch and display a GitHub issue")
  .argument("<issue-number>", "GitHub issue number")
  .action(async (issueNumberArgument: string) => {
    const issueNumber = Number.parseInt(issueNumberArgument, 10);

    if (!Number.isInteger(issueNumber) || issueNumber < 1 || String(issueNumber) !== issueNumberArgument) {
      console.error("Issue number must be a positive integer.");
      process.exitCode = 1;
      return;
    }

    try {
      console.log(await showIssue(issueNumber));
    } catch (error) {
      console.error(formatIssueError(error, issueNumber));
      process.exitCode = 1;
    }
  });

program.parse();
