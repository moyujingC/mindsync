#!/usr/bin/env node

import process from "node:process";

import {
  collectGitBaseline,
  getStringArray,
  getOption,
  logError,
  logInfo,
  logWarn,
  parseArgs,
  readTextIfExists,
  requireOption,
  summarizeExecutionBaseline,
  truthy,
} from "./common.mjs";
import { syncPaperclipCommitSummary, syncPaperclipIssue } from "./paperclip-sync-lib.mjs";

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || options.h) {
    console.log(`Usage:
  node shared/tools/ci/paperclip-ci-issue.mjs --company-id <id> --project-name <name> --kind <kind> --workflow <workflow> --branch <branch> --job <job> [--result failed|resolved]
  node shared/tools/ci/paperclip-ci-issue.mjs --mode commit-summary --company-id <id> --project-name <name> --workflow <workflow> --branch <branch> --sha <sha> [--failed-job <job> ...]
`);
    return;
  }
  const softFail = truthy(getOption(options, "soft-fail", false));
  const summaryText = getOption(options, "summary-text", "");
  const summaryFile = getOption(options, "summary-file", "");
  const summary = summaryText || (await readTextIfExists(summaryFile));
  const mode = getOption(options, "mode", "issue");
  const rawExecutionBaseline = await collectGitBaseline(process.cwd());

  try {
    const baseOptions = {
      apiBase: getOption(options, "api-base", process.env.PAPERCLIP_API_BASE ?? "http://127.0.0.1:3100"),
      apiKey: getOption(options, "api-key", process.env.PAPERCLIP_API_KEY ?? null),
      companyId: requireOption(options, "company-id"),
      projectName: requireOption(options, "project-name"),
      workflow: requireOption(options, "workflow"),
      repository: getOption(options, "repository", process.env.GITHUB_REPOSITORY ?? null),
      branch: requireOption(options, "branch"),
      sha: getOption(options, "sha", process.env.GITHUB_SHA ?? null),
      runUrl: getOption(options, "run-url", null),
      result: getOption(options, "result", "failed"),
      ownerAgentId: getOption(options, "owner-agent-id", null),
      ownerLabel: getOption(options, "owner-label", null),
      note: getOption(options, "note", null),
      diagnosis: getOption(options, "diagnosis", null),
      blockedReason: getOption(options, "blocked-reason", null),
      actionTaken: getOption(options, "action-taken", null),
      nextStep: getOption(options, "next-step", null),
      unblockOwner: getOption(options, "unblock-owner", null),
      phase: getOption(options, "phase", null),
      summary,
      eventTime: getOption(options, "event-time", null),
      executionBaseline: summarizeExecutionBaseline(rawExecutionBaseline, {
        expectedSha: getOption(options, "sha", process.env.GITHUB_SHA ?? null),
        expectedBranch: getOption(options, "branch", null),
      }),
    };

    const result =
      mode === "commit-summary"
        ? await syncPaperclipCommitSummary({
            ...baseOptions,
            failedJobs: getStringArray(getOption(options, "failed-job", [])),
            jobCount: Number(getOption(options, "job-count", "0")) || null,
          })
        : await syncPaperclipIssue({
            ...baseOptions,
            kind: requireOption(options, "kind"),
            job: requireOption(options, "job"),
            failedStep: getOption(options, "failed-step", null),
            reproCommand: getOption(options, "repro-command", null),
            environment: getOption(options, "environment", null),
            repairBranch: getOption(options, "repair-branch", null),
            repairPrUrl: getOption(options, "repair-pr-url", null),
            enableCommitParent: truthy(getOption(options, "commit-parent", false)),
          });
    logInfo(`Paperclip issue sync: ${result.action}`);
    if (result.identifier) {
      logInfo(`Paperclip issue: ${result.identifier}`);
    }
  } catch (error) {
    if (softFail) {
      logWarn(`Paperclip issue sync skipped: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    throw error;
  }
}

main().catch((error) => {
  logError(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
