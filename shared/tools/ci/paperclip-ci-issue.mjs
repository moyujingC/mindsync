#!/usr/bin/env node

import process from "node:process";

import {
  getOption,
  logError,
  logInfo,
  logWarn,
  parseArgs,
  readTextIfExists,
  requireOption,
  truthy,
} from "./common.mjs";
import { syncPaperclipIssue } from "./paperclip-sync-lib.mjs";

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || options.h) {
    console.log(`Usage:
  node shared/tools/ci/paperclip-ci-issue.mjs --company-id <id> --project-name <name> --kind <kind> --workflow <workflow> --branch <branch> --job <job> [--result failed|resolved]
`);
    return;
  }
  const softFail = truthy(getOption(options, "soft-fail", false));
  const summaryText = getOption(options, "summary-text", "");
  const summaryFile = getOption(options, "summary-file", "");
  const summary = summaryText || (await readTextIfExists(summaryFile));

  try {
    const result = await syncPaperclipIssue({
      apiBase: getOption(options, "api-base", process.env.PAPERCLIP_API_BASE ?? "http://127.0.0.1:3100"),
      apiKey: getOption(options, "api-key", process.env.PAPERCLIP_API_KEY ?? null),
      companyId: requireOption(options, "company-id"),
      projectName: requireOption(options, "project-name"),
      kind: requireOption(options, "kind"),
      workflow: requireOption(options, "workflow"),
      repository: getOption(options, "repository", process.env.GITHUB_REPOSITORY ?? null),
      branch: requireOption(options, "branch"),
      job: requireOption(options, "job"),
      sha: getOption(options, "sha", process.env.GITHUB_SHA ?? null),
      runUrl: getOption(options, "run-url", null),
      failedStep: getOption(options, "failed-step", null),
      reproCommand: getOption(options, "repro-command", null),
      result: getOption(options, "result", "failed"),
      ownerAgentId: getOption(options, "owner-agent-id", null),
      ownerLabel: getOption(options, "owner-label", null),
      environment: getOption(options, "environment", null),
      repairBranch: getOption(options, "repair-branch", null),
      repairPrUrl: getOption(options, "repair-pr-url", null),
      note: getOption(options, "note", null),
      summary,
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
