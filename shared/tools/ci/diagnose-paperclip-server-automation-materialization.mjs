#!/usr/bin/env node

import process from "node:process";
import { pathToFileURL } from "node:url";

import { PaperclipApi, getOption, isoNow, logError, logInfo, parseArgs, resolveProjectByName, runShellCommand } from "./common.mjs";
import { __testables as health } from "./check-paperclip-execution-health.mjs";
import { __testables as audit } from "./audit-paperclip-workspace-materialization.mjs";

const DIAGNOSIS_BUCKETS = [
  "policy_precondition_issues",
  "issue_binding_missing_after_execution_trace",
  "workspace_entity_persistence_issues",
  "workspace_host_materialization_issues",
  "routing_metadata_or_source_anomalies",
  "stale_control_plane_activity_issues",
];

function normalizePath(value) {
  return String(value ?? "").replace(/\/+$/, "");
}

async function getInstanceExperimentalSettings(api) {
  try {
    return await api.get("/api/instance/settings/experimental");
  } catch {
    return null;
  }
}

async function listIssueComments(api, issues) {
  const entries = await Promise.all(
    (issues ?? []).map(async (issue) => {
      try {
        const comments = await api.get(`/api/issues/${issue.id}/comments`);
        return [issue.id, comments ?? []];
      } catch {
        return [issue.id, []];
      }
    }),
  );
  return new Map(entries);
}

async function listHostWorktreePaths(repoRoot, expectedRoot) {
  const result = await runShellCommand(`git -C ${JSON.stringify(repoRoot)} worktree list --porcelain`, {
    cwd: repoRoot,
  });
  if (result.code !== 0) {
    return new Set();
  }

  const entries = [];
  for (const line of String(result.stdout).split(/\r?\n/)) {
    if (line.startsWith("worktree ")) {
      entries.push(line.slice("worktree ".length).trim());
    }
  }

  const prefix = `${normalizePath(expectedRoot)}/`;
  return new Set(entries.map((value) => normalizePath(value)).filter((value) => value.startsWith(prefix)));
}

