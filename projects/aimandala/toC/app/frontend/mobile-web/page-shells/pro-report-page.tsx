import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

import logoNiwu from "../assets/logo-niwu.webp";
import brandPattern from "../assets/pattern.webp";
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
  const withoutPrefix = raw.includes("：")
    ? raw.split("：").slice(1).join("：").trim()
    : raw;
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
    return qa.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
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
  return (
    text
      .split(/\n\s*\n/)
      .map((part) => stripMarkdownText(part).trim())
      .find(Boolean) ?? ""
  );
}

function extractProSummary(
  state: MandalaFlowState,
  sections: ProMarkdownSection[],
): string {
  const overallImpression = stripMarkdownText(
    state.report?.overall_impression ?? "",
  );
  if (overallImpression) {
    return overallImpression;
  }

  const firstParagraph = extractFirstParagraph(sections[0]?.body ?? "");
  if (firstParagraph) {
    return firstParagraph;
  }

  return "这份 Pro 报告会把 Lite 里已经看到的主线，继续向更深的结构与现实连接展开。";
}

function joinClassNames(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
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
  const previewStyle = {
    "--am-pro-middle-size": `${middleSize}px`,
    "--am-pro-inner-size": `${innerSize}px`,
  } as CSSProperties;

  return (
    <div className="am-pro-report-preview" style={previewStyle}>
      <div className="am-pro-report-preview__halo" />
      <div className="am-pro-report-preview__aura" />
      <div className="am-pro-report-preview__frame">
        <img
          className="am-pro-report-preview__image"
          src={imagePath}
          alt="当前曼陀罗"
        />
      </div>
      <div className="am-pro-report-preview__ring am-pro-report-preview__ring--middle" />
      <div className="am-pro-report-preview__ring am-pro-report-preview__ring--inner" />
      <div className="am-pro-report-preview__pill">Pro版</div>
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
          <strong
            key={`${token.content}-${index}`}
            className="am-pro-report-markdown__strong"
          >
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

      const normalized = tableBuffer.map((line) => line.trim()).filter(Boolean);

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
    <div className="am-pro-report-markdown">
      {sections.map((section, index) => (
        <section
          key={`${section.title}-${index}`}
          className={joinClassNames(
            "am-pro-report-markdown__section",
            index > 0 && "am-pro-report-markdown__section--split",
          )}
        >
          {index > 0 ? <div className="am-pro-report-markdown__divider" /> : null}
          {section.title ? (
            <h2 className="am-pro-report-markdown__section-title">{section.title}</h2>
          ) : null}
          <div className="am-pro-report-markdown__blocks">
            {parseMarkdownBlocks(section.body).map((block, blockIndex) => {
              if (block.type === "heading3") {
                return (
                  <h3
                    key={`${section.title}-${index}-h3-${blockIndex}`}
                    className="am-pro-report-markdown__heading3"
                  >
                    {renderInlineText(block.text)}
                  </h3>
                );
              }

              if (block.type === "paragraph") {
                return (
                  <p
                    key={`${section.title}-${index}-p-${blockIndex}`}
                    className="am-pro-report-markdown__paragraph"
                  >
                    {renderInlineText(block.text)}
                  </p>
                );
              }

              if (block.type === "rule") {
                return (
                  <div
                    key={`${section.title}-${index}-rule-${blockIndex}`}
                    className="am-pro-report-markdown__rule"
                  />
                );
              }

              if (block.type === "ordered-list") {
                return (
                  <ol
                    key={`${section.title}-${index}-ol-${blockIndex}`}
                    className="am-pro-report-markdown__list"
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
                  className="am-pro-report-markdown__table-wrap"
                >
                  <table className="am-pro-report-markdown__table">
                    <thead>
                      <tr>
                        {block.header.map((cell, cellIndex) => (
                          <th
                            key={`${cell}-${cellIndex}`}
                            className="am-pro-report-markdown__table-heading"
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
                              className={joinClassNames(
                                "am-pro-report-markdown__table-cell",
                                rowIndex > 0 &&
                                  "am-pro-report-markdown__table-cell--with-border",
                              )}
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
        className="am-pro-chat-modal__backdrop"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="和曼曼聊聊"
        className="am-pro-chat-modal"
      >
        <div className="am-pro-chat-modal__header-shell">
          <div className="am-pro-chat-modal__handle" />
          <div className="am-pro-chat-modal__header">
            <div className="am-pro-chat-modal__title-group">
              <div className="am-pro-chat-modal__icon">
                <MessageGlyph />
              </div>
              <div>
                <div className="am-pro-chat-modal__title">和曼曼聊聊</div>
                <div className="am-pro-chat-modal__subtitle">关于你的曼陀罗解读</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="am-pro-chat-modal__close"
            >
              <CloseGlyph />
            </button>
          </div>
        </div>
        <div className="am-pro-chat-modal__body am-scrollbar-hide">
          {messages.length === 0 ? (
            <div className="am-pro-chat-bubble-row is-assistant">
              <div className="am-pro-chat-avatar">曼</div>
              <div className="am-pro-chat-bubble is-assistant">
                嗨，我是曼曼。你可以继续问我这份 Pro 解读里最在意的部分，我先在这里陪你整理思路。
              </div>
            </div>
          ) : null}
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={joinClassNames(
                "am-pro-chat-bubble-row",
                message.role === "user" ? "is-user" : "is-assistant",
              )}
            >
              {message.role === "assistant" ? (
                <div className="am-pro-chat-avatar">曼</div>
              ) : null}
              <div
                className={joinClassNames(
                  "am-pro-chat-bubble",
                  message.role === "user" ? "is-user" : "is-assistant",
                )}
              >
                {message.content}
              </div>
            </div>
          ))}
          {messages.length === 0 && questions.length > 0 ? (
            <div className="am-pro-chat-suggestions">
              {questions.map((question) => (
                <button
                  key={question}
                  type="button"
                  disabled={sending}
                  onClick={() => onSend(question)}
                  className="am-pro-chat-suggestions__chip"
                >
                  {question}
                </button>
              ))}
            </div>
          ) : null}
          {sending ? (
            <div className="am-pro-chat-bubble-row is-assistant is-loading">
              <div className="am-pro-chat-avatar">
                <LoadingGlyph />
              </div>
              <div className="am-pro-chat-bubble is-assistant is-loading">
                曼曼正在结合这份报告继续想一想……
              </div>
            </div>
          ) : null}
        </div>
        <div className="am-pro-chat-modal__footer">
          {error ? <div className="am-pro-chat-modal__error">{error}</div> : null}
          <div className="am-pro-chat-modal__input-row">
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
              className="am-pro-chat-modal__input"
            />
            <button
              type="button"
              disabled={sending}
              onClick={() => onSend()}
              className="am-pro-chat-modal__send"
            >
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
  const previewImage =
    uploadDraft?.imagePath ?? state.selectedImage?.imagePath ?? null;
  const innerRadius =
    state.status?.three_circles?.inner_radius ??
    state.interpretation?.three_circles?.inner_radius ??
    0.3;
  const middleRadius =
    state.status?.three_circles?.middle_radius ??
    state.interpretation?.three_circles?.middle_radius ??
    0.68;
  const title = useMemo(() => extractProTitle(state), [state]);
  const sections = useMemo(() => parseProMarkdown(state), [state]);
  const qaQuestions = useMemo(() => parseQaQuestions(state), [state]);
  const summary = useMemo(() => extractProSummary(state, sections), [sections, state]);
  const hasProReport = state.report?.version === "pro" && sections.length > 0;
  const isError = state.step === "error" && Boolean(state.lastError);
  const isGenerating = !hasProReport && !isError;
  const themeLabel = getThemeDisplayName(uploadDraft?.theme) ?? "财富议题";
  const generatedAt = useMemo(
    () =>
      new Date().toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [],
  );
  const pageStyle = {
    "--am-pattern-image": `url(${brandPattern})`,
  } as CSSProperties;

  useEffect(() => {
    setChatMessages([]);
    setChatInput("");
    setChatError(null);
    setChatSending(false);
  }, [state.report?.interpretation_id]);

  async function handleSendChat(message?: string) {
    const next = (message ?? chatInput).trim();
    if (!next || chatSending) {
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

    void history;
    const messageText = "报告追问暂未接入当前财富报告 API。";
    setChatError(messageText);
    setChatMessages((current) => [
      ...current,
      {
        role: "assistant",
        content: messageText,
      },
    ]);
    setChatSending(false);
  }

  function openChatWithQuestion(question?: string) {
    setChatOpen(true);
    if (question) {
      void handleSendChat(question);
    }
  }

  if (isError) {
    return (
      <div className="am-pro-report-page am-pro-report-page--error">
        <div className="am-pro-report-page__frame">
          <div className="am-pro-report-error-card">
            <div className="am-pro-report-error-card__mark">!</div>
            <h2 className="am-pro-report-error-card__title">
              Pro 报告暂时没有顺利打开
            </h2>
            <p className="am-pro-report-error-card__message">{state.lastError}</p>
            <button
              type="button"
              onClick={onRetryAction}
              className="mw-primary-button am-pro-report-error-card__button"
            >
              重试加载
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="am-pro-report-page" style={pageStyle}>
      <div className="am-pro-report-page__frame">
        <div className="am-pro-report-topbar">
          <button
            type="button"
            onClick={onBackAction}
            className="am-pro-report-topbar__action"
          >
            <TopArrowIcon />
          </button>
          <div className="am-pro-report-topbar__brand">
            <img
              src={logoNiwu}
              alt="一镜一梳"
              className="am-pro-report-topbar__brand-logo"
            />
            <span>Pro版完整解读</span>
          </div>
          <button type="button" className="am-pro-report-topbar__action">
            <ShareGlyph />
          </button>
        </div>

        <div className="am-pro-report-page__scroll am-scrollbar-hide">
          <section className="am-pro-report-hero">
            <div className="am-pro-report-hero__pattern" />
            <div className="am-pro-report-hero__inner">
              <div className="am-pro-report-hero__content">
                <div className="am-pro-report-hero__eyebrow">
                  一镜一梳 · 深度疗愈阅读
                </div>
                <h1 className="am-pro-report-hero__title">{title}</h1>
                <div className="am-pro-report-hero__line" />
                <span className="am-pro-report-hero__date">{generatedAt}生成</span>
                <div className="am-pro-report-hero__badges">
                  <span className="am-pro-report-hero__badge is-primary">
                    Pro 完整报告
                  </span>
                  <span className="am-pro-report-hero__badge">{themeLabel}</span>
                </div>
                <div className="am-pro-report-hero__preview-wrap">
                  <ProMandalaPreview
                    imagePath={previewImage}
                    innerRadius={innerRadius}
                    middleRadius={middleRadius}
                  />
                </div>
                {summary ? (
                  <div className="am-pro-report-summary-card">
                    <div className="am-pro-report-summary-card__label">一眼总结</div>
                    <p className="am-pro-report-summary-card__body">{summary}</p>
                    <p className="am-pro-report-summary-card__hint">
                      让这份解读先陪你停一下，再继续往更深处看。
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="am-pro-report-surface">
            <div className="am-pro-report-surface__handle" />
            <div className="am-pro-report-surface__content">
              {isGenerating ? (
                <div className="am-pro-report-waiting-card">
                  <div className="am-pro-report-waiting-card__icon">
                    <LoadingGlyph />
                  </div>
                  <p className="am-pro-report-waiting-card__title">Pro 报告还在准备中</p>
                  <p className="am-pro-report-waiting-card__body">
                    正常流程会先停留在全局 Loading 页；如果你是直接打开了当前页面，可以手动再刷新一次。
                  </p>
                  <button
                    type="button"
                    onClick={onRetryAction}
                    className="mw-primary-button am-pro-report-waiting-card__button"
                  >
                    刷新 Pro 报告
                  </button>
                </div>
              ) : null}

              {hasProReport ? (
                <>
                  <div className="am-pro-report-section-kicker">
                    <div className="am-pro-report-section-kicker__line" />
                    <span>完整解读</span>
                    <div className="am-pro-report-section-kicker__line" />
                  </div>

                  <p className="am-pro-report-reading-note">
                    慢一点读，你会更容易看见那些原本藏在反应背后的结构。
                  </p>

                  <ProReportMarkdown sections={sections} />
                </>
              ) : null}

              {qaQuestions.length > 0 ? (
                <div className="am-pro-report-chat-entry">
                  <div className="am-pro-report-chat-entry__main">
                    <div className="am-pro-report-chat-entry__head">
                      <div className="am-pro-report-chat-entry__icon">
                        <MessageGlyph />
                      </div>
                      <div>
                        <div className="am-pro-report-chat-entry__title">还有疑问？</div>
                        <div className="am-pro-report-chat-entry__subtitle">
                          AI 助手随时为你解答
                        </div>
                      </div>
                    </div>
                    <p className="am-pro-report-chat-entry__prompt">
                      你可以继续这样追问
                    </p>
                    <div className="am-pro-report-chat-entry__chips">
                      {qaQuestions.map((question) => (
                        <button
                          key={question}
                          type="button"
                          onClick={() => openChatWithQuestion(question)}
                          className="am-pro-report-chat-entry__chip"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="am-pro-report-chat-entry__footer">
                    <button
                      type="button"
                      onClick={() => setChatOpen(true)}
                      className="am-pro-report-chat-entry__button"
                    >
                      <span className="am-pro-report-chat-entry__button-inner">
                        <MessageGlyph />
                        开始 AI 对话
                      </span>
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mw-button-row am-pro-report-actions">
                <button
                  type="button"
                  onClick={() => {
                    setSaved(true);
                    window.setTimeout(() => setSaved(false), 1800);
                  }}
                  className="mw-primary-button am-pro-report-actions__button"
                >
                  <SaveGlyph />
                  <span>{saved ? "已保存到相册" : "保存报告"}</span>
                </button>
                <button
                  type="button"
                  onClick={onRestartAction}
                  className="mw-secondary-button am-pro-report-actions__button"
                >
                  <RestartGlyph />
                  <span>再画一幅</span>
                </button>
              </div>

              <div className="am-pro-report-info-card">
                <p>
                  更多延展服务会在后续版本逐步开放，当前 MVP 先聚焦把单次 Pro 报告阅读体验做好。
                </p>
              </div>

              <div className="am-pro-report-disclaimer">
                <p className="am-pro-report-disclaimer__text">
                  <span className="am-pro-report-disclaimer__icon">
                    <InfoGlyph />
                  </span>
                  <span>
                    本报告基于AI分析和传统五行理论生成，仅供自我探索参考，不构成医疗或心理咨询建议。如有严重心理困扰，请寻求专业帮助。
                  </span>
                </p>
              </div>

              <div className="am-pro-report-footer-brand">
                <div className="am-pro-report-footer-brand__line" />
                <img
                  src={logoNiwu}
                  alt="一镜一梳"
                  className="am-pro-report-footer-brand__logo"
                />
                <span className="am-pro-report-footer-brand__text">一镜一梳</span>
              </div>
            </div>
          </section>
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
