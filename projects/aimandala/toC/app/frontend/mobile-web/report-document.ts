import type { MandalaFlowState } from "../shared/types";

export type ReportDocumentMode = "lite" | "pro";

export interface ReportFollowupAnchor {
  id: string;
  moduleId: string;
  label: string;
}

export interface ReportDocumentModule {
  id: string;
  title: string;
  body: string;
  followupAnchor?: ReportFollowupAnchor;
}

export interface ReportDocument {
  id: string;
  mode: ReportDocumentMode;
  title: string;
  summary: string;
  modules: ReportDocumentModule[];
  finalReportMd: string;
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^>\s?/gm, "")
    .trim();
}

function parseMarkdownModules(markdown: string): ReportDocumentModule[] {
  const normalized = markdown.replace(/\r/g, "").trim();
  if (!normalized) return [];

  const lines = normalized.split("\n");
  const modules: ReportDocumentModule[] = [];
  let currentTitle = "完整解读";
  let buffer: string[] = [];

  const pushModule = () => {
    const body = stripMarkdown(buffer.join("\n")).trim();
    if (!body) return;
    modules.push({
      id: `module-${modules.length + 1}`,
      title: stripMarkdown(currentTitle),
      body,
    });
  };

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    const strongHeadingMatch = line.match(/^\*\*([^*]+)\*\*\s*$/);
    if (headingMatch || strongHeadingMatch) {
      pushModule();
      currentTitle = headingMatch?.[1] ?? strongHeadingMatch?.[1] ?? currentTitle;
      buffer = [];
      continue;
    }
    if (line.trim() === "---") continue;
    buffer.push(line);
  }

  pushModule();
  return modules;
}

function normalizeStructuredModules(
  structured: Record<string, unknown>,
): ReportDocumentModule[] {
  const rawModules =
    structured.modules ??
    structured.sections ??
    structured.report_modules ??
    structured.cards;
  if (!Array.isArray(rawModules)) return [];

  return rawModules.flatMap((item, index): ReportDocumentModule[] => {
    const record = getRecord(item);
    if (!record) return [];
    const title =
      getString(record.title) ??
      getString(record.heading) ??
      getString(record.label) ??
      `模块 ${index + 1}`;
    const body =
      getString(record.body) ??
      getString(record.content) ??
      getString(record.text) ??
      getString(record.summary);
    if (!body) return [];
    const id = getString(record.id) ?? `module-${index + 1}`;
    return [
      {
        id,
        title,
        body,
      },
    ];
  });
}

function attachFollowupAnchors(
  modules: ReportDocumentModule[],
): ReportDocumentModule[] {
  return modules.map((module, index) => ({
    ...module,
    followupAnchor: {
      id: `${module.id}-followup`,
      moduleId: module.id,
      label: `第 ${index + 1} 段追问`,
    },
  }));
}

export function buildReportDocument(
  state: MandalaFlowState,
  fallbackMode: ReportDocumentMode,
): ReportDocument {
  const report = state.report;
  const structured = getRecord(report?.structured);
  const finalReportMd = getString(report?.report) ?? "";
  const mode =
    report?.version === "pro" || fallbackMode === "pro" ? "pro" : "lite";
  const structuredModules = structured
    ? normalizeStructuredModules(structured)
    : [];
  const markdownModules = parseMarkdownModules(finalReportMd);
  const modules =
    structuredModules.length > 0 ? structuredModules : markdownModules;
  const title =
    getString(structured?.title) ??
    getString(report?.title) ??
    (mode === "pro" ? "一梳 Pro 版" : "一镜 Lite 版");
  const summary =
    getString(structured?.summary) ??
    getString(report?.overall_impression) ??
    modules[0]?.body ??
    "";

  return {
    id: report?.interpretation_id ?? "preview-report",
    mode,
    title,
    summary,
    modules: mode === "pro" ? attachFollowupAnchors(modules) : modules,
    finalReportMd,
  };
}
