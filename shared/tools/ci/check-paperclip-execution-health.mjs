#!/usr/bin/env node

import process from "node:process";

import {
  PaperclipApi,
  getOption,
  isoNow,
  logError,
  logInfo,
  parseArgs,
  truthy,
} from "./common.mjs";

function minutesSince(isoTimestamp) {
  return (Date.now() - new Date(isoTimestamp).getTime()) / (1000 * 60);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || options.h) {
    console.log(`Usage:
  node shared/tools/ci/check-paperclip-execution-health.mjs --company-id <id> --project-name <name> [--stale-minutes 15] [--apply]
`);
    return;
  }

  const apiBase = getOption(options, "api-base", process.env.PAPERCLIP_API_BASE ?? "http://127.0.0.1:3100");
  const apiKey = getOption(options, "api-key", process.env.PAPERCLIP_API_KEY ?? null);
  const companyId = getOption(options, "company-id", process.env.PAPERCLIP_COMPANY_ID ?? null);
  const projectName = getOption(options, "project-name", process.env.PAPERCLIP_PROJECT_NAME ?? "一镜一梳");
  const staleMinutes = Number(getOption(options, "stale-minutes", process.env.PAPERCLIP_EXECUTION_STALE_MINUTES ?? "15"));
  const apply = truthy(getOption(options, "apply", "0"));

  if (!companyId) {
    throw new Error("company id is required");
  }

  const api = new PaperclipApi({ apiBase, apiKey, companyId });
  const projects = await api.get(`/api/companies/${companyId}/projects`);
  const project = (projects ?? []).find((item) => item.name === projectName);
  if (!project) {
    throw new Error(`Unable to resolve project: ${projectName}`);
  }

  const issues = await api.get(`/api/companies/${companyId}/issues?projectId=${encodeURIComponent(project.id)}`);
  const candidates = (issues ?? []).filter((issue) => {
    if (!issue.activeRun || issue.activeRun.status !== "running") {
      return false;
    }
    const lastActivity = issue.lastActivityAt ?? issue.updatedAt ?? issue.activeRun.startedAt;
    return minutesSince(lastActivity) >= staleMinutes;
  });

  const staleIssues = [];
  for (const issue of candidates) {
    const comments = await api.get(`/api/issues/${issue.id}/comments`);
    const latestCommentAt = comments?.[comments.length - 1]?.createdAt ?? null;
    const minutesWithoutComment = issue.activeRun?.startedAt ? minutesSince(issue.activeRun.startedAt) : null;
    const noProgressComment =
      !latestCommentAt || (issue.activeRun?.startedAt && new Date(latestCommentAt).getTime() < new Date(issue.activeRun.startedAt).getTime());

    if (!noProgressComment) {
      continue;
    }

    staleIssues.push({
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      lastActivityAt: issue.lastActivityAt ?? issue.updatedAt ?? null,
      activeRunId: issue.activeRun?.id ?? null,
      activeRunStartedAt: issue.activeRun?.startedAt ?? null,
      minutesWithoutComment,
    });

    if (!apply) {
      continue;
    }

    await api.patch(`/api/issues/${issue.id}`, {
      status: "blocked",
      comment: [
        `执行健康巡检时间：${isoNow()}`,
        "- 当前判断：执行卡住 / 缺少运行中回写",
        "- blocked reason: human_action_required",
        `- active run: ${issue.activeRun?.id ?? "unknown"}`,
        `- started at: ${issue.activeRun?.startedAt ?? "unknown"}`,
        `- stale threshold: ${staleMinutes} min`,
        "",
        "已做动作：",
        "- 巡检到 issue 仍显示 running，但在阈值内没有新的进度评论或状态回写，先转为 blocked 以避免面板误导。",
        "",
        "下一步动作：",
        "- 检查对应 agent run 日志、当前工作区状态和实际执行卡点；若仍需继续执行，再由 owner 重新接手并补第一条进度评论。",
        "",
        "谁来解除阻塞：",
        "- 当前任务 owner / 具备运行日志访问权限的运维执行方",
      ].join("\n"),
    });
  }

  if (staleIssues.length === 0) {
    logInfo("No stale running issues detected");
    return;
  }

  logInfo(`Detected ${staleIssues.length} stale running issue(s)`);
  console.log(JSON.stringify({ checkedAt: isoNow(), staleIssues }, null, 2));
}

main().catch((error) => {
  logError(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
