#!/usr/bin/env node

import process from "node:process";

import {
  createGitHubApiHeaders,
  fetchJson,
  getOption,
  isoNow,
  logError,
  logInfo,
  parseArgs,
  truthy,
} from "./common.mjs";
import { syncPaperclipIssue } from "./paperclip-sync-lib.mjs";

function hoursSince(isoTimestamp) {
  return (Date.now() - new Date(isoTimestamp).getTime()) / (1000 * 60 * 60);
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
  const maxQueuedMinutes = Number(getOption(options, "max-queued-minutes", "20"));
  const maxSuccessAgeHours = Number(getOption(options, "max-success-age-hours", "24"));
  const companyId = getOption(options, "company-id", process.env.PAPERCLIP_COMPANY_ID ?? "be191a6e-7447-4821-a93d-9114214c4a64");
  const apiBase = getOption(options, "api-base", process.env.PAPERCLIP_API_BASE ?? "http://127.0.0.1:3100");
  const apiKey = getOption(options, "api-key", process.env.PAPERCLIP_API_KEY ?? null);
  const ownerAgentId = getOption(options, "owner-agent-id", process.env.PAPERCLIP_ENGINEER_AGENT_ID ?? null);
  const softFail = truthy(getOption(options, "soft-fail", "1"));

  if (!repository || !githubToken) {
    throw new Error("repository and github token are required");
  }

  try {
    const payload = await fetchJson(
      `https://api.github.com/repos/${repository}/actions/workflows/${workflowFile}/runs?branch=${encodeURIComponent(branch)}&per_page=10`,
      {
        headers: createGitHubApiHeaders(githubToken),
        timeoutMs: 30_000,
      },
    );

    const runs = payload.workflow_runs ?? [];
    const latest = runs[0];
    if (!latest) {
      logInfo("No workflow runs found for runner heartbeat check");
      return;
    }

    const queuedHours = hoursSince(latest.created_at);
    const latestSuccessful = runs.find((run) => run.status === "completed" && run.conclusion === "success") ?? null;
    const latestSuccessAgeHours = latestSuccessful ? hoursSince(latestSuccessful.updated_at) : Number.POSITIVE_INFINITY;

    const unhealthy =
      (latest.status !== "completed" && queuedHours * 60 >= maxQueuedMinutes) ||
      latestSuccessAgeHours >= maxSuccessAgeHours;

    if (!unhealthy) {
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
        sha: latest.head_sha,
        runUrl: latest.html_url,
        result: "resolved",
        ownerAgentId,
        ownerLabel: "Engineer",
        note: `runner heartbeat healthy at ${isoNow()}`,
      });
      logInfo("Runner heartbeat healthy");
      return;
    }

    const note =
      latest.status !== "completed" && queuedHours * 60 >= maxQueuedMinutes
        ? `workflow ${latest.name} 已处于 ${latest.status} 超过 ${maxQueuedMinutes} 分钟`
        : `最近一次成功运行距离当前已超过 ${maxSuccessAgeHours} 小时`;

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
      sha: latest.head_sha,
      runUrl: latest.html_url,
      result: "failed",
      ownerAgentId,
      ownerLabel: "Engineer",
      note,
      summary: JSON.stringify(
        {
          latestRun: {
            id: latest.id,
            status: latest.status,
            conclusion: latest.conclusion,
            created_at: latest.created_at,
            updated_at: latest.updated_at,
          },
          latestSuccessfulRun: latestSuccessful
            ? {
                id: latestSuccessful.id,
                updated_at: latestSuccessful.updated_at,
              }
            : null,
        },
        null,
        2,
      ),
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
