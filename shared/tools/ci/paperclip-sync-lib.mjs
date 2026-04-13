#!/usr/bin/env node

import {
  PaperclipApi,
  extractAutomationKey,
  findIssueByAutomationKey,
  isoNow,
  listLabels,
  listProjectIssues,
  mapLabelsByName,
  resolveProjectByName,
  truncateText,
} from "./common.mjs";

const ISSUE_KIND_CONFIG = {
  "ci-test-failure": {
    titlePrefix: "CI失败",
    status: "todo",
    priority: "high",
    labelNames: ["type:execution"],
  },
  "build-failure": {
    titlePrefix: "构建失败",
    status: "todo",
    priority: "high",
    labelNames: ["type:execution"],
  },
  "deploy-or-smoke-failure": {
    titlePrefix: "部署风险",
    status: "in_review",
    priority: "critical",
    labelNames: ["type:artifact", "review:deliverable"],
  },
  "infra-runner-failure": {
    titlePrefix: "CI基础设施异常",
    status: "todo",
    priority: "critical",
    labelNames: ["type:execution"],
  },
};

function buildAutomationKey(options) {
  const parts = [
    options.repository ?? "unknown-repo",
    options.workflow ?? "unknown-workflow",
    options.branch ?? "unknown-branch",
    options.job ?? "unknown-job",
    options.kind,
  ];
  return parts.join("::");
}

function buildFailureTitle(config, options) {
  const jobPart = options.job ? `${options.job}` : "unknown-job";
  const branchPart = options.branch ? ` / ${options.branch}` : "";
  return `${config.titlePrefix}：${jobPart}${branchPart}`;
}

function buildDescription(config, options) {
  const issueMode = config.labelNames.includes("type:artifact") ? "artifact" : "execution";
  const lines = [];
  const owner = options.ownerLabel ?? options.ownerAgentId ?? "待指派";

  lines.push(`automation_key: ${options.automationKey}`);
  lines.push(`type:${issueMode}`);
  if (config.labelNames.includes("review:deliverable")) {
    lines.push("review:deliverable");
  }
  lines.push(`project: ${options.projectName}`);
  lines.push(`parent: ${options.automationKey}`);
  lines.push(`owner: ${owner}`);
  if (options.goalTitle) {
    lines.push(`goal: ${options.goalTitle}`);
  }
  lines.push(`source: ${options.kind}`);
  lines.push(`updated_at: ${isoNow()}`);
  lines.push("");

  if (issueMode === "execution") {
    lines.push("任务目标：");
    lines.push(`- 修复 ${options.workflow ?? "workflow"} 的 ${options.job ?? "job"} 检查失败`);
    lines.push("");
    lines.push("输入材料：");
    lines.push(`- repository: ${options.repository ?? "unknown"}`);
    lines.push(`- branch: ${options.branch ?? "unknown"}`);
    if (options.sha) {
      lines.push(`- commit: ${options.sha}`);
    }
    if (options.runUrl) {
      lines.push(`- run: ${options.runUrl}`);
    }
    if (options.failedStep) {
      lines.push(`- failed step: ${options.failedStep}`);
    }
    if (options.reproCommand) {
      lines.push(`- repro: ${options.reproCommand}`);
    }
    lines.push("");
    lines.push("artifact：");
    lines.push("- 修复 diff、修复分支或 PR");
    lines.push("- 对应 GitHub check 重新通过");
    lines.push("");
    lines.push("review goal：");
    lines.push("- 请确认对应检查已恢复为绿色，且根因与修复说明足以交接");
    lines.push("");
    lines.push("done when：");
    lines.push("- 同类失败在当前分支恢复为绿色");
    lines.push("- 根因、修复方式与残留风险已回写");
    lines.push("");
    lines.push("约束：");
    lines.push("- 不直接修改 main / release");
    lines.push("- 自动修复只允许测试、类型检查、构建和确定性脚本范围");
  } else {
    lines.push("输入材料：");
    lines.push(`- repository: ${options.repository ?? "unknown"}`);
    lines.push(`- branch: ${options.branch ?? "unknown"}`);
    if (options.sha) {
      lines.push(`- commit: ${options.sha}`);
    }
    if (options.runUrl) {
      lines.push(`- run: ${options.runUrl}`);
    }
    if (options.failedStep) {
      lines.push(`- failed step: ${options.failedStep}`);
    }
    if (options.reproCommand) {
      lines.push(`- repro: ${options.reproCommand}`);
    }
    lines.push("");
    lines.push("artifact：");
    lines.push(`- ${options.environment ?? "unknown"} 环境部署 / smoke 恢复说明`);
    lines.push("");
    lines.push("review goal：");
    lines.push(`- ${options.environment ?? "unknown"} 环境的部署链路与 smoke 风险是否已解除`);
    lines.push("");
    lines.push("通过意味着什么：");
    lines.push("- 对应 smoke 已恢复为绿色");
    lines.push("- 当前部署链路可以继续作为发布入口");
    lines.push("");
    lines.push("不通过时如何处理：");
    lines.push("- 保持问题单打开并继续按 runbook 排障");
    lines.push("");
    lines.push("done when：");
    lines.push("- 对应环境 smoke 恢复为绿色");
    lines.push("- 风险说明、根因和后续动作已回写");
  }

  if (options.summary) {
    lines.push("");
    lines.push("摘要日志：");
    lines.push("```text");
    lines.push(truncateText(options.summary, 3000) || "(empty)");
    lines.push("```");
  }

  return `${lines.join("\n")}\n`;
}

