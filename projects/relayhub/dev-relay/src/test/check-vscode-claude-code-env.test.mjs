import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { checkClaudeCodeEnv } from "../check-vscode-claude-code-env.mjs";

const TEMPLATE_ENV = {
  RELAYHUB_DEV_RELAY_BASE_URL: "http://127.0.0.1:4319",
  RELAYHUB_DEV_RELAY_AUTH_TOKEN: "relayhub-local-dev-relay",
  RELAYHUB_CLAUDE_MODEL: "relayhub-task-claude-code",
  ANTHROPIC_BASE_URL: "http://127.0.0.1:4319",
  ANTHROPIC_API_KEY: "relayhub-local-dev-relay",
  ANTHROPIC_AUTH_TOKEN: "relayhub-local-dev-relay",
  ANTHROPIC_MODEL: "relayhub-task-claude-code",
  ANTHROPIC_DEFAULT_OPUS_MODEL: "relayhub-task-claude-code",
  ANTHROPIC_DEFAULT_SONNET_MODEL: "relayhub-task-claude-code",
  ANTHROPIC_DEFAULT_HAIKU_MODEL: "relayhub-task-claude-code"
};

async function withTempWorkspace(run) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "relayhub-vscode-check-"));
  const homeDir = path.join(root, "home");
  await fs.mkdir(homeDir, { recursive: true });

  try {
    await run({
      root,
      homeDir,
      workspaceSettingsPath: path.join(root, ".vscode", "settings.json"),
      userClaudeSettingsPath: path.join(homeDir, ".claude", "settings.json")
    });
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

async function writeWorkspaceSettings(filePath, values = TEMPLATE_ENV) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(
    filePath,
    JSON.stringify(
      {
        "terminal.integrated.env.osx": values
      },
      null,
      2
    ),
    "utf8"
  );
}

async function writeUserClaudeSettings(filePath, values) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(values, null, 2), "utf8");
}

test("reports fix next when workspace settings are missing", async () => {
  await withTempWorkspace(async ({ root, homeDir }) => {
    const result = await checkClaudeCodeEnv({
      workspaceRoot: root,
      homeDir,
      env: TEMPLATE_ENV
    });

    assert.equal(result.status, "fix next");
    assert.match(result.findings[0], /workspace settings missing/);
  });
});

test("reports fix next when workspace settings are incomplete", async () => {
  await withTempWorkspace(async ({ root, homeDir, workspaceSettingsPath }) => {
    await writeWorkspaceSettings(workspaceSettingsPath, {
      ANTHROPIC_BASE_URL: "http://127.0.0.1:4319"
    });

    const result = await checkClaudeCodeEnv({
      workspaceRoot: root,
      homeDir,
      env: TEMPLATE_ENV
    });

    assert.equal(result.status, "fix next");
    assert.ok(result.findings.some((line) => line.includes("missing RELAYHUB_DEV_RELAY_BASE_URL")));
  });
});

test("reports warning when shell environment diverges from template", async () => {
  await withTempWorkspace(async ({ root, homeDir, workspaceSettingsPath }) => {
    await writeWorkspaceSettings(workspaceSettingsPath);

    const result = await checkClaudeCodeEnv({
      workspaceRoot: root,
      homeDir,
      env: {
        ...TEMPLATE_ENV,
        ANTHROPIC_BASE_URL: "https://wrong.example.com"
      }
    });

    assert.equal(result.status, "warning");
    assert.ok(result.findings.some((line) => line.includes("mismatch ANTHROPIC_BASE_URL")));
  });
});

test("reports fix next when user claude settings contain override keys", async () => {
  await withTempWorkspace(async ({ root, homeDir, workspaceSettingsPath, userClaudeSettingsPath }) => {
    await writeWorkspaceSettings(workspaceSettingsPath);
    await writeUserClaudeSettings(userClaudeSettingsPath, {
      env: {
        ANTHROPIC_BASE_URL: "https://aitechflux.com/v1",
        ANTHROPIC_AUTH_TOKEN: "sk-aitechflux",
        ANTHROPIC_MODEL: "claude-sonnet"
      }
    });

    const result = await checkClaudeCodeEnv({
      workspaceRoot: root,
      homeDir,
      env: TEMPLATE_ENV
    });

    assert.equal(result.status, "fix next");
    assert.ok(result.findings.some((line) => line.includes("user-claude env conflict ANTHROPIC_BASE_URL")));
    assert.ok(result.findings.some((line) => line.includes("user-claude env conflict ANTHROPIC_AUTH_TOKEN")));
  });
});

test("reports ok when workspace, shell, and user claude settings are aligned", async () => {
  await withTempWorkspace(async ({ root, homeDir, workspaceSettingsPath, userClaudeSettingsPath }) => {
    await writeWorkspaceSettings(workspaceSettingsPath);
    await writeUserClaudeSettings(userClaudeSettingsPath, {});

    const result = await checkClaudeCodeEnv({
      workspaceRoot: root,
      homeDir,
      env: TEMPLATE_ENV
    });

    assert.equal(result.status, "ok");
    assert.ok(result.findings.some((line) => line.includes("workspace settings match template")));
    assert.ok(result.findings.some((line) => line.includes("shell environment matches template")));
  });
});
