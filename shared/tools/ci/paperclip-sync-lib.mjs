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
  "lint-failure": {
    status: "todo",
    priority: "high",
    labelNames: ["type:execution"],
    severity: "error",
  },
  "format-failure": {
    status: "todo",
    priority: "high",
    labelNames: ["type:execution"],
    severity: "error",
  },
  "coverage-failure": {
    status: "todo",
    priority: "high",
    labelNames: ["type:execution"],
    severity: "error",
  },
  "ci-test-failure": {
    status: "todo",
    priority: "high",
    labelNames: ["type:execution"],
    severity: "error",
  },
  "build-failure": {
    status: "todo",
    priority: "high",
    labelNames: ["type:execution"],
    severity: "error",
  },
  "deploy-or-smoke-failure": {
    status: "in_review",
    priority: "critical",
    labelNames: ["type:artifact", "review:deliverable"],
    severity: "warning",
  },
  "infra-runner-failure": {
    status: "todo",
    priority: "critical",
    labelNames: ["type:execution"],
    severity: "error",
  },
};

const PARENT_LABEL_NAMES = ["type:epic"];
const KIND_DIAGNOSIS = {
  "lint-failure": "代码规范问题",
  "format-failure": "格式规范问题",
  "coverage-failure": "测试覆盖率问题",
  "ci-test-failure": "代码问题",
  "build-failure": "代码问题",
  "deploy-or-smoke-failure": "发布风险",
  "infra-runner-failure": "基础设施问题",
};
const BLOCKED_REASON_LABEL = {
  infra_missing: "infra_missing",
  credential_missing: "credential_missing",
  workspace_drift: "workspace_drift",
  human_action_required: "human_action_required",
};

function shortSha(sha) {
  const normalized = String(sha ?? "").trim();
  if (!normalized) {
    return "no-sha";
  }
  return normalized.slice(0, 8);
}

function formatIssueTime(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return isoNow().slice(0, 16).replace("T", " ");
  }
  return date.toISOString().slice(0, 16).replace("T", " ");
}

function formatTitleLabel(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return "Unknown";
  }
  return normalized
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      if (["ci", "qa", "api", "ui", "ux"].includes(lower)) {
        return lower.toUpperCase();
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("-");
}

function formatWorkflowTitleLabel(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "ci") {
    return "Aimandala-CI";
  }
  if (normalized === "deploy") {
    return "Aimandala-Deploy";
  }
  return formatTitleLabel(value);
}

function resolveIssueSeverity(config, options) {
  if (options.result === "resolved") {
    return "success";
  }
  return config?.severity ?? "error";
}

function prefixTitleWithSeverity(title, severity) {
  const normalized = String(title ?? "")
    .replace(/^(✅|⚠️|❌)\s+/, "")
    .trim();
  if (!normalized) {
    return String(title ?? "").trim();
  }
  return normalized;
}

function buildAutomationKey(options) {
  const parts = [
    options.repository ?? "unknown-repo",
    options.workflow ?? "unknown-workflow",
    options.branch ?? "unknown-branch",
    options.job ?? "unknown-job",
    options.sha ?? "no-sha",
    options.kind,
  ];
  return parts.join("::");
}

function buildCommitSummaryAutomationKey(options) {
  const parts = [
    options.repository ?? "unknown-repo",
    options.workflow ?? "unknown-workflow",
    options.branch ?? "unknown-branch",
    options.sha ?? "no-sha",
    "commit-summary",
  ];
  return parts.join("::");
}

function buildFailureTitle(_config, options) {
  const segments = [];
  if (options.sha) {
    segments.push(shortSha(options.sha));
  }
  segments.push(formatTitleLabel(options.job ?? "unknown-job"));
  segments.push(formatIssueTime(options.eventTime));
  return segments.join(" · ");
}

function buildCommitSummaryTitle(options) {
  const segments = [];
  if (options.sha) {
    segments.push(shortSha(options.sha));
  }
  segments.push(formatWorkflowTitleLabel(options.workflow ?? "workflow"));
  segments.push(formatIssueTime(options.eventTime));
  return segments.join(" · ");
}

