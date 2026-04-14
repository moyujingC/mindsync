#!/usr/bin/env node

import fs from "node:fs/promises";
import process from "node:process";

import {
  buildRunUrl,
  createGitHubApiHeaders,
  fetchJson,
  getChangedFiles,
  getOption,
  logError,
  logInfo,
  logWarn,
  parseArgs,
  runShellCommand,
  truncateText,
  truthy,
} from "./common.mjs";
import { syncPaperclipIssue } from "./paperclip-sync-lib.mjs";

const REPAIR_PROFILES = [
  {
    jobName: "frontend-ci",
    stepName: "Run Vitest",
    kind: "ci-test-failure",
    reproCommand: "npm --prefix projects/aimandala/toC/app/frontend test",
    allowedPaths: ["projects/aimandala/toC/app/frontend/"],
  },
  {
    jobName: "frontend-ci",
    stepName: "Run Typecheck",
    kind: "ci-test-failure",
    reproCommand: "npm --prefix projects/aimandala/toC/app/frontend run typecheck",
    allowedPaths: ["projects/aimandala/toC/app/frontend/"],
  },
  {
    jobName: "frontend-ci",
    stepName: "Run Mobile Web Build",
    kind: "build-failure",
    reproCommand: "npm --prefix projects/aimandala/toC/app/frontend run build:mobile-web",
    allowedPaths: ["projects/aimandala/toC/app/frontend/"],
  },
  {
    jobName: "backend-ci",
    stepName: "Run Pytest",
    kind: "ci-test-failure",
    reproCommand: "PYTHONPATH=projects/aimandala/toC/app/backend pytest -q projects/aimandala/toC/app/backend/tests/unit",
    allowedPaths: ["projects/aimandala/toC/app/backend/"],
  },
  {
    jobName: "knowledge-ci",
    stepName: "Run Knowledge Validation",
    kind: "ci-test-failure",
    reproCommand: "PYTHONPATH=projects/aimandala/toC/app/backend python3 projects/aimandala/toC/app/backend/scripts/validate_knowledge_workbench.py",
    allowedPaths: [
      "projects/aimandala/toC/app/backend/",
      "projects/aimandala/fixtures/",
    ],
  },
  {
    jobName: "knowledge-ci",
    stepName: "Run Knowledge Evals",
    kind: "ci-test-failure",
    reproCommand: "PYTHONPATH=projects/aimandala/toC/app/backend python3 projects/aimandala/toC/app/backend/scripts/run_knowledge_evals.py --build-selector current",
    allowedPaths: [
      "projects/aimandala/toC/app/backend/",
      "projects/aimandala/fixtures/",
    ],
  },
];

async function listFailedJobs(repository, runId, token) {
  const jobs = [];
  let page = 1;

  while (true) {
    const payload = await fetchJson(
      `https://api.github.com/repos/${repository}/actions/runs/${runId}/jobs?per_page=100&page=${page}`,
      {
        headers: createGitHubApiHeaders(token),
        timeoutMs: 30_000,
      },
    );
    jobs.push(...(payload.jobs ?? []));
    if (!payload.jobs?.length || jobs.length >= (payload.total_count ?? 0)) {
      break;
    }
    page += 1;
  }

  return jobs.filter((job) => job.conclusion === "failure" || job.conclusion === "timed_out");
}

function resolveFailedStep(job) {
  return job.steps?.find((step) => step.conclusion === "failure")?.name ?? null;
}

function findRepairProfile(jobName, failedStep) {
  return (
    REPAIR_PROFILES.find(
      (profile) => profile.jobName === jobName && profile.stepName === failedStep,
    ) ?? null
  );
}

async function createPullRequest({ repository, token, head, base, title, body }) {
  return fetchJson(`https://api.github.com/repos/${repository}/pulls`, {
    method: "POST",
    headers: {
      ...createGitHubApiHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      head,
      base,
      body,
      draft: true,
    }),
    timeoutMs: 30_000,
  });
}

