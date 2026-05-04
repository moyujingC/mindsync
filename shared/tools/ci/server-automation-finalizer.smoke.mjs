#!/usr/bin/env node

import { __testables as finalizer } from "./server-automation-finalizer.mjs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  assert(
    finalizer.changedFilesStayWithinAllowlist([
      "shared/tools/ci/check-runner-heartbeat.mjs",
      "projects/aimandala/docs/qa/2026-04-28-sample.md",
    ]),
    "allowlisted server automation paths should pass",
  );

  assert(
    !finalizer.changedFilesStayWithinAllowlist([
      "projects/aimandala/toC/app/frontend/mobile-web/styles/report.css",
    ]),
    "business code path should not be auto-commit allowlisted",
  );

  const denied = finalizer.changedFilesTouchDenylist([
    "coverage/index.html",
    "projects/aimandala/toC/app/backend/data/uploads/example.json",
  ]);
  assert(denied.length === 2, "denylist matches should be reported");

  process.stdout.write("server-automation-finalizer smoke ok\n");
}

main();