function buildCommitSummaryDescription(options) {
  const lines = [];
  const owner = options.ownerLabel ?? options.ownerAgentId ?? "待指派";

  lines.push(`automation_key: ${options.parentAutomationKey}`);
  lines.push("type:epic");
  lines.push(`project: ${options.projectName}`);
  lines.push(`owner: ${owner}`);
  if (options.goalTitle) {
    lines.push(`goal: ${options.goalTitle}`);
  }
  lines.push(`workflow: ${options.workflow ?? "unknown"}`);
  lines.push(`branch: ${options.branch ?? "unknown"}`);
  if (options.sha) {
    lines.push(`commit: ${options.sha}`);
  }
  lines.push(`observed_at: ${formatIssueTime(options.eventTime)}Z`);
  lines.push(`updated_at: ${isoNow()}`);
  lines.push("");
  lines.push("任务目标：");
  lines.push(`- 汇总本次 ${options.workflow ?? "workflow"} 在当前 commit 下的 CI/CD 执行情况`);
  lines.push(`- 作为同一提交下各失败 job 的父任务入口`);
  lines.push("");
  lines.push("done when：");
  lines.push("- 本次提交对应 workflow 的失败项已全部恢复为绿色，或确认无需继续处理");
  lines.push("- 根因、修复方式与残留风险已能从子任务与评论中追溯");

  if (options.summary) {
    lines.push("");
    lines.push("摘要：");
    lines.push("```text");
    lines.push(truncateText(options.summary, 2000) || "(empty)");
    lines.push("```");
  }

  return `${lines.join("\n")}\n`;
}

function buildCommitSummaryComment(options) {
  const failedJobs = Array.isArray(options.failedJobs) ? options.failedJobs : [];
  const lines = [];
  lines.push(`CI汇总时间：${isoNow()}`);
  lines.push(`- 结果：${options.result}`);
  if (options.runUrl) {
    lines.push(`- run: ${options.runUrl}`);
  }
  if (typeof options.jobCount === "number" && Number.isFinite(options.jobCount)) {
    lines.push(`- jobs: ${failedJobs.length}/${options.jobCount} failed`);
  }
  if (failedJobs.length > 0) {
    lines.push(`- failed jobs: ${failedJobs.join(", ")}`);
  }
  if (options.summary) {
    lines.push("");
    lines.push("汇总摘要：");
    lines.push("```text");
    lines.push(truncateText(options.summary, 1500) || "(empty)");
    lines.push("```");
  }
  return `${lines.join("\n")}\n`;
}

function resolveDiagnosis(options) {
  return options.diagnosis ?? KIND_DIAGNOSIS[options.kind] ?? "待判断";
}

function formatExecutionBaselineLines(options) {
  const baseline = options.executionBaseline;
  if (!baseline) {
    return [];
  }

  const lines = [];
  lines.push("执行基线：");
  lines.push(`- cwd: ${baseline.cwd ?? "unknown"}`);

  if (baseline.available === false) {
    lines.push(`- baseline: unavailable (${baseline.error ?? "unknown error"})`);
    return lines;
  }

  lines.push(`- branch: ${baseline.branch ?? "detached"}`);
  lines.push(`- head: ${baseline.headSha ?? "unknown"}`);
  lines.push(`- dirty: ${baseline.dirty ? "true" : "false"}`);
  lines.push(`- untracked files: ${baseline.untrackedFiles?.length ?? 0}`);
  if (baseline.expectedBranch) {
    lines.push(`- expected branch: ${baseline.expectedBranch}`);
  }
  if (baseline.expectedSha) {
    lines.push(`- expected commit: ${baseline.expectedSha}`);
  }
  if (Array.isArray(baseline.driftReasons) && baseline.driftReasons.length > 0) {
    lines.push(`- drift: ${baseline.driftReasons.join(", ")}`);
  } else {
    lines.push("- drift: none");
  }
  return lines;
}

