#!/usr/bin/env node

import process from "node:process";

import {
  PaperclipApi,
  getOption,
  isoNow,
  listLabels,
  logError,
  logInfo,
  mapLabelsByName,
  parseArgs,
  resolveProjectByName,
  truthy,
} from "./common.mjs";

const DEFAULT_ENGINEER_AGENT_ID = "fd835fc1-7e14-487f-ba02-45eed5f6c221";
const DEFAULT_COMPANY_ID = "be191a6e-7447-4821-a93d-9114214c4a64";
const DEFAULT_PROJECT_NAME = "一镜一梳";
const HUMAN_REQUIRED_LABEL = "Human";
const PRIORITY_LABEL = "P1";

function printHelp() {
  console.log(`Usage:
  node shared/tools/ci/escalate-engineer-stuck-issues.mjs [options]

Options:
  --company-id <id>          Paperclip company id
  --project-name <name>      Project to inspect, defaults to 一镜一梳
  --engineer-agent-id <id>   Engineer agent id
  --human-user-id <id>       User id to assign escalated issues to
  --max-age-minutes <n>      Escalate Engineer in_progress issues older than this, default 90
  --max-failure-comments <n> Escalate if recent comments contain at least this many failure signals, default 3
  --include-age-threshold    Also escalate old in_progress issues without active runs or repeated failures
  --include-public-blocker   Also escalate suspected infra/auth/env/dependency/external-service blockers
  --apply                    Apply changes. Without this flag, prints dry-run JSON only.

Environment:
  PAPERCLIP_API_BASE
  PAPERCLIP_API_KEY
  PAPERCLIP_COMPANY_ID
  PAPERCLIP_ESCALATION_USER_ID
`);
}

function parseDate(value) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function minutesSince(value) {
  const timestamp = parseDate(value);
  if (timestamp == null) return null;
  return (Date.now() - timestamp) / (1000 * 60);
}

function labelNames(issue) {
  return (issue.labels ?? [])
    .map((label) => label?.name)
    .filter((name) => typeof name === "string");
}

function hasLabel(issue, name) {
  return labelNames(issue).includes(name);
}

function hasBlockedHumanEscalation(issue) {
  return issue.status === "blocked" && hasLabel(issue, HUMAN_REQUIRED_LABEL);
}

function isEngineerIssue(issue, engineerAgentId) {
  return issue.assigneeAgentId === engineerAgentId
    || issue.assignee?.id === engineerAgentId
    || issue.assigneeAgent?.id === engineerAgentId;
}

function commentText(comment) {
  return [
    comment?.body,
    comment?.content,
    comment?.text,
    comment?.message,
  ].filter(Boolean).join("\n");
}

function isFailureSignal(comment) {
  const text = commentText(comment).toLowerCase();
  if (!text) return false;
  return [
    "failed",
    "failure",
    "error",
    "exception",
    "blocked",
    "无法",
    "失败",
    "报错",
    "卡住",
    "未解决",
    "不能继续",
  ].some((token) => text.includes(token));
}

function classifyPublicBlocker(comments) {
  const text = comments.map(commentText).join("\n").toLowerCase();
  const blockerTokens = [
    "infra",
    "auth",
    "credential",
    "permission",
    "env",
    "dependency",
    "external service",
    "api key",
    "token",
    "network",
    "proxy",
    "环境变量",
    "权限",
    "密钥",
    "凭证",
    "依赖",
    "外部服务",
    "网络",
  ];
  return blockerTokens.some((token) => text.includes(token));
}

function buildEscalationComment({ issue, reason, ageMinutes, failureSignals, publicBlocker, maxAgeMinutes, maxFailureComments }) {
  const lines = [];
  lines.push(`Engineer 转人工巡检时间：${isoNow()}`);
  lines.push("");
  lines.push("当前判断：");
  lines.push(`- escalation reason: ${reason}`);
  lines.push(`- issue: ${issue.identifier ?? issue.id}`);
  lines.push(`- status before escalation: ${issue.status}`);
  lines.push(`- age minutes: ${ageMinutes == null ? "unknown" : Math.round(ageMinutes)}`);
  lines.push(`- failure signals: ${failureSignals}`);
  lines.push(`- public blocker suspected: ${publicBlocker ? "yes" : "no"}`);
  lines.push("");
  lines.push("触发阈值：");
  lines.push(`- max age minutes: ${maxAgeMinutes}`);
  lines.push(`- max failure comments: ${maxFailureComments}`);
  lines.push("");
  lines.push("已做动作：");
  lines.push("- 停止让 Engineer 在同一任务上继续无限尝试");
  lines.push("- 将任务转为 blocked");
  lines.push(`- 添加 ${HUMAN_REQUIRED_LABEL}`);
  lines.push("- 若配置了 PAPERCLIP_ESCALATION_USER_ID，则转交给用户本人");
  lines.push("");
  lines.push("建议人工先处理：");
  lines.push("- 查看最近失败日志和评论中的公共卡点");
  lines.push("- 优先清理 infra / auth / env / dependency / external service 类阻塞");
  lines.push("- 清障后再恢复 Engineer 或重新 assign 给合适 Agent");
  return `${lines.join("\n")}\n`;
}