function extractCommentEvidence(comments) {
  const workspacePaths = new Set();
  const workspaceIds = new Set();
  let latestCommentAt = null;
  let commentsAfterStartedCount = 0;

  for (const comment of comments ?? []) {
    const body = String(comment.body ?? comment.content ?? "");
    const createdAt = comment.createdAt ?? null;
    if (createdAt && (!latestCommentAt || new Date(createdAt).getTime() > new Date(latestCommentAt).getTime())) {
      latestCommentAt = createdAt;
    }

    const pathMatches = body.match(/\/opt\/automation\/worktrees\/[^\s)`"'，。]+/g) ?? [];
    for (const match of pathMatches) {
      workspacePaths.add(normalizePath(match));
    }

    const idMatches = body.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi) ?? [];
    for (const match of idMatches) {
      workspaceIds.add(match);
    }
  }

  return {
    latestCommentAt,
    commentsAfterStartedCount,
    commentWorkspacePaths: [...workspacePaths],
    commentWorkspaceIds: [...workspaceIds],
  };
}

function hasStaleExecutionTrace(issue, context) {
  if (!issue.startedAt || !context.nowIso) {
    return false;
  }
  const ageHours = (new Date(context.nowIso).getTime() - new Date(issue.startedAt).getTime()) / (1000 * 60 * 60);
  if (!Number.isFinite(ageHours) || ageHours < context.staleHours) {
    return false;
  }
  return context.commentsAfterStartedCount === 0;
}

function hasRoutingAnomaly(issue, context) {
  const metadata = context.metadata ?? {};
  if (health.resolveExecutionRoute(metadata) !== "server_automation") {
    return true;
  }
  return metadata.task_class !== "automation-execution" || !metadata.source;
}

function hasPolicyPreconditionIssue(context) {
  const snapshot = context.preconditionSnapshot ?? {};
  if (snapshot.instanceEnableIsolatedWorkspaces !== true) {
    return true;
  }
  if (snapshot.projectExecutionWorkspacePolicyEnabled !== true) {
    return true;
  }
  if (snapshot.projectDefaultMode !== "isolated_workspace") {
    return true;
  }
  if (snapshot.projectStrategyType !== "git_worktree") {
    return true;
  }
  return normalizePath(snapshot.projectWorktreeParentDir) !== normalizePath(context.expectedRoot);
}

function hasHostMaterializationIssue(context) {
  const matchedPath = (context.commentWorkspacePaths ?? []).find((value) =>
    normalizePath(value).startsWith(`${normalizePath(context.expectedRoot)}/`),
  );
  if (!matchedPath) {
    return false;
  }
  return !(context.hostWorktreePaths ?? new Set()).has(normalizePath(matchedPath));
}

function hasWorkspaceEntityPersistenceIssue(context) {
  return (context.commentWorkspaceIds ?? []).length > 0;
}

function buildEvidence(issue, context) {
  return {
    status: issue.status,
    assigneeAgentId: issue.assigneeAgentId ?? null,
    checkoutRunId: issue.checkoutRunId ?? null,
    startedAt: issue.startedAt ?? null,
    completedAt: issue.completedAt ?? null,
    updatedAt: issue.updatedAt ?? null,
    latestCommentAt: context.latestCommentAt ?? null,
    commentsAfterStartedCount: context.commentsAfterStartedCount ?? 0,
    commentWorkspacePaths: context.commentWorkspacePaths ?? [],
    commentWorkspaceIds: context.commentWorkspaceIds ?? [],
    expectedRoot: context.expectedRoot,
    preconditionSnapshot: context.preconditionSnapshot,
  };
}

function classifyBlockingIssue(issue, context) {
  let bucket = "issue_binding_missing_after_execution_trace";
  let classificationReason = "execution trace exists, but no workspace binding was materialized";

  if (hasPolicyPreconditionIssue(context)) {
    bucket = "policy_precondition_issues";
    classificationReason = "instance or project execution workspace preconditions are not fully aligned";
  } else if (hasRoutingAnomaly(issue, context)) {
    bucket = "routing_metadata_or_source_anomalies";
    classificationReason = "issue metadata or source does not cleanly describe a server automation execution path";
  } else if (hasStaleExecutionTrace(issue, context)) {
    bucket = "stale_control_plane_activity_issues";
    classificationReason = "issue looks active in the control plane, but execution traces look stale";
  } else if (hasHostMaterializationIssue(context)) {
    bucket = "workspace_host_materialization_issues";
    classificationReason = "workspace evidence points to /opt/automation/worktrees, but host materialization is missing";
  } else if (hasWorkspaceEntityPersistenceIssue(context)) {
    bucket = "workspace_entity_persistence_issues";
    classificationReason = "workspace evidence exists in comments or traces, but persisted binding is still missing";
  }

  return {
    issueId: issue.issueId ?? issue.id,
    identifier: issue.identifier,
    title: issue.title,
    status: issue.status,
    taskClass: issue.taskClass ?? context.metadata?.task_class ?? null,
    executionRoute: issue.executionRoute ?? health.resolveExecutionRoute(context.metadata ?? {}),
    source: context.metadata?.source ?? null,
    bucket,
    classificationReason,
    evidence: buildEvidence(issue, context),
  };
}

function buildBucketSummary(classifiedIssues) {
  const summary = Object.fromEntries(
    DIAGNOSIS_BUCKETS.map((bucket) => [
      bucket,
      {
        count: 0,
        issues: [],
      },
    ]),
  );

  for (const issue of classifiedIssues) {
    summary[issue.bucket].count += 1;
    summary[issue.bucket].issues.push(issue);
  }

  return summary;
}

function countByKey(items, getter) {
  const summary = {};
  for (const item of items ?? []) {
    const key = String(getter(item) ?? "unknown");
    summary[key] ??= { count: 0, identifiers: [] };
    summary[key].count += 1;
    summary[key].identifiers.push(item.identifier);
  }
  return summary;
}

function buildPreconditionSnapshot(instanceSettings, project, expectedRoot, repoRoot, hostWorktreePaths) {
  const policy = project.executionWorkspacePolicy ?? {};
  return {
    instanceEnableIsolatedWorkspaces: instanceSettings?.enableIsolatedWorkspaces ?? null,
    projectExecutionWorkspacePolicyEnabled: policy.enabled ?? null,
    projectDefaultMode: policy.defaultMode ?? null,
    projectStrategyType: policy.workspaceStrategy?.type ?? null,
    projectWorktreeParentDir: policy.workspaceStrategy?.worktreeParentDir ?? null,
    expectedRoot,
    repoRoot,
    hostWorktreeCount: hostWorktreePaths.size,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || options.h) {
    console.log(`Usage:
  node shared/tools/ci/diagnose-paperclip-server-automation-materialization.mjs --company-id <id> --project-name <name> [--api-base <url>] [--api-key <key>] [--expected-root /opt/automation/worktrees] [--repo-root /opt/automation/app/mindsync]
`);
    return;
  }

  const apiBase = getOption(options, "api-base", process.env.PAPERCLIP_API_BASE ?? "http://127.0.0.1:3100");
  const apiKey = getOption(options, "api-key", process.env.PAPERCLIP_API_KEY ?? null);
  const companyId = getOption(options, "company-id", process.env.PAPERCLIP_COMPANY_ID ?? null);
  const projectName = getOption(options, "project-name", process.env.PAPERCLIP_PROJECT_NAME ?? "一镜一梳");
  const expectedRoot = normalizePath(
    getOption(
      options,
      "expected-root",
      process.env.PAPERCLIP_SERVER_WRITABLE_ALLOWED_ROOT ?? process.env.PAPERCLIP_EXECUTION_WORKTREE_ROOT ?? "/opt/automation/worktrees",
    ),
  );
  const repoRoot = getOption(options, "repo-root", process.env.REPO_ROOT ?? "/opt/automation/app/mindsync");

  if (!companyId) {
    throw new Error("company id is required");
  }

  const api = new PaperclipApi({ apiBase, apiKey, companyId });
  const [project, instanceSettings] = await Promise.all([
    resolveProjectByName(api, companyId, projectName),
    getInstanceExperimentalSettings(api),
  ]);
  const [issues, executionWorkspaces] = await Promise.all([
    api.get(`/api/companies/${companyId}/issues?projectId=${encodeURIComponent(project.id)}`),
    api.get(`/api/companies/${companyId}/execution-workspaces?projectId=${encodeURIComponent(project.id)}`),
  ]);
  const workspaceById = new Map((executionWorkspaces ?? []).map((workspace) => [workspace.id, workspace]));
  const hostWorktreePaths = await listHostWorktreePaths(repoRoot, expectedRoot);
  const preconditionSnapshot = buildPreconditionSnapshot(instanceSettings, project, expectedRoot, repoRoot, hostWorktreePaths);

  const observedWorkspaceDriftIssues =
    project.executionWorkspacePolicy?.enabled === true
      ? (issues ?? [])
          .filter((issue) => {
            const metadata = health.parseIssueMetadata(issue.description);
            return health.issueLooksActiveWithoutWorkspace(issue, health.resolveExecutionRoute(metadata));
          })
          .map((issue) => ({
            ...health.classifyExecutionWorkspaceDrift(issue),
            id: issue.id,
            description: issue.description,
            assigneeAgentId: issue.assigneeAgentId ?? null,
          }))
      : [];
  const {
    activeBlockingIssues: serverAutomationBlockingIssues,
    historicalDoneIssues: historicalDoneWorkspaceDriftIssues,
  } = health.splitWorkspaceDriftIssues(observedWorkspaceDriftIssues);

  const localExecutionRoutingIssues = (issues ?? [])
    .filter((issue) => {
      const metadata = health.parseIssueMetadata(issue.description);
      if (health.resolveExecutionRoute(metadata) === "server_automation") {
        return false;
      }
      if (!health.STRICT_BLOCKING_STATUSES.has(issue.status)) {
        return false;
      }
      const workspace = audit.getWorkspaceBinding(issue, workspaceById);
      return Boolean(workspace) && health.workspaceUsesExpectedRoot(workspace, expectedRoot);
    })
    .map((issue) => {
      const metadata = health.parseIssueMetadata(issue.description);
      const workspace = audit.getWorkspaceBinding(issue, workspaceById);
      return health.classifyLocalExecutionRoutingIssue(issue, metadata, workspace);
    });

  const commentMap = await listIssueComments(api, serverAutomationBlockingIssues);

  const classifiedIssues = serverAutomationBlockingIssues.map((issue) => {
    const comments = commentMap.get(issue.issueId) ?? [];
    const metadata = health.parseIssueMetadata(issue.description);
    const evidenceFromComments = extractCommentEvidence(comments);
    const commentsAfterStartedCount = comments.filter((comment) => {
      if (!issue.startedAt || !comment.createdAt) {
        return false;
      }
      return new Date(comment.createdAt).getTime() >= new Date(issue.startedAt).getTime();
    }).length;

    return classifyBlockingIssue(issue, {
      expectedRoot,
      metadata,
      hostWorktreePaths,
      preconditionSnapshot,
      nowIso: isoNow(),
      staleHours: 24,
      latestCommentAt: evidenceFromComments.latestCommentAt,
      commentsAfterStartedCount,
      commentWorkspacePaths: evidenceFromComments.commentWorkspacePaths,
      commentWorkspaceIds: evidenceFromComments.commentWorkspaceIds,
    });
  });

  const summary = {
    checkedAt: isoNow(),
    preconditionSnapshot,
    counts: {
      serverAutomationBlocking: serverAutomationBlockingIssues.length,
      historicalDoneWorkspaceDrift: historicalDoneWorkspaceDriftIssues.length,
      localExecutionRouting: localExecutionRoutingIssues.length,
    },
    serverAutomationBlockingIssues,
    historicalDoneWorkspaceDriftIssues,
    localExecutionRoutingIssues,
    diagnosisBuckets: buildBucketSummary(classifiedIssues),
    bySource: countByKey(classifiedIssues, (issue) => issue.source),
    byStatus: countByKey(classifiedIssues, (issue) => issue.status),
    byAssigneeAgent: countByKey(serverAutomationBlockingIssues, (issue) => issue.assigneeAgentId),
  };

  logInfo(
    `Diagnosis completed: server_blocking=${serverAutomationBlockingIssues.length}, historical_done=${historicalDoneWorkspaceDriftIssues.length}, local_routing=${localExecutionRoutingIssues.length}`,
  );
  console.log(JSON.stringify(summary, null, 2));
}

export const __testables = {
  DIAGNOSIS_BUCKETS,
  parseIssueMetadata: health.parseIssueMetadata,
  resolveExecutionRoute: health.resolveExecutionRoute,
  issueLooksActiveWithoutWorkspace: health.issueLooksActiveWithoutWorkspace,
  classifyBlockingIssue,
  buildBucketSummary,
  countByKey,
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    logError(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exit(1);
  });
}
