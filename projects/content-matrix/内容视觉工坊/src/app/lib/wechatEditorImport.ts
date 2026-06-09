import type { SavedWechatEditorImport, WechatEditorImportSummary } from "../types";

function dedupeSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function normalizeStyleValue(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function extractStyleValue(styleText: string, property: string) {
  const match = styleText.match(new RegExp(`${property}\\s*:\\s*([^;]+)`, "i"));
  return match ? normalizeStyleValue(match[1]) : "";
}

function truncateText(text: string, maxLength = 80) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}...`;
}

function mergeStyleTexts(...styleTexts: string[]) {
  const declarations = new Map<string, string>();

  for (const styleText of styleTexts) {
    for (const chunk of styleText.split(";")) {
      const trimmed = chunk.trim();
      if (!trimmed) continue;
      const separatorIndex = trimmed.indexOf(":");
      if (separatorIndex < 0) continue;
      const property = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      if (!property || !value) continue;
      declarations.set(property, value);
    }
  }

  return Array.from(declarations.entries())
    .map(([property, value]) => `${property}: ${value}`)
    .join("; ");
}

function extractBlockStyle(node: Element) {
  const selfStyle = normalizeStyleValue(node.getAttribute("style") ?? "");
  const contentStyle =
    normalizeStyleValue(node.querySelector(".content")?.getAttribute("style") ?? "") ||
    normalizeStyleValue(node.firstElementChild?.getAttribute("style") ?? "");

  return mergeStyleTexts(selfStyle, contentStyle);
}

function pickRepresentativeBlocks(
  blocks: Array<{ tag: string; text: string; inlineStyle: string }>,
  limit = 8,
) {
  const preferredOrder = ["h1", "h2", "h3", "blockquote", "ol", "ul", "li", "p"];
  const selected: Array<{ tag: string; text: string; inlineStyle: string }> = [];
  const usedIndexes = new Set<number>();

  for (const tag of preferredOrder) {
    const index = blocks.findIndex((block, blockIndex) => block.tag === tag && !usedIndexes.has(blockIndex));
    if (index >= 0) {
      selected.push(blocks[index]);
      usedIndexes.add(index);
    }
    if (selected.length >= limit) return selected;
  }

  for (let i = 0; i < blocks.length && selected.length < limit; i += 1) {
    if (usedIndexes.has(i)) continue;
    selected.push(blocks[i]);
  }

  return selected;
}

export function parseWechatEditorPastePayload(html: string, plainText: string): WechatEditorImportSummary {
  const safeHtml = html.trim();
  const safePlainText = plainText.trim();

  if (typeof DOMParser === "undefined" || !safeHtml) {
    return {
      source: "plain-text",
      html: "",
      plainText: safePlainText,
      blockCount: 0,
      paragraphCount: 0,
      headingCount: 0,
      listCount: 0,
      quoteCount: 0,
      imageCount: 0,
      strongCount: 0,
      dominantColors: [],
      fontSizes: [],
      lineHeights: [],
      textAligns: [],
      sampleBlocks: [],
    };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(safeHtml, "text/html");
  const blockSelector = "p,h1,h2,h3,h4,h5,h6,blockquote,ul,ol,li";
  const blocks = Array.from(doc.body.querySelectorAll(blockSelector));
  const textBlocks = blocks.filter((node) => node.textContent?.trim());
  const styledElements = Array.from(
    doc.body.querySelectorAll("p,h1,h2,h3,h4,h5,h6,blockquote,ul,ol,li,strong,b,span,img"),
  );

  const styleTexts = styledElements.map((element) =>
    ["h1", "h2", "h3", "h4", "h5", "h6"].includes(element.tagName.toLowerCase())
      ? extractBlockStyle(element)
      : normalizeStyleValue(element.getAttribute("style") ?? ""),
  );

  const colors = dedupeSorted(styleTexts.map((styleText) => extractStyleValue(styleText, "color")).filter(Boolean));
  const fontSizes = dedupeSorted(styleTexts.map((styleText) => extractStyleValue(styleText, "font-size")).filter(Boolean));
  const lineHeights = dedupeSorted(styleTexts.map((styleText) => extractStyleValue(styleText, "line-height")).filter(Boolean));
  const textAligns = dedupeSorted(styleTexts.map((styleText) => extractStyleValue(styleText, "text-align")).filter(Boolean));

  return {
    source: "html",
    html: safeHtml,
    plainText: safePlainText || doc.body.textContent?.trim() || "",
    blockCount: textBlocks.length,
    paragraphCount: doc.body.querySelectorAll("p").length,
    headingCount: doc.body.querySelectorAll("h1,h2,h3,h4,h5,h6").length,
    listCount: doc.body.querySelectorAll("ul,ol").length,
    quoteCount: doc.body.querySelectorAll("blockquote").length,
    imageCount: doc.body.querySelectorAll("img").length,
    strongCount: doc.body.querySelectorAll("strong,b").length,
    dominantColors: colors.slice(0, 8),
    fontSizes: fontSizes.slice(0, 8),
    lineHeights: lineHeights.slice(0, 8),
    textAligns: textAligns.slice(0, 8),
    sampleBlocks: pickRepresentativeBlocks(
      textBlocks.map((node) => ({
        tag: node.tagName.toLowerCase(),
        text: truncateText(node.textContent ?? ""),
        inlineStyle: extractBlockStyle(node),
      })),
      8,
    ),
  };
}

export async function saveWechatEditorImport(payload: {
  title: string;
  html: string;
  plainText: string;
  summary: WechatEditorImportSummary;
}): Promise<SavedWechatEditorImport> {
  const response = await fetch("/api/save-wechat-editor-import", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "save-wechat-editor-import failed");
  }

  return response.json() as Promise<SavedWechatEditorImport>;
}

export async function loadLatestWechatEditorImport(): Promise<WechatEditorImportSummary | null> {
  const response = await fetch("/api/load-latest-wechat-editor-import");

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "load-latest-wechat-editor-import failed");
  }

  const payload = await response.json();
  return (payload?.summary as WechatEditorImportSummary | null) ?? null;
}
