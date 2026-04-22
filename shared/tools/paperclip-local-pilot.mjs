#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const DEFAULT_STATUSES = "todo,in_progress,blocked,in_review";
const REQUIRED_ENV = [
  "PAPERCLIP_API_URL",
  "PAPERCLIP_COMPANY_ID",
  "PAPERCLIP_AGENT_ID",
  "PAPERCLIP_API_KEY",
];

function usage() {
  console.log(`Usage:
  node shared/tools/paperclip-local-pilot.mjs doctor [--json]
  node shared/tools/paperclip-local-pilot.mjs candidates [--json] [--statuses <csv>]
  node shared/tools/paperclip-local-pilot.mjs render-comment --kind <claim|progress|complete|blocked> [options]
  node shared/tools/paperclip-local-pilot.mjs claim <issueIdOrIdentifier> [options] [--execute]
  node shared/tools/paperclip-local-pilot.mjs update <issueIdOrIdentifier> --status <in_progress|in_review|done|blocked> [options] [--execute]

Options:
  --cwd <path>             Override local working directory
  --branch <name>          Override local git branch
  --sha <sha>              Override local git sha
  --host <host>            Override host label (default: mac:<hostname>)
  --judgment <text>        Current judgment (当前判断)
  --actions <text>         Actions taken (已做动作)
  --next <text>            Next step (下一步动作)
  --verification <text>    Verification result (验证结论)
  --json                   Print JSON output
  --execute                Actually mutate the remote issue; without this flag commands are dry-run

Notes:
  - This helper only targets local_manual_review pilot work on your Mac.
  - automation-summary / commit-summary parent tasks are rejected by default.
  - Load env first:
      eval "$(${path.resolve("shared/tools/paperclip-local-env.sh")} engineer)"
`);
}

