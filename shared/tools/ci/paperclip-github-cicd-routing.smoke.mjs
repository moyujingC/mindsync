#!/usr/bin/env node

import { __testables } from "./paperclip-sync-lib.mjs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const relayhubOptions = {
  workflow: "relayhub-ci-deploy",
  job: "relayhub-deploy",
  branch: "relayhub/dev",
  sha: "30553ac6a8b41c4fa7c6d7e3ab4dd1d0abc12345",
  eventTime: "2026-05-03T05:06:28.000Z",
  projectName: "RelayHub",
  parentAutomationKey: "repo::relayhub-ci-deploy::relayhub/dev::sha::commit-summary",
  automationKey: "repo::relayhub-ci-deploy::relayhub/dev::relayhub-deploy::sha::deploy-or-smoke-failure",
  repository: "moyujingC/mindsync",
  runUrl: "https://github.com/moyujingC/mindsync/actions/runs/25270509943",
  runNumber: "87",
  failedStep: "Smoke Check RelayHub",
  reproCommand: "gh run view 25270509943 --log-failed",
  kind: "deploy-or-smoke-failure",
  ownerAgentId: "engineer",
  summary: "relayhub smoke failed",
  executionAdapter: "github-actions/self-hosted-runner:deploy",
  executionHost: "automation@150.158.9.95",
};

const relayhubParentDescription = __testables.buildCommitSummaryDescription(relayhubOptions);
assert(
  relayhubParentDescription.includes("task_class: manual-review-required"),
  "relayhub parent summary should remain manual-review-required",
);
assert(
  relayhubParentDescription.includes("execution_route: local_manual_review"),
  "relayhub parent summary should remain local_manual_review",
);
assert(
  relayhubParentDescription.includes("source: automation-summary"),
  "relayhub parent summary should carry automation-summary source",
);
assert(
  relayhubParentDescription.includes("branch: relayhub/dev"),
  "relayhub parent summary should keep relayhub/dev branch",
);

const relayhubFailureDescription = __testables.buildDescription(
  {
    labelNames: ["type:artifact", "review:deliverable"],
    severity: "warning",
  },
  relayhubOptions,
);
assert(
  relayhubFailureDescription.includes("task_class: automation-execution"),
  "relayhub deploy failure should route to automation-execution",
);
assert(
  relayhubFailureDescription.includes("execution_route: server_automation"),
  "relayhub deploy failure should route to server_automation",
);
assert(
  relayhubFailureDescription.includes("source: deploy-or-smoke-failure"),
  "relayhub deploy failure should keep deploy source",
);
assert(
  relayhubFailureDescription.includes("branch: relayhub/dev"),
  "relayhub deploy failure should keep relayhub/dev branch",
);

const relayhubComment = __testables.buildComment({
  ...relayhubOptions,
  result: "failed",
  diagnosis: "发布风险",
});
assert(
  relayhubComment.includes("- adapter: github-actions/self-hosted-runner:deploy"),
  "relayhub deploy comment should include deploy adapter",
);
assert(
  relayhubComment.includes("- host: automation@150.158.9.95"),
  "relayhub deploy comment should include automation host",
);

const aimandalaCiOptions = {
  workflow: "ci",
  job: "backend-tests",
  branch: "main",
  sha: "9f8e7d6c5b4a39281716151413121110abcdef12",
  eventTime: "2026-05-03T06:00:00.000Z",
  projectName: "一镜一梳",
  parentAutomationKey: "repo::ci::main::sha::commit-summary",
  automationKey: "repo::ci::main::backend-tests::sha::ci-test-failure",
  repository: "moyujingC/mindsync",
  runUrl: "https://github.com/moyujingC/mindsync/actions/runs/25280000000",
  runNumber: "188",
  failedStep: "Run Backend Tests",
  reproCommand: "pytest -q",
  kind: "ci-test-failure",
  ownerAgentId: "engineer",
  summary: "backend test failed",
};

const aimandalaCiFailureDescription = __testables.buildDescription(
  {
    labelNames: ["type:execution"],
    severity: "error",
  },
  aimandalaCiOptions,
);
assert(
  aimandalaCiFailureDescription.includes("source: ci-test-failure"),
  "aimandala PR/main CI failure should remain ci-test-failure",
);
assert(
  !aimandalaCiFailureDescription.includes("source: deploy-or-smoke-failure"),
  "aimandala PR/main CI failure should not be treated as deploy failure",
);

const aimandalaReleaseOptions = {
  workflow: "deploy",
  job: "deploy-prod",
  branch: "release",
  sha: "abcdefabcdefabcdefabcdefabcdefabcdefabcd",
  eventTime: "2026-05-03T06:10:00.000Z",
  projectName: "一镜一梳",
  parentAutomationKey: "repo::deploy::release::sha::commit-summary",
  automationKey: "repo::deploy::release::deploy-prod::sha::deploy-or-smoke-failure",
  repository: "moyujingC/mindsync",
  runUrl: "https://github.com/moyujingC/mindsync/actions/runs/25280000001",
  runNumber: "189",
  failedStep: "Smoke Check Production",
  reproCommand: "gh run view 25280000001 --log-failed",
  kind: "deploy-or-smoke-failure",
  ownerAgentId: "engineer",
  summary: "prod smoke failed",
  executionAdapter: "github-actions/self-hosted-runner:deploy",
  executionHost: "automation@150.158.9.95",
  environment: "prod",
};

const aimandalaReleaseDescription = __testables.buildDescription(
  {
    labelNames: ["type:artifact", "review:deliverable"],
    severity: "warning",
  },
  aimandalaReleaseOptions,
);
assert(
  aimandalaReleaseDescription.includes("branch: release"),
  "aimandala release deploy failure should keep release branch",
);
assert(
  aimandalaReleaseDescription.includes("source: deploy-or-smoke-failure"),
  "aimandala release deploy failure should keep deploy source",
);

console.log("paperclip-github-cicd-routing smoke passed");
