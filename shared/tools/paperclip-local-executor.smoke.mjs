#!/usr/bin/env node

import { __testables } from "./paperclip-local-executor.mjs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const localTask = {
  id: "issue-1",
  identifier: "MIN-200",
  title: "本地普通研发任务",
  status: "todo",
  assigneeAgentId: "fd835fc1-7e14-487f-ba02-45eed5f6c221",
  description: [
    "task_class: manual-review-required",
    "execution_route: local_manual_review",
    "source: user-request",
  ].join("\n"),
};

const summaryTask = {
  id: "issue-2",
  identifier: "MIN-133",
  title: "#31",
  status: "blocked",
  assigneeAgentId: "fd835fc1-7e14-487f-ba02-45eed5f6c221",
  description: [
    "automation_key: repo::ci::main::sha::commit-summary",
    "type:epic",
    "task_class: manual-review-required",
    "execution_route: local_manual_review",
    "source: automation-summary",
  ].join("\n"),
};

const serverTask = {
  id: "issue-3",
  identifier: "MIN-300",
  title: "服务器自动执行任务",
  status: "todo",
  assigneeAgentId: "fd835fc1-7e14-487f-ba02-45eed5f6c221",
  description: [
    "task_class: automation-execution",
    "execution_route: server_automation",
    "source: build-failure",
  ].join("\n"),
};

const agentCatalog = {
  "fd835fc1-7e14-487f-ba02-45eed5f6c221": {
    id: "fd835fc1-7e14-487f-ba02-45eed5f6c221",
    name: "Engineer",
    adapter: "codex_local",
  },
  "74eec73d-6752-4478-bbe2-6215be534715": {
    id: "74eec73d-6752-4478-bbe2-6215be534715",
    name: "Test / QA",
    adapter: "codex_local",
  },
  "2014e2cd-af7a-4be1-bb60-e6a324b7c3c1": {
    id: "2014e2cd-af7a-4be1-bb60-e6a324b7c3c1",
    name: "CEO",
    adapter: "claude_local",
  },
  "idea-agent": {
    id: "idea-agent",
    name: "Idea Clarifier",
    adapter: "pi_local",
  },
};

assert(__testables.isLocalExecutorIssue(localTask), "local task should be recognized");
assert(!__testables.isLocalExecutorIssue(serverTask), "server task should be rejected");
assert(!__testables.isEligibleExecutorIssue(summaryTask), "summary task should be excluded");
assert(__testables.isCommitSummaryIssue(summaryTask), "commit-summary parent should be recognized");
assert(__testables.isEligibleExecutorIssue(localTask), "plain local task should be eligible");

assert(
  __testables.resolveAdapter(agentCatalog["fd835fc1-7e14-487f-ba02-45eed5f6c221"]) === "codex_local",
  "engineer should resolve to codex_local",
);
assert(
  __testables.resolveAdapter(agentCatalog["2014e2cd-af7a-4be1-bb60-e6a324b7c3c1"]) === "claude_local",
  "ceo should resolve to claude_local",
);
assert(
  __testables.resolveAdapter(agentCatalog["idea-agent"]) === "pi_local",
  "idea clarifier should resolve to pi_local",
);

const selection = __testables.selectRunnableIssues({
  issues: [
    localTask,
    {
      ...localTask,
      id: "issue-4",
      identifier: "MIN-201",
      status: "blocked",
      assigneeAgentId: "fd835fc1-7e14-487f-ba02-45eed5f6c221",
    },
    {
      ...localTask,
      id: "issue-5",
      identifier: "MIN-202",
      assigneeAgentId: "74eec73d-6752-4478-bbe2-6215be534715",
    },
    summaryTask,
    serverTask,
  ],
  agentsById: agentCatalog,
  activeLocks: new Set(["fd835fc1-7e14-487f-ba02-45eed5f6c221"]),
});

assert(selection.runnable.length === 1, "only unlocked agent should receive one runnable task");
assert(selection.runnable[0].identifier === "MIN-202", "selection should keep one runnable issue for Test / QA");
assert(selection.skipped.some((item) => item.reason === "agent_locked"), "locked agent issue should be skipped");
assert(selection.skipped.some((item) => item.reason === "summary_parent"), "summary parent should be skipped");
assert(selection.skipped.some((item) => item.reason === "non_local_route"), "server route should be skipped");

const successPlan = __testables.buildStatusTransition({
  issue: localTask,
  outcome: "success",
  context: {
    host: "mac:xrMac.local",
    adapter: "codex_local",
    cwd: "/Users/xinran/Downloads/dev/mindsync",
    branch: "main",
    sha: "abc123",
  },
});
assert(successPlan.status === "in_review", "success should land in in_review");
assert(successPlan.comment.includes("- adapter: codex_local"), "success comment should include adapter");
assert(successPlan.comment.includes("- host: mac:xrMac.local"), "success comment should include host");

const blockedPlan = __testables.buildStatusTransition({
  issue: localTask,
  outcome: "blocked",
  errorSummary: "本地验证失败",
  context: {
    host: "mac:xrMac.local",
    adapter: "codex_local",
    cwd: "/Users/xinran/Downloads/dev/mindsync",
    branch: "main",
    sha: "abc123",
  },
});
assert(blockedPlan.status === "blocked", "failed execution should land in blocked");
assert(blockedPlan.comment.includes("本地验证失败"), "blocked comment should include error summary");

const piRuntime = __testables.resolveAdapterRuntime({
  adapter: "pi_local",
  availableCommands: new Set(["codex", "claude"]),
});
assert(piRuntime.ready === false, "pi runtime should be marked unavailable when pi command is missing");
assert(piRuntime.reason === "adapter_command_missing", "pi runtime should fail with adapter_command_missing");

const codexRuntime = __testables.resolveAdapterRuntime({
  adapter: "codex_local",
  availableCommands: new Set(["codex", "claude"]),
});
assert(codexRuntime.ready === true, "codex runtime should be ready when codex command exists");

const parsedExports = __testables.parseExportLines(
  [
    "export PAPERCLIP_API_URL='http://example.test'",
    "export PAPERCLIP_COMPANY_ID='company-1'",
    "export PAPERCLIP_AGENT_ID='agent-1'",
    "export PAPERCLIP_API_KEY='key-1'",
  ].join("\n"),
);
assert(parsedExports.PAPERCLIP_AGENT_ID === "agent-1", "export parser should extract PAPERCLIP_AGENT_ID");
assert(parsedExports.PAPERCLIP_API_KEY === "key-1", "export parser should extract PAPERCLIP_API_KEY");

console.log("paperclip-local-executor smoke passed");
