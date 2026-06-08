import type { MarkdownStructureSummary, ParsedMarkdownDocument, UploadedArticle } from "../types";

function countMatches(source: string, pattern: RegExp) {
  return (source.match(pattern) || []).length;
}

function extractTitle(lines: string[]) {
  const heading = lines.find((line) => line.trim().startsWith("# "));
  if (heading) {
    return heading.replace(/^#\s+/, "").trim();
  }

  const firstParagraph = lines.find((line) => line.trim().length > 0);
  return firstParagraph?.trim() || "未命名文稿";
}

function buildStructureTags(summary: MarkdownStructureSummary) {
  return [
    `${summary.headings} 文章标题`,
    `${summary.subheadings} 一级标题`,
    `${summary.bolds} 加粗`,
    `${summary.quotes} 引用`,
  ];
}

export interface ParsedMarkdownPayload {
  article: UploadedArticle;
  parsedMarkdown: ParsedMarkdownDocument;
}

export function parseMarkdownFileContent(fileName: string, rawText: string): ParsedMarkdownPayload {
  const lines = rawText.split(/\r?\n/);
  const title = extractTitle(lines);

  const structure: MarkdownStructureSummary = {
    headings: countMatches(rawText, /^#\s.+$/gm),
    subheadings: countMatches(rawText, /^##\s.+$/gm),
    bolds: countMatches(rawText, /\*\*[^*]+\*\*/g),
    quotes: countMatches(rawText, /^>\s.+$/gm),
    lists: countMatches(rawText, /^(\s*[-*+]\s.+|\s*\d+\.\s.+)$/gm),
  };

  return {
    article: {
      fileName,
      updatedAt: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }),
      wordCount: rawText.trim().length,
      title,
      rawText,
    },
    parsedMarkdown: {
      status: "parsed",
      structure,
      structureTags: buildStructureTags(structure),
    },
  };
}
