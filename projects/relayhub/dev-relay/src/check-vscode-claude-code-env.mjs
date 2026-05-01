import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const EXPECTED_KEYS = [
  "RELAYHUB_DEV_RELAY_BASE_URL",
  "RELAYHUB_DEV_RELAY_AUTH_TOKEN",
  "RELAYHUB_CLAUDE_MODEL",
  "ANTHROPIC_BASE_URL",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_MODEL",
  "ANTHROPIC_DEFAULT_OPUS_MODEL",
  "ANTHROPIC_DEFAULT_SONNET_MODEL",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL"
];

const USER_CLAUDE_CONFLICT_KEYS = [
  "ANTHROPIC_BASE_URL",
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_MODEL",
  "ANTHROPIC_DEFAULT_OPUS_MODEL",
  "ANTHROPIC_DEFAULT_SONNET_MODEL",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL"
];

function parseArgs(argv) {
  let workspaceRoot = process.cwd();

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--workspace-root") {
      workspaceRoot = argv[index + 1] ?? workspaceRoot;
      index += 1;
    }
  }

  return {
    workspaceRoot: path.resolve(workspaceRoot)
  };
}

async function parseEnvTemplate(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const expected = {};

  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator < 0) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    expected[key] = value;
  }

  return expected;
}

async function parseJsonFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function getTemplateSettingsValues(templateJson) {
  return templateJson["terminal.integrated.env.osx"] ?? {};
}

function getClaudeCodeEnvironmentValues(settingsJson) {
  const entries = settingsJson["claudeCode.environmentVariables"];
  if (!Array.isArray(entries)) {
    return {};
  }

  const values = {};
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const key = typeof entry.name === "string" ? entry.name : "";
    if (!key) {
      continue;
    }

    values[key] = entry.value;
  }

  return values;
}

function collectMismatches(expected, actual) {
  const mismatches = [];

  for (const key of EXPECTED_KEYS) {
    const expectedValue = expected[key];
    const actualValue = actual[key];

    if (actualValue === undefined) {
      mismatches.push({
        key,
        type: "missing",
        expected: expectedValue
      });
      continue;
    }

    if (String(actualValue) !== String(expectedValue)) {
      mismatches.push({
        key,
        type: "mismatch",
        expected: expectedValue,
        actual: actualValue
      });
    }
  }

  return mismatches;
}

function buildShellActual(env) {
  const actual = {};
  for (const key of EXPECTED_KEYS) {
    if (env[key] !== undefined) {
      actual[key] = env[key];
    }
  }
  return actual;
}

function collectUserClaudeConflicts(settings) {
  const conflicts = [];
  if (!settings || typeof settings !== "object") {
    return conflicts;
  }

  for (const key of USER_CLAUDE_CONFLICT_KEYS) {
    if (settings[key] !== undefined && settings[key] !== null && settings[key] !== "") {
      conflicts.push({
        source: "top-level",
        key,
        value: settings[key]
      });
    }
  }

  const nestedEnv = settings.env;
  if (nestedEnv && typeof nestedEnv === "object") {
    for (const key of USER_CLAUDE_CONFLICT_KEYS) {
      if (nestedEnv[key] !== undefined && nestedEnv[key] !== null && nestedEnv[key] !== "") {
        conflicts.push({
          source: "env",
          key,
          value: nestedEnv[key]
        });
      }
    }
  }

  return conflicts;
}

function renderMismatch(mismatch) {
  if (mismatch.type === "missing") {
    return `fix next workspace-or-shell missing ${mismatch.key} expected=${mismatch.expected}`;
  }

  return `warning workspace-or-shell mismatch ${mismatch.key} expected=${mismatch.expected} actual=${mismatch.actual}`;
}

export async function checkClaudeCodeEnv({
  workspaceRoot,
  env = process.env,
  homeDir = os.homedir(),
  scriptDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..")
}) {
  const envTemplatePath = path.join(scriptDir, "claude-code-relay.env.example");
  const settingsTemplatePath = path.join(scriptDir, "vscode-settings.template.json");
  const expectedFromEnvTemplate = await parseEnvTemplate(envTemplatePath);
  const templateJson = await parseJsonFile(settingsTemplatePath);
  const expectedFromSettingsTemplate = getTemplateSettingsValues(templateJson);

  const expected = {
    ...expectedFromEnvTemplate,
    ...expectedFromSettingsTemplate
  };

  const workspaceSettingsPath = path.join(workspaceRoot, ".vscode", "settings.json");
  const userClaudeSettingsPath = path.join(homeDir, ".claude", "settings.json");

  const findings = [];
  let status = "ok";

  let workspaceSettings = null;
  try {
    workspaceSettings = await parseJsonFile(workspaceSettingsPath);
  } catch (error) {
    findings.push(`fix next workspace settings missing path=${workspaceSettingsPath}`);
    status = "fix next";
  }

  if (workspaceSettings) {
    const actualWorkspaceValues = getTemplateSettingsValues(workspaceSettings);
    const workspaceMismatches = collectMismatches(expected, actualWorkspaceValues);
    const actualClaudeCodeValues = getClaudeCodeEnvironmentValues(workspaceSettings);
    const claudeCodeMismatches = collectMismatches(expected, actualClaudeCodeValues);

    for (const mismatch of workspaceMismatches) {
      findings.push(renderMismatch(mismatch));
    }
    for (const mismatch of claudeCodeMismatches) {
      findings.push(`workspace-claude ${renderMismatch(mismatch)}`);
    }

    if (workspaceMismatches.length > 0 || claudeCodeMismatches.length > 0) {
      status = "fix next";
    } else {
      findings.push(`ok workspace settings match template path=${workspaceSettingsPath}`);
      findings.push(`ok workspace claudeCode.environmentVariables match template path=${workspaceSettingsPath}`);
    }
  }

  const shellActual = buildShellActual(env);
  const shellMismatches = collectMismatches(expected, shellActual);
  if (shellMismatches.length > 0) {
    for (const mismatch of shellMismatches) {
      findings.push(renderMismatch(mismatch));
    }
    status = status === "fix next" ? "fix next" : "warning";
  } else {
    findings.push("ok shell environment matches template");
  }

  try {
    const userClaudeSettings = await parseJsonFile(userClaudeSettingsPath);
    const conflicts = collectUserClaudeConflicts(userClaudeSettings);

    if (conflicts.length > 0) {
      for (const conflict of conflicts) {
        findings.push(
          `fix next user-claude ${conflict.source} conflict ${conflict.key} value=${conflict.value} path=${userClaudeSettingsPath}`
        );
      }
      status = "fix next";
    } else {
      findings.push(`ok user-claude settings have no known relay override keys path=${userClaudeSettingsPath}`);
    }
  } catch {
    findings.push(`warning user-claude settings unreadable-or-missing path=${userClaudeSettingsPath}`);
    if (status === "ok") {
      status = "warning";
    }
  }

  return {
    status,
    workspaceRoot,
    workspaceSettingsPath,
    userClaudeSettingsPath,
    findings
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs(process.argv.slice(2));
  const result = await checkClaudeCodeEnv(options);

  console.log(`status=${result.status}`);
  console.log(`workspace_root=${result.workspaceRoot}`);
  console.log(`workspace_settings=${result.workspaceSettingsPath}`);
  console.log(`user_claude_settings=${result.userClaudeSettingsPath}`);
  for (const finding of result.findings) {
    console.log(finding);
  }

  process.exitCode = result.status === "ok" ? 0 : 1;
}
