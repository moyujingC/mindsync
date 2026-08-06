#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import {
  fetchDeepSeekModels,
  loadPrivateEnv,
} from "./claude-code-deepseek-proxy.mjs";

const THIS_FILE = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(THIS_FILE), "..", "..");
const SETTINGS_PATH = path.join(REPO_ROOT, ".claude", "settings.json");
const LOCAL_SETTINGS_PATH = path.join(REPO_ROOT, ".claude", "settings.local.json");
const DEEPSEEK_ANTHROPIC_BASE_URL = "https://api.deepseek.com/anthropic";

export const AITECHFLUX_PRESETS = {
  default: "gpt-5.6-sol",
  gpt56: "gpt-5.6-sol",
  "gpt-5.6-sol": "gpt-5.6-sol",
  gpt55: "gpt-5.5",
  "gpt-5.5": "gpt-5.5",
  deepseek: "deepseek-v4-pro",
  "deepseek-v4-pro": "deepseek-v4-pro",
  qwen: "Qwen3.6-35B-A3B",
  "qwen3.6-35b-a3b": "Qwen3.6-35B-A3B",
  fast: "高性能极速模型",
  cheap: "高性能极速模型",
  "high-performance-fast": "高性能极速模型",
  "高性能极速模型": "高性能极速模型",
};

const AITECHFLUX_MODELS = [
  { label: "GPT 5.6 Sol", value: "gpt-5.6-sol" },
  { label: "GPT 5.5", value: "gpt-5.5" },
  { label: "DeepSeek V4 Pro（AITechFlux）", value: "deepseek-v4-pro" },
  { label: "Qwen 3.6 35B A3B", value: "Qwen3.6-35B-A3B" },
  { label: "高性能极速模型", value: "高性能极速模型" },
];

const MODEL_KEYS = [
  "ANTHROPIC_MODEL",
  "ANTHROPIC_REASONING_MODEL",
  "CLAUDE_CODE_SUBAGENT_MODEL",
];

const AITECHFLUX_SELECTORS = {
  ANTHROPIC_DEFAULT_OPUS_MODEL: "deepseek-v4-pro",
  ANTHROPIC_DEFAULT_SONNET_MODEL: "Qwen3.6-35B-A3B",
  ANTHROPIC_DEFAULT_HAIKU_MODEL: "高性能极速模型",
};

const TEXT_ONLY_AITECHFLUX_MODELS = new Set([
  "deepseek-v4-pro",
  "Qwen3.6-35B-A3B",
  "高性能极速模型",
]);

export function parseModelRequest(input) {
  const raw = input?.trim();
  if (!raw) {
    return null;
  }

  const separator = raw.indexOf(":");
  if (separator > 0) {
    const provider = raw.slice(0, separator).toLowerCase();
    const model = raw.slice(separator + 1).trim();
    if (!model || !["aitechflux", "deepseek"].includes(provider)) {
      throw new Error(`无法识别模型参数：${raw}`);
    }
    return {
      provider,
      model: provider === "aitechflux" ? resolveAitechfluxModel(model) : model,
    };
  }

  return { provider: "aitechflux", model: resolveAitechfluxModel(raw) };
}

function resolveAitechfluxModel(input) {
  return AITECHFLUX_PRESETS[input] ?? AITECHFLUX_PRESETS[input.toLowerCase()] ?? input;
}

export function buildDeepSeekSelectors(models, selectedModel) {
  const available = new Set(models);
  if (!available.has(selectedModel)) {
    throw new Error(`DeepSeek 官方目录中不存在模型：${selectedModel}`);
  }

  const reasoner = models.find((model) => /reason|r1/i.test(model)) ?? selectedModel;
  const chat = models.find((model) => /chat|v3/i.test(model)) ?? selectedModel;
  return {
    ANTHROPIC_DEFAULT_OPUS_MODEL: reasoner,
    ANTHROPIC_DEFAULT_SONNET_MODEL: chat,
    ANTHROPIC_DEFAULT_HAIKU_MODEL: chat,
  };
}

