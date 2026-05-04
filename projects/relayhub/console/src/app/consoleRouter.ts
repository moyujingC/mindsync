export function normalizeConsoleBasePath(basePath?: string): string {
  if (!basePath || basePath === "/") {
    return "/";
  }

  const trimmed = basePath.trim();

  if (!trimmed || trimmed === "/") {
    return "/";
  }

  const ensuredLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const normalized = ensuredLeadingSlash.replace(/\/+$/, "");

  return normalized || "/";
}

export function getConsoleRouterBasename(basePath?: string): string {
  return normalizeConsoleBasePath(basePath);
}
