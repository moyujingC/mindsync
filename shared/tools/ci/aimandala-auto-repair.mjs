#!/usr/bin/env node

import fs from "node:fs/promises";
import process from "node:process";

import {
  buildRunUrl,
  collectGitBaseline,
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
  summarizeExecutionBaseline,
  truthy,
} from "./common.mjs";
import { syncPaperclipIssue } from "./paperclip-sync-lib.mjs";

function sanitizeWorktreeSegment(value) {
  return String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "unknown";
}

const REPAIR_PROFILES = [
  {
    jobName: "frontend-quality",
    stepName: "Run Frontend Lint",
    kind: "lint-failure",
    reproCommand: "npm --prefix projects/aimandala/toC/app/frontend run lint",
    allowedPaths: ["projects/aimandala/toC/app/frontend/"],
  },
  {
    jobName: "frontend-quality",
    stepName: "Run Frontend Format Check",
    kind: "format-failure",
    reproCommand: "npm --prefix projects/aimandala/toC/app/frontend run format:check",
    allowedPaths: ["projects/aimandala/toC/app/frontend/"],
  },
  {
    jobName: "frontend-quality",
    stepName: "Run Vitest",
    kind: "ci-test-failure",
    reproCommand: "npm --prefix projects/aimandala/toC/app/frontend test",
    allowedPaths: ["projects/aimandala/toC/app/frontend/"],
  },
  {
    jobName: "frontend-quality",
    stepName: "Run Vitest Coverage",
    kind: "coverage-failure",
    reproCommand: "npm --prefix projects/aimandala/toC/app/frontend run test:coverage",
    allowedPaths: ["projects/aimandala/toC/app/frontend/"],
  },
  {
    jobName: "frontend-quality",
    stepName: "Run Typecheck",
    kind: "ci-test-failure",
    reproCommand: "npm --prefix projects/aimandala/toC/app/frontend run typecheck",
    allowedPaths: ["projects/aimandala/toC/app/frontend/"],
  },
  {
    jobName: "frontend-quality",
    stepName: "Run Mobile Web Build",
    kind: "build-failure",
    reproCommand: "npm --prefix projects/aimandala/toC/app/frontend run build:mobile-web",
    allowedPaths: ["projects/aimandala/toC/app/frontend/"],
  },
  {
    jobName: "backend-quality",
    stepName: "Run Ruff Check",
    kind: "lint-failure",
    reproCommand: "PYTHONPATH=projects/aimandala/toC/app/backend ruff check projects/aimandala/toC/app/backend/app projects/aimandala/toC/app/backend/tests projects/aimandala/toC/app/backend/scripts",
    allowedPaths: ["projects/aimandala/toC/app/backend/"],
  },
  {
    jobName: "backend-quality",
    stepName: "Run Pytest",
    kind: "ci-test-failure",
    reproCommand: "PYTHONPATH=projects/aimandala/toC/app/backend pytest -q projects/aimandala/toC/app/backend/tests/unit",
    allowedPaths: ["projects/aimandala/toC/app/backend/"],
  },
  {
    jobName: "knowledge-quality",
    stepName: "Run Knowledge Validation",
    kind: "ci-test-failure",
    reproCommand: "PYTHONPATH=projects/aimandala/toC/app/backend python3 projects/aimandala/toC/app/backend/scripts/validate_knowledge_workbench.py",
    allowedPaths: [
      "projects/aimandala/toC/app/backend/",
      "projects/aimandala/fixtures/",
    ],
  },
  {
    jobName: "knowledge-quality",
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
  const executionWorktreeRoot = getOption(
    options,
    "execution-worktree-root",
    process.env.PAPERCLIP_EXECUTION_WORKTREE_ROOT ?? "/opt/automation/worktrees",
  );
  const executionAdapter = getOption(
    options,
    "execution-adapter",
    process.env.PAPERCLIP_EXECUTION_ADAPTER ?? "github-actions/self-hosted-runner:auto-repair",
  );
  const executionHost = getOption(
    options,
    "execution-host",
    process.env.PAPERCLIP_EXECUTION_HOST ?? process.env.HOSTNAME ?? null,
  );

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
    diagnosis: "代码问题",
    actionTaken: "读取 workflow_run 失败 job，识别失败 step，并建立对应的修复 issue。",
    nextStep: profile
      ? "进入自动修复白名单流程，隔离分支执行修复命令并复跑。"
      : "等待人工排查；当前失败点不在自动修复白名单内。",
    phase: profile ? "auto-repair intake" : "manual-follow-up",
    executionAdapter,
    executionHost,
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
    diagnosis: "代码问题",
    actionTaken: "创建自动修复执行上下文，准备切换隔离分支并运行修复命令。",
    nextStep: "执行修复命令，随后用对应 repro command 做本地复跑。",
    phase: "auto-repair started",
    executionAdapter,
    executionHost,
  });

  const branchName = `codex/auto-fix/${workflowRun.id}`;
  const worktreeDir = `${executionWorktreeRoot}/${sanitizeWorktreeSegment(`auto-repair-${workflowRun.id}-${failedJob.name}`)}`;
  await runShellCommand(`mkdir -p ${JSON.stringify(executionWorktreeRoot)}`);
  await runShellCommand(`rm -rf ${JSON.stringify(worktreeDir)}`);
  const checkout = await runShellCommand(
    `git worktree add -B ${branchName} ${JSON.stringify(worktreeDir)} ${workflowRun.head_sha}`,
  );
  if (checkout.code !== 0) {
    throw new Error(`Failed to create auto-repair branch: ${truncateText(checkout.stderr || checkout.stdout, 1200)}`);
  }

  const repairRun = await runShellCommand(autoRepairCommand, {
    cwd: worktreeDir,
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
    const baseline = summarizeExecutionBaseline(await collectGitBaseline(worktreeDir), {
      expectedSha: workflowRun.head_sha,
      expectedBranch: workflowRun.head_branch,
    });
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
      diagnosis: "代码问题",
      blockedReason: "human_action_required",
      actionTaken: "已执行自动修复命令，但命令本身失败。",
      nextStep: "人工查看修复命令输出，确认是否需要补依赖、修脚本或转人工修复分支。",
      unblockOwner: "Engineer",
      phase: "auto-repair command failed",
      executionBaseline: baseline,
      executionAdapter,
      executionHost,
      note: `自动修复命令执行失败，隔离 worktree: ${worktreeDir}`,
      summary: repairRun.stderr || repairRun.stdout,
    });
    throw new Error(`Auto-repair command failed: ${truncateText(repairRun.stderr || repairRun.stdout, 1600)}`);
  }

  const reproResult = await runShellCommand(profile.reproCommand, { cwd: worktreeDir });
  if (reproResult.code !== 0) {
    const baseline = summarizeExecutionBaseline(await collectGitBaseline(worktreeDir), {
      expectedSha: workflowRun.head_sha,
      expectedBranch: workflowRun.head_branch,
    });
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
      diagnosis: "代码问题",
      actionTaken: "自动修复命令已执行完成，但本地 repro command 仍未通过。",
      nextStep: "人工继续排查失败根因，并决定是否保留自动修复分支作为半成品。",
      unblockOwner: "Engineer",
      phase: "auto-repair repro failed",
      executionBaseline: baseline,
      executionAdapter,
      executionHost,
      note: `自动修复复跑仍失败，隔离 worktree: ${worktreeDir}`,
      summary: reproResult.stderr || reproResult.stdout,
    });
    throw new Error(`Auto-repair repro command still fails: ${truncateText(reproResult.stderr || reproResult.stdout, 1600)}`);
  }

  const changedFiles = await getChangedFiles(worktreeDir);
  if (changedFiles.length === 0) {
    const baseline = summarizeExecutionBaseline(await collectGitBaseline(worktreeDir), {
      expectedSha: workflowRun.head_sha,
      expectedBranch: workflowRun.head_branch,
    });
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
      diagnosis: "工作区问题",
      blockedReason: "workspace_drift",
      actionTaken: "修复命令和 repro 已通过，但工作区没有产出可提交 diff。",
      nextStep: "检查当前执行目录、缓存命中和工作树基线，确认是否发生 workspace drift 或修复已在别处分支存在。",
      unblockOwner: "Engineer / 运维执行方",
      phase: "auto-repair no diff",
      executionBaseline: baseline,
      executionAdapter,
      executionHost,
      note: `自动修复无可提交 diff，隔离 worktree: ${worktreeDir}`,
    });
    return;
  }

  if (!changedFilesStayWithinAllowlist(changedFiles, profile.allowedPaths)) {
    throw new Error(`Auto-repair touched files outside allowlist: ${changedFiles.join(", ")}`);
  }

  await runShellCommand("git config user.name 'github-actions[bot]'", { cwd: worktreeDir });
  await runShellCommand("git config user.email '41898282+github-actions[bot]@users.noreply.github.com'", { cwd: worktreeDir });
  await runShellCommand("git add .", { cwd: worktreeDir });
  const commit = await runShellCommand(
    `git commit -m ${JSON.stringify(`chore: auto-repair ${failedJob.name} (${failedStep ?? "unknown-step"})`)}`,
    { cwd: worktreeDir },
  );
  if (commit.code !== 0) {
    throw new Error(`Failed to create auto-repair commit: ${truncateText(commit.stderr || commit.stdout, 1200)}`);
  }

  let prUrl = null;
  if (autoRepairPush) {
    const push = await runShellCommand(`git push origin ${branchName} --force-with-lease`, { cwd: worktreeDir });
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
    diagnosis: "代码问题",
    actionTaken: "修复命令和本地 repro 已通过，已产出隔离分支并准备评审。",
    nextStep: prUrl
      ? "由 Engineer / Test QA 在 PR 中确认 diff 边界、复跑结果与残留风险。"
      : "推送隔离分支或创建 PR 后再进入评审。",
    phase: "auto-repair ready for review",
    executionBaseline: summarizeExecutionBaseline(await collectGitBaseline(worktreeDir), {
      expectedSha: workflowRun.head_sha,
      expectedBranch: workflowRun.head_branch,
    }),
    executionAdapter,
    executionHost,
    note: `自动修复已在隔离 worktree 完成：${worktreeDir}`,
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
