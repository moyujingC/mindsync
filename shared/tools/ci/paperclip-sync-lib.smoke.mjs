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
  failedStep: "Install Knowledge Dependencies",
  reproCommand: "python3 -m pip install -r requirements.txt pytest",
  kind: "build-failure",
  ownerAgentId: "engineer",
  summary: "sample log",
};

function main() {
  const failureTitle = __testables.buildFailureTitle({}, baseOptions);
  assert(failureTitle === "CI失败：Knowledge-CI / main", `unexpected failure title: ${failureTitle}`);

  const commitTitle = __testables.buildCommitSummaryTitle(baseOptions);
  assert(commitTitle === "Aimandala-CI 失败汇总 / main", `unexpected commit title: ${commitTitle}`);

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

  const resolvedTitle = __testables.prefixTitleWithSeverity("❌ CI失败：Knowledge-CI / main", "success");
  assert(resolvedTitle === "CI失败：Knowledge-CI / main", `resolved title should strip emoji: ${resolvedTitle}`);

  process.stdout.write("paperclip-sync-lib smoke ok\n");
}

main();