function changedFilesStayWithinAllowlist(files, allowlist) {
  return files.every((file) => allowlist.some((allowedPath) => file.startsWith(allowedPath)));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || options.h) {
    console.log(`Usage:
  node shared/tools/ci/aimandala-auto-repair.mjs --event-path <github-event.json> --repository <owner/repo> [--repair-command "<cmd>"]
`);
    return;
  }
  const repository = getOption(options, "repository", process.env.GITHUB_REPOSITORY);
  const githubToken = getOption(options, "github-token", process.env.GITHUB_TOKEN);
  const eventPath = getOption(options, "event-path", process.env.GITHUB_EVENT_PATH);
  const autoRepairCommand = getOption(options, "repair-command", process.env.AIMANDALA_AUTO_REPAIR_COMMAND ?? null);
  const autoRepairPush = truthy(getOption(options, "push", process.env.AIMANDALA_AUTO_REPAIR_PUSH ?? "1"));
  const autoRepairCreatePr = truthy(
    getOption(options, "create-pr", process.env.AIMANDALA_AUTO_REPAIR_CREATE_PR ?? "1"),
  );
  const paperclipApiBase = getOption(options, "api-base", process.env.PAPERCLIP_API_BASE ?? "http://127.0.0.1:3100");
  const paperclipApiKey = getOption(options, "api-key", process.env.PAPERCLIP_API_KEY ?? null);
  const companyId = getOption(options, "company-id", process.env.PAPERCLIP_COMPANY_ID ?? "be191a6e-7447-4821-a93d-9114214c4a64");
  const ownerAgentId = getOption(options, "owner-agent-id", process.env.PAPERCLIP_ENGINEER_AGENT_ID ?? null);

  if (!repository || !githubToken || !eventPath) {
    throw new Error("repository, github token, and event path are required");
  }

  const event = JSON.parse(await fs.readFile(eventPath, "utf8"));
  const workflowRun = event.workflow_run;
  if (!workflowRun) {
    throw new Error("workflow_run payload is missing from event");
  }

  const failedJobs = await listFailedJobs(repository, workflowRun.id, githubToken);
  const failedJob = failedJobs[0];
  if (!failedJob) {
    logInfo("No failed jobs found in workflow run payload");
    return;
  }

  const failedStep = resolveFailedStep(failedJob);
  const profile = findRepairProfile(failedJob.name, failedStep);
  const kind = profile?.kind ?? "ci-test-failure";
  const runUrl = workflowRun.html_url ?? buildRunUrl(repository, workflowRun.id);
  const note = profile
    ? "命中自动修复白名单，准备尝试隔离分支修复。"
    : "未命中自动修复白名单，本轮仅建单与回写日志。";

  const issueResult = await syncPaperclipIssue({
    apiBase: paperclipApiBase,
    apiKey: paperclipApiKey,
    companyId,
    projectName: "一镜一梳",
    kind,
    workflow: "ci",
    repository,
    branch: workflowRun.head_branch,
    job: failedJob.name,
    sha: workflowRun.head_sha,
    runUrl,
    failedStep,
    reproCommand: profile?.reproCommand ?? null,
    result: "failed",
    ownerAgentId,
    ownerLabel: "Engineer",
    summary: `workflow=${workflowRun.name}\njob=${failedJob.name}\nstep=${failedStep ?? "unknown"}\nconclusion=${failedJob.conclusion}`,
    note,
  });

  if (!profile) {
    logWarn("Failed job is not in the auto-repair whitelist; leaving issue open.");
    return;
  }

  if (!autoRepairCommand) {
    logWarn("AIMANDALA_AUTO_REPAIR_COMMAND is not configured; leaving issue open for manual follow-up.");
    return;
  }

  await syncPaperclipIssue({
    apiBase: paperclipApiBase,
    apiKey: paperclipApiKey,
    companyId,
    projectName: "一镜一梳",
    kind,
    workflow: "ci",
    repository,
    branch: workflowRun.head_branch,
    job: failedJob.name,
    sha: workflowRun.head_sha,
    runUrl,
    failedStep,
    reproCommand: profile.reproCommand,
    result: "failed",
    statusOverride: "in_progress",
    ownerAgentId,
    ownerLabel: "Engineer",
    note: "自动修复已接手，正在隔离分支尝试修复并复跑。",
  });

  const branchName = `codex/auto-fix/${workflowRun.id}`;
  const checkout = await runShellCommand(`git checkout -B ${branchName} ${workflowRun.head_sha}`);
  if (checkout.code !== 0) {
    throw new Error(`Failed to create auto-repair branch: ${truncateText(checkout.stderr || checkout.stdout, 1200)}`);
  }

  const repairRun = await runShellCommand(autoRepairCommand, {
    env: {
      AIMANDALA_FAILED_JOB: failedJob.name,
      AIMANDALA_FAILED_STEP: failedStep ?? "",
      AIMANDALA_FAILED_SHA: workflowRun.head_sha,
      AIMANDALA_FAILED_BRANCH: workflowRun.head_branch,
      AIMANDALA_REPRO_COMMAND: profile.reproCommand,
      AIMANDALA_ALLOWED_PATHS: profile.allowedPaths.join(":"),
      AIMANDALA_PAPERCLIP_ISSUE_ID: issueResult.issueId ?? "",
      AIMANDALA_PAPERCLIP_ISSUE_IDENTIFIER: issueResult.identifier ?? "",
    },
  });

  if (repairRun.code !== 0) {
    await syncPaperclipIssue({
      apiBase: paperclipApiBase,
      apiKey: paperclipApiKey,
      companyId,
      projectName: "一镜一梳",
      kind,
      workflow: "ci",
      repository,
      branch: workflowRun.head_branch,
      job: failedJob.name,
      sha: workflowRun.head_sha,
      runUrl,
      failedStep,
      reproCommand: profile.reproCommand,
      result: "failed",
      statusOverride: "in_progress",
      ownerAgentId,
      ownerLabel: "Engineer",
      note: "自动修复命令执行失败，已保留问题单等待人工处理。",
      summary: repairRun.stderr || repairRun.stdout,
    });
    throw new Error(`Auto-repair command failed: ${truncateText(repairRun.stderr || repairRun.stdout, 1600)}`);
  }

  const reproResult = await runShellCommand(profile.reproCommand);
  if (reproResult.code !== 0) {
    await syncPaperclipIssue({
      apiBase: paperclipApiBase,
      apiKey: paperclipApiKey,
      companyId,
      projectName: "一镜一梳",
      kind,
      workflow: "ci",
      repository,
      branch: workflowRun.head_branch,
      job: failedJob.name,
      sha: workflowRun.head_sha,
      runUrl,
      failedStep,
      reproCommand: profile.reproCommand,
      result: "failed",
      statusOverride: "in_progress",
      ownerAgentId,
      ownerLabel: "Engineer",
      note: "自动修复后复跑仍失败，问题单继续保留。",
      summary: reproResult.stderr || reproResult.stdout,
    });
    throw new Error(`Auto-repair repro command still fails: ${truncateText(reproResult.stderr || reproResult.stdout, 1600)}`);
  }

  const changedFiles = await getChangedFiles(process.cwd());
  if (changedFiles.length === 0) {
    await syncPaperclipIssue({
      apiBase: paperclipApiBase,
      apiKey: paperclipApiKey,
      companyId,
      projectName: "一镜一梳",
      kind,
      workflow: "ci",
      repository,
      branch: workflowRun.head_branch,
      job: failedJob.name,
      sha: workflowRun.head_sha,
      runUrl,
      failedStep,
      reproCommand: profile.reproCommand,
      result: "failed",
      statusOverride: "in_progress",
      ownerAgentId,
      ownerLabel: "Engineer",
      note: "自动修复复跑已通过，但工作区没有产生可提交 diff，问题单继续保留。",
    });
    return;
  }

  if (!changedFilesStayWithinAllowlist(changedFiles, profile.allowedPaths)) {
    throw new Error(`Auto-repair touched files outside allowlist: ${changedFiles.join(", ")}`);
  }

  await runShellCommand("git config user.name 'github-actions[bot]'");
  await runShellCommand("git config user.email '41898282+github-actions[bot]@users.noreply.github.com'");
  await runShellCommand("git add .");
  const commit = await runShellCommand(
    `git commit -m ${JSON.stringify(`chore: auto-repair ${failedJob.name} (${failedStep ?? "unknown-step"})`)}`,
  );
  if (commit.code !== 0) {
    throw new Error(`Failed to create auto-repair commit: ${truncateText(commit.stderr || commit.stdout, 1200)}`);
  }

  let prUrl = null;
  if (autoRepairPush) {
    const push = await runShellCommand(`git push origin ${branchName} --force-with-lease`);
    if (push.code !== 0) {
      throw new Error(`Failed to push auto-repair branch: ${truncateText(push.stderr || push.stdout, 1200)}`);
    }
  }

  if (autoRepairPush && autoRepairCreatePr) {
    const pullRequest = await createPullRequest({
      repository,
      token: githubToken,
      head: branchName,
      base: workflowRun.head_branch,
      title: `Auto repair: ${failedJob.name}${failedStep ? ` / ${failedStep}` : ""}`,
      body: [
        "## Auto repair context",
        `- workflow run: ${runUrl}`,
        `- failing job: ${failedJob.name}`,
        failedStep ? `- failing step: ${failedStep}` : null,
        `- repro command: \`${profile.reproCommand}\``,
        "",
        "## Safety",
        `- allowed paths: ${profile.allowedPaths.join(", ")}`,
        "- branch is isolated and the PR is opened as draft",
      ]
        .filter(Boolean)
        .join("\n"),
    });
    prUrl = pullRequest.html_url ?? null;
  }

  await syncPaperclipIssue({
    apiBase: paperclipApiBase,
    apiKey: paperclipApiKey,
    companyId,
    projectName: "一镜一梳",
    kind,
    workflow: "ci",
    repository,
    branch: workflowRun.head_branch,
    job: failedJob.name,
    sha: workflowRun.head_sha,
    runUrl,
    failedStep,
    reproCommand: profile.reproCommand,
    result: "failed",
    statusOverride: "in_review",
    ownerAgentId,
    ownerLabel: "Engineer",
    repairBranch: branchName,
    repairPrUrl: prUrl,
    note: "自动修复已在隔离分支完成复跑并产出待审结果。",
  });

  logInfo(`Auto-repair branch ready: ${branchName}`);
  if (prUrl) {
    logInfo(`Auto-repair PR: ${prUrl}`);
  }
}

main().catch((error) => {
  logError(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
