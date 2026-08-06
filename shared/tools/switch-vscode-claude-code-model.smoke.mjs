#!/usr/bin/env node

import { __testables } from "./switch-vscode-claude-code-model.mjs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const legacy = __testables.parseModelRequest("gpt56");
assert(legacy.provider === "aitechflux", "legacy preset should keep AITechFlux provider");
assert(legacy.model === "gpt-5.6-sol", "legacy preset should resolve to existing model");

const explicitAitechflux = __testables.parseModelRequest("aitechflux:qwen");
assert(explicitAitechflux.model === "Qwen3.6-35B-A3B", "explicit AITechFlux request should resolve preset");

const official = __testables.parseModelRequest("deepseek:deepseek-reasoner");
assert(official.provider === "deepseek", "DeepSeek prefix should select official provider");
assert(official.model === "deepseek-reasoner", "official model id should be preserved");

const catalog = ["deepseek-chat", "deepseek-reasoner"];
const selectors = __testables.buildDeepSeekSelectors(catalog, "deepseek-reasoner");
assert(selectors.ANTHROPIC_DEFAULT_OPUS_MODEL === "deepseek-reasoner", "Opus slot should prefer reasoning model");
assert(selectors.ANTHROPIC_DEFAULT_SONNET_MODEL === "deepseek-chat", "Sonnet slot should prefer chat model");
assert(selectors.ANTHROPIC_DEFAULT_HAIKU_MODEL === "deepseek-chat", "Haiku slot should prefer chat model");

let unknownModelRejected = false;
try {
  __testables.buildDeepSeekSelectors(catalog, "missing-model");
} catch (error) {
  unknownModelRejected = error instanceof Error && error.message.includes("不存在模型");
}
assert(unknownModelRejected, "unknown official model should be rejected");

const original = {
  env: {
    CLAUDE_CODE_ATTRIBUTION_HEADER: "0",
    EXISTING_VALUE: "keep-me",
  },
};
const deepSeekSettings = __testables.buildSettings(original, official, { deepSeekModels: catalog });
assert(deepSeekSettings.env.ANTHROPIC_BASE_URL === "https://api.deepseek.com/anthropic", "official provider should use the official Anthropic-compatible endpoint");
assert(deepSeekSettings.env.ANTHROPIC_MODEL === "deepseek-reasoner", "official provider should update active model");
assert(deepSeekSettings.env.ANTHROPIC_AUTH_TOKEN === undefined, "official provider should not retain an upstream auth token");
assert(deepSeekSettings.env.EXISTING_VALUE === "keep-me", "unrelated settings should be preserved");
assert(original.env.ANTHROPIC_BASE_URL === undefined, "settings builder should not mutate input");

const localSettings = __testables.buildLocalDeepSeekSettings({ env: { EXISTING_VALUE: "keep-me" } }, "test-key");
assert(localSettings.env.ANTHROPIC_API_KEY === "test-key", "local settings should retain the private API key");
assert(localSettings.env.CLAUDE_CODE_SKIP_AUTH_LOGIN === "1", "local settings should use API-key authentication");
assert(localSettings.env.EXISTING_VALUE === "keep-me", "local settings should preserve unrelated values");

const clearedLocalSettings = __testables.clearLocalDeepSeekSettings(localSettings);
assert(clearedLocalSettings.env.ANTHROPIC_API_KEY === undefined, "switching away should remove the private API key");
assert(clearedLocalSettings.env.CLAUDE_CODE_SKIP_AUTH_LOGIN === undefined, "switching away should restore normal authentication behavior");
assert(clearedLocalSettings.env.EXISTING_VALUE === "keep-me", "clearing private settings should preserve unrelated values");

const aitechfluxSettings = __testables.buildSettings(deepSeekSettings, legacy);
assert(aitechfluxSettings.env.ANTHROPIC_BASE_URL === "https://aitechflux.com", "AITechFlux switch should restore upstream base URL");
assert(aitechfluxSettings.env.ANTHROPIC_AUTH_TOKEN === undefined, "AITechFlux switch should remove local proxy token");
assert(aitechfluxSettings.env.ANTHROPIC_MODEL === "gpt-5.6-sol", "AITechFlux switch should restore selected model");

console.log("switch-vscode-claude-code-model smoke passed");
