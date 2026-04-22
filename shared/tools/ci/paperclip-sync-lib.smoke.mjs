#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import { assertProjectRegistered } from "./common.mjs";
import { __testables } from "./paperclip-sync-lib.mjs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function withTempRegistry(run) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mindsync-paperclip-smoke-"));
  const companyDir = path.join(tempDir, "company");
  await fs.mkdir(companyDir, { recursive: true });
  await fs.writeFile(
    path.join(companyDir, "项目注册表.yaml"),
    [
      "version: 0.1.0",
      "objects:",
      '  - id: "p1"',
      '    name: "一镜一梳"',
      '    slug: "aimandala"',
      '    kind: "product"',
      "",
    ].join("\n"),
    "utf8",
  );

  try {
    await run(tempDir);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
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

async function main() {
  const failureTitle = __testables.buildFailureTitle({}, baseOptions);
  assert(failureTitle === "knowledge-ci", `unexpected failure title: ${failureTitle}`);

  const commitTitle = __testables.buildCommitSummaryTitle(baseOptions);
  assert(commitTitle === "#24", `unexpected commit title: ${commitTitle}`);

  const commitDescription = __testables.buildCommitSummaryDescription({
    ...baseOptions,
    goalTitle: "一镜一梳上线",
  });
  assert(commitDescription.includes("type:epic"), "commit summary should include type:epic");
  assert(
    commitDescription.includes("task_class: manual-review-required"),
    "commit summary should pin manual-review-required task class",
  );
  assert(
    commitDescription.includes("execution_route: local_manual_review"),
    "commit summary should pin local_manual_review route",
  );
  assert(
    commitDescription.includes("任务目标："),
    "commit summary should remain a control-plane coordination artifact",
  );
  assert(commitDescription.includes("goal: 一镜一梳上线"), "commit summary should include goal");
  assert(commitDescription.includes("review goal："), "commit summary should include review goal");
  assert(commitDescription.includes("source: automation-summary"), "commit summary should include automation-summary source");
  assert(commitDescription.includes("workflow: ci"), "commit summary should include workflow field");

  const runnerHeartbeatSummaryDescription = __testables.buildCommitSummaryDescription({
    ...baseOptions,
    workflow: "runner-heartbeat",
    parentAutomationKey: "repo::runner-heartbeat::main::sha::commit-summary",
    goalTitle: "一镜一梳上线",
  });
  assert(
    runnerHeartbeatSummaryDescription.includes("task_class: manual-review-required"),
    "runner-heartbeat summary should remain manual-review-required",
  );
  assert(
    runnerHeartbeatSummaryDescription.includes("execution_route: local_manual_review"),
    "runner-heartbeat summary should remain local_manual_review",
  );
  assert(
    runnerHeartbeatSummaryDescription.includes("source: automation-summary"),
    "runner-heartbeat summary should keep automation-summary source",
  );
  assert(
    runnerHeartbeatSummaryDescription.includes("workflow: runner-heartbeat"),
    "runner-heartbeat summary should keep workflow field",
  );

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
  assert(
    executionDescription.includes("task_class: automation-execution"),
    "execution description should include automation-execution task class",
  );
  assert(
    executionDescription.includes("execution_route: server_automation"),
    "execution description should include server_automation route",
  );
  assert(executionDescription.includes("预期 artifact："), "execution description should include expected artifact");
  assert(executionDescription.includes("完成标准："), "execution description should include completion criteria");
  assert(executionDescription.includes("done when："), "execution description should include done when");
  assert(executionDescription.includes("source: build-failure"), "build failure should include source");
  assert(executionDescription.includes("diagnosis: 代码问题"), "build failure should include diagnosis");

  const runnerFailureDescription = __testables.buildDescription(
    {
      labelNames: ["type:execution"],
      severity: "error",
    },
    {
      ...baseOptions,
      workflow: "runner-heartbeat",
      job: "Runner-Heartbeat",
      kind: "infra-runner-failure",
      automationKey: "repo::runner-heartbeat::main::runner-heartbeat::sha::infra-runner-failure",
      goalTitle: "一镜一梳上线",
    },
  );
  assert(
    runnerFailureDescription.includes("task_class: automation-execution"),
    "infra-runner-failure should use automation-execution task class",
  );
  assert(
    runnerFailureDescription.includes("execution_route: server_automation"),
    "infra-runner-failure should use server_automation route",
  );
  assert(
    runnerFailureDescription.includes("source: infra-runner-failure"),
    "infra-runner-failure should include source",
  );
  assert(
    runnerFailureDescription.includes("type:execution"),
    "infra-runner-failure should remain type:execution",
  );

  const ciTestFailureDescription = __testables.buildDescription(
    {
      labelNames: ["type:execution"],
      severity: "error",
    },
    {
      ...baseOptions,
      kind: "ci-test-failure",
      automationKey: "repo::ci::main::knowledge-ci::sha::ci-test-failure",
      goalTitle: "一镜一梳上线",
    },
  );
  assert(
    ciTestFailureDescription.includes("task_class: automation-execution"),
    "ci-test-failure should use automation-execution task class",
  );
  assert(
    ciTestFailureDescription.includes("execution_route: server_automation"),
    "ci-test-failure should use server_automation route",
  );
  assert(ciTestFailureDescription.includes("source: ci-test-failure"), "ci-test-failure should include source");
  assert(ciTestFailureDescription.includes("type:execution"), "ci-test-failure should remain type:execution");

  const deployFailureDescription = __testables.buildDescription(
    {
      labelNames: ["type:artifact", "review:deliverable"],
      severity: "warning",
    },
    {
      ...baseOptions,
      workflow: "deploy",
      kind: "deploy-or-smoke-failure",
      environment: "dev",
      automationKey: "repo::deploy::main::aimandala-deploy::sha::deploy-or-smoke-failure",
      goalTitle: "一镜一梳上线",
    },
  );
  assert(
    deployFailureDescription.includes("task_class: automation-execution"),
    "deploy-or-smoke-failure should still use automation-execution task class",
  );
  assert(
    deployFailureDescription.includes("execution_route: server_automation"),
    "deploy-or-smoke-failure should still use server_automation route",
  );
  assert(
    deployFailureDescription.includes("source: deploy-or-smoke-failure"),
    "deploy-or-smoke-failure should include source",
  );
  assert(
    deployFailureDescription.includes("type:artifact"),
    "deploy-or-smoke-failure should preserve type:artifact",
  );
  assert(
    deployFailureDescription.includes("review:deliverable"),
    "deploy-or-smoke-failure should preserve review:deliverable",
  );

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

  await withTempRegistry(async (tempDir) => {
    const registered = await assertProjectRegistered("一镜一梳", tempDir);
    assert(registered.slug === "aimandala", "registered project should resolve from registry");

    let threw = false;
    try {
      await assertProjectRegistered("Onboarding", tempDir);
    } catch (error) {
      threw = String(error?.message ?? error).includes("Project is not registered");
    }
    assert(threw, "unregistered runtime project should be rejected");
  });

  process.stdout.write("paperclip-sync-lib smoke ok\n");
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exit(1);
});
