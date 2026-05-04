const CONFIG_STORAGE_KEY = "aimandala.native.runtime.config";

function normalizeValue(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function normalizePath(value) {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return "/";
  }
  if (normalized.startsWith("/")) {
    return normalized;
  }
  return `/${normalized}`;
}

function readStoredConfig() {
  try {
    return wx.getStorageSync(CONFIG_STORAGE_KEY) || {};
  } catch {
    return {};
  }
}

function persistRuntimeConfig(config) {
  try {
    wx.setStorageSync(CONFIG_STORAGE_KEY, config);
  } catch {
    // Ignore storage errors during debug shell bootstrap.
  }
}

function resolveRuntimeConfig(query) {
  const stored = readStoredConfig();
  const resolved = {
    apiBaseUrl: normalizeValue(
      (query && query.apiBaseUrl) || stored.apiBaseUrl,
    ),
    runtimeBaseUrl: normalizeValue(
      (query && query.runtimeBaseUrl) || stored.runtimeBaseUrl,
    ),
    runtimePath: normalizePath(
      (query && query.runtimePath) || stored.runtimePath || "/",
    ),
  };

  if (resolved.apiBaseUrl || resolved.runtimeBaseUrl) {
    persistRuntimeConfig(resolved);
  }

  return resolved;
}

function isRuntimeConfigReady(config) {
  return Boolean(config && config.apiBaseUrl && config.runtimeBaseUrl);
}

module.exports = {
  resolveRuntimeConfig,
  isRuntimeConfigReady,
};