async function resolveLabelIds(api, companyId, issue, names) {
  const labels = await listLabels(api, companyId);
  const labelsByName = mapLabelsByName(labels);
  const existingLabelIds = (issue.labels ?? []).map((label) => label.id).filter(Boolean);
  const requestedLabelIds = names.map((name) => labelsByName.get(name)?.id).filter(Boolean);
  return Array.from(new Set([...existingLabelIds, ...requestedLabelIds]));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || options.h) {
    printHelp();
    return;
  }

  const apiBase = getOption(options, "api-base", process.env.PAPERCLIP_API_BASE ?? "http://127.0.0.1:3100");
  const apiKey = getOption(options, "api-key", process.env.PAPERCLIP_API_KEY ?? null);
  const companyId = getOption(options, "company-id", process.env.PAPERCLIP_COMPANY_ID ?? DEFAULT_COMPANY_ID);
  const projectName = getOption(options, "project-name", process.env.PAPERCLIP_PROJECT_NAME ?? DEFAULT_PROJECT_NAME);
  const engineerAgentId = getOption(options, "engineer-agent-id", process.env.PAPERCLIP_ENGINEER_AGENT_ID ?? DEFAULT_ENGINEER_AGENT_ID);
  const humanUserId = getOption(options, "human-user-id", process.env.PAPERCLIP_ESCALATION_USER_ID ?? null);
  const maxAgeMinutes = Number(getOption(options, "max-age-minutes", process.env.PAPERCLIP_ENGINEER_ESCALATE_MAX_AGE_MINUTES ?? "90"));
  const maxFailureComments = Number(getOption(options, "max-failure-comments", process.env.PAPERCLIP_ENGINEER_ESCALATE_MAX_FAILURE_COMMENTS ?? "3"));
  const includeAgeThreshold = truthy(getOption(options, "include-age-threshold", process.env.PAPERCLIP_ENGINEER_ESCALATE_INCLUDE_AGE_THRESHOLD ?? "0"));
  const includePublicBlocker = truthy(getOption(options, "include-public-blocker", process.env.PAPERCLIP_ENGINEER_ESCALATE_INCLUDE_PUBLIC_BLOCKER ?? "0"));
  const apply = truthy(getOption(options, "apply", "0"));

  const api = new PaperclipApi({ apiBase, apiKey, companyId });
  const project = await resolveProjectByName(api, companyId, projectName);
  const issues = await api.get(`/api/companies/${companyId}/issues?projectId=${encodeURIComponent(project.id)}`);
  const candidates = (issues ?? []).filter((issue) => {
    if (!isEngineerIssue(issue, engineerAgentId)) return false;
    if (!["todo", "in_progress"].includes(issue.status)) return false;
    return !hasBlockedHumanEscalation(issue);
  });

  const escalations = [];
  for (const issue of candidates) {
    const comments = await api.get(`/api/issues/${issue.id}/comments`).catch(() => []);
    const failureSignals = (comments ?? []).filter(isFailureSignal).length;
    const publicBlocker = classifyPublicBlocker(comments ?? []);
    const ageMinutes = minutesSince(issue.startedAt ?? issue.updatedAt ?? issue.createdAt);

    let reason = null;
    if (includePublicBlocker && publicBlocker) {
      reason = "public_blocker";
    } else if (failureSignals >= maxFailureComments) {
      reason = "repeated_failure";
    } else if (
      includeAgeThreshold
      && issue.activeRun
      && ageMinutes != null
      && ageMinutes >= maxAgeMinutes
      && issue.status === "in_progress"
    ) {
      reason = "age_threshold";
    }

    if (!reason) continue;

    const escalation = {
      issueId: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      reason,
      ageMinutes: ageMinutes == null ? null : Math.round(ageMinutes),
      failureSignals,
      publicBlocker,
      apply,
    };
    escalations.push(escalation);

    if (!apply) continue;

    const labelIds = await resolveLabelIds(api, companyId, issue, [HUMAN_REQUIRED_LABEL, PRIORITY_LABEL]);
    const payload = {
      status: "blocked",
      labelIds,
      comment: buildEscalationComment({
        issue,
        reason,
        ageMinutes,
        failureSignals,
        publicBlocker,
        maxAgeMinutes,
        maxFailureComments,
      }),
    };

    if (humanUserId) {
      payload.assigneeAgentId = null;
      payload.assigneeUserId = humanUserId;
    }

    await api.patch(`/api/issues/${issue.id}`, payload);
  }

  if (escalations.length === 0) {
    logInfo("No Engineer issues require human escalation");
    return;
  }

  logInfo(`${apply ? "Escalated" : "Would escalate"} ${escalations.length} Engineer issue(s)`);
  console.log(JSON.stringify({
    checkedAt: isoNow(),
    projectName,
    engineerAgentId,
    humanUserId,
    includeAgeThreshold,
    includePublicBlocker,
    escalations,
  }, null, 2));
}

main().catch((error) => {
  logError(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
