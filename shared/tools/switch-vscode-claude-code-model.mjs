#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const MODEL_PRESETS = {
  default: "gpt-5.5",
  gpt55: "gpt-5.5",
  "gpt-5.5": "gpt-5.5",
  deepseek: "deepseek-v4-pro",
  "deepseek-v4-pro": "deepseek-v4-pro",
  qwen: "Qwen3.6-35B-A3B",
  "qwen3.6-35b-a3b": "Qwen3.6-35B-A3B",
  cheap: "高性能低价模型",
  "high-performance-low-cost": "高性能低价模型",
  "高性能低价模型": "高性能低价模型",
};

const MODEL_KEYS = [
  "ANTHROPIC_MODEL",
  "ANTHROPIC_DEFAULT_OPUS_MODEL",
  "ANTHROPIC_DEFAULT_SONNET_MODEL",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL",
  "ANTHROPIC_REASONING_MODEL",
  "CLAUDE_CODE_SUBAGENT_MODEL",
];

function usage() {
  console.log(`Usage:
  node shared/tools/switch-vscode-claude-code-model.mjs <preset-or-model>

Presets:
  default | gpt55                  -> gpt-5.5
  deepseek | deepseek-v4-pro       -> deepseek-v4-pro
  qwen | qwen3.6-35b-a3b          -> Qwen3.6-35B-A3B
  cheap | high-performance-low-cost -> 高性能低价模型
`);
}

function resolveModel(input) {
  const raw = input?.trim();
  if (!raw) {
    return null;
  }

  return MODEL_PRESETS[raw] ?? MODEL_PRESETS[raw.toLowerCase()] ?? raw;
}

const requested = process.argv[2];
if (requested === "-h" || requested === "--help" || requested === "help") {
  usage();
  process.exit(0);
}

const model = resolveModel(requested);
if (!model) {
  usage();
  process.exit(1);
}

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const settingsPath = path.join(repoRoot, ".claude", "settings.json");
const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
settings.env = settings.env && typeof settings.env === "object" ? settings.env : {};
settings.env.ANTHROPIC_BASE_URL = "https://aitechflux.com";

for (const key of MODEL_KEYS) {
  settings.env[key] = model;
}

fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
console.log(`VS Code Claude Code model set to ${model}`);
console.log(`Updated ${settingsPath}`);
