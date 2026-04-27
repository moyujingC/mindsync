#!/usr/bin/env node

import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const DEFAULT_STATUSES = "todo,in_progress,blocked,in_review";
const LOCAL_ROUTE_TASK_CLASS = "manual-review-required";
const LOCAL_ROUTE = "local_manual_review";
const SUMMARY_SOURCE = "automation-summary";
const SUPPORTED_LOCAL_ADAPTERS = new Set(["codex_local", "claude_local", "pi_local"]);
const REQUIRED_ENV = [
  "PAPERCLIP_API_URL",
  "PAPERCLIP_COMPANY_ID",
  "PAPERCLIP_AGENT_ID",
  "PAPERCLIP_API_KEY",
];

function usage() {
  console.log(`Usage:
  node shared/tools/paperclip-local-executor.mjs doctor [--json]
  node shared/tools/paperclip-local-executor.mjs poll-once [--json] [--statuses <csv>]
  node shared/tools/paperclip-local-executor.mjs run-once [--json] [--statuses <csv>] [--execute]
  node shared/tools/paperclip-local-executor.mjs daemon-tick [--json] [--statuses <csv>] [--execute]
  node shared/tools/paperclip-local-executor.mjs list-active [--json]
  node shared/tools/paperclip-local-executor.mjs stop [--agent-id <id>] [--issue <idOrIdentifier>]
  node shared/tools/paperclip-local-executor.mjs resume [--agent-id <id>] [--issue <idOrIdentifier>]

Notes:
  - This executor only targets manual-review-required + local_manual_review.
  - automation-summary / commit-summary parent tasks are always excluded.
  - Successful local execution advances the task to in_review.
  - Failed local execution advances the task to blocked.
`);
}

function fail(message, code = 1) {
  console.error(`paperclip-local-executor: ${message}`);
  process.exit(code);
}

function requireEnv(keys = REQUIRED_ENV, env = process.env) {
  const missing = keys.filter((key) => !env[key]);
  if (missing.length > 0) {
    fail(
      `missing required env: ${missing.join(", ")}; load a local agent identity first, for example: eval "$(shared/tools/paperclip-local-env.sh engineer)"`,
    );
  }
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {
    command,
    args: [],
    json: false,
    execute: false,
    statuses: DEFAULT_STATUSES,
  };

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--execute") {
      options.execute = true;
      continue;
    }
    if (arg === "--statuses") {
      options.statuses = rest[index + 1] ?? options.statuses;
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
      options[key] = rest[index + 1] ?? "";
      index += 1;
      continue;
    }
    options.args.push(arg);
  }

  return options;
}

function containsLine(description, expected) {
  return typeof description === "string" && description.includes(expected);
}

function isLocalExecutorIssue(issue) {
  const description = issue?.description ?? "";
  return (
    containsLine(description, `task_class: ${LOCAL_ROUTE_TASK_CLASS}`) &&
    containsLine(description, `execution_route: ${LOCAL_ROUTE}`)
  );
}

function isAutomationSummaryIssue(issue) {
  return containsLine(issue?.description ?? "", `source: ${SUMMARY_SOURCE}`);
}

function isCommitSummaryIssue(issue) {
  return typeof issue?.description === "string" && issue.description.includes("commit-summary");
}

function isEligibleExecutorIssue(issue) {
  return isLocalExecutorIssue(issue) && !isAutomationSummaryIssue(issue) && !isCommitSummaryIssue(issue);
}

function resolveAdapter(agent) {
  return typeof agent?.adapter === "string" ? agent.adapter.trim() : "";
}

function summarizeIssue(issue) {
  return {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    status: issue.status,
    assigneeAgentId: issue.assigneeAgentId ?? null,
    description: issue.description ?? "",
  };
}

