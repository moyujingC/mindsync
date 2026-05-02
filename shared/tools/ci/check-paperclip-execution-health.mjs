#!/usr/bin/env node

import process from "node:process";
import { pathToFileURL } from "node:url";

import {
  PaperclipApi,
  getGitStatusLines,
  getOption,
  isoNow,
  logError,
  logInfo,
  parseArgs,
  truthy,
} from "./common.mjs";

const AUTOMATION_ROUTE_SOURCES = new Set([
  "lint-failure",
  "format-failure",
  "coverage-failure",
  "ci-test-failure",
  "build-failure",
  "deploy-or-smoke-failure",
  "infra-runner-failure",
]);
const OBSERVED_ACTIVE_STATUSES = new Set(["in_progress", "in_review", "blocked", "done"]);
const STRICT_BLOCKING_STATUSES = new Set(["in_progress", "in_review", "blocked"]);
const OBSERVE_ONLY_CHECKOUTS = new Set([
  "/opt/automation/app/mindsync",
  "/opt/automation/app/mindsync-heartbeat",
]);

function minutesSince(isoTimestamp) {
  return (Date.now() - new Date(isoTimestamp).getTime()) / (1000 * 60);
}

function hasExecutionWorkspaceBinding(issue) {
  return Boolean(issue.executionWorkspaceId || issue.currentExecutionWorkspace?.id);
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

function resolveExecutionRoute(metadata) {
  const explicit = String(metadata.execution_route ?? "").trim();
  if (explicit) {
    return explicit;
  }
  const source = String(metadata.source ?? "").trim();
  return AUTOMATION_ROUTE_SOURCES.has(source) ? "server_automation" : "local_manual_review";
}

function getWorkspaceBinding(issue, workspaceById) {
  if (issue.currentExecutionWorkspace?.id) {
    return issue.currentExecutionWorkspace;
  }
  if (issue.executionWorkspaceId) {
    return workspaceById.get(issue.executionWorkspaceId) ?? null;
  }
  return null;
}

function normalizePath(value) {
  return String(value ?? "").replace(/\/+$/, "");
}

function workspaceUsesExpectedRoot(workspace, expectedRoot) {
  const prefix = `${normalizePath(expectedRoot)}/`;
  return [workspace?.cwd, workspace?.providerRef, workspace?.worktreePath].some((value) =>
    normalizePath(value).startsWith(prefix),
  );
}

function workspaceUsesObserveOnlyCheckout(workspace) {
  return [workspace?.cwd, workspace?.providerRef, workspace?.worktreePath].some((value) => {
    const normalized = normalizePath(value);
    for (const observeOnlyRoot of OBSERVE_ONLY_CHECKOUTS) {
      const root = normalizePath(observeOnlyRoot);
      if (normalized === root || normalized.startsWith(`${root}/`)) {
        return true;
      }
    }
    return false;
  });
}

function classifyExecutionWorkspaceDrift(issue) {
  const metadata = parseIssueMetadata(issue.description);
  return {
    issueId: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    status: issue.status,
    reason: "execution_workspace_policy_not_materialized",
    taskClass: metadata.task_class ?? null,
    executionRoute: resolveExecutionRoute(metadata),
    executionWorkspaceId: issue.executionWorkspaceId ?? null,
    currentExecutionWorkspaceId: issue.currentExecutionWorkspace?.id ?? null,
    checkoutRunId: issue.checkoutRunId ?? null,
    startedAt: issue.startedAt ?? null,
    completedAt: issue.completedAt ?? null,
    updatedAt: issue.updatedAt ?? null,
  };
}

function issueLooksActiveWithoutWorkspace(issue, executionRoute) {
  if (hasExecutionWorkspaceBinding(issue)) {
    return false;
  }

  if (!issue.assigneeAgentId) {
    return false;
  }

  if (executionRoute !== "server_automation") {
    return false;
  }

  if (!OBSERVED_ACTIVE_STATUSES.has(issue.status)) {
    return false;
  }

  return Boolean(issue.checkoutRunId || issue.startedAt || issue.completedAt || issue.updatedAt);
}

function splitWorkspaceDriftIssues(issues) {
  const activeBlockingIssues = [];
  const historicalDoneIssues = [];

  for (const issue of issues) {
    if (issue.status === "done") {
      historicalDoneIssues.push(issue);
      continue;
    }
    if (STRICT_BLOCKING_STATUSES.has(issue.status)) {
      activeBlockingIssues.push(issue);
    }
  }

  return {
    activeBlockingIssues,
    historicalDoneIssues,
  };
}

function classifyServerWritableExecutionRejected(issue, metadata, workspace) {
  return {
    issueId: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    status: issue.status,
    reason: "server_writable_execution_not_allowed",
    taskClass: metadata.task_class ?? "manual-review-required",
    executionRoute: resolveExecutionRoute(metadata),
    source: metadata.source ?? null,
    executionWorkspaceId: issue.executionWorkspaceId ?? issue.currentExecutionWorkspace?.id ?? null,
    workspaceCwd: workspace?.cwd ?? null,
    workspaceProviderRef: workspace?.providerRef ?? null,
    workspacePath: workspace?.worktreePath ?? null,
  };
}

function classifyLocalExecutionRoutingIssue(issue, metadata, workspace) {
  return classifyServerWritableExecutionRejected(issue, metadata, workspace);
}

function classifyObserveOnlyCheckoutIssue(issue, metadata, workspace) {
  return {
    issueId: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    status: issue.status,
    reason: "execution_workspace_policy_not_materialized",
    taskClass: metadata.task_class ?? null,
    executionRoute: resolveExecutionRoute(metadata),
    executionWorkspaceId: issue.executionWorkspaceId ?? issue.currentExecutionWorkspace?.id ?? null,
    workspaceCwd: workspace?.cwd ?? null,
    workspaceProviderRef: workspace?.providerRef ?? null,
    workspacePath: workspace?.worktreePath ?? null,
  };
}

async function classifyDirtyDoneWorkspaceIssues(issues, workspaceById, expectedRoot) {
  const results = [];

  for (const issue of issues ?? []) {
    if (issue.status !== "done") {
      continue;
    }
    const metadata = parseIssueMetadata(issue.description);
    if (resolveExecutionRoute(metadata) !== "server_automation") {
      continue;
    }
    const workspace = getWorkspaceBinding(issue, workspaceById);
    if (!workspace || !workspaceUsesExpectedRoot(workspace, expectedRoot)) {
      continue;
    }
    const cwd = workspace.cwd ?? workspace.providerRef ?? workspace.worktreePath ?? null;
    if (!cwd) {
      continue;
    }
    let statusLines = [];
    try {
      statusLines = await getGitStatusLines(cwd);
    } catch {
      continue;
    }
    if (statusLines.length === 0) {
      continue;
    }
    results.push({
      issueId: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      status: issue.status,
      reason: "done_issue_worktree_dirty",
      taskClass: metadata.task_class ?? null,
      executionRoute: resolveExecutionRoute(metadata),
      executionWorkspaceId: issue.executionWorkspaceId ?? issue.currentExecutionWorkspace?.id ?? null,
      workspaceCwd: workspace?.cwd ?? null,
      workspaceProviderRef: workspace?.providerRef ?? null,
      workspacePath: workspace?.worktreePath ?? null,
      gitStatus: statusLines,
    });
  }

  return results;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || options.h) {
    console.log(`Usage:
  node shared/tools/ci/check-paperclip-execution-health.mjs --company-id <id> --project-name <name> [--stale-minutes 15] [--apply] [--strict] [--expected-root /opt/automation/worktrees]
`);
    return;
  }

  const apiBase = getOption(options, "api-base", process.env.PAPERCLIP_API_BASE ?? "http://127.0.0.1:3100");
  const apiKey = getOption(options, "api-key", process.env.PAPERCLIP_API_KEY ?? null);
  const companyId = getOption(options, "company-id", process.env.PAPERCLIP_COMPANY_ID ?? null);
  const projectName = getOption(options, "project-name", process.env.PAPERCLIP_PROJECT_NAME ?? "一镜一梳");
  const staleMinutes = Number(getOption(options, "stale-minutes", process.env.PAPERCLIP_EXECUTION_STALE_MINUTES ?? "15"));
  const expectedRoot = getOption(
    options,
    "expected-root",
    process.env.PAPERCLIP_SERVER_WRITABLE_ALLOWED_ROOT ?? process.env.PAPERCLIP_EXECUTION_WORKTREE_ROOT ?? "/opt/automation/worktrees",
  );
  const apply = truthy(getOption(options, "apply", "0"));
  const strict = truthy(getOption(options, "strict", process.env.PAPERCLIP_EXECUTION_HEALTH_STRICT ?? "0"));

  if (!companyId) {
    throw new Error("company id is required");
  }

  const api = new PaperclipApi({ apiBase, apiKey, companyId });
  const projects = await api.get(`/api/companies/${companyId}/projects`);
  const project = (projects ?? []).find((item) => item.name === projectName);
  if (!project) {
    throw new Error(`Unable to resolve project: ${projectName}`);
  }

  const issues = await api.get(`/api/companies/${companyId}/issues?projectId=${encodeURIComponent(project.id)}`);
  const executionWorkspaces = await api.get(
    `/api/companies/${companyId}/execution-workspaces?projectId=${encodeURIComponent(project.id)}`,
  );
  const workspaceById = new Map((executionWorkspaces ?? []).map((workspace) => [workspace.id, workspace]));
  const candidates = (issues ?? []).filter((issue) => {
    if (!issue.activeRun || issue.activeRun.status !== "running") {
      return false;
    }
    const lastActivity = issue.lastActivityAt ?? issue.updatedAt ?? issue.activeRun.startedAt;
    return minutesSince(lastActivity) >= staleMinutes;
  });

  const staleIssues = [];
  for (const issue of candidates) {
    const comments = await api.get(`/api/issues/${issue.id}/comments`);
    const latestCommentAt = comments?.[comments.length - 1]?.createdAt ?? null;
    const minutesWithoutComment = issue.activeRun?.startedAt ? minutesSince(issue.activeRun.startedAt) : null;
    const noProgressComment =
      !latestCommentAt || (issue.activeRun?.startedAt && new Date(latestCommentAt).getTime() < new Date(issue.activeRun.startedAt).getTime());

    if (!noProgressComment) {
      continue;
    }

    staleIssues.push({
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      lastActivityAt: issue.lastActivityAt ?? issue.updatedAt ?? null,
      activeRunId: issue.activeRun?.id ?? null,
      activeRunStartedAt: issue.activeRun?.startedAt ?? null,
      minutesWithoutComment,
    });

    if (!apply) {
      continue;
    }

    await api.patch(`/api/issues/${issue.id}`, {
      status: "blocked",
      comment: [
        `执行健康巡检时间：${isoNow()}`,
        "- 当前判断：执行卡住 / 缺少运行中回写",
        "- blocked reason: human_action_required",
        `- active run: ${issue.activeRun?.id ?? "unknown"}`,
        `- started at: ${issue.activeRun?.startedAt ?? "unknown"}`,
        `- stale threshold: ${staleMinutes} min`,
        "",
        "已做动作：",
        "- 巡检到 issue 仍显示 running，但在阈值内没有新的进度评论或状态回写，先转为 blocked 以避免面板误导。",
        "",
        "下一步动作：",
        "- 检查对应 agent run 日志、当前工作区状态和实际执行卡点；若仍需继续执行，再由 owner 重新接手并补第一条进度评论。",
        "",
        "谁来解除阻塞：",
        "- 当前任务 owner / 具备运行日志访问权限的运维执行方",
      ].join("\n"),
    });
  }

  const workspaceDriftIssues =
    project.executionWorkspacePolicy?.enabled === true
      ? (issues ?? [])
          .filter((issue) => {
            const metadata = parseIssueMetadata(issue.description);
            return issueLooksActiveWithoutWorkspace(issue, resolveExecutionRoute(metadata));
          })
          .map(classifyExecutionWorkspaceDrift)
      : [];

  const observeOnlyCheckoutIssues = (issues ?? [])
    .filter((issue) => {
      const metadata = parseIssueMetadata(issue.description);
      if (resolveExecutionRoute(metadata) !== "server_automation") {
        return false;
      }
      if (!STRICT_BLOCKING_STATUSES.has(issue.status)) {
        return false;
      }
      const workspace = getWorkspaceBinding(issue, workspaceById);
      return Boolean(workspace) && workspaceUsesObserveOnlyCheckout(workspace);
    })
    .map((issue) => {
      const metadata = parseIssueMetadata(issue.description);
      const workspace = getWorkspaceBinding(issue, workspaceById);
      return classifyObserveOnlyCheckoutIssue(issue, metadata, workspace);
    });

  const serverWritableExecutionRejectedIssues = (issues ?? [])
    .filter((issue) => {
      const metadata = parseIssueMetadata(issue.description);
      if (resolveExecutionRoute(metadata) === "server_automation") {
        return false;
      }
      if (!STRICT_BLOCKING_STATUSES.has(issue.status)) {
        return false;
      }
      const workspace = getWorkspaceBinding(issue, workspaceById);
      return Boolean(workspace) && workspaceUsesExpectedRoot(workspace, expectedRoot);
    })
    .map((issue) => {
      const metadata = parseIssueMetadata(issue.description);
      const workspace = getWorkspaceBinding(issue, workspaceById);
      return classifyServerWritableExecutionRejected(issue, metadata, workspace);
    });

  const doneDirtyWorkspaceIssues = await classifyDirtyDoneWorkspaceIssues(issues, workspaceById, expectedRoot);

  const staleRunningIssues = staleIssues.map((issue) => ({
    ...issue,
    reason: "stale_running_issue",
  }));
  const {
    activeBlockingIssues: activeWorkspaceDriftIssues,
    historicalDoneIssues: historicalDoneWorkspaceDriftIssues,
  } = splitWorkspaceDriftIssues(workspaceDriftIssues);

  const summary = {
    checkedAt: isoNow(),
    strict,
    expectedRoot,
    counts: {
      staleRunning: staleRunningIssues.length,
      serverAutomationBlocking: activeWorkspaceDriftIssues.length + observeOnlyCheckoutIssues.length,
      historicalDoneWorkspaceDrift: historicalDoneWorkspaceDriftIssues.length,
      localExecutionRouting: serverWritableExecutionRejectedIssues.length,
      doneDirtyWorkspace: doneDirtyWorkspaceIssues.length,
    },
    staleRunningIssues,
    serverAutomationBlockingIssues: [...activeWorkspaceDriftIssues, ...observeOnlyCheckoutIssues],
    historicalDoneWorkspaceDriftIssues,
    localExecutionRoutingIssues: serverWritableExecutionRejectedIssues,
    doneDirtyWorkspaceIssues: doneDirtyWorkspaceIssues,
  };

  const strictShouldFail =
    activeWorkspaceDriftIssues.length > 0
    || observeOnlyCheckoutIssues.length > 0
    || serverWritableExecutionRejectedIssues.length > 0
    || doneDirtyWorkspaceIssues.length > 0;

  if (staleIssues.length === 0) {
    if (!strictShouldFail && historicalDoneWorkspaceDriftIssues.length === 0) {
      logInfo("No stale running issues detected");
      return;
    }

    logInfo(
      `Detected ${activeWorkspaceDriftIssues.length + observeOnlyCheckoutIssues.length} server automation blocking issue(s), ${historicalDoneWorkspaceDriftIssues.length} historical done workspace drift issue(s), ${serverWritableExecutionRejectedIssues.length} local execution routing issue(s), and ${doneDirtyWorkspaceIssues.length} done-but-dirty worktree issue(s)`,
    );
    console.log(JSON.stringify(summary, null, 2));
    if (strict && strictShouldFail) {
      process.exitCode = 2;
    }
    return;
  }

  logInfo(`Detected ${staleIssues.length} stale running issue(s)`);
  console.log(JSON.stringify(summary, null, 2));
  if (strict && strictShouldFail) {
    process.exitCode = 2;
  }
}

export const __testables = {
  hasExecutionWorkspaceBinding,
  parseIssueMetadata,
  resolveExecutionRoute,
  issueLooksActiveWithoutWorkspace,
  splitWorkspaceDriftIssues,
  workspaceUsesExpectedRoot,
  classifyExecutionWorkspaceDrift,
  classifyLocalExecutionRoutingIssue,
  classifyObserveOnlyCheckoutIssue,
  classifyDirtyDoneWorkspaceIssues,
  OBSERVED_ACTIVE_STATUSES,
  STRICT_BLOCKING_STATUSES,
  OBSERVE_ONLY_CHECKOUTS,
  workspaceUsesObserveOnlyCheckout,
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    logError(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exit(1);
  });
}
