#!/usr/bin/env node

import { __testables as health } from "./check-paperclip-execution-health.mjs";

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
    startedAt: "2026-04-18T00:00:00.000Z",
    completedAt: null,
    updatedAt: "2026-04-18T00:01:00.000Z",
    description: "",
    ...overrides,
  };
}

function main() {
  const activeServerAutomationIssue = buildIssue({
    status: "in_progress",
    description: ["task_class: automation-execution", "execution_route: server_automation"].join("\n"),
  });
  assert(
    health.issueLooksActiveWithoutWorkspace(activeServerAutomationIssue, "server_automation"),
    "active server automation issue should be treated as active without workspace",
  );

  const historicalDoneIssue = buildIssue({
    status: "done",
    description: ["task_class: automation-execution", "execution_route: server_automation"].join("\n"),
  });
  assert(
    health.issueLooksActiveWithoutWorkspace(historicalDoneIssue, "server_automation"),
    "historical done issue should still be observed for audit compatibility",
  );

  const split = health.splitWorkspaceDriftIssues([
    { status: "in_progress", identifier: "MIN-1" },
    { status: "blocked", identifier: "MIN-2" },
    { status: "in_review", identifier: "MIN-3" },
    { status: "done", identifier: "MIN-4" },
  ]);
  assert(split.activeBlockingIssues.length === 3, "strict split should keep only active blocking statuses");
  assert(split.historicalDoneIssues.length === 1, "strict split should move done issues into historical bucket");

  const localManualMetadata = health.parseIssueMetadata(
    ["task_class: manual-review-required", "execution_route: local_manual_review"].join("\n"),
  );
  assert(
    health.resolveExecutionRoute(localManualMetadata) === "local_manual_review",
    "explicit local_manual_review route should be preserved",
  );

  assert(
    health.workspaceUsesExpectedRoot({ cwd: "/opt/automation/worktrees/MIN-1" }, "/opt/automation/worktrees"),
    "workspace under expected root should be accepted",
  );
  assert(
    !health.workspaceUsesExpectedRoot({ cwd: "/opt/automation/app/mindsync" }, "/opt/automation/worktrees"),
    "workspace outside expected root should be rejected",
  );

  const localRoutingIssue = buildIssue({
    status: "blocked",
    description: ["task_class: manual-review-required", "execution_route: local_manual_review"].join("\n"),
  });
  const localRoutingClassification = health.classifyLocalExecutionRoutingIssue(
    localRoutingIssue,
    localManualMetadata,
    {
      cwd: "/opt/automation/worktrees/MIN-1",
      providerRef: "/opt/automation/worktrees/MIN-1",
      worktreePath: "/opt/automation/worktrees/MIN-1",
    },
  );
  assert(
    localRoutingClassification.executionRoute === "local_manual_review",
    "local routing classification should preserve local_manual_review route",
  );
  assert(
    localRoutingClassification.reason === "server_writable_execution_not_allowed",
    "local routing classification should keep the audit reason code",
  );
  assert(
    !health.issueLooksActiveWithoutWorkspace(localRoutingIssue, "local_manual_review"),
    "local manual review issue should not be treated as a server automation blocking issue",
  );

  process.stdout.write("execution-health smoke ok\n");
}

main();