function selectRunnableIssues({ issues, agentsById, activeLocks }) {
  const runnable = [];
  const skipped = [];
  const seenAgents = new Set();

  for (const issue of issues) {
    if (!isLocalExecutorIssue(issue)) {
      skipped.push({ issue: summarizeIssue(issue), reason: "non_local_route" });
      continue;
    }
    if (isAutomationSummaryIssue(issue)) {
      skipped.push({ issue: summarizeIssue(issue), reason: "summary_parent" });
      continue;
    }
    if (isCommitSummaryIssue(issue)) {
      skipped.push({ issue: summarizeIssue(issue), reason: "summary_parent" });
      continue;
    }

    const agentId = issue.assigneeAgentId ?? null;
    if (!agentId || !agentsById[agentId]) {
      skipped.push({ issue: summarizeIssue(issue), reason: "missing_agent" });
      continue;
    }

    const adapter = resolveAdapter(agentsById[agentId]);
    if (!SUPPORTED_LOCAL_ADAPTERS.has(adapter)) {
      skipped.push({ issue: summarizeIssue(issue), reason: "unsupported_adapter" });
      continue;
    }

    if (activeLocks.has(agentId)) {
      skipped.push({ issue: summarizeIssue(issue), reason: "agent_locked" });
      continue;
    }

    if (seenAgents.has(agentId)) {
      skipped.push({ issue: summarizeIssue(issue), reason: "agent_concurrency_limit" });
      continue;
    }

    seenAgents.add(agentId);
    runnable.push({
      issue: summarizeIssue(issue),
      agentId,
      adapter,
      agentName: agentsById[agentId]?.name ?? agentId,
      identifier: issue.identifier,
    });
  }

  return { runnable, skipped };
}

function buildExecutorComment({ kind, context, judgment, actions, next, verification }) {
  const titleByKind = {
    success: "本地 Mac 自动执行完成",
    blocked: "本地 Mac 自动执行受阻",
    progress: "本地 Mac 自动执行进展",
  };
  const lines = [
    `## ${titleByKind[kind] ?? "本地 Mac 自动执行更新"}`,
    "",
    `- host: ${context.host}`,
    `- adapter: ${context.adapter}`,
    `- cwd: ${context.cwd}`,
    `- branch: ${context.branch}`,
    `- sha: ${context.sha}`,
  ];

  if (judgment) {
    lines.push("", "当前判断：", judgment);
  }
  if (actions) {
    lines.push("", "已做动作：", actions);
  }
  if (next) {
    lines.push("", "下一步动作：", next);
  }
  if (verification) {
    lines.push("", "验证结论：", verification);
  }

  return lines.join("\n").trim();
}

function buildStatusTransition({ issue, outcome, context, errorSummary = "" }) {
  if (outcome === "success") {
    return {
      issue: summarizeIssue(issue),
      status: "in_review",
      comment: buildExecutorComment({
        kind: "success",
        context,
        judgment: "本地自动执行已完成，结果进入待验收。",
        actions: "已自动 claim、执行并回写当前结果。",
        next: "等待人工验收并决定是否转 done。",
        verification: "本地执行器判定本轮执行通过。",
      }),
    };
  }

  return {
    issue: summarizeIssue(issue),
    status: "blocked",
    comment: buildExecutorComment({
      kind: "blocked",
      context,
      judgment: "本地自动执行遇到明确阻断，暂不继续自动推进。",
      actions: errorSummary || "本地执行器在执行过程中遇到错误。",
      next: "请人工检查本地日志、工作区和执行环境后再决定是否恢复。",
      verification: errorSummary || "本地执行未通过。",
    }),
  };
}

function runPaperclip(args, env = process.env) {
  return execFileSync("paperclipai", args, {
    encoding: "utf8",
    env,
  });
}

function paperclipJson(args, env = process.env) {
  return JSON.parse(runPaperclip(args, env));
}

function getEnvApiArgs() {
  return getEnvApiArgsFor(process.env);
}

function getEnvApiArgsFor(env) {
  return [
    "--api-base",
    env.PAPERCLIP_API_URL,
    "--api-key",
    env.PAPERCLIP_API_KEY,
  ];
}

function hasRunnableCheckoutContext(env = process.env) {
  return String(env.PAPERCLIP_RUN_ID ?? "").trim().length > 0;
}

