#!/usr/bin/env node

import process from "node:process";
import { pathToFileURL } from "node:url";

import {
  PaperclipApi,
  collectGitBaseline,
  getChangedFiles,
  getGitStatusLines,
  getOption,
  logError,
  logInfo,
  parseArgs,
  requireOption,
  runShellCommand,
  summarizeExecutionBaseline,
  truncateText,
} from "./common.mjs";

const SERVER_AUTOMATION_ALLOWLIST = [
  "shared/tools/ci/",
  ".github/workflows/",
  "projects/aimandala/deploy/",
  "projects/aimandala/docs/qa/",
  "projects/aimandala/docs/delivery/",
];

const SERVER_AUTOMATION_DENYLIST = [
  "projects/aimandala/toC/app/backend/data/uploads/",
  "projects/aimandala/toC/app/backend/data/interpretations/",
  "coverage/",
  "projects/aimandala/toC/app/frontend/coverage/",
];

function normalizePath(value) {
  return String(value ?? "").trim().replace(/\/+$/, "");
}

function parseIssueMetadata(description) {
  const metadata = {};
  for (const rawLine of String(description ?? "").split(/\r?\n/)) {
    const match = rawLine.match(/^([a-z_]+):\s*(.+)$/);
    if (!match) {
      continue;
    }
    metadata[match[1]] = match[2].trim();
  }
  return metadata;
}

function changedFilesStayWithinAllowlist(files, allowlist = SERVER_AUTOMATION_ALLOWLIST) {
  return files.every((file) => allowlist.some((prefix) => file.startsWith(prefix)));
}

function changedFilesTouchDenylist(files, denylist = SERVER_AUTOMATION_DENYLIST) {
  return files.filter((file) => denylist.some((prefix) => file.startsWith(prefix)));
}

function buildBlockedComment({ issue, cwd, statusLines, baseline, reason }) {
  return [
    `执行收尾时间：${new Date().toISOString()}`,
    "- 当前判断：服务器侧任务已运行，但 Git 尚未形成可安全自动闭环的提交。",
    `- blocked reason: ${reason}`,
    `- worktree: ${cwd}`,
    "",
    "git status --short：",
    "```text",
    statusLines.join("\n") || "(clean)",
    "```",
    "",
    "执行基线：",
    "```json",
    JSON.stringify(baseline, null, 2),
    "```",
    "",
    "已做动作：",
    "- 拒绝把当前 issue 继续标记为 done。",
    "- 保留现场，等待人工确认是否提交、拆分或丢弃改动。",
    "",
    "下一步动作：",
    "- 由 Engineer / 运维执行方检查当前 worktree 改动边界。",
    "- 若属于允许自动提交范围，调整白名单后重新收尾。",
    "- 若属于普通研发或超出白名单改动，转人工 review 后再提交。",
    "",
    `任务：${issue.identifier} ${issue.title}`,
  ].join("\n");
}

function buildReviewComment({ issue, cwd, changedFiles, baseline, commitMessage }) {
  return [
    `执行收尾时间：${new Date().toISOString()}`,
    "- 当前判断：服务器侧任务已完成 Git 收尾，可进入审阅。",
    `- worktree: ${cwd}`,
    `- commit message: ${commitMessage}`,
    "",
    "变更文件：",
    "```text",
    changedFiles.join("\n") || "(none)",
    "```",
    "",
    "执行基线：",
    "```json",
    JSON.stringify(baseline, null, 2),
    "```",
    "",
    "已做动作：",
    "- 已在隔离 worktree 完成 git add + git commit。",
    "- 当前任务不再允许保持 done but dirty。",
    "",
    `任务：${issue.identifier} ${issue.title}`,
  ].join("\n");
}

