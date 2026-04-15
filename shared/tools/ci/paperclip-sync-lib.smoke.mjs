#!/usr/bin/env node

import process from "node:process";

import { __testables } from "./paperclip-sync-lib.mjs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const baseOptions = {
  workflow: "ci",
  job: "knowledge-ci",
  branch: "main",
  sha: "e9c8e56a0f0bd7bade4de0948e15cc9d08386ef2",
  eventTime: "2026-04-14T14:36:25.000Z",
  projectName: "一镜一梳",
  parentAutomationKey: "repo::ci::main::sha::commit-summary",
  automationKey: "repo::ci::main::knowledge-ci::sha::build-failure",
  repository: "moyujingC/mindsync",
  runUrl: "https://example.test/run/1",
  runNumber: "24",
  failedStep: "Install Knowledge Dependencies",
  reproCommand: "python3 -m pip install -r requirements.txt pytest",
  kind: "build-failure",
  ownerAgentId: "engineer",
  summary: "sample log",
};

function main() {
  const failureTitle = __testables.buildFailureTitle({}, baseOptions);
  assert(failureTitle === "knowledge-ci", `unexpected failure title: ${failureTitle}`);

  const commitTitle = __testables.buildCommitSummaryTitle(baseOptions);
  assert(commitTitle === "#24", `unexpected commit title: ${commitTitle}`);

  const commitDescription = __testables.buildCommitSummaryDescription({
    ...baseOptions,
    goalTitle: "一镜一梳上线",
  });
  assert(commitDescription.includes("type:epic"), "commit summary should include type:epic");
  assert(commitDescription.includes("goal: 一镜一梳上线"), "commit summary should include goal");
  assert(commitDescription.includes("review goal："), "commit summary should include review goal");

  const executionDescription = __testables.buildDescription(
    {
      labelNames: ["type:execution"],
      severity: "error",
    },
    {
      ...baseOptions,
      goalTitle: "一镜一梳上线",
    },
  );
  assert(executionDescription.includes("type:execution"), "execution description should include type:execution");
  assert(executionDescription.includes("预期 artifact："), "execution description should include expected artifact");
  assert(executionDescription.includes("完成标准："), "execution description should include completion criteria");
  assert(executionDescription.includes("done when："), "execution description should include done when");

  const resolvedTitle = __testables.prefixTitleWithSeverity("❌ knowledge-ci", "success");
  assert(resolvedTitle === "knowledge-ci", `resolved title should strip emoji: ${resolvedTitle}`);

  const safePatchPayload = __testables.buildSafeIssuePatchPayload({
    title: "knowledge-ci",
    description: "new description",
    goalId: "123e4567-e89b-12d3-a456-426614174000",
    parentId: "parent-1",
    comment: "comment body",
  });
  assert(!("description" in safePatchPayload), "safe patch payload should drop description");
  assert(!("goalId" in safePatchPayload), "safe patch payload should drop goalId");
  assert(safePatchPayload.title === "knowledge-ci", "safe patch payload should keep title");
  assert(safePatchPayload.parentId === "parent-1", "safe patch payload should keep parentId");
  assert(safePatchPayload.comment === "comment body", "safe patch payload should keep comment");

  assert(__testables.isRuntimePatchCompatibilityError(new Error("HTTP 500 Internal Server Error")), "500 should be treated as compatibility error");
  assert(!__testables.isRuntimePatchCompatibilityError(new Error("HTTP 422 Unprocessable Entity")), "422 should not be treated as compatibility error");

  const comment = __testables.buildComment({
    ...baseOptions,
    result: "failed",
    diagnosis: "代码问题",
    executionAdapter: "codex_local",
    executionHost: "automation-host",
  });
  assert(comment.includes("执行来源："), "comment should include execution source section");
  assert(comment.includes("- adapter: codex_local"), "comment should include execution adapter");
  assert(comment.includes("- host: automation-host"), "comment should include execution host");

  const commitSummaryComment = __testables.buildCommitSummaryComment({
    ...baseOptions,
    result: "failed",
    executionAdapter: "claude_local",
    executionHost: "automation-host",
  });
  assert(commitSummaryComment.includes("- adapter: claude_local"), "commit summary comment should include execution adapter");
  assert(commitSummaryComment.includes("- host: automation-host"), "commit summary comment should include execution host");

  process.stdout.write("paperclip-sync-lib smoke ok\n");
}

main();
