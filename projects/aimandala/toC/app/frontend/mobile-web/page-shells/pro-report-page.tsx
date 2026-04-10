import { Fragment, useEffect, useMemo, useState } from "react";

import logoNiwu from "../assets/logo-niwu.webp";
import brandPattern from "../assets/pattern.webp";
import { chatWithInterpretationReport } from "../../shared/api/services";
import { getThemeDisplayName } from "../../shared/core";
import type { MandalaFlowState } from "../../shared/types";
import type { MobileWebUploadDraft } from "../state";

type ProMarkdownSection = {
  title: string;
  body: string;
};

type InlineToken =
  | { type: "text"; content: string }
  | { type: "strong"; content: string };

type MarkdownBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading3"; text: string }
  | { type: "rule" }
  | { type: "ordered-list"; items: string[] }
  | { type: "table"; header: string[]; rows: string[][] };

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function TopArrowIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14.5 6.5L9 12L14.5 17.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShareGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 8.5A3.5 3.5 0 1 1 8.8 10.7L4.5 13.2M15.2 13.3L19.5 10.8M13.5 15.3L16.8 17.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SaveGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 10.5 12 15.5l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 20h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function RestartGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 3v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 10v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="7" r="1" fill="currentColor" />
    </svg>
  );
}

function MessageGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 2 1.4-4.2A7.5 7.5 0 1 1 20 11.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SendGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 2 11 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m22 2-7 20-4-9-9-4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LoadingGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4a8 8 0 1 0 8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function extractProTitle(state: MandalaFlowState): string {
  const titleFromReport = state.report?.title;
  const markdown =
    typeof state.report?.report === "string" ? state.report.report : "";
  const markdownTitle = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const raw = markdownTitle || titleFromReport || "Pro 解读报告";
  const withoutPrefix = raw.includes("：") ? raw.split("：").slice(1).join("：").trim() : raw;
  return withoutPrefix.replace(/\s*-\s*Pro\s*版?\s*$/i, "").trim() || "Pro 解读报告";
}

