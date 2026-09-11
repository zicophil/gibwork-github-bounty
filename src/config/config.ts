import { access, constants, mkdir } from "node:fs/promises";
import path from "node:path";

export const REQUIRED_ENVIRONMENT_VARIABLES = [
  "GITHUB_TOKEN",
  "GITHUB_OWNER",
  "GITHUB_REPO",
  "GIBWORK_KEYPAIR_PATH",
  "GIBWORK_ENVIRONMENT",
  "OPENAI_API_KEY",
  "AI_MODEL",
] as const;

export const OPTIONAL_ENVIRONMENT_VARIABLES = [
  "GIBWORK_POLL_INTERVAL",
  "GIBWORK_MAX_AI_CALLS",
] as const;

export type Environment = Partial<
  Record<
    (typeof REQUIRED_ENVIRONMENT_VARIABLES)[number] | (typeof OPTIONAL_ENVIRONMENT_VARIABLES)[number],
    string
  >
>;

export interface ConfigurationStatus {
  github: {
    configured: boolean;
    missing: string[];
  };
  gibwork: {
    configured: boolean;
    missing: string[];
  };
  ai: {
    configured: boolean;
    missing: string[];
  };
  state: {
    configured: boolean;
    path: string;
    error?: string;
  };
}

function missingVariables(environment: Environment, variables: readonly string[]): string[] {
  return variables.filter((variable) => !environment[variable as keyof Environment]?.trim());
}

export function getEnvironment(environment: NodeJS.ProcessEnv = process.env): Environment {
  return { ...environment } as Environment;
}

export async function getConfigurationStatus(
  environment: Environment = getEnvironment(),
  stateDirectory = path.resolve(process.cwd(), ".gibwork"),
): Promise<ConfigurationStatus> {
  const githubMissing = missingVariables(environment, ["GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO"]);
  const gibworkMissing = missingVariables(environment, ["GIBWORK_KEYPAIR_PATH", "GIBWORK_ENVIRONMENT"]);
  const aiMissing = missingVariables(environment, ["OPENAI_API_KEY", "AI_MODEL"]);

  let stateError: string | undefined;
  try {
    await mkdir(stateDirectory, { recursive: true });
    await access(stateDirectory, constants.R_OK | constants.W_OK);
  } catch {
    stateError = "The .gibwork directory is not readable and writable.";
  }

  return {
    github: { configured: githubMissing.length === 0, missing: githubMissing },
    gibwork: { configured: gibworkMissing.length === 0, missing: gibworkMissing },
    ai: { configured: aiMissing.length === 0, missing: aiMissing },
    state: {
      configured: stateError === undefined,
      path: stateDirectory,
      ...(stateError ? { error: stateError } : {}),
    },
  };
}

export function isConfigurationReady(status: ConfigurationStatus): boolean {
  return status.github.configured && status.gibwork.configured && status.ai.configured && status.state.configured;
}