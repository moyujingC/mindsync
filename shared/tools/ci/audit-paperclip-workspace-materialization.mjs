#!/usr/bin/env node

import process from "node:process";
import { pathToFileURL } from "node:url";
import {
  PaperclipApi,
  getOption,
  isoNow,
  logError,
  logInfo,
  parseArgs,
  resolveProjectByName,
  runShellCommand,
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
  const activeIssuesMissingWorkspace = [];
  const historicalDoneIssuesMissingWorkspace = [];

  for (const issue of issues) {
    if (issue.status === "done") {
      historicalDoneIssuesMissingWorkspace.push(issue);
      continue;
    }
    if (STRICT_BLOCKING_STATUSES.has(issue.status)) {
      activeIssuesMissingWorkspace.push(issue);
    }
  }

  return {
    activeIssuesMissingWorkspace,
    historicalDoneIssuesMissingWorkspace,
  };
}

function normalizePath(value) {
  return String(value ?? "").replace(/\/+$/, "");
}

async function listHostWorktrees(repoRoot, worktreeRoot) {
  const gitResult = await runShellCommand(`git -C ${JSON.stringify(repoRoot)} worktree list --porcelain`, {
    cwd: repoRoot,
  });
  if (gitResult.code !== 0) {
    throw new Error(`Failed to list git worktrees: ${gitResult.stderr || gitResult.stdout}`);
  }

  const entries = [];
  let current = null;
  for (const line of String(gitResult.stdout).split(/\r?\n/)) {
    if (line.startsWith("worktree ")) {
if (current) entries.push(current);
      current = { path: line.slice("worktree ".length).trim() };
      continue;
    }
    if (!current || !line) continue;
    if (line.startsWith("branch ")) current.branch = line.slice("branch ".length).trim();
    if (line === "bare") current.bare = true;
    if (line === "detached") current.detached = true;
    if (line === "locked") current.locked = true;
    if (line === "prunable") current.prunable = true;
  }
  if (current) entries.push(current);

  const expectedRoot = `${normalizePath(worktreeRoot)}/`;
  return entries.filter((entry) => normalizePath(entry.path).startsWith(expectedRoot));
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

function workspaceUsesExpectedRoot(workspace, expectedRoot) {
  const expectedPrefix = `${normalizePath(expectedRoot)}/`;
  return [workspace?.cwd, workspace?.providerRef, workspace?.worktreePath].some((value) =>
    normalizePath(value ?? "").startsWith(expectedPrefix),
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || options.h) {
    console.log(`Usage:
  node shared/tools/ci/audit-paperclip-workspace-materialization.mjs --company-id <id> --project-name <name> [--api-base <url>] [--api-key <key>] [--expected-root /opt/automation/worktrees] [--repo-root /opt/automation/app/mindsync]
`);
    return;
  }

  const apiBase = getOption(options, "api-base", process.env.PAPERCLIP_API_BASE ?? "http://127.0.0.1:3100");
  const apiKey = getOption(options, "api-key", process.env.PAPERCLIP_API_KEY ?? null);
  const companyId = getOption(options, "company-id", process.env.PAPERCLIP_COMPANY_ID ?? null);
  const projectName = getOption(options, "project-name", process.env.PAPERCLIP_PROJECT_NAME ?? "一镜一梳");
  const expectedRoot = normalizePath(
    getOption(options, "expected-root", process.env.PAPERCLIP_EXECUTION_WORKTREE_ROOT ?? "/opt/automation/worktrees"),
  );
  const repoRoot = getOption(options, "repo-root", process.env.REPO_ROOT ?? "/opt/automation/app/mindsync");

  if (!companyId) {
    throw new Error("company id is required");
  }

  const api = new PaperclipApi({ apiBase, apiKey, companyId });
  const project = await resolveProjectByName(api, companyId, projectName);
  const issues = await api.get(`/api/companies/${companyId}/issues?projectId=${encodeURIComponent(project.id)}`);
  const executionWorkspaces = await api.get(
    `/api/companies/${companyId}/execution-workspaces?projectId=${encodeURIComponent(project.id)}`,
  );
  const workspaceById = new Map((executionWorkspaces ?? []).map((workspace) => [workspace.id, workspace]));

  const observedWorkspaceDriftIssues = (issues ?? [])
    .filter((issue) => {
      const metadata = parseIssueMetadata(issue.description);
      return (
        project.executionWorkspacePolicy?.enabled === true &&
        issueLooksActiveWithoutWorkspace(issue, resolveExecutionRoute(metadata))
      );
    })
    .map((issue) => {
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
    });
  const { activeIssuesMissingWorkspace, historicalDoneIssuesMissingWorkspace } =
    splitWorkspaceDriftIssues(observedWorkspaceDriftIssues);

  const localExecutionRoutingIssues = (issues ?? [])
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
    });

  const executionWorkspacesOutsideExpectedRoot = (executionWorkspaces ?? [])
    .filter((workspace) => {
      const cwd = normalizePath(workspace.cwd ?? "");
      const providerRef = normalizePath(workspace.providerRef ?? "");
      const expectedPrefix = `${expectedRoot}/`;
      return (
        workspace.strategyType === "git_worktree" &&
        !cwd.startsWith(expectedPrefix) &&
        !providerRef.startsWith(expectedPrefix)
      );
    })
    .map((workspace) => ({
      executionWorkspaceId: workspace.id,
      name: workspace.name,
      status: workspace.status,
      strategyType: workspace.strategyType,
      cwd: workspace.cwd ?? null,
      providerRef: workspace.providerRef ?? null,
      sourceIssueId: workspace.sourceIssueId ?? null,
      reason: "execution_workspace_outside_expected_root",
    }));

  const hostWorktrees = await listHostWorktrees(repoRoot, expectedRoot);
  const boundWorkspacePaths = new Set(
    (executionWorkspaces ?? [])
      .flatMap((workspace) => [workspace.cwd, workspace.providerRef])
      .filter(Boolean)
      .map((value) => normalizePath(value)),
  );
  const hostWorktreesWithoutBoundIssue = hostWorktrees
    .filter((entry) => !boundWorkspacePaths.has(normalizePath(entry.path)))
    .map((entry) => ({
      path: entry.path,
      branch: entry.branch ?? null,
      reason: "host_worktree_without_bound_issue",
    }));

  const summary = {
    checkedAt: isoNow(),
    project: {
      id: project.id,
      name: project.name,
      executionWorkspacePolicy: project.executionWorkspacePolicy ?? null,
    },
    expectedRoot,
    repoRoot,
    serverAutomationBlockingIssues: activeIssuesMissingWorkspace,
    historicalDoneIssuesMissingWorkspace,
    localExecutionRoutingIssues,
    executionWorkspacesOutsideExpectedRoot,
    hostWorktreesWithoutBoundIssue,
  };

  logInfo(
    `Workspace audit completed: server_blocking=${activeIssuesMissingWorkspace.length}, historical_done_missing=${historicalDoneIssuesMissingWorkspace.length}, local_routing=${localExecutionRoutingIssues.length}, outside_root=${executionWorkspacesOutsideExpectedRoot.length}, host_unbound=${hostWorktreesWithoutBoundIssue.length}`,
  );
  console.log(JSON.stringify(summary, null, 2));
}

export const __testables = {
  parseIssueMetadata,
  resolveExecutionRoute,
  issueLooksActiveWithoutWorkspace,
  splitWorkspaceDriftIssues,
  normalizePath,
  listHostWorktrees,
  getWorkspaceBinding,
  workspaceUsesExpectedRoot,
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    logError(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exit(1);
  });
}
