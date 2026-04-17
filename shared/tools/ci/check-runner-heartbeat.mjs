#!/usr/bin/env node

import process from "node:process";

import {
  collectGitBaseline,
  createGitHubApiHeaders,
  fetchJson,
  getOption,
  isoNow,
  logError,
  logInfo,
  parseArgs,
  summarizeExecutionBaseline,
  truthy,
} from "./common.mjs";
import { syncPaperclipIssue } from "./paperclip-sync-lib.mjs";

function hoursSince(isoTimestamp) {
  return (Date.now() - new Date(isoTimestamp).getTime()) / (1000 * 60 * 60);
}

function buildDiagnosisNote(diagnosis, maxQueuedMinutes, maxSuccessAgeHours) {
  if (diagnosis.runnerDiagnosis.accessDenied) {
    return "heartbeat token 缺少 repository self-hosted runners 读取权限";
  }
  if (!diagnosis.runnerDiagnosis.found) {
    return `runner ${diagnosis.runnerDiagnosis.runnerName} 未在 GitHub 注册列表中找到`;
  }
  if (diagnosis.runnerDiagnosis.online === false) {
    return `runner ${diagnosis.runnerDiagnosis.runnerName} 当前离线`;
  }
  if (!diagnosis.runnerDiagnosis.labelsMatch) {
    return `runner labels 不匹配，期望 ${diagnosis.runnerDiagnosis.expectedLabels.join(", ")}`;
  }
  if (diagnosis.latestRun && diagnosis.latestRun.status !== "completed" && diagnosis.queuedMinutes >= maxQueuedMinutes) {
    return `workflow ${diagnosis.latestRun.name ?? "ci"} 已处于 ${diagnosis.latestRun.status} 超过 ${maxQueuedMinutes} 分钟`;
  }
  if (diagnosis.latestSuccessAgeHours >= maxSuccessAgeHours) {
    return `最近一次成功运行距离当前已超过 ${maxSuccessAgeHours} 小时`;
  }
  return "runner heartbeat healthy";
}

function shouldTreatSuccessAgeAsUnhealthy(diagnosis, maxSuccessAgeHours) {
  if (!(diagnosis.latestSuccessAgeHours >= maxSuccessAgeHours)) {
    return false;
  }

  // 最新 run 已结束时，runner 至少仍可被调度，不应直接按 infra 阻塞。
  if (diagnosis.latestRun?.status === "completed") {
    return false;
  }

  return true;
}

function deriveBlockedReason({ unhealthy, diagnosis, executionBaseline }) {
  if (!unhealthy) {
    return null;
  }

  if (Array.isArray(executionBaseline?.driftReasons) && executionBaseline.driftReasons.length > 0) {
    return "workspace_drift";
  }

  if (diagnosis.runnerDiagnosis.accessDenied) {
    return "credential_missing";
  }

  return "infra_missing";
}

async function fetchLatestWorkflowState({ repository, workflowFile, branch, githubToken }) {
  const payload = await fetchJson(
    `https://api.github.com/repos/${repository}/actions/workflows/${workflowFile}/runs?branch=${encodeURIComponent(branch)}&per_page=10`,
    {
      headers: createGitHubApiHeaders(githubToken),
      timeoutMs: 30_000,
    },
  );

  const runs = payload.workflow_runs ?? [];
  const latest = runs[0] ?? null;
  const latestSuccessful = runs.find((run) => run.status === "completed" && run.conclusion === "success") ?? null;

  return {
    latest,
    latestSuccessful,
    queuedMinutes: latest ? hoursSince(latest.created_at) * 60 : 0,
    latestSuccessAgeHours: latestSuccessful ? hoursSince(latestSuccessful.updated_at) : Number.POSITIVE_INFINITY,
  };
}