function fail(message, code = 1) {
  console.error(`paperclip-local-pilot: ${message}`);
  process.exit(code);
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {
    command,
    args: [],
    execute: false,
    json: false,
    statuses: DEFAULT_STATUSES,
  };

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (arg === "--execute") {
      options.execute = true;
      continue;
    }
    if (arg === "--json") {
      options.json = true;
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

function requireEnv(keys = REQUIRED_ENV) {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    const needsAgentIdentity = missing.includes("PAPERCLIP_AGENT_ID") || missing.includes("PAPERCLIP_API_KEY");
    const hint = needsAgentIdentity
      ? 'load a local agent identity first, for example: eval "$(shared/tools/paperclip-local-env.sh engineer)"'
      : 'load base Paperclip env first, for example: eval "$(shared/tools/paperclip-local-env.sh --base)"';
    fail(`missing required env: ${missing.join(", ")}; ${hint}`);
  }
}

function runPaperclip(args) {
  return execFileSync(
    "paperclipai",
    args,
    {
      encoding: "utf8",
      env: {
        ...process.env,
      },
    },
  );
}

function paperclipJson(args) {
  return JSON.parse(runPaperclip(args));
}

function getEnvApiArgs() {
  return [
    "--api-base",
    process.env.PAPERCLIP_API_URL,
    "--api-key",
    process.env.PAPERCLIP_API_KEY,
  ];
}

function containsLine(description, expected) {
  return typeof description === "string" && description.includes(expected);
}

function isLocalManualReviewIssue(issue) {
  const description = issue?.description ?? "";
  return (
    containsLine(description, "task_class: manual-review-required") &&
    containsLine(description, "execution_route: local_manual_review")
  );
}

function isAutomationSummaryIssue(issue) {
  return containsLine(issue?.description ?? "", "source: automation-summary");
}

function isEligibleLocalPilotIssue(issue) {
  return isLocalManualReviewIssue(issue) && !isAutomationSummaryIssue(issue);
}

function summarizeIssue(issue) {
  return {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    status: issue.status,
    assigneeAgentId: issue.assigneeAgentId,
    executionWorkspaceId: issue.executionWorkspaceId,
  };
}

function resolveGitContext(options = {}) {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const branch = options.branch || execFileSync("git", ["branch", "--show-current"], { cwd, encoding: "utf8" }).trim();
  const sha = options.sha || execFileSync("git", ["rev-parse", "HEAD"], { cwd, encoding: "utf8" }).trim();
  const host = options.host || `mac:${os.hostname()}`;

  if (!branch) {
    fail(`cannot resolve git branch from ${cwd}`);
  }
  if (!sha) {
    fail(`cannot resolve git sha from ${cwd}`);
  }

  return { cwd, branch, sha, host };
}

function buildCommentBody({ kind, context, judgment, actions, next, verification }) {
  const lines = [];
  const titleByKind = {
    claim: "本地 Mac 执行节点接手",
    progress: "本地 Mac 执行进展",
    complete: "本地 Mac 执行完成",
    blocked: "本地 Mac 执行受阻",
  };

  lines.push(`## ${titleByKind[kind] ?? "本地 Mac 执行更新"}`);
  lines.push("");
  lines.push("- host: " + context.host);
  lines.push("- cwd: " + context.cwd);
  lines.push("- branch: " + context.branch);
  lines.push("- sha: " + context.sha);

  if (judgment) {
    lines.push("");
    lines.push("当前判断：");
    lines.push(judgment);
  }

  if (actions) {
    lines.push("");
    lines.push("已做动作：");
    lines.push(actions);
  }

  if (next) {
    lines.push("");
    lines.push("下一步动作：");
    lines.push(next);
  }

  if (verification) {
    lines.push("");
    lines.push("验证结论：");
    lines.push(verification);
  }

  return lines.join("\n").trim();
}

async function doctor({ json }) {
  requireEnv();
  const response = await fetch(`${process.env.PAPERCLIP_API_URL}/api/agents/me`, {
    headers: {
      Authorization: `Bearer ${process.env.PAPERCLIP_API_KEY}`,
    },
  });

  if (!response.ok) {
    fail(`doctor failed: ${response.status} ${response.statusText}`);
  }

  const agent = await response.json();
  const payload = {
    ok: true,
    apiUrl: process.env.PAPERCLIP_API_URL,
    companyId: process.env.PAPERCLIP_COMPANY_ID,
    expectedAgentId: process.env.PAPERCLIP_AGENT_ID,
    actualAgentId: agent.id,
    agentName: agent.name,
    host: `mac:${os.hostname()}`,
  };

  if (agent.id !== process.env.PAPERCLIP_AGENT_ID) {
    fail(`agent mismatch: expected ${process.env.PAPERCLIP_AGENT_ID}, got ${agent.id}`);
  }

  if (json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(`ok: ${payload.ok}`);
  console.log(`apiUrl: ${payload.apiUrl}`);
  console.log(`companyId: ${payload.companyId}`);
  console.log(`agentId: ${payload.actualAgentId}`);
  console.log(`agentName: ${payload.agentName}`);
  console.log(`host: ${payload.host}`);
}

function candidates({ statuses, json }) {
  requireEnv();
  const issues = paperclipJson([
    "issue",
    "list",
    "-C",
    process.env.PAPERCLIP_COMPANY_ID,
    "--status",
    statuses,
    ...getEnvApiArgs(),
    "--json",
  ]);

  const filtered = issues
    .filter(isEligibleLocalPilotIssue)
    .map((issue) => ({
      ...summarizeIssue(issue),
      startedAt: issue.startedAt,
      updatedAt: issue.updatedAt,
    }));

  if (json) {
    console.log(JSON.stringify(filtered, null, 2));
    return;
  }

  if (filtered.length === 0) {
    console.log("No eligible local pilot issues found.");
    return;
  }

  for (const issue of filtered) {
    console.log(
      [
        issue.identifier,
        issue.status,
        issue.title,
        issue.executionWorkspaceId ? "has_server_workspace=true" : "has_server_workspace=false",
      ].join("\t"),
    );
  }
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

function ensureEligibleIssue(issue) {
  if (!isLocalManualReviewIssue(issue)) {
    fail(`${issue.identifier} is not manual-review-required + local_manual_review`);
  }
  if (isAutomationSummaryIssue(issue)) {
    fail(`${issue.identifier} is an automation-summary parent task and must not be claimed by the local pilot`);
  }
}

function renderComment(options) {
  const kind = options.kind;
  if (!kind) {
    fail("render-comment requires --kind");
  }
  const context = resolveGitContext(options);
  const body = buildCommentBody({
    kind,
    context,
    judgment: options.judgment,
    actions: options.actions,
    next: options.next,
    verification: options.verification,
  });
  console.log(body);
}

function claim(selector, options) {
  requireEnv();
  const issue = getIssue(selector);
  ensureEligibleIssue(issue);
  const context = resolveGitContext(options);
  const comment = buildCommentBody({
    kind: "claim",
    context,
    judgment: options.judgment ?? "已在本地 Mac 接手，准备进入本地执行闭环。",
    actions: options.actions,
    next: options.next ?? "先完成本地 checkout / 分析 / 修改，再补进展和验证回写。",
    verification: options.verification,
  });

  const plan = {
    mode: options.execute ? "execute" : "dry-run",
    issue: summarizeIssue(issue),
    context,
    comment,
    operations: [
      {
        step: "checkout",
        command: [
          "paperclipai",
          "issue",
          "checkout",
          issue.id,
          "--agent-id",
          process.env.PAPERCLIP_AGENT_ID,
          ...getEnvApiArgs(),
        ],
      },
      {
        step: "update-status-and-comment",
        command: [
          "paperclipai",
          "issue",
          "update",
          issue.id,
          "--status",
          "in_progress",
          "--comment",
          comment,
          ...getEnvApiArgs(),
        ],
      },
    ],
  };

  if (!options.execute) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  runPaperclip([
    "issue",
    "checkout",
    issue.id,
    "--agent-id",
    process.env.PAPERCLIP_AGENT_ID,
    ...getEnvApiArgs(),
  ]);

  runPaperclip([
    "issue",
    "update",
    issue.id,
    "--status",
    "in_progress",
    "--comment",
    comment,
    ...getEnvApiArgs(),
  ]);

  console.log(JSON.stringify({ ok: true, issue: summarizeIssue(issue), context }, null, 2));
}

function updateIssue(selector, options) {
  requireEnv();
  const status = options.status;
  if (!status) {
    fail("update requires --status");
  }
  const allowed = new Set(["in_progress", "in_review", "done", "blocked"]);
  if (!allowed.has(status)) {
    fail(`unsupported status: ${status}`);
  }

  const issue = getIssue(selector);
  ensureEligibleIssue(issue);
  const context = resolveGitContext(options);
  const kindByStatus = {
    in_progress: "progress",
    in_review: "complete",
    done: "complete",
    blocked: "blocked",
  };
  const comment = buildCommentBody({
    kind: kindByStatus[status],
    context,
    judgment: options.judgment ?? "",
    actions: options.actions ?? "",
    next: options.next ?? "",
    verification: options.verification ?? "",
  });

  const plan = {
    mode: options.execute ? "execute" : "dry-run",
    issue: summarizeIssue(issue),
    context,
    targetStatus: status,
    comment,
    command: [
      "paperclipai",
      "issue",
      "update",
      issue.id,
      "--status",
      status,
      "--comment",
      comment,
      ...getEnvApiArgs(),
    ],
  };

  if (!options.execute) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  runPaperclip([
    "issue",
    "update",
    issue.id,
    "--status",
    status,
    "--comment",
    comment,
    ...getEnvApiArgs(),
  ]);
  console.log(JSON.stringify({ ok: true, issue: summarizeIssue(issue), targetStatus: status }, null, 2));
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  switch (options.command) {
    case "doctor":
      await doctor(options);
      return;
    case "candidates":
      candidates(options);
      return;
    case "render-comment":
      renderComment(options);
      return;
    case "claim":
      if (!options.args[0]) fail("claim requires <issueIdOrIdentifier>");
      claim(options.args[0], options);
      return;
    case "update":
      if (!options.args[0]) fail("update requires <issueIdOrIdentifier>");
      updateIssue(options.args[0], options);
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

const isMainModule = (() => {
  const entry = process.argv[1];
  if (!entry) return false;
  return path.resolve(entry) === fileURLToPath(import.meta.url);
})();

if (isMainModule) {
  await main();
}

export const __testables = {
  isLocalManualReviewIssue,
  isAutomationSummaryIssue,
  isEligibleLocalPilotIssue,
  buildCommentBody,
};
