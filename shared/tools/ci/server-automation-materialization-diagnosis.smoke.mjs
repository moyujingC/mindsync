#!/usr/bin/env node

import { __testables as diagnosis } from "./diagnose-paperclip-server-automation-materialization.mjs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function buildIssue(overrides = {}) {
  return {
    id: "issue-1",
    identifier: "MIN-1",
    title: "sample",
    status: "in_progress",
    assigneeAgentId: "agent-1",
    executionWorkspaceId: null,
    currentExecutionWorkspace: null,
    checkoutRunId: "run-1",
    startedAt: "2026-04-19T00:00:00.000Z",
    completedAt: null,
    updatedAt: "2026-04-19T00:05:00.000Z",
    description: ["task_class: automation-execution", "execution_route: server_automation", "source: build-failure"].join("\n"),
    ...overrides,
  };
}

function buildContext(overrides = {}) {
  return {
    expectedRoot: "/opt/automation/worktrees",
    preconditionSnapshot: {
      instanceEnableIsolatedWorkspaces: true,
      projectExecutionWorkspacePolicyEnabled: true,
      projectDefaultMode: "isolated_workspace",
      projectStrategyType: "git_worktree",
      projectWorktreeParentDir: "/opt/automation/worktrees",
    },
    hostWorktreePaths: new Set(["/opt/automation/worktrees/MIN-3", "/opt/automation/worktrees/MIN-4"]),
    nowIso: "2026-04-19T12:00:00.000Z",
    staleHours: 24,
    latestCommentAt: null,
    commentsAfterStartedCount: 0,
    commentWorkspacePaths: [],
    commentWorkspaceIds: [],
    metadata: diagnosis.parseIssueMetadata(
      ["task_class: automation-execution", "execution_route: server_automation", "source: build-failure"].join("\n"),
    ),
    ...overrides,
  };
}

function main() {
  const policyIssue = diagnosis.classifyBlockingIssue(
    buildIssue({ identifier: "MIN-policy" }),
    buildContext({
      preconditionSnapshot: {
        instanceEnableIsolatedWorkspaces: false,
        projectExecutionWorkspacePolicyEnabled: true,
        projectDefaultMode: "isolated_workspace",
        projectStrategyType: "git_worktree",
        projectWorktreeParentDir: "/opt/automation/worktrees",
      },
    }),
  );
  assert(policyIssue.bucket === "policy_precondition_issues", "policy precondition issue should hit policy bucket");

  const routingIssue = diagnosis.classifyBlockingIssue(
    buildIssue({
      identifier: "MIN-routing",
      description: ["task_class: manual-review-required", "execution_route: local_manual_review", "source: build-failure"].join("\n"),
    }),
    buildContext({
      metadata: diagnosis.parseIssueMetadata(
        ["task_class: manual-review-required", "execution_route: local_manual_review", "source: build-failure"].join("\n"),
      ),
    }),
  );
  assert(
    routingIssue.bucket === "routing_metadata_or_source_anomalies",
    "route anomaly should hit routing metadata bucket",
  );

  const staleIssue = diagnosis.classifyBlockingIssue(
    buildIssue({
      identifier: "MIN-stale",
      startedAt: "2026-04-16T00:00:00.000Z",
      updatedAt: "2026-04-16T00:03:00.000Z",
      completedAt: "2026-04-16T00:04:00.000Z",
    }),
    buildContext(),
  );
  assert(staleIssue.bucket === "stale_control_plane_activity_issues", "stale sample should hit stale bucket");

  const hostIssue = diagnosis.classifyBlockingIssue(
    buildIssue({ identifier: "MIN-host" }),
    buildContext({
      commentWorkspacePaths: ["/opt/automation/worktrees/MIN-missing"],
      hostWorktreePaths: new Set(["/opt/automation/worktrees/MIN-3"]),
    }),
  );
  assert(
    hostIssue.bucket === "workspace_host_materialization_issues",
    "missing host worktree evidence should hit host materialization bucket",
  );

  const entityIssue = diagnosis.classifyBlockingIssue(
    buildIssue({ identifier: "MIN-entity" }),
    buildContext({
      commentWorkspacePaths: ["/opt/automation/worktrees/MIN-3"],
      hostWorktreePaths: new Set(["/opt/automation/worktrees/MIN-3"]),
      commentWorkspaceIds: ["workspace-1"],
    }),
  );
  assert(
    entityIssue.bucket === "workspace_entity_persistence_issues",
    "workspace entity evidence should hit persistence bucket",
  );

  const bindingIssue = diagnosis.classifyBlockingIssue(buildIssue({ identifier: "MIN-binding" }), buildContext());
  assert(
    bindingIssue.bucket === "issue_binding_missing_after_execution_trace",
    "plain active automation issue should default to binding-missing bucket",
  );

  const summary = diagnosis.buildBucketSummary([
    policyIssue,
    routingIssue,
    staleIssue,
    hostIssue,
    entityIssue,
    bindingIssue,
  ]);
  assert(summary.policy_precondition_issues.count === 1, "policy bucket count should be 1");
  assert(summary.routing_metadata_or_source_anomalies.count === 1, "routing bucket count should be 1");
  assert(summary.stale_control_plane_activity_issues.count === 1, "stale bucket count should be 1");
  assert(summary.workspace_host_materialization_issues.count === 1, "host bucket count should be 1");
  assert(summary.workspace_entity_persistence_issues.count === 1, "entity bucket count should be 1");
  assert(
    summary.issue_binding_missing_after_execution_trace.count === 1,
    "binding-missing bucket count should be 1",
  );

  const aggregate = diagnosis.countByKey(
    [
      buildIssue({ assigneeAgentId: "agent-a", status: "in_progress" }),
      buildIssue({ identifier: "MIN-2", assigneeAgentId: "agent-a", status: "blocked" }),
      buildIssue({ identifier: "MIN-3", assigneeAgentId: "agent-b", status: "blocked" }),
    ],
    (issue) => issue.assigneeAgentId,
  );
  assert(aggregate["agent-a"].count === 2, "aggregate should count agent-a twice");
  assert(aggregate["agent-b"].count === 1, "aggregate should count agent-b once");

  const localMetadata = diagnosis.parseIssueMetadata(
    ["task_class: manual-review-required", "execution_route: local_manual_review"].join("\n"),
  );
  assert(
    diagnosis.resolveExecutionRoute(localMetadata) === "local_manual_review",
    "local manual review should stay local_manual_review",
  );
  assert(
    !diagnosis.issueLooksActiveWithoutWorkspace(
      buildIssue({
        description: ["task_class: manual-review-required", "execution_route: local_manual_review"].join("\n"),
      }),
      "local_manual_review",
    ),
    "local manual review issue must not become a server automation diagnosis sample",
  );

  process.stdout.write("server-automation-materialization-diagnosis smoke ok\n");
}

main();