export function buildSettings(currentSettings, selection, { deepSeekModels = [] } = {}) {
  const settings = structuredClone(currentSettings);
  settings.env = settings.env && typeof settings.env === "object" ? settings.env : {};

  if (selection.provider === "deepseek") {
    settings.env.ANTHROPIC_BASE_URL = DEEPSEEK_ANTHROPIC_BASE_URL;
    delete settings.env.ANTHROPIC_AUTH_TOKEN;
    delete settings.env.ANTHROPIC_API_KEY;
    for (const key of MODEL_KEYS) {
      settings.env[key] = selection.model;
    }
    Object.assign(settings.env, buildDeepSeekSelectors(deepSeekModels, selection.model));
  } else {
    settings.env.ANTHROPIC_BASE_URL = "https://aitechflux.com";
    delete settings.env.ANTHROPIC_AUTH_TOKEN;
    delete settings.env.ANTHROPIC_API_KEY;
    for (const key of MODEL_KEYS) {
      settings.env[key] = selection.model;
    }
    Object.assign(settings.env, AITECHFLUX_SELECTORS);
  }

  return settings;
}

export function buildLocalDeepSeekSettings(currentSettings, apiKey) {
  if (!apiKey) {
    throw new Error("未配置 DEEPSEEK_API_KEY，无法写入 Claude Code 本地认证配置。");
  }

  const settings = structuredClone(currentSettings);
  settings.env = settings.env && typeof settings.env === "object" ? settings.env : {};
  settings.env.ANTHROPIC_API_KEY = apiKey;
  settings.env.CLAUDE_CODE_SKIP_AUTH_LOGIN = "1";
  delete settings.env.ANTHROPIC_AUTH_TOKEN;
  return settings;
}

export function clearLocalDeepSeekSettings(currentSettings) {
  const settings = structuredClone(currentSettings);
  settings.env = settings.env && typeof settings.env === "object" ? settings.env : {};
  delete settings.env.ANTHROPIC_API_KEY;
  delete settings.env.ANTHROPIC_AUTH_TOKEN;
  delete settings.env.CLAUDE_CODE_SKIP_AUTH_LOGIN;
  return settings;
}

export function atomicWriteJson(filePath, value) {
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporaryPath, filePath);
}

function usage() {
  console.log(`用法：
  node shared/tools/switch-vscode-claude-code-model.mjs
  node shared/tools/switch-vscode-claude-code-model.mjs <AITechFlux preset-or-model>
  node shared/tools/switch-vscode-claude-code-model.mjs aitechflux:<preset-or-model>
  node shared/tools/switch-vscode-claude-code-model.mjs deepseek:<official-model-id>

AITechFlux presets:
  default | gpt56 | gpt-5.6-sol
  gpt55 | gpt-5.5
  deepseek | deepseek-v4-pro
  qwen | qwen3.6-35b-a3b
  fast | cheap | high-performance-fast

DeepSeek Official:
  使用 https://api.deepseek.com/anthropic 官方 Anthropic 兼容接口直连。
`);
}

async function getDeepSeekCatalog() {
  const privateEnv = loadPrivateEnv();
  return fetchDeepSeekModels({
    apiKey: privateEnv.DEEPSEEK_API_KEY,
    apiBase: privateEnv.DEEPSEEK_API_BASE,
  });
}

async function showInteractiveMenu() {
  let deepSeekModels = [];
  let deepSeekError = null;
  try {
    deepSeekModels = await getDeepSeekCatalog();
  } catch (error) {
    deepSeekError = error instanceof Error ? error.message : String(error);
  }

  const entries = [];
  console.log("\nSwitch Model\n");
  console.log("AITechFlux");
  for (const item of AITECHFLUX_MODELS) {
    entries.push({ provider: "aitechflux", model: item.value });
    console.log(`  ${entries.length}. ${item.label} (${item.value})`);
  }

  console.log("\nDeepSeek Official");
  if (deepSeekError) {
    console.log(`  暂不可用：${deepSeekError}`);
  } else {
    for (const model of deepSeekModels) {
      entries.push({ provider: "deepseek", model });
      console.log(`  ${entries.length}. ${model}`);
    }
  }

  const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await terminal.question("\n请选择编号（直接回车取消）：");
    if (!answer.trim()) {
      return null;
    }
    const index = Number.parseInt(answer, 10) - 1;
    if (!Number.isInteger(index) || !entries[index]) {
      throw new Error(`无效菜单编号：${answer}`);
    }
    return { selection: entries[index], deepSeekModels };
  } finally {
    terminal.close();
  }
}

