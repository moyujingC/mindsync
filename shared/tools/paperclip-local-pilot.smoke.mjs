#!/usr/bin/env node

import { __testables } from "./paperclip-local-pilot.mjs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const manualPositive = {
  identifier: "MIN-119",
  description: [
    "task_class: manual-review-required",
    "execution_route: local_manual_review",
    "",
    "整理并收口本轮MVP上线相关的所有文档",
  ].join("\n"),
};

const summaryNegative = {
  identifier: "MIN-133",
  description: [
    "automation_key: repo::ci::main::sha::commit-summary",
    "type:epic",
    "task_class: manual-review-required",
    "execution_route: local_manual_review",
    "source: automation-summary",
  ].join("\n"),
};

assert(__testables.isLocalManualReviewIssue(manualPositive), "manual sample should be recognized as local_manual_review");
assert(__testables.isEligibleLocalPilotIssue(manualPositive), "manual sample should be eligible for local pilot");
assert(__testables.isLocalManualReviewIssue(summaryNegative), "summary sample still uses local_manual_review");
assert(__testables.isAutomationSummaryIssue(summaryNegative), "summary sample should be recognized as automation-summary");
assert(!__testables.isEligibleLocalPilotIssue(summaryNegative), "automation-summary sample must be excluded from local pilot candidates");

const comment = __testables.buildCommentBody({
  kind: "claim",
  context: {
    host: "mac:test-host",
    cwd: "/Users/xinran/dev/mindsync",
    branch: "codex/test-branch",
    sha: "abc123",
  },
  judgment: "开始本地接手。",
  actions: "已完成环境加载。",
  next: "准备 checkout 并开始修改。",
  verification: "控制面连接正常。",
});

assert(comment.includes("## 本地 Mac 执行节点接手"), "claim comment should include title");
assert(comment.includes("- host: mac:test-host"), "comment should include host");
assert(comment.includes("- cwd: /Users/xinran/dev/mindsync"), "comment should include cwd");
assert(comment.includes("- branch: codex/test-branch"), "comment should include branch");
assert(comment.includes("- sha: abc123"), "comment should include sha");
assert(comment.includes("当前判断："), "comment should include judgment section");
assert(comment.includes("已做动作："), "comment should include actions section");
assert(comment.includes("下一步动作："), "comment should include next-step section");
assert(comment.includes("验证结论："), "comment should include verification section");

console.log("paperclip-local-pilot smoke passed");
