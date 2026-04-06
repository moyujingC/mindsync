#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");
const paperclipConfigPath = path.join(rootDir, ".paperclip.yaml");

const DAY_MS = 24 * 60 * 60 * 1000;
const defaultOptions = {
  apiUrl: "http://127.0.0.1:3100",
  staleHours: 24,
  reviewHours: 24,
  json: false,
};

function parseArgs(argv) {
  const options = { ...defaultOptions };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--api-url") {
      options.apiUrl = argv[index + 1] ?? options.apiUrl;
      index += 1;
      continue;
    }
    if (arg === "--stale-hours") {
      options.staleHours = Number(argv[index + 1] ?? options.staleHours);
      index += 1;
      continue;
    }
    if (arg === "--review-hours") {
      options.reviewHours = Number(argv[index + 1] ?? options.reviewHours);
      index += 1;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage:
  node shared/tools/paperclip-task-system-audit.mjs [--json] [--api-url <url>] [--stale-hours <n>] [--review-hours <n>]

Purpose:
  Audit the current Paperclip task system against MindSync governance and surface
  actionable health signals.`);
}

function readPaperclipConfig(configPath) {
  const raw = fs.readFileSync(configPath, "utf8");
  const companyIdMatch = raw.match(/^\s*id:\s*"([^"]+)"/m);
  if (!companyIdMatch) {
    throw new Error(`Unable to parse company.id from ${configPath}`);
  }

  const goalsById = new Map();
  const expectedProjectGoalByName = new Map();

  let section = null;
  let currentItem = null;

  for (const line of raw.split(/\r?\n/)) {
    if (/^goals:\s*$/.test(line)) {
      section = "goals";
      currentItem = null;
      continue;
    }
    if (/^projects:\s*$/.test(line)) {
      section = "projects";
      currentItem = null;
      continue;
    }
    if (/^[A-Za-z_]+:\s*$/.test(line) && !/^(goals|projects):\s*$/.test(line)) {
      section = null;
      currentItem = null;
      continue;
    }

    if (!section) continue;

    const itemStart = line.match(/^\s*-\s+id:\s*"([^"]+)"/);
    if (itemStart) {
      currentItem = { id: itemStart[1] };
      if (section === "goals") {
        goalsById.set(currentItem.id, currentItem);
      }
      continue;
    }

    if (!currentItem) continue;

    const kv = line.match(/^\s*([A-Za-z_]+):\s*"([^"]*)"/);
    if (!kv) continue;

    const [, key, value] = kv;
    currentItem[key] = value;

    if (section === "projects" && key === "name") {
      currentItem.name = value;
    }
    if (section === "projects" && key === "goal_id") {
      currentItem.goal_id = value;
    }
    if (section === "goals" && key === "title") {
      currentItem.title = value;
    }
  }

  for (const entry of raw.split(/^/m)) {
    void entry;
  }

  let activeProject = null;
  section = null;
  for (const line of raw.split(/\r?\n/)) {
    if (/^projects:\s*$/.test(line)) {
      section = "projects";
      activeProject = null;
      continue;
    }
    if (/^[A-Za-z_]+:\s*$/.test(line) && !/^projects:\s*$/.test(line)) {
      if (!/^\s/.test(line)) {
        section = null;
        activeProject = null;
      }
    }
    if (section !== "projects") continue;
    const projectStart = line.match(/^\s*-\s+id:\s*"([^"]+)"/);
    if (projectStart) {
      activeProject = { id: projectStart[1] };
      continue;
    }
    if (!activeProject) continue;
    const kv = line.match(/^\s*([A-Za-z_]+):\s*"([^"]*)"/);
    if (!kv) continue;
    const [, key, value] = kv;
    activeProject[key] = value;
    if (activeProject.name && activeProject.goal_id) {
      const expectedGoal = goalsById.get(activeProject.goal_id)?.title ?? null;
      if (expectedGoal) {
        expectedProjectGoalByName.set(activeProject.name, expectedGoal);
      }
    }
  }

  return {
    companyId: companyIdMatch[1],
    expectedProjectGoalByName,
  };
}

function runPaperclipIssueList(companyId) {
  const output = execFileSync(
    "paperclipai",
    ["issue", "list", "-C", companyId, "--json"],
    { cwd: rootDir, encoding: "utf8" },
  );
  return JSON.parse(output);
}

async function fetchRuntimeProjects(apiUrl, companyId) {
  const response = await fetch(`${apiUrl}/api/companies/${companyId}/projects`);
  if (!response.ok) {
    throw new Error(`Failed to fetch runtime projects: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function parseDate(value) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function lastActivityTs(issue) {
  return parseDate(issue.lastActivityAt) ?? parseDate(issue.updatedAt) ?? 0;
}

function getTypeLabel(issue) {
  const typeLabels = (issue.labels ?? [])
    .map((label) => label?.name)
    .filter((name) => typeof name === "string" && name.startsWith("type:"));

  if (typeLabels.length === 0) return null;
  if (typeLabels.length === 1) return typeLabels[0];
  return "type:multiple";
}

function summarizeIssues(issues, { staleHours, reviewHours }) {
  const openIssues = issues.filter((issue) => !["done", "cancelled"].includes(issue.status));
  const now = Date.now();
  const staleThresholdMs = staleHours * 60 * 60 * 1000;
  const reviewThresholdMs = reviewHours * 60 * 60 * 1000;
  const openChildCountByParentId = new Map();

  const byStatus = {};
  const byType = {};
  for (const issue of openIssues) {
    byStatus[issue.status] = (byStatus[issue.status] ?? 0) + 1;
    const typeLabel = getTypeLabel(issue) ?? "untyped";
    byType[typeLabel] = (byType[typeLabel] ?? 0) + 1;
    if (issue.parentId) {
      openChildCountByParentId.set(issue.parentId, (openChildCountByParentId.get(issue.parentId) ?? 0) + 1);
    }
  }

  const needsTriage = openIssues.filter((issue) =>
    !issue.parentId &&
    !issue.assigneeAgentId &&
    !issue.assigneeUserId &&
    (issue.status === "todo" || issue.status === "backlog"),
  );

  const readyToStart = openIssues.filter((issue) =>
    issue.status === "todo" &&
    (issue.assigneeAgentId || issue.assigneeUserId),
  );

  const staleInProgress = openIssues.filter((issue) =>
    issue.status === "in_progress" &&
    now - lastActivityTs(issue) >= staleThresholdMs,
  );

  const agingReview = openIssues.filter((issue) =>
    issue.status === "in_review" &&
    now - lastActivityTs(issue) >= reviewThresholdMs,
  );

  const missingTypeLabel = openIssues.filter((issue) => !getTypeLabel(issue));

  const topLevelActive = openIssues.filter((issue) =>
    !issue.parentId && ["todo", "in_progress", "in_review", "blocked"].includes(issue.status),
  ).filter((issue) => {
    const hasOpenChildren = (openChildCountByParentId.get(issue.id) ?? 0) > 0;
    const typeLabel = getTypeLabel(issue);
    return !hasOpenChildren && typeLabel !== "type:epic";
  });

  return {
    openCount: openIssues.length,
    byStatus,
    byType,
    needsTriage,
    readyToStart,
    staleInProgress,
    agingReview,
    missingTypeLabel,
    topLevelActive,
  };
}

function summarizeProjectDrift(runtimeProjects, expectedProjectGoalByName) {
  const goalDrift = [];

  for (const project of runtimeProjects) {
    const expectedGoal = expectedProjectGoalByName.get(project.name);
    const runtimeGoal = project.goals?.[0]?.title ?? null;
    if (expectedGoal && runtimeGoal && expectedGoal !== runtimeGoal) {
      goalDrift.push({
        projectName: project.name,
        expectedGoal,
        runtimeGoal,
      });
    }
  }

  return { goalDrift };
}

function compactIssue(issue) {
  return {
    identifier: issue.identifier ?? issue.id,
    title: issue.title,
    status: issue.status,
    typeLabel: getTypeLabel(issue),
    parentId: issue.parentId,
    assigneeAgentId: issue.assigneeAgentId,
    assigneeUserId: issue.assigneeUserId,
    lastActivityAt: issue.lastActivityAt ?? issue.updatedAt,
  };
}

function printHumanReport(report, { staleHours, reviewHours }) {
  console.log("# Paperclip 任务系统审计");
  console.log("");
  console.log("## 概览");
  console.log(`- open issues: ${report.issues.openCount}`);
  console.log(`- by status: ${Object.entries(report.issues.byStatus).map(([status, count]) => `${status}=${count}`).join(", ") || "none"}`);
  console.log(`- by type: ${Object.entries(report.issues.byType).map(([type, count]) => `${type}=${count}`).join(", ") || "none"}`);
  console.log(`- project->goal drift: ${report.projects.goalDrift.length}`);
  console.log("");

  printIssueGroup("待分诊输入", report.issues.needsTriage, "顶层、无 owner、仍在 backlog/todo 的输入。");
  printIssueGroup("待开始任务", report.issues.readyToStart, "已分配 owner、处于 todo，可直接启动。");
  printIssueGroup(`卡住的执行任务（>${staleHours}h）`, report.issues.staleInProgress, "处于 in_progress，但最近活动已超过阈值。");
  printIssueGroup(`久置 review（>${reviewHours}h）`, report.issues.agingReview, "处于 in_review，且最近活动已超过阈值。");
  printIssueGroup("缺少类型标签的打开任务", report.issues.missingTypeLabel, "已打开但尚未标记 `type:*` 语义的任务。");
  printIssueGroup("仍在顶层直接推进的活跃任务", report.issues.topLevelActive, "用于识别仍未收束成父子结构、且没有活跃子任务承接的顶层活跃任务。");

  console.log("## Project / Goal 漂移");
  if (report.projects.goalDrift.length === 0) {
    console.log("- 无");
  } else {
    for (const item of report.projects.goalDrift) {
      console.log(`- ${item.projectName}`);
      console.log(`  运行时 goal: ${item.runtimeGoal}`);
      console.log(`  治理源 goal: ${item.expectedGoal}`);
    }
  }
}

function printIssueGroup(title, issues, description) {
  console.log(`## ${title}`);
  console.log(`- ${description}`);
  if (issues.length === 0) {
    console.log("- 无");
    console.log("");
    return;
  }
  for (const issue of issues.map(compactIssue)) {
    const typePart = issue.typeLabel ? ` | ${issue.typeLabel}` : "";
    console.log(`- ${issue.identifier} | ${issue.status}${typePart} | ${issue.title}`);
  }
  console.log("");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const config = readPaperclipConfig(paperclipConfigPath);
  const issues = runPaperclipIssueList(config.companyId);
  const runtimeProjects = await fetchRuntimeProjects(options.apiUrl, config.companyId);

  const report = {
    generatedAt: new Date().toISOString(),
    companyId: config.companyId,
    issues: summarizeIssues(issues, options),
    projects: summarizeProjectDrift(runtimeProjects, config.expectedProjectGoalByName),
  };

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  printHumanReport(report, options);
}

main().catch((error) => {
  console.error(`paperclip-task-system-audit: ${error.message}`);
  process.exit(1);
});
