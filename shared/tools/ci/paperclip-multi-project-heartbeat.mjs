#!/usr/bin/env node

import fs from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { getOption, isoNow, logError, logInfo, parseArgs, truthy } from "./common.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CHECK_RUNNER_HEARTBEAT_PATH = path.join(__dirname, "check-runner-heartbeat.mjs");
const DEFAULT_CHECK_EXECUTION_HEALTH_PATH = path.join(__dirname, "check-paperclip-execution-health.mjs");

const DEFAULT_TARGETS = [
  {
    projectName: "一镜一梳",
    workflowFile: "aimandala-ci.yml",
    branch: "main",
    runnerLabels: "self-hosted,linux,mindsync-ci,aimandala",
  },
  {
    projectName: "RelayHub",
    workflowFile: "relayhub-ci-deploy.yml",
    branch: "relayhub/dev",
    runnerLabels: "self-hosted,linux,mindsync-ci,aimandala",
  },
];

function parseTargetsJson(raw) {
  if (!raw || !String(raw).trim()) {
    return DEFAULT_TARGETS;
  }

  let parsed;
  try {
    parsed = JSON.parse(String(raw));
  } catch (error) {
    throw new Error(`PAPERCLIP_HEARTBEAT_TARGETS_JSON 不是合法 JSON：${error instanceof Error ? error.message : String(error)}`);
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("PAPERCLIP_HEARTBEAT_TARGETS_JSON 必须是非空数组");
  }

  return parsed.map((item, index) => {
    const projectName = String(item?.projectName ?? "").trim();
    const workflowFile = String(item?.workflowFile ?? "").trim();
    const branch = String(item?.branch ?? "").trim();
    const runnerLabels = String(item?.runnerLabels ?? "").trim();

    if (!projectName || !workflowFile || !branch) {
      throw new Error(`heartbeat target[${index}] 缺少 projectName / workflowFile / branch`);
    }

    return {
      projectName,
      workflowFile,
      branch,
      runnerLabels: runnerLabels || "self-hosted,linux,mindsync-ci,aimandala",
    };
  });
}