async function fetchRunnerDiagnosis({ repository, runnerName, expectedLabels, githubToken }) {
  const response = await fetch(`https://api.github.com/repos/${repository}/actions/runners?per_page=100`, {
    headers: createGitHubApiHeaders(githubToken),
  });

  if (response.status === 403) {
    return {
      runnerName,
      found: null,
      online: null,
      accessDenied: true,
      expectedLabels,
      labels: [],
      labelsMatch: null,
    };
  }

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Failed to read runner list: HTTP ${response.status} ${text.slice(0, 400)}`);
  }
  const payload = text ? JSON.parse(text) : {};

  const runner = (payload.runners ?? []).find((item) => item.name === runnerName) ?? null;
  const labels = runner?.labels?.map((label) => label.name) ?? [];
  const normalizedLabels = labels.map((label) => label.toLowerCase());
  const normalizedExpectedLabels = expectedLabels.map((label) => label.toLowerCase());
  const labelsMatch = runner
    ? normalizedExpectedLabels.every((label) => normalizedLabels.includes(label))
    : false;

  return {
    runnerName,
    found: Boolean(runner),
    online: runner?.status === "online",
    accessDenied: false,
    expectedLabels,
    labels,
    labelsMatch,
  };
}

async function buildDiagnosis(options) {
  const workflowState = await fetchLatestWorkflowState(options);
  const runnerDiagnosis = await fetchRunnerDiagnosis(options);

  const latestRun = workflowState.latest
    ? {
        id: workflowState.latest.id,
        name: workflowState.latest.name,
        status: workflowState.latest.status,
        conclusion: workflowState.latest.conclusion,
        created_at: workflowState.latest.created_at,
        updated_at: workflowState.latest.updated_at,
        html_url: workflowState.latest.html_url,
        head_sha: workflowState.latest.head_sha,
      }
    : null;

  const latestSuccessfulRun = workflowState.latestSuccessful
    ? {
        id: workflowState.latestSuccessful.id,
        updated_at: workflowState.latestSuccessful.updated_at,
        html_url: workflowState.latestSuccessful.html_url,
      }
    : null;

  return {
    latestRun,
    latestSuccessfulRun,
    queuedMinutes: workflowState.queuedMinutes,
    latestSuccessAgeHours: workflowState.latestSuccessAgeHours,
    runnerDiagnosis,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || options.h) {
    console.log(`Usage:
  node shared/tools/ci/check-runner-heartbeat.mjs --repository <owner/repo> [--workflow-file aimandala-ci.yml] [--branch main]
`);
    return;
  }
  const repository = getOption(options, "repository", process.env.GITHUB_REPOSITORY);
  const githubToken = getOption(options, "github-token", process.env.GITHUB_TOKEN);
  const workflowFile = getOption(options, "workflow-file", "aimandala-ci.yml");
  const branch = getOption(options, "branch", "main");
  const runnerName = getOption(options, "runner-name", process.env.RUNNER_HEARTBEAT_RUNNER_NAME ?? "mindsync-ci");
  const expectedLabels = String(
    getOption(options, "expect-labels", process.env.RUNNER_HEARTBEAT_EXPECT_LABELS ?? "self-hosted,linux,mindsync-ci,aimandala"),
  )
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const maxQueuedMinutes = Number(getOption(options, "max-queued-minutes", process.env.RUNNER_HEARTBEAT_MAX_QUEUED_MINUTES ?? "20"));
  const maxSuccessAgeHours = Number(
    getOption(options, "max-success-age-hours", process.env.RUNNER_HEARTBEAT_MAX_SUCCESS_AGE_HOURS ?? "24"),
  );
  const companyId = getOption(options, "company-id", process.env.PAPERCLIP_COMPANY_ID ?? "be191a6e-7447-4821-a93d-9114214c4a64");
  const apiBase = getOption(options, "api-base", process.env.PAPERCLIP_API_BASE ?? "http://127.0.0.1:3100");
  const apiKey = getOption(options, "api-key", process.env.PAPERCLIP_API_KEY ?? null);
  const ownerAgentId = getOption(options, "owner-agent-id", process.env.PAPERCLIP_ENGINEER_AGENT_ID ?? null);
  const executionAdapter = getOption(
    options,
    "execution-adapter",
    process.env.PAPERCLIP_EXECUTION_ADAPTER ?? "github-actions/self-hosted-runner:runner-heartbeat",
  );
  const executionHost = getOption(
    options,
    "execution-host",
    process.env.PAPERCLIP_EXECUTION_HOST ?? process.env.HOSTNAME ?? null,
  );
  const softFail = truthy(getOption(options, "soft-fail", "1"));
  const mode = getOption(options, "mode", "sync");
  const printJson = truthy(getOption(options, "print-json", mode === "doctor" ? "1" : "0"));

  if (!repository || !githubToken) {
    throw new Error("repository and github token are required");
  }

  try {
    const diagnosis = await buildDiagnosis({
      repository,
      workflowFile,
      branch,
      githubToken,
      runnerName,
      expectedLabels,
    });

    const unhealthy =
      diagnosis.runnerDiagnosis.accessDenied ||
      !diagnosis.runnerDiagnosis.found ||
      diagnosis.runnerDiagnosis.online === false ||
      diagnosis.runnerDiagnosis.labelsMatch === false ||
      (diagnosis.latestRun && diagnosis.latestRun.status !== "completed" && diagnosis.queuedMinutes >= maxQueuedMinutes) ||
      shouldTreatSuccessAgeAsUnhealthy(diagnosis, maxSuccessAgeHours);

    const note = buildDiagnosisNote(diagnosis, maxQueuedMinutes, maxSuccessAgeHours);
    const executionBaseline = summarizeExecutionBaseline(await collectGitBaseline(process.cwd()), {
      expectedBranch: branch,
      expectedSha: diagnosis.latestRun?.head_sha ?? null,
    });
    const blockedReason = deriveBlockedReason({
      unhealthy,
      diagnosis,
      executionBaseline,
    });

    if (printJson) {
      console.log(
        JSON.stringify(
          {
            checked_at: isoNow(),
            unhealthy,
            note,
            diagnosis,
            executionBaseline,
          },
          null,
          2,
        ),
      );
    } else {
      logInfo(note);
    }

    if (mode === "doctor") {
      process.exit(unhealthy ? 2 : 0);
    }

    await syncPaperclipIssue({
      apiBase,
      apiKey,
      companyId,
      projectName: "一镜一梳",
      kind: "infra-runner-failure",
      workflow: "runner-heartbeat",
      repository,
      branch,
      job: "mindsync-ci-runner",
      sha: diagnosis.latestRun?.head_sha ?? null,
      runUrl: diagnosis.latestRun?.html_url ?? null,
      result: unhealthy ? "failed" : "resolved",
      statusOverride: unhealthy ? "blocked" : "done",
      ownerAgentId,
      ownerLabel: "Engineer",
      note,
      diagnosis: "基础设施问题",
      blockedReason,
      actionTaken: unhealthy
        ? "读取 workflow 最新运行状态、检查 runner 注册状态、比对 labels，并回写 Paperclip 基础设施异常单。"
        : "确认 runner 在线、labels 匹配，且最近 workflow 状态恢复正常。"
        ,
      nextStep: unhealthy
        ? "在 automation 节点执行 runner-doctor.sh，核对 runner 服务、GitHub token 权限与最新 workflow 状态，然后按 runbook 完成重注册或重跑。"
        : "保持 heartbeat 定时巡检，后续仅在再次出现 queued 超时或 runner 离线时重新开单。"
        ,
      unblockOwner: unhealthy ? "运维侧 / 具备 GitHub runner 管理权限的执行方" : null,
      phase: unhealthy ? "runner-heartbeat blocked" : "runner-heartbeat resolved",
      executionAdapter,
      executionHost,
      executionBaseline,
      summary: JSON.stringify(diagnosis, null, 2),
    });
    logInfo("Runner heartbeat issue synced");
  } catch (error) {
    if (softFail) {
      logInfo(`Runner heartbeat soft-failed: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    throw error;
  }
}

main().catch((error) => {
  logError(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