function buildDescription(config, options) {
  const issueMode = config.labelNames.includes("type:artifact") ? "artifact" : "execution";
  const lines = [];
  const owner = options.ownerLabel ?? options.ownerAgentId ?? "待指派";

  lines.push(`automation_key: ${options.automationKey}`);
  lines.push(`severity: ${config.severity}`);
  lines.push(`diagnosis: ${resolveDiagnosis(options)}`);
  lines.push(`type:${issueMode}`);
  if (config.labelNames.includes("review:deliverable")) {
    lines.push("review:deliverable");
  }
  lines.push(`project: ${options.projectName}`);
  if (options.parentAutomationKey) {
    lines.push(`parent: ${options.parentAutomationKey}`);
  }
  lines.push(`owner: ${owner}`);
  if (options.blockedReason) {
    lines.push(`blocked_reason: ${BLOCKED_REASON_LABEL[options.blockedReason] ?? options.blockedReason}`);
  }
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
    lines.push("- 自动修复只允许 lint、format、测试、类型检查、构建和确定性脚本范围");
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

  const baselineLines = formatExecutionBaselineLines(options);
  if (baselineLines.length > 0) {
    lines.push("");
    lines.push(...baselineLines);
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
  lines.push(`- 当前判断：${resolveDiagnosis(options)}`);
  if (options.phase) {
    lines.push(`- 当前阶段：${options.phase}`);
  }
  if (options.blockedReason) {
    lines.push(`- blocked reason: ${BLOCKED_REASON_LABEL[options.blockedReason] ?? options.blockedReason}`);
  }
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
  if (options.actionTaken) {
    lines.push("");
    lines.push("已做动作：");
    lines.push(`- ${options.actionTaken}`);
  }
  if (options.nextStep) {
    lines.push("");
    lines.push("下一步动作：");
    lines.push(`- ${options.nextStep}`);
  }
  if (options.unblockOwner) {
    lines.push("");
    lines.push("谁来解除阻塞：");
    lines.push(`- ${options.unblockOwner}`);
  }
  const baselineLines = formatExecutionBaselineLines(options);
  if (baselineLines.length > 0) {
    lines.push("");
    lines.push(...baselineLines);
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
  const parentAutomationKey =
    options.parentAutomationKey ?? (options.enableCommitParent ? buildCommitSummaryAutomationKey(options) : null);
  const issues = await listProjectIssues(api, options.companyId, project.id);
  const parentLabelIds = PARENT_LABEL_NAMES.map((name) => labelsByName.get(name)?.id).filter(Boolean);
  let parentIssue =
    parentAutomationKey != null ? findIssueByAutomationKey(issues, parentAutomationKey) : null;

  if (options.enableCommitParent && (options.result === "failed" || parentIssue)) {
    const parentPayload = {
      title: prefixTitleWithSeverity(
        buildCommitSummaryTitle(options),
        options.result === "resolved" ? "success" : "error",
      ),
      description: buildCommitSummaryDescription({
        ...options,
        parentAutomationKey,
        goalTitle: project.goals?.[0]?.title ?? null,
      }),
      status: options.result === "failed" ? "in_progress" : parentIssue?.status ?? "todo",
      priority: config.priority === "critical" ? "critical" : "high",
      projectId: project.id,
      goalId: project.goals?.[0]?.id ?? project.goalId ?? null,
      assigneeAgentId: options.ownerAgentId ?? null,
      labelIds: parentLabelIds,
    };

    if (!parentIssue) {
      parentIssue = await api.post(`/api/companies/${options.companyId}/issues`, parentPayload);
      issues.push(parentIssue);
    } else {
      parentIssue = await api.patch(`/api/issues/${parentIssue.id}`, parentPayload);
    }
  }

  const existing = findIssueByAutomationKey(issues, automationKey);

  if (!existing && options.result === "resolved") {
    return {
      ok: true,
      action: "noop",
      reason: "No matching Paperclip issue to resolve",
      automationKey,
    };
  }

  const targetStatus = options.statusOverride ?? (options.result === "resolved" ? "done" : config.status);
  const title = prefixTitleWithSeverity(
    buildFailureTitle(config, options),
    resolveIssueSeverity(config, options),
  );
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
    parentId: parentIssue?.id ?? options.parentId ?? null,
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

export async function syncPaperclipCommitSummary(options) {
  const api = new PaperclipApi({
    apiBase: options.apiBase,
    apiKey: options.apiKey,
    companyId: options.companyId,
  });
  const project = await resolveProjectByName(api, options.companyId, options.projectName);
  const labels = await listLabels(api, options.companyId);
  const labelsByName = mapLabelsByName(labels);
  const parentLabelIds = PARENT_LABEL_NAMES.map((name) => labelsByName.get(name)?.id).filter(Boolean);
  const parentAutomationKey = options.parentAutomationKey ?? buildCommitSummaryAutomationKey(options);
  const issues = await listProjectIssues(api, options.companyId, project.id);
  const existing = findIssueByAutomationKey(issues, parentAutomationKey);
  const payload = {
    title: prefixTitleWithSeverity(
      buildCommitSummaryTitle(options),
      options.result === "resolved" ? "success" : "error",
    ),
    description: buildCommitSummaryDescription({
      ...options,
      parentAutomationKey,
      goalTitle: project.goals?.[0]?.title ?? null,
    }),
    status: options.result === "failed" ? "in_progress" : "done",
    priority: options.result === "failed" ? "high" : "medium",
    projectId: project.id,
    goalId: project.goals?.[0]?.id ?? project.goalId ?? null,
    assigneeAgentId: options.ownerAgentId ?? null,
    labelIds: parentLabelIds,
  };

  if (!existing) {
    const created = await api.post(`/api/companies/${options.companyId}/issues`, payload);
    return {
      ok: true,
      action: "created",
      issueId: created.id,
      identifier: created.identifier,
      automationKey: parentAutomationKey,
    };
  }

  const updated = await api.patch(`/api/issues/${existing.id}`, {
    ...payload,
    comment: buildCommitSummaryComment(options),
  });

  return {
    ok: true,
    action: "updated",
    issueId: updated.id,
    identifier: updated.identifier,
    automationKey: parentAutomationKey,
  };
}

export function maybeParseAutomationKey(description) {
  return extractAutomationKey(description);
}