async function loadEnvFile(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    value = value.replace(/^["']|["']$/g, "");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function runNodeScript(scriptPath, args, options = {}) {
  const { spawn } = await import("node:child_process");

  return new Promise((resolve) => {
    const proc = spawn(process.execPath, [scriptPath, ...args], {
      cwd: options.cwd ?? process.cwd(),
      env: {
        ...process.env,
        ...(options.env ?? {}),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("close", (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

function buildRunnerArgs(target, options) {
  return [
    "--repository", options.repository,
    "--github-token", options.githubToken,
    "--company-id", options.companyId,
    "--api-base", options.apiBase,
    "--api-key", options.apiKey,
    "--owner-agent-id", options.ownerAgentId,
    "--project-name", target.projectName,
    "--branch", target.branch,
    "--workflow-file", target.workflowFile,
    "--runner-name", options.runnerName,
    "--expect-labels", target.runnerLabels,
    "--max-queued-minutes", String(options.maxQueuedMinutes),
    "--max-success-age-hours", String(options.maxSuccessAgeHours),
    "--execution-adapter", options.executionAdapter,
    "--execution-host", options.executionHost,
    "--soft-fail", options.softFail ? "1" : "0",
    "--mode", options.mode,
    "--print-json", options.printJson ? "1" : "0",
  ];
}

function buildExecutionHealthArgs(target, options) {
  return [
    "--company-id", options.companyId,
    "--project-name", target.projectName,
    "--api-base", options.apiBase,
    "--api-key", options.apiKey,
    "--stale-minutes", String(options.staleMinutes),
    "--expected-root", options.expectedRoot,
    ...(options.apply ? ["--apply", "1"] : []),
    ...(options.strict ? ["--strict", "1"] : []),
  ];
}

function printTargetSection(title, payload) {
  process.stdout.write(`\n=== ${title} ===\n`);
  process.stdout.write(`${payload.trim() || "(empty)"}\n`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || options.h) {
    console.log(`Usage:
  node shared/tools/ci/paperclip-multi-project-heartbeat.mjs [--targets-json '<json>'] [--doctor] [--strict] [--env-file /etc/default/paperclip-heartbeat]
`);
    return;
  }

  const envFile = getOption(options, "env-file", "");
  if (envFile) {
    await loadEnvFile(envFile);
  }

  const repository = getOption(options, "repository", process.env.GITHUB_REPOSITORY ?? "");
  const githubToken = getOption(options, "github-token", process.env.GITHUB_TOKEN ?? "");
  const companyId = getOption(options, "company-id", process.env.PAPERCLIP_COMPANY_ID ?? "");
  const apiBase = getOption(options, "api-base", process.env.PAPERCLIP_API_BASE ?? "http://127.0.0.1:3100");
  const apiKey = getOption(options, "api-key", process.env.PAPERCLIP_API_KEY ?? "");
  const ownerAgentId = getOption(options, "owner-agent-id", process.env.PAPERCLIP_ENGINEER_AGENT_ID ?? "");
  const runnerName = getOption(options, "runner-name", process.env.RUNNER_HEARTBEAT_RUNNER_NAME ?? "mindsync-ci");
  const executionAdapter = getOption(
    options,
    "execution-adapter",
    process.env.PAPERCLIP_EXECUTION_ADAPTER ?? "github-actions/self-hosted-runner:runner-heartbeat",
  );
  const executionHost = getOption(
    options,
    "execution-host",
    process.env.PAPERCLIP_EXECUTION_HOST ?? process.env.HOSTNAME ?? "",
  );
  const maxQueuedMinutes = Number(getOption(options, "max-queued-minutes", process.env.RUNNER_HEARTBEAT_MAX_QUEUED_MINUTES ?? "20"));
  const maxSuccessAgeHours = Number(
    getOption(options, "max-success-age-hours", process.env.RUNNER_HEARTBEAT_MAX_SUCCESS_AGE_HOURS ?? "24"),
  );
  const staleMinutes = Number(getOption(options, "stale-minutes", process.env.PAPERCLIP_EXECUTION_STALE_MINUTES ?? "15"));
  const expectedRoot = getOption(
    options,
    "expected-root",
    process.env.PAPERCLIP_SERVER_WRITABLE_ALLOWED_ROOT ?? process.env.PAPERCLIP_EXECUTION_WORKTREE_ROOT ?? "/opt/automation/worktrees",
  );
  const strict = truthy(getOption(options, "strict", process.env.PAPERCLIP_EXECUTION_HEALTH_STRICT ?? "0"));
  const apply = truthy(getOption(options, "apply", "1"));
  const doctor = truthy(getOption(options, "doctor", "0"));
  const printJson = truthy(getOption(options, "print-json", doctor ? "1" : "0"));
  const softFail = truthy(getOption(options, "soft-fail", doctor ? "0" : "1"));
  const mode = doctor ? "doctor" : "sync";
  const targets = parseTargetsJson(getOption(options, "targets-json", process.env.PAPERCLIP_HEARTBEAT_TARGETS_JSON ?? ""));
  const runnerScriptPath = getOption(
    options,
    "runner-script-path",
    process.env.CHECK_RUNNER_HEARTBEAT_PATH_OVERRIDE ?? DEFAULT_CHECK_RUNNER_HEARTBEAT_PATH,
  );
  const executionHealthScriptPath = getOption(
    options,
    "execution-health-script-path",
    process.env.CHECK_EXECUTION_HEALTH_PATH_OVERRIDE ?? DEFAULT_CHECK_EXECUTION_HEALTH_PATH,
  );

  if (!repository || !githubToken || !companyId || !apiKey) {
    throw new Error("repository、github token、company id、paperclip api key 都是必填");
  }

  const summary = [];
  let hasFailure = false;

  logInfo(`multi-project heartbeat started at ${isoNow()}`);

  for (const target of targets) {
    logInfo(`checking ${target.projectName} (${target.workflowFile} @ ${target.branch})`);

    const runnerResult = await runNodeScript(
      runnerScriptPath,
      buildRunnerArgs(target, {
        repository,
        githubToken,
        companyId,
        apiBase,
        apiKey,
        ownerAgentId,
        runnerName,
        executionAdapter,
        executionHost,
        maxQueuedMinutes,
        maxSuccessAgeHours,
        softFail,
        mode,
        printJson,
      }),
    );

    const executionResult = await runNodeScript(
      executionHealthScriptPath,
      buildExecutionHealthArgs(target, {
        companyId,
        apiBase,
        apiKey,
        staleMinutes,
        expectedRoot,
        apply,
        strict,
      }),
    );

    if (printJson) {
      printTargetSection(`${target.projectName} runner-heartbeat`, runnerResult.stdout || runnerResult.stderr);
      printTargetSection(`${target.projectName} execution-health`, executionResult.stdout || executionResult.stderr);
    }

    const targetFailed = runnerResult.code !== 0 || executionResult.code !== 0;
    hasFailure ||= targetFailed;
    summary.push({
      projectName: target.projectName,
      workflowFile: target.workflowFile,
      branch: target.branch,
      runnerExitCode: runnerResult.code,
      executionHealthExitCode: executionResult.code,
      ok: !targetFailed,
    });
  }

  process.stdout.write(`\n=== Multi-Project Heartbeat Summary ===\n`);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

  if (hasFailure) {
    process.exit(1);
  }
}

main().catch((error) => {
  logError(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
