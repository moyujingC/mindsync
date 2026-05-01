#!/usr/bin/env node

import process from "node:process";
import { pathToFileURL } from "node:url";

import { getOption, logError, logInfo, parseArgs, requireOption } from "./common.mjs";

const OBSERVE_ONLY_CHECKOUTS = new Set([
  "/opt/automation/app/mindsync",
  "/opt/automation/app/mindsync-heartbeat",
]);

function normalizePath(value) {
  return String(value ?? "").trim().replace(/\/+$/, "");
}

function metadataFromDescription(description) {
  const metadata = {};
  for (const rawLine of String(description ?? "").split(/\r?\n/)) {
    const match = rawLine.match(/^([a-z_]+):\s*(.+)$/);
    if (!match) {
      continue;
    }
    metadata[match[1]] = match[2].trim();
  }
  return metadata;
}

function resolveTaskClass(metadata, fallback) {
  return String(metadata.task_class ?? fallback ?? "").trim() || null;
}

function resolveExecutionRoute(metadata, fallback) {
  return String(metadata.execution_route ?? fallback ?? "").trim() || null;
}

function pathEqualsOrWithin(pathname, root) {
  const normalizedPath = normalizePath(pathname);
  const normalizedRoot = normalizePath(root);
  return normalizedPath === normalizedRoot || normalizedPath.startsWith(`${normalizedRoot}/`);
}

function evaluateGuard({ cwd, expectedRoot, taskClass, executionRoute }) {
  const normalizedCwd = normalizePath(cwd);
  const normalizedRoot = normalizePath(expectedRoot);

  if (!normalizedCwd) {
    return {
      ok: false,
      reason: "missing_cwd",
      message: "执行前校验失败：缺少 cwd，拒绝进入服务器执行链。",
    };
  }

  for (const observeOnlyRoot of OBSERVE_ONLY_CHECKOUTS) {
    if (pathEqualsOrWithin(normalizedCwd, observeOnlyRoot)) {
      return {
        ok: false,
        reason: "execution_workspace_policy_not_materialized",
        message: `执行前校验失败：cwd 命中 observe-only checkout（${observeOnlyRoot}），拒绝执行。`,
      };
    }
  }

  if (executionRoute === "server_automation") {
    if (!pathEqualsOrWithin(normalizedCwd, normalizedRoot)) {
      return {
        ok: false,
        reason: "execution_workspace_policy_not_materialized",
        message: `执行前校验失败：server_automation 未落到隔离 worktree 根（${normalizedRoot}）。`,
      };
    }
    return {
      ok: true,
      reason: null,
      message: `执行前校验通过：server_automation cwd=${normalizedCwd}`,
    };
  }

  if (executionRoute === "local_manual_review" || taskClass === "manual-review-required") {
    if (pathEqualsOrWithin(normalizedCwd, normalizedRoot)) {
      return {
        ok: false,
        reason: "server_writable_execution_not_allowed",
        message: `执行前校验失败：local_manual_review 不允许使用服务器可写根（${normalizedRoot}）。`,
      };
    }
  }

  return {
    ok: true,
    reason: null,
    message: `执行前校验通过：cwd=${normalizedCwd}`,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || options.h) {
    console.log(`Usage:
  node shared/tools/ci/server-automation-guard.mjs --cwd <path> --expected-root /opt/automation/worktrees [--task-class automation-execution] [--execution-route server_automation]
`);
    return;
  }

  const cwd = requireOption(options, "cwd");
  const expectedRoot = getOption(
    options,
    "expected-root",
    process.env.PAPERCLIP_SERVER_WRITABLE_ALLOWED_ROOT ?? process.env.PAPERCLIP_EXECUTION_WORKTREE_ROOT ?? "/opt/automation/worktrees",
  );
  const metadata = metadataFromDescription(getOption(options, "description", ""));
  const taskClass = resolveTaskClass(metadata, getOption(options, "task-class", ""));
  const executionRoute = resolveExecutionRoute(metadata, getOption(options, "execution-route", ""));
  const result = evaluateGuard({
    cwd,
    expectedRoot,
    taskClass,
    executionRoute,
  });

  if (result.ok) {
    logInfo(result.message);
    return;
  }

  logError(`${result.message} reason=${result.reason}`);
  process.exitCode = 2;
}

export const __testables = {
  OBSERVE_ONLY_CHECKOUTS,
  metadataFromDescription,
  normalizePath,
  pathEqualsOrWithin,
  evaluateGuard,
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    logError(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exit(1);
  });
}
