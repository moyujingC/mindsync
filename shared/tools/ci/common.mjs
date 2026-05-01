#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import process from "node:process";

export function parseArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    const hasValue = next !== undefined && !next.startsWith("--");
    const value = hasValue ? next : true;
    if (hasValue) {
      index += 1;
    }

    if (options[key] === undefined) {
      options[key] = value;
      continue;
    }

    if (Array.isArray(options[key])) {
      options[key].push(value);
      continue;
    }

    options[key] = [options[key], value];
  }

  return options;
}

export function requireOption(options, key) {
  const value = options[key];
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing required option --${key}`);
  }
  return value;
}

export function getOption(options, key, fallback = undefined) {
  const value = options[key];
  return value === undefined ? fallback : value;
}

export function getStringArray(value) {
  if (value === undefined || value === null || value === false) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  return [String(value)];
}

export function truthy(value) {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === undefined || value === null) {
    return false;
  }
  const normalized = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "y", "on"].includes(normalized);
}

export function compactText(value) {
  return String(value ?? "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function truncateText(value, maxLength = 4000) {
  const text = compactText(value);
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 15)}\n...[truncated]`;
}

export function markdownCodeBlock(value, language = "") {
  const body = truncateText(value, 3500) || "(empty)";
  return `\`\`\`${language}\n${body}\n\`\`\``;
}

export async function readTextIfExists(filePath) {
  if (!filePath) {
    return "";
  }
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return "";
    }
    throw error;
  }
}

