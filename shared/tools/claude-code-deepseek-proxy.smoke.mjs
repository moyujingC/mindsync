#!/usr/bin/env node

import { __testables } from "./claude-code-deepseek-proxy.mjs";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const parsedEnv = __testables.parseEnvFile([
  "# private values",
  "DEEPSEEK_API_KEY='secret-value'",
  "export DEEPSEEK_API_BASE=https://api.deepseek.com",
  "EMPTY=",
].join("\n"));
assert(parsedEnv.DEEPSEEK_API_KEY === "secret-value", "env parser should remove quotes");
assert(parsedEnv.DEEPSEEK_API_BASE === "https://api.deepseek.com", "env parser should support export prefix");
assert(parsedEnv.EMPTY === "", "env parser should preserve empty values");

const models = __testables.normalizeModelCatalog({
  data: [
    { id: "deepseek-reasoner" },
    { id: "deepseek-chat" },
    { id: "deepseek-chat" },
    { id: " " },
    {},
  ],
});
assert(models.length === 2, "model catalog should remove duplicates and invalid entries");
assert(models[0] === "deepseek-chat", "model catalog should sort model ids");
assert(models[1] === "deepseek-reasoner", "model catalog should retain reasoning model");

let invalidCatalogRejected = false;
try {
  __testables.normalizeModelCatalog({ models: [] });
} catch (error) {
  invalidCatalogRejected = error instanceof Error && error.message.includes("data 数组");
}
assert(invalidCatalogRejected, "invalid model catalog should be rejected");

const config = __testables.buildLiteLlmConfig(models);
assert(config.includes('model_name: "deepseek-chat"'), "config should expose chat model alias");
assert(config.includes('model: "deepseek/deepseek-reasoner"'), "config should use LiteLLM DeepSeek provider prefix");
assert(config.includes("api_key: os.environ/DEEPSEEK_API_KEY"), "config should reference private environment key");
assert(!config.includes("secret-value"), "config should not contain parsed secret value");
assert(config.includes("master_key: os.environ/LITELLM_MASTER_KEY"), "config should protect local proxy with a master key");

assert(
  __testables.getProxyUrl({ host: "127.0.0.1", port: 4555 }) === "http://127.0.0.1:4555",
  "proxy URL should use the configured loopback host and port",
);

console.log("claude-code-deepseek-proxy smoke passed");