function buildComment(options) {
  const lines = [];
  lines.push(`CI同步时间：${isoNow()}`);
  lines.push(`- 结果：${options.result}`);
  if (options.runUrl) {
    lines.push(`- run: ${options.runUrl}`);
  }
  if (options.failedStep) {
    lines.push(`- failed step: ${options.failedStep}`);
  }
  if (options.repairBranch) {
    lines.push(`- repair branch: ${options.repairBranch}`);
  }
  if (options.repairPrUrl) {
    lines.push(`- repair pr: ${options.repairPrUrl}`);
  }
  if (options.note) {
    lines.push(`- note: ${options.note}`);
  }
  if (options.summary) {
    lines.push("");
    lines.push("日志摘要：");
    lines.push("```text");
    lines.push(truncateText(options.summary, 1500) || "(empty)");
    lines.push("```");
  }
  return `${lines.join("\n")}\n`;
}

export async function syncPaperclipIssue(options) {
  const config = ISSUE_KIND_CONFIG[options.kind];
  if (!config) {
    throw new Error(`Unsupported issue kind: ${options.kind}`);
  }

  const api = new PaperclipApi({
    apiBase: options.apiBase,
    apiKey: options.apiKey,
    companyId: options.companyId,
  });
  const project = await resolveProjectByName(api, options.companyId, options.projectName);
  const labels = await listLabels(api, options.companyId);
  const labelsByName = mapLabelsByName(labels);
  const labelIds = config.labelNames
    .map((name) => labelsByName.get(name)?.id)
    .filter(Boolean);
  const automationKey = options.automationKey ?? buildAutomationKey(options);
  const issues = await listProjectIssues(api, options.companyId, project.id);
  const existing = findIssueByAutomationKey(issues, automationKey);

  if (!existing && options.result === "resolved") {
    return {
      ok: true,
      action: "noop",
      reason: "No matching Paperclip issue to resolve",
      automationKey,
    };
  }

  const targetStatus = options.result === "resolved" ? "done" : config.status;
  const title = buildFailureTitle(config, options);
  const description = buildDescription(config, {
    ...options,
    automationKey,
    goalTitle: project.goals?.[0]?.title ?? null,
  });
  const payload = {
    title,
    description,
    status: targetStatus,
    priority: config.priority,
    projectId: project.id,
    goalId: project.goals?.[0]?.id ?? project.goalId ?? null,
    assigneeAgentId: options.ownerAgentId ?? null,
    labelIds,
  };

  if (!existing) {
    const created = await api.post(`/api/companies/${options.companyId}/issues`, payload);
    return {
      ok: true,
      action: "created",
      issueId: created.id,
      identifier: created.identifier,
      automationKey,
    };
  }

  const updated = await api.patch(`/api/issues/${existing.id}`, {
    ...payload,
    comment: buildComment(options),
  });

  return {
    ok: true,
    action: "updated",
    issueId: updated.id,
    identifier: updated.identifier,
    automationKey,
  };
}

export function maybeParseAutomationKey(description) {
  return extractAutomationKey(description);
}
