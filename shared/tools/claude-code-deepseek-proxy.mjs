#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const THIS_FILE = fileURLToPath(import.meta.url);
export const REPO_ROOT = path.resolve(path.dirname(THIS_FILE), "..", "..");
export const RUNTIME_DIR = path.join(REPO_ROOT, "tmp", "claude-code-deepseek");
export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_PORT = 4000;
export const LOCAL_PROXY_KEY = "sk-local-deepseek-claude-code";
const PID_PATH = path.join(RUNTIME_DIR, "proxy.pid");
const LOG_PATH = path.join(RUNTIME_DIR, "proxy.log");
const CONFIG_PATH = path.join(RUNTIME_DIR, "litellm.generated.yaml");
const ENV_PATH = path.join(REPO_ROOT, ".env.local");

export function parseEnvFile(content) {
  const values = {};
  for (const sourceLine of content.split(/\r?\n/)) {
    const line = sourceLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const normalized = line.startsWith("export ") ? line.slice(7) : line;
    const separator = normalized.indexOf("=");
    if (separator < 1) {
      continue;
    }

    const key = normalized.slice(0, separator).trim();
    let value = normalized.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

export function loadPrivateEnv({ env = process.env, envPath = ENV_PATH } = {}) {
  const fileValues = fs.existsSync(envPath) ? parseEnvFile(fs.readFileSync(envPath, "utf8")) : {};
  return { ...fileValues, ...env };
}

export function normalizeModelCatalog(payload) {
  if (!payload || !Array.isArray(payload.data)) {
    throw new Error("DeepSeek /models 返回格式无效：缺少 data 数组。");
  }

  return [...new Set(payload.data
    .map((item) => (typeof item?.id === "string" ? item.id.trim() : ""))
    .filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, "en"));
}

export async function fetchDeepSeekModels({ apiKey, apiBase = "https://api.deepseek.com", fetchImpl = fetch } = {}) {
  if (!apiKey) {
    throw new Error("未配置 DEEPSEEK_API_KEY。请将其写入仓库根目录 .env.local 后重试。");
  }

  const endpoint = `${apiBase.replace(/\/$/, "")}/models`;
  let response;
  try {
    response = await fetchImpl(endpoint, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    throw new Error(`请求 DeepSeek /models 失败：${error instanceof Error ? error.message : String(error)}`);
  }

  if (!response.ok) {
    throw new Error(`DeepSeek /models 返回 HTTP ${response.status}。`);
  }

  return normalizeModelCatalog(await response.json());
}

function yamlQuote(value) {
  return JSON.stringify(value);
}

export function buildLiteLlmConfig(models, { apiBase = "https://api.deepseek.com" } = {}) {
  if (!Array.isArray(models) || models.length === 0) {
    throw new Error("无法生成 LiteLLM 配置：DeepSeek 模型目录为空。");
  }

  const modelEntries = models.map((model) => `  - model_name: ${yamlQuote(model)}
    litellm_params:
      model: ${yamlQuote(`deepseek/${model}`)}
      api_base: ${yamlQuote(apiBase)}
      api_key: os.environ/DEEPSEEK_API_KEY`).join("\n");

  return `model_list:\n${modelEntries}\n\nlitellm_settings:\n  drop_params: true\n\ngeneral_settings:\n  master_key: os.environ/LITELLM_MASTER_KEY\n`;
}

export function getProxyUrl({ host = DEFAULT_HOST, port = DEFAULT_PORT } = {}) {
  return `http://${host}:${port}`;
}

export async function checkProxyHealth({ host = DEFAULT_HOST, port = DEFAULT_PORT, fetchImpl = fetch } = {}) {
  const url = `${getProxyUrl({ host, port })}/health/readiness`;
  try {
    const response = await fetchImpl(url, {
      headers: { Authorization: `Bearer ${LOCAL_PROXY_KEY}` },
      signal: AbortSignal.timeout(3_000),
    });
    return { ready: response.status === 200, status: response.status, url };
  } catch (error) {
    return { ready: false, status: null, url, error: error instanceof Error ? error.message : String(error) };
  }
}

function readPid() {
  if (!fs.existsSync(PID_PATH)) {
    return null;
  }
  const pid = Number.parseInt(fs.readFileSync(PID_PATH, "utf8").trim(), 10);
  return Number.isInteger(pid) && pid > 0 ? pid : null;
}

function isProcessRunning(pid) {
  if (!pid) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function findLiteLlmCommand() {
  const candidates = [
    process.env.LITELLM_BIN,
    "/Library/Frameworks/Python.framework/Versions/3.11/bin/litellm",
    "/opt/homebrew/bin/litellm",
    "/usr/local/bin/litellm",
    ...String(process.env.PATH ?? "")
      .split(path.delimiter)
      .filter(Boolean)
      .map((directory) => path.join(directory, "litellm")),
  ].filter(Boolean);

  const command = candidates.find((candidate) => {
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  });
  if (!command) {
    throw new Error("未找到可执行的 LiteLLM。请在隔离 Python 环境安装 litellm[proxy]，或设置 LITELLM_BIN。");
  }
  return command;
}

async function waitForReady(options, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  do {
    const health = await checkProxyHealth(options);
    if (health.ready) {
      return health;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  } while (Date.now() < deadline);
  return checkProxyHealth(options);
}

export async function startProxy({ host = DEFAULT_HOST, port = DEFAULT_PORT } = {}) {
  const existingHealth = await checkProxyHealth({ host, port });
  if (existingHealth.ready) {
    return { alreadyRunning: true, health: existingHealth, models: null };
  }

  const existingPid = readPid();
  if (isProcessRunning(existingPid)) {
    throw new Error(`LiteLLM 进程 ${existingPid} 正在运行，但 readiness 未通过。请先执行 stop 并查看 ${LOG_PATH}。`);
  }

  const privateEnv = loadPrivateEnv();
  const models = await fetchDeepSeekModels({
    apiKey: privateEnv.DEEPSEEK_API_KEY,
    apiBase: privateEnv.DEEPSEEK_API_BASE,
  });
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, buildLiteLlmConfig(models, { apiBase: privateEnv.DEEPSEEK_API_BASE }), { mode: 0o600 });

  const logFd = fs.openSync(LOG_PATH, "a", 0o600);
  let child;
  try {
    child = spawn(findLiteLlmCommand(), [
      "--config", CONFIG_PATH,
      "--host", host,
      "--port", String(port),
      "--num_workers", "1",
      "--telemetry", "False",
    ], {
      cwd: REPO_ROOT,
      detached: true,
      env: {
        ...process.env,
        DEEPSEEK_API_KEY: privateEnv.DEEPSEEK_API_KEY,
        LITELLM_MASTER_KEY: LOCAL_PROXY_KEY,
      },
      stdio: ["ignore", logFd, logFd],
    });
    child.unref();
  } catch (error) {
    throw new Error(`无法启动 LiteLLM。请先在隔离 Python 环境安装 litellm[proxy]。${error instanceof Error ? ` ${error.message}` : ""}`);
  } finally {
    fs.closeSync(logFd);
  }

  fs.writeFileSync(PID_PATH, `${child.pid}\n`, { mode: 0o600 });
  await new Promise((resolve) => setTimeout(resolve, 5_000));
  const health = await waitForReady({ host, port }, 10_000);
  if (!health.ready) {
    const running = isProcessRunning(child.pid);
    throw new Error(`LiteLLM 启动后 readiness 未返回 HTTP 200（进程${running ? "仍在" : "已退出"}）。请查看 ${LOG_PATH}。`);
  }

  return { alreadyRunning: false, health, models };
}

export async function stopProxy() {
  const pid = readPid();
  if (!pid || !isProcessRunning(pid)) {
    fs.rmSync(PID_PATH, { force: true });
    return { stopped: false, pid };
  }

  process.kill(pid, "SIGTERM");
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline && isProcessRunning(pid)) {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  if (isProcessRunning(pid)) {
    throw new Error(`进程 ${pid} 未在 5 秒内退出，请手动检查。`);
  }
  fs.rmSync(PID_PATH, { force: true });
  return { stopped: true, pid };
}

function usage() {
  console.log(`用法：
  node shared/tools/claude-code-deepseek-proxy.mjs start
  node shared/tools/claude-code-deepseek-proxy.mjs stop
  node shared/tools/claude-code-deepseek-proxy.mjs status
  node shared/tools/claude-code-deepseek-proxy.mjs models
`);
}

async function main() {
  const command = process.argv[2] ?? "status";
  const privateEnv = loadPrivateEnv();

  if (command === "models") {
    const models = await fetchDeepSeekModels({ apiKey: privateEnv.DEEPSEEK_API_KEY, apiBase: privateEnv.DEEPSEEK_API_BASE });
    console.log(`DeepSeek 官方当前返回 ${models.length} 个模型：`);
    for (const model of models) {
      console.log(`- ${model}`);
    }
    return;
  }

  if (command === "start") {
    const result = await startProxy();
    if (result.alreadyRunning) {
      console.log(`LiteLLM 已就绪：${result.health.url} (HTTP 200)`);
    } else {
      console.log(`LiteLLM 已启动并通过 readiness：${result.health.url} (HTTP 200)`);
      console.log(`已加载 ${result.models.length} 个 DeepSeek 官方模型。`);
    }
    return;
  }

  if (command === "stop") {
    const result = await stopProxy();
    console.log(result.stopped ? `LiteLLM 已停止（PID ${result.pid}）。` : "LiteLLM 当前未运行。");
    return;
  }

  if (command === "status") {
    const health = await checkProxyHealth();
    const pid = readPid();
    console.log(`readiness: ${health.ready ? "ready (HTTP 200)" : `not ready${health.status ? ` (HTTP ${health.status})` : ""}`}`);
    console.log(`process: ${isProcessRunning(pid) ? `running (PID ${pid})` : "not running"}`);
    console.log(`url: ${getProxyUrl()}`);
    process.exitCode = health.ready ? 0 : 1;
    return;
  }

  usage();
  process.exitCode = 1;
}

export const __testables = {
  parseEnvFile,
  normalizeModelCatalog,
  buildLiteLlmConfig,
  getProxyUrl,
};

if (process.argv[1] && path.resolve(process.argv[1]) === THIS_FILE) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