function resolveAdapterRuntime({ adapter, availableCommands }) {
  const commandByAdapter = {
    codex_local: "codex",
    claude_local: "claude",
    pi_local: "pi",
  };
  const command = commandByAdapter[adapter] ?? null;
  if (!command) {
    return { ready: false, reason: "unsupported_adapter", command: null };
  }
  if (!availableCommands.has(command)) {
    return { ready: false, reason: "adapter_command_missing", command };
  }
  return { ready: true, reason: null, command };
}

function commandExists(command) {
  try {
    execFileSync("bash", ["-lc", `command -v ${command}`], {
      encoding: "utf8",
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}

function getAvailableCommands() {
  return new Set(["codex", "claude", "pi"].filter(commandExists));
}

function getExecutorHome() {
  return path.join(os.homedir(), ".paperclip-local-executor");
}

function getLocksDir() {
  return path.join(getExecutorHome(), "locks");
}

function getLogsDir() {
  return path.join(getExecutorHome(), "logs");
}

function getPiSessionsDir() {
  return path.join(getExecutorHome(), "pi-sessions");
}

async function ensureRuntimeDirs() {
  await fs.mkdir(getLocksDir(), { recursive: true });
  await fs.mkdir(getLogsDir(), { recursive: true });
  await fs.mkdir(getPiSessionsDir(), { recursive: true });
}

async function listActiveLocks() {
  const dir = getLocksDir();
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => ({
      key: entry.name.replace(/\.json$/, ""),
      path: path.join(dir, entry.name),
    }));
}

function getLockPath(agentId) {
  return path.join(getLocksDir(), `${agentId}.json`);
}

function lockMatchesTarget(lockPayload, target) {
  if (!target) {
    return true;
  }
  const normalized = String(target).trim();
  if (!normalized) {
    return true;
  }
  return [
    lockPayload?.agentId,
    lockPayload?.issueId,
    lockPayload?.identifier,
  ].some((value) => String(value ?? "").includes(normalized));
}

async function readLock(agentId) {
  const lockPath = getLockPath(agentId);
  try {
    return JSON.parse(await fs.readFile(lockPath, "utf8"));
  } catch {
    return null;
  }
}

async function acquireLock(payload) {
  const lockPath = getLockPath(payload.agentId);
  await fs.writeFile(lockPath, JSON.stringify(payload, null, 2), {
    encoding: "utf8",
    flag: "wx",
  });
  return lockPath;
}

async function releaseLock(agentId) {
  await fs.rm(getLockPath(agentId), { force: true });
}

function buildExecutionContext(options = {}) {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const branch = options.branch || execFileSync("git", ["branch", "--show-current"], { cwd, encoding: "utf8" }).trim();
  const sha = options.sha || execFileSync("git", ["rev-parse", "HEAD"], { cwd, encoding: "utf8" }).trim();
  return {
    host: options.host || `mac:${os.hostname()}`,
    adapter: options.adapter || "unknown",
    cwd,
    branch,
    sha,
  };
}

function parseExportLines(text) {
  const env = {};
  for (const line of String(text ?? "").split(/\r?\n/)) {
    const match = line.match(/^export\s+([A-Za-z_][A-Za-z0-9_]*)='([^']*)'$/);
    if (match) {
      env[match[1]] = match[2];
    }
  }
  return env;
}

function loadAgentEnv(agentRef) {
  const scriptPath = path.resolve("shared/tools/paperclip-local-env.sh");
  const output = execFileSync(scriptPath, [agentRef], {
    encoding: "utf8",
    env: {
      ...process.env,
    },
  });
  const targetEnv = {
    ...process.env,
    ...parseExportLines(output),
  };
  const missing = REQUIRED_ENV.filter((key) => !targetEnv[key]);
  if (missing.length > 0) {
    throw new Error(`local agent env for ${agentRef} is missing: ${missing.join(", ")}`);
  }
  return targetEnv;
}

function tryLoadAgentEnv(agentRef) {
  try {
    return {
      ok: true,
      env: loadAgentEnv(agentRef),
      error: "",
    };
  } catch (error) {
    return {
      ok: false,
      env: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function buildAdapterCommand({ adapter, prompt, cwd, issue, context }) {
  const basePrompt = [
    `当前任务：${issue.identifier} ${issue.title}`,
    "",
    "请在当前工作区中继续处理这条本地普通任务。",
    "要求：",
    `1. 只在当前 cwd 中工作：${cwd}`,
    "2. 不要把任务视为服务器 automation 任务。",
    "3. 完成后给出简短执行结论，供本地执行器回写。",
    "",
    "任务描述：",
    issue.description ?? "",
    "",
    prompt || "请基于任务描述完成本地执行，并总结结果。",
  ].join("\n");

  if (adapter === "codex_local") {
    return {
      command: "codex",
      args: [
        "exec",
        "--json",
        "--dangerously-bypass-approvals-and-sandbox",
        "--cd",
        cwd,
        basePrompt,
      ],
    };
  }

  if (adapter === "claude_local") {
    return {
      command: "claude",
      args: [
        "--print",
        "-",
        "--output-format",
        "json",
        "--dangerously-skip-permissions",
        "--add-dir",
        cwd,
      ],
      stdin: basePrompt,
    };
  }

  if (adapter === "pi_local") {
    return {
      command: "pi",
      args: [
        "--mode",
        "json",
        "-p",
        "--append-system-prompt",
        "You are running as a Paperclip local execution host on the user's Mac.",
        "--session",
        path.join(getPiSessionsDir(), `${issue.id}.jsonl`),
        basePrompt,
      ],
    };
  }

  return null;
}

async function runAdapterCommand({ adapter, issue, context, prompt, env = process.env }) {
  const runtime = resolveAdapterRuntime({
    adapter,
    availableCommands: getAvailableCommands(),
  });
  if (!runtime.ready) {
    return {
      ok: false,
      errorSummary: `adapter ${adapter} is not ready on this Mac: ${runtime.reason}`,
      stdout: "",
      stderr: "",
    };
  }

  const execution = buildAdapterCommand({
    adapter,
    issue,
    context,
    cwd: context.cwd,
    prompt,
  });
  if (!execution) {
    return {
      ok: false,
      errorSummary: `adapter ${adapter} is not supported by the local executor`,
      stdout: "",
      stderr: "",
    };
  }

  const logPrefix = `${issue.identifier}-${adapter}-${Date.now()}`;
  const stdoutPath = path.join(getLogsDir(), `${logPrefix}.stdout.log`);
  const stderrPath = path.join(getLogsDir(), `${logPrefix}.stderr.log`);

  return await new Promise((resolve) => {
    const child = spawn(execution.command, execution.args, {
      cwd: context.cwd,
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    if (typeof execution.stdin === "string") {
      child.stdin.write(execution.stdin);
    }
    child.stdin.end();
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", async (error) => {
      await Promise.all([
        fs.writeFile(stdoutPath, stdout, "utf8"),
        fs.writeFile(stderrPath, `${stderr}\n${error.stack || error.message}`, "utf8"),
      ]);
      resolve({
        ok: false,
        stdout,
        stderr: `${stderr}\n${error.stack || error.message}`,
        errorSummary: error.message,
        logPaths: { stdoutPath, stderrPath },
      });
    });
    child.on("close", async (code) => {
      await Promise.all([
        fs.writeFile(stdoutPath, stdout, "utf8"),
        fs.writeFile(stderrPath, stderr, "utf8"),
      ]);
      if (code === 0) {
        resolve({
          ok: true,
          stdout,
          stderr,
          errorSummary: "",
          logPaths: { stdoutPath, stderrPath },
        });
        return;
      }
      resolve({
        ok: false,
        stdout,
        stderr,
        errorSummary: firstNonEmptyLine(stderr) || firstNonEmptyLine(stdout) || `adapter exited with code ${code ?? -1}`,
        logPaths: { stdoutPath, stderrPath },
      });
    });
  });
}

function firstNonEmptyLine(text) {
  return (
    String(text ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) ?? ""
  );
}

function listIssues(statuses) {
  requireEnv();
  return paperclipJson([
    "issue",
    "list",
    "-C",
    process.env.PAPERCLIP_COMPANY_ID,
    "--status",
    statuses,
    ...getEnvApiArgs(),
    "--json",
  ]);
}

function listAgents() {
  requireEnv();
  return paperclipJson([
    "agent",
    "list",
    "-C",
    process.env.PAPERCLIP_COMPANY_ID,
    ...getEnvApiArgs(),
    "--json",
  ]);
}

function getAgentLocalEnv(agent) {
  return tryLoadAgentEnv(agent.name || agent.id);
}

function getIssue(selector) {
  requireEnv();
  return paperclipJson([
    "issue",
    "get",
    selector,
    ...getEnvApiArgs(),
    "--json",
  ]);
}

function getProject(projectId) {
  requireEnv();
  if (!projectId) {
    return null;
  }
  return paperclipJson([
    "project",
    "get",
    projectId,
    ...getEnvApiArgs(),
    "--json",
  ]);
}

function normalizeWorkspaceName(name) {
  return String(name ?? "").trim().toLowerCase();
}

function pickPreferredLocalWorkspace(project) {
  const workspaces = Array.isArray(project?.workspaces) ? project.workspaces : [];
  if (workspaces.length === 0) {
    return null;
  }

  const byName = (workspace) => normalizeWorkspaceName(workspace?.name);
  const hasCwd = (workspace) => typeof workspace?.cwd === "string" && workspace.cwd.trim().length > 0;

  const localWorktree = workspaces.find((workspace) => hasCwd(workspace) && byName(workspace).includes("local-worktree"));
  if (localWorktree) {
    return {
      source: "local_worktree",
      workspace: localWorktree,
    };
  }

  const localMonorepo = workspaces.find((workspace) => hasCwd(workspace) && byName(workspace).includes("local-monorepo"));
  if (localMonorepo) {
    return {
      source: "local_monorepo",
      workspace: localMonorepo,
    };
  }

  const localPath = workspaces.find(
    (workspace) => hasCwd(workspace) && String(workspace.cwd).startsWith("/Users/"),
  );
  if (localPath) {
    return {
      source: "local_path_fallback",
      workspace: localPath,
    };
  }

  return null;
}

function resolveIssueExecutionCwd(issue, fallbackCwd = process.cwd()) {
  if (!issue?.projectId) {
    return {
      cwd: path.resolve(fallbackCwd),
      source: "process_cwd",
      workspace: null,
      project: null,
    };
  }

  const project = getProject(issue.projectId);
  const preferred = pickPreferredLocalWorkspace(project);
  if (!preferred?.workspace?.cwd) {
    return {
      cwd: path.resolve(fallbackCwd),
      source: "process_cwd",
      workspace: null,
      project,
    };
  }

  return {
    cwd: path.resolve(preferred.workspace.cwd),
    source: preferred.source,
    workspace: preferred.workspace,
    project,
  };
}

function updateIssue(issueId, status, comment, env = process.env) {
  requireEnv(REQUIRED_ENV, env);
  runPaperclip([
    "issue",
    "update",
    issueId,
    "--status",
    status,
    "--comment",
    comment,
    ...getEnvApiArgsFor(env),
  ], env);
}

function checkoutIssue(issueId, agentId, env = process.env) {
  requireEnv(REQUIRED_ENV, env);
  runPaperclip([
    "issue",
    "checkout",
    issueId,
    "--agent-id",
    agentId,
    ...getEnvApiArgsFor(env),
  ], env);
}

function resolveCheckoutPlan(env = process.env) {
  if (hasRunnableCheckoutContext(env)) {
    return {
      mode: "paperclip_checkout",
      requiresRunId: true,
      runId: env.PAPERCLIP_RUN_ID,
    };
  }
  return {
    mode: "local_lock_only",
    requiresRunId: false,
    runId: null,
    reason: "missing_paperclip_run_id",
  };
}

async function doctor(options) {
  await ensureRuntimeDirs();
  const availableCommands = Array.from(getAvailableCommands()).sort();
  const payload = {
    ok: true,
    host: `mac:${os.hostname()}`,
    executorHome: getExecutorHome(),
    locksDir: getLocksDir(),
    logsDir: getLogsDir(),
    availableCommands,
    supportedAdapters: Array.from(SUPPORTED_LOCAL_ADAPTERS),
  };
  if (options.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  console.log(`ok: ${payload.ok}`);
  console.log(`host: ${payload.host}`);
  console.log(`executorHome: ${payload.executorHome}`);
  console.log(`locksDir: ${payload.locksDir}`);
  console.log(`logsDir: ${payload.logsDir}`);
  console.log(`availableCommands: ${availableCommands.join(", ") || "(none)"}`);
}

async function listActive(options) {
  await ensureRuntimeDirs();
  const locks = await listActiveLocks();
  if (options.json) {
    console.log(JSON.stringify(locks, null, 2));
    return;
  }
  if (locks.length === 0) {
    console.log("No active local executor locks.");
    return;
  }
  for (const lock of locks) {
    console.log(`${lock.key}\t${lock.path}`);
  }
}

async function pollOnce(options) {
  await ensureRuntimeDirs();
  const issues = listIssues(options.statuses);
  const agents = listAgents();
  const agentsById = Object.fromEntries(
    agents.map((agent) => [agent.id, { id: agent.id, name: agent.name, adapter: agent.adapterType || agent.adapter || "" }]),
  );
  const activeLocks = new Set((await listActiveLocks()).map((lock) => lock.key));
  const selection = selectRunnableIssues({
    issues,
    agentsById,
    activeLocks,
  });
  const payload = {
    ok: true,
    mode: "poll-only",
    statuses: options.statuses,
    runnable: selection.runnable,
    skipped: selection.skipped,
  };
  if (options.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  if (selection.runnable.length === 0) {
    console.log("No runnable local tasks found.");
    return;
  }
  for (const item of selection.runnable) {
    console.log(`${item.identifier}\t${item.adapter}\t${item.agentName}`);
  }
}

async function executeOne(selection, options) {
  const agentEnvResult = getAgentLocalEnv({
    id: selection.agentId,
    name: selection.agentName,
  });
  const issue = getIssue(selection.issue.id);
  const cwdResolution = resolveIssueExecutionCwd(issue, process.cwd());
  const context = buildExecutionContext({
    adapter: selection.adapter,
    cwd: cwdResolution.cwd,
  });
  const checkoutPlan = resolveCheckoutPlan(agentEnvResult.env ?? process.env);
  const lockPayload = {
    agentId: selection.agentId,
    issueId: issue.id,
    identifier: issue.identifier,
    adapter: selection.adapter,
    host: context.host,
    cwdSource: cwdResolution.source,
    workspaceName: cwdResolution.workspace?.name ?? null,
    checkoutMode: checkoutPlan.mode,
    startedAt: new Date().toISOString(),
  };

  if (!options.execute) {
    return {
      mode: "dry-run",
      selection,
      agentEnvSummary: {
        ok: agentEnvResult.ok,
        agentId: agentEnvResult.env?.PAPERCLIP_AGENT_ID ?? null,
        hasApiKey: Boolean(agentEnvResult.env?.PAPERCLIP_API_KEY),
        error: agentEnvResult.error || null,
      },
      checkoutPlan,
      cwdResolution,
      lockPayload,
      plannedTransition: buildStatusTransition({
        issue,
        outcome: "success",
        context,
      }),
    };
  }

  if (!agentEnvResult.ok || !agentEnvResult.env) {
    const transition = buildStatusTransition({
      issue,
      outcome: "blocked",
      context,
      errorSummary: `无法加载本地 agent 身份: ${agentEnvResult.error || "unknown_error"}`,
    });
    updateIssue(issue.id, transition.status, transition.comment);
    return {
      mode: "execute",
      selection,
      cwdResolution,
      result: {
        ok: false,
        stdout: "",
        stderr: "",
        errorSummary: agentEnvResult.error || "failed_to_load_agent_env",
      },
      transition,
      lockPath: null,
    };
  }

  const agentEnv = agentEnvResult.env;
  const lockPath = await acquireLock(lockPayload);
  try {
    if (checkoutPlan.mode === "paperclip_checkout") {
      checkoutIssue(issue.id, selection.agentId, agentEnv);
    }
    const result = await runAdapterCommand({
      adapter: selection.adapter,
      issue,
      context,
      prompt: options.prompt || "",
      env: agentEnv,
    });
    const transition = buildStatusTransition({
      issue,
      outcome: result.ok ? "success" : "blocked",
      context,
      errorSummary: result.errorSummary,
    });
    updateIssue(issue.id, transition.status, transition.comment, agentEnv);
    return {
      mode: "execute",
      selection,
      checkoutPlan,
      cwdResolution,
      result,
      transition,
      lockPath,
    };
  } finally {
    await releaseLock(selection.agentId);
  }
}

async function runOnce(options) {
  await ensureRuntimeDirs();
  const issues = listIssues(options.statuses);
  const agents = listAgents();
  const agentsById = Object.fromEntries(
    agents.map((agent) => [agent.id, { id: agent.id, name: agent.name, adapter: agent.adapterType || agent.adapter || "" }]),
  );
  const activeLocks = new Set((await listActiveLocks()).map((lock) => lock.key));
  const selection = selectRunnableIssues({
    issues,
    agentsById,
    activeLocks,
  });

  if (selection.runnable.length === 0) {
    const payload = {
      ok: true,
      mode: options.execute ? "execute" : "dry-run",
      statuses: options.statuses,
      runnable: [],
      skipped: selection.skipped,
    };
    console.log(options.json ? JSON.stringify(payload, null, 2) : "No runnable local tasks found.");
    return;
  }

  const result = await executeOne(selection.runnable[0], options);
  console.log(options.json ? JSON.stringify(result, null, 2) : `${result.selection.identifier}: ${result.mode}`);
}

async function daemonTick(options) {
  return runOnce(options);
}

async function stop(options) {
  await ensureRuntimeDirs();
  const locks = await listActiveLocks();
  const target = options.agentId || options.issue || "";
  const lockDetails = await Promise.all(
    locks.map(async (lock) => {
      try {
        const payload = JSON.parse(await fs.readFile(lock.path, "utf8"));
        return { lock, payload };
      } catch {
        return { lock, payload: { agentId: lock.key } };
      }
    }),
  );
  const matched = lockDetails
    .filter((item) => lockMatchesTarget(item.payload, target))
    .map((item) => item.lock);
  for (const lock of matched) {
    await fs.rm(lock.path, { force: true });
  }
  if (options.json) {
    console.log(JSON.stringify({ ok: true, removed: matched }, null, 2));
    return;
  }
  console.log(matched.length === 0 ? "No matching executor locks found." : `Removed ${matched.length} executor lock(s).`);
}

async function resume(options) {
  await ensureRuntimeDirs();
  const payload = {
    ok: true,
    note: "resume currently means clearing locks and allowing the next daemon tick to pick the task again",
    agentId: options.agentId ?? null,
    issue: options.issue ?? null,
  };
  console.log(options.json ? JSON.stringify(payload, null, 2) : payload.note);
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  switch (options.command) {
    case "doctor":
      await doctor(options);
      return;
    case "poll-once":
      await pollOnce(options);
      return;
    case "run-once":
      await runOnce(options);
      return;
    case "daemon-tick":
      await daemonTick(options);
      return;
    case "list-active":
      await listActive(options);
      return;
    case "stop":
      await stop(options);
      return;
    case "resume":
      await resume(options);
      return;
    case "--help":
    case "-h":
    case undefined:
      usage();
      return;
    default:
      fail(`unknown command: ${options.command}`);
  }
}

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMainModule) {
  await main();
}

export const __testables = {
  isLocalExecutorIssue,
  isAutomationSummaryIssue,
  isCommitSummaryIssue,
  isEligibleExecutorIssue,
  parseExportLines,
  buildAdapterCommand,
  hasRunnableCheckoutContext,
  resolveCheckoutPlan,
  resolveAdapter,
  selectRunnableIssues,
  buildStatusTransition,
  resolveAdapterRuntime,
  lockMatchesTarget,
  pickPreferredLocalWorkspace,
};
