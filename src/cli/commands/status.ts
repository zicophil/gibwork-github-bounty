import type { ConfigurationStatus } from "../../config/config.js";

export function formatStatus(status: ConfigurationStatus): string {
  const lines = [
    "Gibwork GitHub Automation",
    "",
    "GitHub",
    formatConfigurationLine(status.github.configured, status.github.missing),
    "",
    "Gibwork",
    formatConfigurationLine(status.gibwork.configured, status.gibwork.missing),
    "",
    "AI",
    formatConfigurationLine(status.ai.configured, status.ai.missing),
    "",
    "State",
    status.state.configured ? "✓ readable and writable" : `✗ ${status.state.error}`,
  ];

  return lines.join("\n");
}

function formatConfigurationLine(configured: boolean, missing: string[]): string {
  return configured ? "✓ configured" : `✗ missing ${missing.join(", ")}`;
}