export async function readProjectRegistry(projectRoot = process.cwd()) {
  const registryPath = path.resolve(projectRoot, "company/项目注册表.yaml");
  const content = await readTextIfExists(registryPath);
  if (!content.trim()) {
    throw new Error(`Project registry not found or empty: ${registryPath}`);
  }

  const objects = [];
  let inObjects = false;
  let current = null;
  let inPurpose = false;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/\r$/, "");
    const trimmed = line.trim();

    if (trimmed === "objects:") {
      inObjects = true;
      continue;
    }
    if (!inObjects) {
      continue;
    }

    if (line.startsWith("  - ")) {
      if (current) {
        objects.push(current);
      }
      current = {};
      inPurpose = false;
      const remainder = line.slice(4);
      if (remainder.includes(":")) {
        const [key, ...rest] = remainder.split(":");
        current[key.trim()] = rest.join(":").trim().replace(/^["']|["']$/g, "");
      }
      continue;
    }

    if (!current) {
      continue;
    }

    if (trimmed.startsWith("purpose:")) {
      inPurpose = true;
      continue;
    }

    if (inPurpose) {
      if (line.startsWith("      - ") || line.startsWith("        ")) {
        continue;
      }
      inPurpose = false;
    }

    if (!line.startsWith("    ") || !trimmed.includes(":")) {
      continue;
    }

    const [key, ...rest] = trimmed.split(":");
    current[key.trim()] = rest.join(":").trim().replace(/^["']|["']$/g, "");
  }

  if (current) {
    objects.push(current);
  }

  return objects;
}

export async function assertProjectRegistered(projectName, projectRoot = process.cwd()) {
  const registryObjects = await readProjectRegistry(projectRoot);
  const normalized = String(projectName ?? "").trim().toLowerCase();
  const matched = registryObjects.find((item) => item.name?.trim().toLowerCase() === normalized);
  if (!matched) {
    throw new Error(`Project is not registered in company/项目注册表.yaml: ${projectName}`);
  }
  return matched;
}

export async function writeTextFile(filePath, content) {
  await fs.writeFile(filePath, content, "utf8");
}

export async function writeJsonFile(filePath, value) {
  await writeTextFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function logInfo(message) {
  console.log(`[ci] ${message}`);
}

export function logWarn(message) {
  console.warn(`[ci][warn] ${message}`);
}

export function logError(message) {
  console.error(`[ci][error] ${message}`);
}

function buildHeaders(apiKey, extraHeaders = {}) {
  const headers = { ...extraHeaders };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  return headers;
}

export async function fetchJson(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? 30_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers: buildHeaders(options.apiKey, options.headers),
      body: options.body,
      signal: controller.signal,
      redirect: options.redirect ?? "follow",
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}: ${truncateText(text, 1200)}`);
    }
    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchText(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? 30_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers: buildHeaders(options.apiKey, options.headers),
      body: options.body,
      signal: controller.signal,
      redirect: options.redirect ?? "follow",
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}: ${truncateText(text, 1200)}`);
    }
    return { response, text };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchMaybeJson(url, options = {}) {
  const { response, text } = await fetchText(url, options);
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { response, text, json };
}

export class PaperclipApi {
  constructor({ apiBase, apiKey, companyId }) {
    this.apiBase = apiBase.replace(/\/$/, "");
    this.apiKey = apiKey ?? null;
    this.companyId = companyId;
  }

  buildUrl(pathname) {
    if (/^https?:\/\//.test(pathname)) {
      return pathname;
    }
    return `${this.apiBase}${pathname}`;
  }

  async get(pathname) {
    return fetchJson(this.buildUrl(pathname), { apiKey: this.apiKey });
  }

  async post(pathname, payload) {
    return fetchJson(this.buildUrl(pathname), {
      method: "POST",
      apiKey: this.apiKey,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  async patch(pathname, payload) {
    return fetchJson(this.buildUrl(pathname), {
      method: "PATCH",
      apiKey: this.apiKey,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }
}

export async function resolveProjectByName(api, companyId, projectName) {
  await assertProjectRegistered(projectName);
  const projects = await api.get(`/api/companies/${companyId}/projects`);
  const normalized = projectName.trim().toLowerCase();
  const project = (projects ?? []).find((item) => item.name?.trim().toLowerCase() === normalized);
  if (!project) {
    throw new Error(`Unable to resolve Paperclip project by name: ${projectName}`);
  }
  return project;
}

export async function listLabels(api, companyId) {
  return api.get(`/api/companies/${companyId}/labels`);
}

export function mapLabelsByName(labels) {
  const byName = new Map();
  for (const label of labels ?? []) {
    byName.set(label.name, label);
  }
  return byName;
}

export async function listProjectIssues(api, companyId, projectId) {
  return api.get(`/api/companies/${companyId}/issues?projectId=${encodeURIComponent(projectId)}`);
}

export function extractAutomationKey(description) {
  const match = String(description ?? "").match(/^automation_key:\s*(.+)$/m);
  return match ? match[1].trim() : null;
}

export function findIssueByAutomationKey(issues, automationKey) {
  return (issues ?? []).find((issue) => extractAutomationKey(issue.description) === automationKey) ?? null;
}

export function isoNow() {
  return new Date().toISOString();
}

export function buildRunUrl(repository, runId) {
  if (!repository || !runId) {
    return null;
  }
  return `https://github.com/${repository}/actions/runs/${runId}`;
}

export function buildCommitUrl(repository, sha) {
  if (!repository || !sha) {
    return null;
  }
  return `https://github.com/${repository}/commit/${sha}`;
}

export async function runShellCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("zsh", ["-lc", command], {
      cwd: options.cwd ?? process.cwd(),
      env: {
        ...process.env,
        ...(options.env ?? {}),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

export async function getChangedFiles(cwd) {
  const result = await runShellCommand("git status --porcelain", { cwd });
  if (result.code !== 0) {
    throw new Error(`Failed to read git status: ${truncateText(result.stderr || result.stdout, 1200)}`);
  }
  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.slice(3).trim());
}

export async function getGitStatusLines(cwd) {
  const result = await runShellCommand("git status --porcelain", { cwd });
  if (result.code !== 0) {
    throw new Error(`Failed to read git status: ${truncateText(result.stderr || result.stdout, 1200)}`);
  }
  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);
}

export async function isGitWorktreeClean(cwd) {
  const lines = await getGitStatusLines(cwd);
  return lines.length === 0;
}

function parseStatusPorcelain(output) {
  const lines = String(output ?? "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);

  const untrackedFiles = [];
  let dirty = false;

  for (const line of lines) {
    if (line.startsWith("?? ")) {
      untrackedFiles.push(line.slice(3).trim());
      dirty = true;
      continue;
    }
    dirty = true;
  }

  return {
    dirty,
    untrackedFiles,
  };
}

export async function collectGitBaseline(cwd = process.cwd()) {
  const [headSha, branchName, status] = await Promise.all([
    runShellCommand("git rev-parse HEAD", { cwd }),
    runShellCommand("git symbolic-ref --short -q HEAD || git branch --show-current || true", { cwd }),
    runShellCommand("git status --porcelain", { cwd }),
  ]);

  if (headSha.code !== 0) {
    return {
      available: false,
      cwd,
      error: truncateText(headSha.stderr || headSha.stdout, 800),
    };
  }

  const baseline = parseStatusPorcelain(status.stdout);
  return {
    available: true,
    cwd,
    headSha: headSha.stdout.trim() || null,
    branch: branchName.code === 0 ? branchName.stdout.trim() || null : null,
    dirty: baseline.dirty,
    untrackedFiles: baseline.untrackedFiles,
  };
}

export function summarizeExecutionBaseline(baseline, options = {}) {
  if (!baseline || baseline.available === false) {
    return {
      available: false,
      cwd: baseline?.cwd ?? options.cwd ?? process.cwd(),
      error: baseline?.error ?? "baseline unavailable",
      headMatchesExpected: null,
      branchMatchesExpected: null,
      driftReasons: [],
    };
  }

  const expectedSha = options.expectedSha ?? null;
  const expectedBranch = options.expectedBranch ?? null;
  const headMatchesExpected = expectedSha ? baseline.headSha === expectedSha : null;
  const branchMatchesExpected = expectedBranch ? baseline.branch === expectedBranch : null;
  const driftReasons = [];

  if (headMatchesExpected === false) {
    driftReasons.push("sha_mismatch");
  }
  if (branchMatchesExpected === false) {
    driftReasons.push("branch_mismatch");
  }
  if (baseline.dirty) {
    driftReasons.push("dirty_worktree");
  }

  return {
    ...baseline,
    expectedSha,
    expectedBranch,
    headMatchesExpected,
    branchMatchesExpected,
    driftReasons,
  };
}

export function createGitHubApiHeaders(token) {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
