import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  getConfigurationStatus,
  isConfigurationReady,
} from "../src/config/config.ts";

const completeEnvironment = {
  GITHUB_TOKEN: "token",
  GITHUB_OWNER: "owner",
  GITHUB_REPO: "repo",
  GIBWORK_KEYPAIR_PATH: "/wallet/keypair.json",
  GIBWORK_ENVIRONMENT: "production",
  OPENAI_API_KEY: "key",
  AI_MODEL: "model",
};

test("configuration status identifies missing variables without exposing values", async () => {
  const status = await getConfigurationStatus({}, path.join(os.tmpdir(), "missing-gibwork-state"));

  assert.deepEqual(status.github.missing, ["GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO"]);
  assert.deepEqual(status.gibwork.missing, ["GIBWORK_KEYPAIR_PATH", "GIBWORK_ENVIRONMENT"]);
  assert.deepEqual(status.ai.missing, ["OPENAI_API_KEY", "AI_MODEL"]);
  assert.equal(isConfigurationReady(status), false);
});

test("configuration status is ready when services and state are configured", async () => {
  const stateDirectory = await mkdtemp(path.join(os.tmpdir(), "gibwork-state-"));

  try {
    const status = await getConfigurationStatus(completeEnvironment, stateDirectory);

    assert.equal(status.github.configured, true);
    assert.equal(status.gibwork.configured, true);
    assert.equal(status.ai.configured, true);
    assert.equal(status.state.configured, true);
    assert.equal(isConfigurationReady(status), true);
  } finally {
    await rm(stateDirectory, { recursive: true, force: true });
  }
});