function parseProMarkdown(state: MandalaFlowState): ProMarkdownSection[] {
  const markdown =
    typeof state.report?.report === "string" ? state.report.report : "";
  const trimmed = markdown.replace(/^#\s+.+\n?/, "").trim();
  if (!trimmed) {
    return [];
  }

  const sections: ProMarkdownSection[] = [];
  const parts = trimmed.split(/\n(?=##\s+)/);
  for (const part of parts) {
    const match = part.match(/^##\s+(.+?)(?:\n|$)([\s\S]*)/);
    if (match) {
      sections.push({
        title: match[1].trim(),
        body: match[2].trim(),
      });
      continue;
    }

    if (part.trim()) {
      sections.push({
        title: "",
        body: part.trim(),
      });
    }
  }

  return sections;
}

function parseQaQuestions(state: MandalaFlowState): string[] {
  const qa = state.report?.ai_qa_context;
  if (Array.isArray(qa)) {
    return qa.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof qa === "string" && qa.trim()) {
    return qa
      .split(/\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function stripMarkdownText(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\|/g, " ")
    .trim();
}

function extractFirstParagraph(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((part) => stripMarkdownText(part).trim())
    .find(Boolean) ?? "";
}

function extractProSummary(state: MandalaFlowState, sections: ProMarkdownSection[]): string {
  const overallImpression = stripMarkdownText(state.report?.overall_impression ?? "");
  if (overallImpression) {
    return overallImpression;
  }

  const firstParagraph = extractFirstParagraph(sections[0]?.body ?? "");
  if (firstParagraph) {
    return firstParagraph;
  }

  return "这份 Pro 报告会把 Lite 里已经看到的主线，继续向更深的结构与现实连接展开。";
}

function ProMandalaPreview({
  imagePath,
  innerRadius = 0.3,
  middleRadius = 0.68,
}: {
  imagePath?: string | null;
  innerRadius?: number;
  middleRadius?: number;
}) {
  if (!imagePath) return null;

  const outer = 148;
  const middleSize = Math.max(outer * middleRadius, 18);
  const innerSize = Math.max(outer * innerRadius, 12);

  return (
    <div style={{ position: "relative", width: outer, height: outer }}>
      <div style={{ position: "absolute", inset: -16, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,160,84,0.22) 0%, rgba(212,160,84,0.08) 42%, rgba(26,40,68,0) 72%)", filter: "blur(3px)" }} />
      <div style={{ position: "absolute", inset: -8, borderRadius: "50%", background: "conic-gradient(from 0deg, rgba(212,160,84,0.26), rgba(200,120,80,0.14), rgba(212,160,84,0.26))", filter: "blur(5px)" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", overflow: "hidden", border: "2.5px solid #C8A066", boxShadow: "0 0 20px rgba(200,160,102,0.22), inset 0 0 18px rgba(200,160,102,0.08)" }}>
        <img src={imagePath} alt="当前曼陀罗" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ position: "absolute", width: middleSize, height: middleSize, top: "50%", left: "50%", transform: "translate(-50%, -50%)", borderRadius: "50%", border: "1.6px solid rgba(255,208,0,0.96)", boxShadow: "0 0 8px rgba(255,208,0,0.55)" }} />
      <div style={{ position: "absolute", width: innerSize, height: innerSize, top: "50%", left: "50%", transform: "translate(-50%, -50%)", borderRadius: "50%", border: "1.6px solid rgba(0,255,208,0.96)", boxShadow: "0 0 8px rgba(0,255,208,0.55)" }} />
      <div style={{ position: "absolute", right: -8, bottom: -4, padding: "3px 8px", borderRadius: 999, background: "linear-gradient(135deg, #1E2D4D 0%, #253860 100%)", border: "1px solid rgba(212,160,84,0.3)", boxShadow: "0 8px 18px rgba(26,40,68,0.2)", fontSize: 10, fontWeight: 500, color: "#D4A054", letterSpacing: "0.05em" }}>Pro版</div>
    </div>
  );
}

export interface MobileWebProReportPageProps {
  state: MandalaFlowState;
  uploadDraft?: MobileWebUploadDraft;
  onBackAction?: () => void;
  onRestartAction?: () => void;
  onRetryAction?: () => void;
}

function ProReportMarkdown({ sections }: { sections: ProMarkdownSection[] }) {
  function parseInlineTokens(text: string): InlineToken[] {
    const tokens: InlineToken[] = [];
    const pattern = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;

    for (const match of text.matchAll(pattern)) {
      const index = match.index ?? 0;
      if (index > lastIndex) {
        tokens.push({
          type: "text",
          content: text.slice(lastIndex, index),
        });
      }
      tokens.push({
        type: "strong",
        content: match[1],
      });
      lastIndex = index + match[0].length;
    }

    if (lastIndex < text.length) {
      tokens.push({
        type: "text",
        content: text.slice(lastIndex),
      });
    }

    return tokens.length ? tokens : [{ type: "text", content: text }];
  }

  function renderInlineText(text: string) {
    return parseInlineTokens(text).map((token, index) => {
      if (token.type === "strong") {
        return (
          <strong key={`${token.content}-${index}`} style={{ color: "#4A3D30", fontWeight: 600 }}>
            {token.content}
          </strong>
        );
      }

      return <Fragment key={`${token.content}-${index}`}>{token.content}</Fragment>;
    });
  }

  function isTableSeparatorLine(line: string): boolean {
    const trimmed = line.trim();
    return /^\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?$/.test(trimmed);
  }

  function parseMarkdownBlocks(body: string): MarkdownBlock[] {
    const lines = body.split("\n");
    const blocks: MarkdownBlock[] = [];
    let paragraphBuffer: string[] = [];
    let orderedListBuffer: string[] = [];
    let tableBuffer: string[] = [];

    const flushParagraph = () => {
      if (!paragraphBuffer.length) return;
      blocks.push({
        type: "paragraph",
        text: paragraphBuffer.join("\n").trim(),
      });
      paragraphBuffer = [];
    };

    const flushOrderedList = () => {
      if (!orderedListBuffer.length) return;
      blocks.push({
        type: "ordered-list",
        items: [...orderedListBuffer],
      });
      orderedListBuffer = [];
    };

    const flushTable = () => {
      if (tableBuffer.length < 2) {
        paragraphBuffer.push(...tableBuffer);
        tableBuffer = [];
        return;
      }

      const normalized = tableBuffer
        .map((line) => line.trim())
        .filter(Boolean);

      if (normalized.length < 2 || !isTableSeparatorLine(normalized[1])) {
        paragraphBuffer.push(...tableBuffer);
        tableBuffer = [];
        return;
      }

      const parseCells = (line: string) =>
        line
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((cell) => cell.trim());

      const header = parseCells(normalized[0]);
      const rows = normalized.slice(2).map(parseCells);
      blocks.push({
        type: "table",
        header,
        rows,
      });
      tableBuffer = [];
    };

    const flushAll = () => {
      flushParagraph();
      flushOrderedList();
      flushTable();
    };

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      const trimmed = line.trim();

      if (!trimmed) {
        flushParagraph();
        flushOrderedList();
        flushTable();
        continue;
      }

      if (trimmed.startsWith("|")) {
        flushParagraph();
        flushOrderedList();
        tableBuffer.push(trimmed);
        continue;
      }

      flushTable();

      if (/^---+$/.test(trimmed)) {
        flushParagraph();
        flushOrderedList();
        blocks.push({ type: "rule" });
        continue;
      }

      if (trimmed.startsWith("### ")) {
        flushParagraph();
        flushOrderedList();
        blocks.push({
          type: "heading3",
          text: trimmed.slice(4).trim(),
        });
        continue;
      }

      const orderedListMatch = trimmed.match(/^\d+\.\s+(.+)$/);
      if (orderedListMatch) {
        flushParagraph();
        orderedListBuffer.push(orderedListMatch[1].trim());
        continue;
      }

      flushOrderedList();
      paragraphBuffer.push(line);
    }

    flushAll();
    return blocks;
  }

  return (
    <div style={{ display: "grid", gap: 24, marginBottom: 8 }}>
      {sections.map((section, index) => (
        <section key={`${section.title}-${index}`} style={index > 0 ? { paddingTop: 2 } : undefined}>
          {index > 0 ? (
            <div style={{ width: 36, height: 1, marginBottom: 18, background: "linear-gradient(90deg, rgba(200,160,102,0.45), rgba(200,160,102,0.08))" }} />
          ) : null}
          {section.title ? (
            <h2
              style={{
                margin: "0 0 10px",
                fontFamily: "'Noto Serif SC', serif",
                fontSize: 16,
                fontWeight: 600,
                color: "#4A3D30",
                letterSpacing: "0.04em",
                lineHeight: 1.45,
              }}
            >
              {section.title}
            </h2>
          ) : null}
          <div style={{ display: "grid", gap: 12 }}>
            {parseMarkdownBlocks(section.body).map((block, blockIndex) => {
              if (block.type === "heading3") {
                return (
                  <h3
                    key={`${section.title}-${index}-h3-${blockIndex}`}
                    style={{
                      margin: 0,
                      fontFamily: "'Noto Serif SC', serif",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#5A4938",
                      lineHeight: 1.6,
                    }}
                  >
                    {renderInlineText(block.text)}
                  </h3>
                );
              }

              if (block.type === "paragraph") {
                return (
                  <p
                    key={`${section.title}-${index}-p-${blockIndex}`}
                    style={{
                      margin: 0,
                      fontSize: 14,
                      color: "#5E5046",
                      lineHeight: 1.92,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {renderInlineText(block.text)}
                  </p>
                );
              }

              if (block.type === "rule") {
                return (
                  <div
                    key={`${section.title}-${index}-rule-${blockIndex}`}
                    style={{
                      width: "100%",
                      height: 1,
                      background: "linear-gradient(90deg, rgba(200,160,102,0.28), rgba(200,160,102,0.06))",
                    }}
                  />
                );
              }

              if (block.type === "ordered-list") {
                return (
                  <ol
                    key={`${section.title}-${index}-ol-${blockIndex}`}
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      display: "grid",
                      gap: 10,
                      color: "#5E5046",
                      fontSize: 14,
                      lineHeight: 1.88,
                    }}
                  >
                    {block.items.map((item, itemIndex) => (
                      <li key={`${item}-${itemIndex}`}>{renderInlineText(item)}</li>
                    ))}
                  </ol>
                );
              }

              return (
                <div
                  key={`${section.title}-${index}-table-${blockIndex}`}
                  style={{
                    overflowX: "auto",
                    borderRadius: 12,
                    border: "1px solid rgba(200,160,102,0.18)",
                    background: "rgba(255,255,255,0.36)",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 13,
                      color: "#5E5046",
                    }}
                  >
                    <thead>
                      <tr>
                        {block.header.map((cell, cellIndex) => (
                          <th
                            key={`${cell}-${cellIndex}`}
                            style={{
                              padding: "10px 12px",
                              textAlign: "left",
                              fontWeight: 600,
                              color: "#4A3D30",
                              background: "rgba(200,160,102,0.12)",
                              borderBottom: "1px solid rgba(200,160,102,0.18)",
                            }}
                          >
                            {renderInlineText(cell)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map((row, rowIndex) => (
                        <tr key={`${row.join("-")}-${rowIndex}`}>
                          {row.map((cell, cellIndex) => (
                            <td
                              key={`${cell}-${cellIndex}`}
                              style={{
                                padding: "10px 12px",
                                verticalAlign: "top",
                                borderTop: rowIndex === 0 ? "none" : "1px solid rgba(200,160,102,0.12)",
                              }}
                            >
                              {renderInlineText(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function MobileWebAiChatModal({
  open,
  questions,
  messages,
  input,
  error,
  sending,
  onInputChange,
  onClose,
  onSend,
}: {
  open: boolean;
  questions: string[];
  messages: ChatMessage[];
  input: string;
  error: string | null;
  sending: boolean;
  onInputChange: (value: string) => void;
  onClose: () => void;
  onSend: (message?: string) => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <>
      <div
        role="presentation"
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40 }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="和曼曼聊聊"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 41,
          height: "85vh",
          maxHeight: 700,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          background: "linear-gradient(180deg, #F5EFE2 0%, #EDE6D6 100%)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ paddingTop: 10, background: "linear-gradient(135deg, #1A2844 0%, #1E2D4D 50%, #253860 100%)" }}>
          <div style={{ width: 44, height: 4, borderRadius: 999, margin: "0 auto 10px", background: "rgba(232,220,200,0.2)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(212,160,84,0.15)", color: "#D4A054" }}>
                <MessageGlyph />
              </div>
              <div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 16, fontWeight: 600, color: "#E8DCC8" }}>和曼曼聊聊</div>
                <div style={{ fontSize: 11, color: "rgba(232,220,200,0.5)" }}>关于你的曼陀罗解读</div>
              </div>
            </div>
            <button type="button" onClick={onClose} style={{ width: 36, height: 36, borderRadius: 999, border: 0, background: "rgba(255,255,255,0.1)", color: "#E8DCC8", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CloseGlyph />
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "grid", gap: 14 }}>
          {messages.length === 0 ? (
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 999, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(212,160,84,0.2)", color: "#D4A054", fontSize: 14 }}>曼</div>
              <div style={{ maxWidth: "80%", borderRadius: 18, borderTopLeftRadius: 6, padding: "12px 14px", background: "rgba(255,255,255,0.82)", border: "1px solid rgba(212,160,84,0.1)", fontSize: 14, color: "#5E5046", lineHeight: 1.6 }}>
                嗨，我是曼曼。你可以继续问我这份 Pro 解读里最在意的部分，我先在这里陪你整理思路。
              </div>
            </div>
          ) : null}
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} style={{ display: "flex", gap: 12, justifyContent: message.role === "user" ? "flex-end" : "flex-start" }}>
              {message.role === "assistant" ? <div style={{ width: 32, height: 32, borderRadius: 999, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(212,160,84,0.2)", color: "#D4A054", fontSize: 14 }}>曼</div> : null}
              <div style={{ maxWidth: "78%", borderRadius: 18, borderTopLeftRadius: message.role === "assistant" ? 6 : 18, borderTopRightRadius: message.role === "user" ? 6 : 18, padding: "12px 14px", background: message.role === "user" ? "linear-gradient(135deg, #9B4030 0%, #C87850 100%)" : "rgba(255,255,255,0.82)", color: message.role === "user" ? "#F5EFE2" : "#5E5046", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {message.content}
              </div>
            </div>
          ))}
          {messages.length === 0 && questions.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginLeft: 44 }}>
              {questions.map((question) => (
                <button key={question} type="button" disabled={sending} onClick={() => onSend(question)} style={{ padding: "8px 12px", borderRadius: 999, border: "1px solid rgba(212,160,84,0.15)", background: "rgba(212,160,84,0.08)", color: "#7A6A5A", fontSize: 12, lineHeight: 1.5, opacity: sending ? 0.5 : 1 }}>
                  {question}
                </button>
              ))}
            </div>
          ) : null}
          {sending ? (
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-start" }}>
              <div style={{ width: 32, height: 32, borderRadius: 999, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(212,160,84,0.2)", color: "#D4A054", fontSize: 14 }}>
                <LoadingGlyph />
              </div>
              <div style={{ maxWidth: "78%", borderRadius: 18, borderTopLeftRadius: 6, padding: "12px 14px", background: "rgba(255,255,255,0.82)", border: "1px solid rgba(212,160,84,0.1)", fontSize: 14, color: "#7A6A5A", lineHeight: 1.6 }}>
                曼曼正在结合这份报告继续想一想……
              </div>
            </div>
          ) : null}
        </div>
        <div style={{ padding: 16, borderTop: "1px solid rgba(138,124,108,0.12)", background: "rgba(245,239,226,0.96)" }}>
          {error ? (
            <div style={{ marginBottom: 10, fontSize: 12, lineHeight: 1.6, color: "#9B4030" }}>
              {error}
            </div>
          ) : null}
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={input}
              disabled={sending}
              onChange={(event) => onInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !sending) {
                  event.preventDefault();
                  onSend();
                }
              }}
              placeholder="输入你想继续追问的问题"
              style={{ flex: 1, minHeight: 46, borderRadius: 14, border: "1px solid rgba(138,124,108,0.16)", background: "rgba(255,255,255,0.88)", padding: "0 14px", fontSize: 14, color: "#4A3D30", outline: "none" }}
            />
            <button type="button" disabled={sending} onClick={() => onSend()} style={{ width: 46, height: 46, borderRadius: 14, border: 0, background: "linear-gradient(135deg, #9B4030 0%, #C87850 50%, #D4A054 100%)", color: "#F5EFE2", display: "flex", alignItems: "center", justifyContent: "center", opacity: sending ? 0.5 : 1 }}>
              {sending ? <LoadingGlyph /> : <SendGlyph />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function MobileWebProReportPage({
  state,
  uploadDraft,
  onBackAction,
  onRestartAction,
  onRetryAction,
}: MobileWebProReportPageProps) {
  const [saved, setSaved] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatSending, setChatSending] = useState(false);
  const previewImage = uploadDraft?.imagePath ?? state.selectedImage?.imagePath ?? null;
  const innerRadius = state.status?.three_circles?.inner_radius ?? state.interpretation?.three_circles?.inner_radius ?? 0.3;
  const middleRadius = state.status?.three_circles?.middle_radius ?? state.interpretation?.three_circles?.middle_radius ?? 0.68;
  const title = useMemo(() => extractProTitle(state), [state]);
  const sections = useMemo(() => parseProMarkdown(state), [state]);
  const qaQuestions = useMemo(() => parseQaQuestions(state), [state]);
  const summary = useMemo(() => extractProSummary(state, sections), [sections, state]);
  const hasProReport = state.report?.version === "pro" && sections.length > 0;
  const isError = state.step === "error" && Boolean(state.lastError);
  const isGenerating = !hasProReport && !isError;
  const themeLabel = getThemeDisplayName(uploadDraft?.theme) ?? "全面解读";
  const generatedAt = useMemo(
    () =>
      new Date().toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [],
  );

  useEffect(() => {
    setChatMessages([]);
    setChatInput("");
    setChatError(null);
    setChatSending(false);
  }, [state.report?.interpretation_id]);

  async function handleSendChat(message?: string) {
    const next = (message ?? chatInput).trim();
    if (!next) {
      return;
    }
    if (chatSending) {
      return;
    }

    const interpretationId = state.report?.interpretation_id;
    if (!interpretationId) {
      setChatError("当前报告还没有可用的解读记录，暂时无法继续追问。");
      return;
    }

    const history = chatMessages.map((item) => ({
      role: item.role,
      content: item.content,
    }));
    const userMessage: ChatMessage = { role: "user", content: next };
    setChatMessages((current) => [...current, userMessage]);
    setChatInput("");
    setChatError(null);
    setChatSending(true);

    try {
      const response = await chatWithInterpretationReport(interpretationId, {
        message: next,
        history,
      });
      setChatMessages((current) => [
        ...current,
        { role: "assistant", content: response.reply },
      ]);
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "AI 问答暂时没有连上，请稍后再试。";
      setChatError(messageText);
      setChatMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: `这次追问暂时没有顺利返回：${messageText}`,
        },
      ]);
    } finally {
      setChatSending(false);
    }
  }

  function openChatWithQuestion(question?: string) {
    setChatOpen(true);
    if (question) {
      void handleSendChat(question);
    }
  }

  if (isError) {
    return (
      <div style={{ minHeight: "100%", backgroundColor: "#F5EFE2", fontFamily: "'Noto Sans SC', sans-serif", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 480, minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 360, borderRadius: 20, padding: 24, background: "rgba(255,255,255,0.75)", border: "1px solid rgba(195,91,86,0.18)", boxShadow: "0 12px 30px rgba(26,40,68,0.08)", textAlign: "center" }}>
          <div style={{ fontSize: 28, lineHeight: 1, color: "#C25B56", marginBottom: 12 }}>!</div>
          <h2 style={{ margin: 0, fontFamily: "'Noto Serif SC', serif", fontSize: 20, color: "#4A3D30" }}>Pro 报告暂时没有顺利打开</h2>
          <p style={{ margin: "12px 0 20px", fontSize: 14, color: "#7A6A5A", lineHeight: 1.8 }}>{state.lastError}</p>
          <button type="button" onClick={onRetryAction} style={{ width: "100%", minHeight: 46, borderRadius: 12, border: 0, background: "linear-gradient(135deg, #9B4030 0%, #C87850 50%, #D4A054 100%)", color: "#F5EFE2", fontSize: 14 }}>重试加载</button>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100%", backgroundColor: "#F5EFE2", fontFamily: "'Noto Sans SC', sans-serif", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 480, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "linear-gradient(135deg, #1A2844 0%, #1E2D4D 50%, #1A2844 100%)", borderBottom: "1px solid rgba(212,160,84,0.15)" }}>
        <button type="button" onClick={onBackAction} style={{ padding: 4, background: "transparent", border: 0, color: "rgba(232,220,200,0.5)" }}>
          <TopArrowIcon />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src={logoNiwu} alt="一镜一梳" style={{ width: 22, height: 22, objectFit: "contain" }} />
          <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 16, fontWeight: 600, letterSpacing: "0.12em", color: "#D4A054" }}>Pro版完整解读</span>
        </div>
        <button type="button" style={{ padding: 4, background: "transparent", border: 0, color: "rgba(232,220,200,0.5)" }}>
          <ShareGlyph />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" as const }}>
      <div style={{ background: "linear-gradient(180deg, #1A2844 0%, #1E2D4D 50%, #223358 80%, #2A3D65 100%)", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${brandPattern})`, backgroundSize: 300, backgroundRepeat: "repeat", opacity: 0.02 }} />
        <div style={{ position: "relative", padding: "32px 24px 28px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
            <div style={{ marginBottom: 12, fontSize: 11, letterSpacing: "0.18em", color: "rgba(212,160,84,0.72)" }}>一镜一梳 · 深度疗愈阅读</div>
            <h1 style={{ margin: 0, textAlign: "center", fontFamily: "'Noto Serif SC', serif", fontSize: 24, fontWeight: 600, color: "#E8DCC8", letterSpacing: "0.15em", lineHeight: 1.4 }}>{title}</h1>
            <div style={{ width: 56, height: 1, marginTop: 12, background: "linear-gradient(90deg, rgba(212,160,84,0), rgba(212,160,84,0.8), rgba(212,160,84,0))" }} />
            <span style={{ marginTop: 8, fontSize: 12, color: "rgba(232,220,200,0.45)", letterSpacing: "0.08em" }}>
              {generatedAt}生成
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 14 }}>
              <span style={{ padding: "5px 10px", borderRadius: 999, fontSize: 11, color: "#E8DCC8", background: "rgba(212,160,84,0.14)", border: "1px solid rgba(212,160,84,0.18)" }}>
                Pro 完整报告
              </span>
              <span style={{ padding: "5px 10px", borderRadius: 999, fontSize: 11, color: "rgba(232,220,200,0.82)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {themeLabel}
              </span>
            </div>
            <div style={{ marginTop: 22, display: "flex", justifyContent: "center" }}>
              <ProMandalaPreview imagePath={previewImage} innerRadius={innerRadius} middleRadius={middleRadius} />
            </div>
            {summary ? (
              <div
                style={{
                  width: "100%",
                  maxWidth: 368,
                  marginTop: 20,
                  padding: "18px 18px 16px",
                  borderRadius: 22,
                  background: "linear-gradient(180deg, rgba(245,239,226,0.14) 0%, rgba(245,239,226,0.08) 100%)",
                  border: "1px solid rgba(232,220,200,0.12)",
                  boxShadow: "0 18px 36px rgba(8,14,28,0.18)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "rgba(212,160,84,0.86)", marginBottom: 10 }}>一眼总结</div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.85, color: "rgba(232,220,200,0.88)" }}>{summary}</p>
                <p style={{ margin: "10px 0 0", fontSize: 12, lineHeight: 1.7, color: "rgba(232,220,200,0.56)" }}>让这份解读先陪你停一下，再继续往更深处看。</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

          <div style={{ position: "relative", marginTop: -18, padding: "30px 20px 26px", background: "#F0E6D6", borderTopLeftRadius: 28, borderTopRightRadius: 28, boxShadow: "0 -6px 28px rgba(26,40,68,0.16)" }}>
        <div style={{ position: "absolute", top: 10, left: "50%", width: 44, height: 4, borderRadius: 999, transform: "translateX(-50%)", background: "rgba(138,124,108,0.18)" }} />
        <div style={{ display: "grid", gap: 22, maxWidth: 420, margin: "0 auto" }}>
          {isGenerating ? (
            <div style={{ borderRadius: 18, padding: 22, background: "rgba(255,255,255,0.68)", border: "1px solid rgba(138,124,108,0.12)", textAlign: "center" }}>
              <div style={{ width: 48, height: 48, margin: "0 auto 14px", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(212,160,84,0.08)", color: "#D4A054" }}>
                <LoadingGlyph />
              </div>
              <p style={{ margin: 0, fontFamily: "'Noto Serif SC', serif", fontSize: 18, color: "#4A3D30" }}>Pro 报告还在准备中</p>
              <p style={{ margin: "12px 0 18px", fontSize: 14, color: "#7A6A5A", lineHeight: 1.8 }}>
                正常流程会先停留在全局 Loading 页；如果你是直接打开了当前页面，可以手动再刷新一次。
              </p>
              <button type="button" onClick={onRetryAction} style={{ width: "100%", minHeight: 46, borderRadius: 12, border: 0, background: "linear-gradient(135deg, #9B4030 0%, #C87850 50%, #D4A054 100%)", color: "#F5EFE2", fontSize: 14 }}>
                刷新 Pro 报告
              </button>
            </div>
          ) : null}

          {hasProReport ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#8A7C6C" }}>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(138,124,108,0), rgba(138,124,108,0.18))" }} />
              <span style={{ fontSize: 11, letterSpacing: "0.16em" }}>完整解读</span>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(138,124,108,0.18), rgba(138,124,108,0))" }} />
            </div>
          ) : null}

          {hasProReport ? (
            <p style={{ margin: "-10px 0 2px", textAlign: "center", fontSize: 12.5, color: "#8F8071", lineHeight: 1.8 }}>
              慢一点读，你会更容易看见那些原本藏在反应背后的结构。
            </p>
          ) : null}

          {hasProReport ? <ProReportMarkdown sections={sections} /> : null}

          {qaQuestions.length > 0 ? (
            <div style={{ borderRadius: 20, overflow: "hidden", background: "linear-gradient(135deg, #1A2844 0%, #1E2D4D 50%, #253860 100%)", border: "1px solid rgba(212,160,84,0.2)", boxShadow: "0 14px 28px rgba(26,40,68,0.16)" }}>
              <div style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(212,160,84,0.15)", color: "#D4A054" }}>
                    <MessageGlyph />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 15, fontWeight: 600, color: "#E8DCC8" }}>还有疑问？</div>
                    <div style={{ fontSize: 11, color: "rgba(232,220,200,0.5)" }}>AI 助手随时为你解答</div>
                  </div>
                </div>
                <p style={{ margin: "0 0 12px", fontFamily: "'Noto Serif SC', serif", fontSize: 15, fontWeight: 600, color: "#E8DCC8" }}>你可以继续这样追问</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {qaQuestions.map((question) => (
                    <button key={question} type="button" onClick={() => openChatWithQuestion(question)} style={{ padding: "7px 11px", borderRadius: 999, background: "rgba(212,160,84,0.1)", color: "rgba(232,220,200,0.78)", border: "1px solid rgba(212,160,84,0.15)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)", fontSize: 12, lineHeight: 1.5, textAlign: "left" }}>
                      {question}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ padding: 20, paddingTop: 12 }}>
                <button type="button" onClick={() => setChatOpen(true)} style={{ width: "100%", minHeight: 46, borderRadius: 12, border: "1px solid rgba(212,160,84,0.25)", background: "rgba(212,160,84,0.15)", color: "#D4A054", fontSize: 14, fontWeight: 500, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <MessageGlyph />
                    开始 AI 对话
                  </span>
                </button>
              </div>
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={() => {
                setSaved(true);
                window.setTimeout(() => setSaved(false), 1800);
              }}
              style={{ flex: 1, minHeight: 50, borderRadius: 999, border: "1px solid rgba(212,160,84,0.24)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "linear-gradient(135deg, #9B4030 0%, #C87850 56%, #D4A054 100%)", color: "#F5EFE2", fontSize: 14, fontWeight: 500, boxShadow: "0 12px 24px rgba(155,64,48,0.16)" }}
            >
              <SaveGlyph />
              <span>{saved ? "已保存到相册" : "保存报告"}</span>
            </button>
            <button type="button" onClick={onRestartAction} style={{ flex: 1, minHeight: 50, borderRadius: 999, border: "1px solid rgba(200,160,102,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(255,255,255,0.82)", color: "#8A7C6C", fontSize: 14, fontWeight: 500, boxShadow: "0 8px 18px rgba(26,40,68,0.06), inset 0 1px 0 rgba(255,255,255,0.35)" }}>
              <RestartGlyph />
              <span>再画一幅</span>
            </button>
          </div>

          <div style={{ borderRadius: 16, padding: "15px 16px", background: "rgba(255,255,255,0.58)", border: "1px solid rgba(138,124,108,0.1)" }}>
            <p style={{ margin: 0, fontSize: 12.5, color: "#8A7C6C", lineHeight: 1.8 }}>
              更多延展服务会在后续版本逐步开放，当前 MVP 先聚焦把单次 Pro 报告阅读体验做好。
            </p>
          </div>

          <div style={{ borderRadius: 14, padding: 16, background: "rgba(200,120,80,0.05)", border: "1px solid rgba(200,120,80,0.1)" }}>
            <p style={{ margin: 0, fontSize: 11.5, color: "#A89C8E", lineHeight: 1.75, display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ color: "#C87850", marginTop: 1 }}>
                <InfoGlyph />
              </span>
              <span>
              本报告基于AI分析和传统五行理论生成，仅供自我探索参考，不构成医疗或心理咨询建议。如有严重心理困扰，请寻求专业帮助。
              </span>
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 8, marginBottom: 4 }}>
            <div style={{ width: 48, height: 1, marginBottom: 12, background: "linear-gradient(90deg, transparent, rgba(138,124,108,0.2), transparent)" }} />
            <img src={logoNiwu} alt="一镜一梳" style={{ width: 24, height: 24, objectFit: "contain", opacity: 0.4 }} />
            <span style={{ marginTop: 6, fontFamily: "'Noto Serif SC', serif", fontSize: 11, color: "#A89C8E", letterSpacing: "0.15em", opacity: 0.6 }}>一镜一梳</span>
          </div>
        </div>
      </div>
      </div>
      </div>
      <MobileWebAiChatModal
        open={chatOpen}
        questions={qaQuestions}
        messages={chatMessages}
        input={chatInput}
        error={chatError}
        sending={chatSending}
        onInputChange={setChatInput}
        onClose={() => setChatOpen(false)}
        onSend={(message) => {
          void handleSendChat(message);
        }}
      />
    </div>
  );
}
