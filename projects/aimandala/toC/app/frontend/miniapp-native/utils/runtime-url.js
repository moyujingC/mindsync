function normalizeValue(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function joinBaseAndPath(baseUrl, path) {
  const normalizedBase = normalizeValue(baseUrl).replace(/\/+$/, "");
  const normalizedPath = normalizeValue(path || "/");
  if (!normalizedPath || normalizedPath === "/") {
    return `${normalizedBase}/`;
  }
  return `${normalizedBase}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
}

function buildQueryString(params) {
  return Object.keys(params)
    .filter(
      (key) =>
        params[key] !== undefined && params[key] !== null && params[key] !== "",
    )
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key]))}`,
    )
    .join("&");
}

function buildRuntimeUrl(input) {
  const query = buildQueryString({
    channel: "miniapp",
    miniappHost: "native",
    userId: input.session.canonicalUserId,
    openId: input.session.openId,
    sessionId: input.session.sessionId || null,
    miniappRoute: input.route || null,
    interpretationId: input.interpretationId || null,
    reportVariant: input.reportVariant || null,
    miniappAutoRecover: input.autoRecover ? "1" : null,
    miniappPaymentResult: input.paymentResult || null,
  });

  return `${joinBaseAndPath(input.config.runtimeBaseUrl, input.config.runtimePath)}?${query}`;
}

module.exports = {
  buildRuntimeUrl,
};