async function validateDeepSeekSelection(selection, models) {
  if (!models.includes(selection.model)) {
    throw new Error(`DeepSeek 官方 /models 当前未返回 ${selection.model}，配置未修改。`);
  }
}

function readJsonOrEmpty(filePath) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : {};
}

async function main() {
  const requested = process.argv[2];
  if (["-h", "--help", "help"].includes(requested)) {
    usage();
    return;
  }

  let selection;
  let deepSeekModels = [];
  if (!requested) {
    const interactive = await showInteractiveMenu();
    if (!interactive) {
      console.log("已取消，配置未修改。");
      return;
    }
    ({ selection, deepSeekModels } = interactive);
  } else {
    selection = parseModelRequest(requested);
    if (selection.provider === "deepseek") {
      deepSeekModels = await getDeepSeekCatalog();
    }
  }

  if (selection.provider === "deepseek") {
    await validateDeepSeekSelection(selection, deepSeekModels);
  }

  const currentSettings = readJsonOrEmpty(SETTINGS_PATH);
  const nextSettings = buildSettings(currentSettings, selection, { deepSeekModels });
  atomicWriteJson(SETTINGS_PATH, nextSettings);
  if (selection.provider === "deepseek") {
    const privateEnv = loadPrivateEnv();
    const localSettings = readJsonOrEmpty(LOCAL_SETTINGS_PATH);
    atomicWriteJson(LOCAL_SETTINGS_PATH, buildLocalDeepSeekSettings(localSettings, privateEnv.DEEPSEEK_API_KEY));
  } else if (fs.existsSync(LOCAL_SETTINGS_PATH)) {
    const localSettings = readJsonOrEmpty(LOCAL_SETTINGS_PATH);
    atomicWriteJson(LOCAL_SETTINGS_PATH, clearLocalDeepSeekSettings(localSettings));
  }

  console.log(`VS Code Claude Code 已切换到 ${selection.provider}:${selection.model}`);
  if (selection.provider === "deepseek") {
    const selectors = buildDeepSeekSelectors(deepSeekModels, selection.model);
    console.log(`Selector slots: Opus=${selectors.ANTHROPIC_DEFAULT_OPUS_MODEL}, Sonnet=${selectors.ANTHROPIC_DEFAULT_SONNET_MODEL}, Haiku=${selectors.ANTHROPIC_DEFAULT_HAIKU_MODEL}`);
    console.log("提示：DeepSeek 官方模型按纯文本模型使用；包含截图或图片时请切回支持视觉输入的模型。");
  } else {
    console.log("Selector slots: Opus=deepseek-v4-pro, Sonnet=Qwen3.6-35B-A3B, Haiku=高性能极速模型");
    if (TEXT_ONLY_AITECHFLUX_MODELS.has(selection.model)) {
      console.log("提示：当前模型在 AITechFlux Claude Code 路径上只支持文本；包含截图或图片时请使用 gpt-5.6-sol。");
    }
  }
  console.log(`已更新 ${SETTINGS_PATH}`);
  console.log("请 Reload VS Code，使 Claude Code 后台进程重新读取配置。");
}

export const __testables = {
  parseModelRequest,
  buildDeepSeekSelectors,
  buildSettings,
  buildLocalDeepSeekSettings,
  clearLocalDeepSeekSettings,
};

if (process.argv[1] && path.resolve(process.argv[1]) === THIS_FILE) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
