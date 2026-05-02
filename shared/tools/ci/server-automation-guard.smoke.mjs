#!/usr/bin/env node

import { __testables as guard } from "./server-automation-guard.mjs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const expectedRoot = "/opt/automation/worktrees";

  const serverAllowed = guard.evaluateGuard({
    cwd: "/opt/automation/worktrees/MIN-1",
    expectedRoot,
    taskClass: "automation-execution",
    executionRoute: "server_automation",
  });
  assert(serverAllowed.ok, "server automation worktree should pass");

  const serverObserveOnly = guard.evaluateGuard({
    cwd: "/opt/automation/app/mindsync",
    expectedRoot,
    taskClass: "automation-execution",
    executionRoute: "server_automation",
  });
  assert(!serverObserveOnly.ok, "observe-only checkout should fail");
  assert(
    serverObserveOnly.reason === "execution_workspace_policy_not_materialized",
    "observe-only checkout should use workspace policy reason",
  );

  const localOnServer = guard.evaluateGuard({
    cwd: "/opt/automation/worktrees/MIN-2",
    expectedRoot,
    taskClass: "manual-review-required",
    executionRoute: "local_manual_review",
  });
  assert(!localOnServer.ok, "local manual review on server root should fail");
  assert(
    localOnServer.reason === "server_writable_execution_not_allowed",
    "local manual review should use server writable rejection reason",
  );

  process.stdout.write("server-automation-guard smoke ok\n");
}

main();