async function patchIssue(api, issueId, payload) {
  return api.patch(`/api/issues/${issueId}`, payload);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || options.h) {
    console.log(`Usage:
  node shared/tools/ci/server-automation-finalizer.mjs --issue-id <id> --cwd <path> --company-id <id> [--project-name 一镜一梳] [--commit-message "..."]
`);
    return;
  }

  const issueId = requireOption(options, "issue-id");
  const cwd = requireOption(options, "cwd");
  const apiBase = getOption(options, "api-base", process.env.PAPERCLIP_API_BASE ?? "http://127.0.0.1:3100");
  const apiKey = getOption(options, "api-key", process.env.PAPERCLIP_API_KEY ?? null);
  const companyId = requireOption(options, "company-id");
  const commitMessage = getOption(options, "commit-message", `chore(automation): finalize ${issueId}`);
  const actorName = getOption(options, "git-user-name", process.env.PAPERCLIP_AUTOMATION_GIT_USER_NAME ?? "Paperclip Automation");
  const actorEmail = getOption(
    options,
    "git-user-email",
    process.env.PAPERCLIP_AUTOMATION_GIT_USER_EMAIL ?? "paperclip-automation@local",
  );

  const api = new PaperclipApi({ apiBase, apiKey, companyId });
  const issue = await api.get(`/api/issues/${issueId}`);
  const metadata = parseIssueMetadata(issue.description);
  const taskClass = String(metadata.task_class ?? "").trim();
  const executionRoute = String(metadata.execution_route ?? "").trim();

  if (taskClass !== "automation-execution" || executionRoute !== "server_automation") {
    throw new Error(`Refuse to finalize non-server-automation issue: ${issue.identifier}`);
  }

  const statusLines = await getGitStatusLines(cwd);
  const changedFiles = await getChangedFiles(cwd);
  const baseline = summarizeExecutionBaseline(await collectGitBaseline(cwd), {
    expectedBranch: null,
    expectedSha: null,
  });

  if (statusLines.length === 0) {
    await patchIssue(api, issue.id, {
      status: "done",
      comment: [
        `执行收尾时间：${new Date().toISOString()}`,
        "- 当前判断：隔离 worktree 已干净，无需额外提交。",
        `- worktree: ${cwd}`,
        "",
        "已做动作：",
        "- 保持 issue 为 done。",
        "- 当前收尾器确认不存在 done but dirty。",
      ].join("\n"),
    });
    logInfo(`Finalized clean server automation issue: ${issue.identifier}`);
    return;
  }

  const deniedFiles = changedFilesTouchDenylist(changedFiles);
  if (deniedFiles.length > 0 || !changedFilesStayWithinAllowlist(changedFiles)) {
    const blockedReason = deniedFiles.length > 0 ? "workspace_drift" : "human_action_required";
    await patchIssue(api, issue.id, {
      status: "blocked",
      comment: buildBlockedComment({
        issue,
        cwd,
        statusLines,
        baseline,
        reason: blockedReason,
      }),
    });
    logInfo(`Blocked server automation issue due to non-whitelisted diff: ${issue.identifier}`);
    return;
  }

  await runShellCommand(`git config user.name ${JSON.stringify(actorName)}`, { cwd });
  await runShellCommand(`git config user.email ${JSON.stringify(actorEmail)}`, { cwd });
  await runShellCommand("git add .", { cwd });
  const commit = await runShellCommand(`git commit -m ${JSON.stringify(commitMessage)}`, { cwd });
  if (commit.code !== 0) {
    await patchIssue(api, issue.id, {
      status: "blocked",
      comment: buildBlockedComment({
        issue,
        cwd,
        statusLines,
        baseline,
        reason: "human_action_required",
      }),
    });
    throw new Error(`Failed to create finalizer commit: ${truncateText(commit.stderr || commit.stdout, 1200)}`);
  }

  await patchIssue(api, issue.id, {
    status: "in_review",
    comment: buildReviewComment({
      issue,
      cwd,
      changedFiles,
      baseline: summarizeExecutionBaseline(await collectGitBaseline(cwd), {
        expectedBranch: null,
        expectedSha: null,
      }),
      commitMessage,
    }),
  });
  logInfo(`Committed and moved server automation issue to in_review: ${issue.identifier}`);
}

export const __testables = {
  SERVER_AUTOMATION_ALLOWLIST,
  SERVER_AUTOMATION_DENYLIST,
  changedFilesStayWithinAllowlist,
  changedFilesTouchDenylist,
  parseIssueMetadata,
  normalizePath,
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    logError(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exit(1);
  });
}
