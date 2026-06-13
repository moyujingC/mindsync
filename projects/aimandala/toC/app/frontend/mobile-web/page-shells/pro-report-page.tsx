import {
  Fragment,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

import logoNiwu from "../assets/logo-niwu.webp";
import brandPattern from "../assets/pattern.webp";
import { getThemeDisplayName } from "../../shared/core";
import { SharedAppTopBar } from "../../shared/ui/app-top-bar";
import { createReportFollowup } from "../../shared/api";
import { isReportFollowupEnabled } from "../../shared/api/config";
import {
  buildReportDocument,
  type ReportDocumentModule,
} from "../report-document";
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

type FollowupRound = {
  question: string;
  answer?: string;
};

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

function FollowupGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 12a8 8 0 0 1-8 8H7l-4 2 1.4-4.1A8 8 0 1 1 21 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 10.2a2.7 2.7 0 0 1 5.1 1.4c0 1.8-2.1 2.1-2.1 3.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12.5 17.4h.01" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  );
}

function ChevronGlyph({ expanded }: { expanded?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={expanded ? "is-expanded" : undefined}
    >
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function createSeedRounds(state: "thinking" | "answered" | "multi-collapsed"): FollowupRound[] {
  if (state === "thinking") {
    return [{ question: "哪一圈最适合我先调整？" }];
  }

  if (state === "multi-collapsed") {
    return [
      {
        question: "这个模式更像长期形成，还是最近被触发？",
        answer: "它更像长期形成的保护方式，只是最近被现实压力重新激活了。",
      },
      {
        question: "我怎样减少过度消耗？",
        answer: "先减少同时回应所有人的冲动，把精力留给一个真正重要的动作。",
      },
      {
        question: "什么环境最支持我的表达？",
        answer: "更适合在节奏稳定、允许慢一点说明的关系里练习表达。",
      },
    ];
  }

  return [
    {
      question: "这周我可以先做一个什么小练习？",
      answer:
        "可以先从一次很小的示弱开始：在安全的关系里，说出一个你平时会自己扛下的需要。重点不是立刻改变关系，而是让你的真实感受有一次被看见的机会。",
    },
  ];
}

function ProInlineFollowup({
  module,
  state,
  uploadDraft,
  themeLabel,
  initialState,
}: {
  module: ReportDocumentModule;
  state: MandalaFlowState;
  uploadDraft?: MobileWebUploadDraft;
  themeLabel: string;
  initialState: "collapsed" | "input" | "thinking" | "answered" | "multi-collapsed";
}) {
  const [panelOpen, setPanelOpen] = useState(initialState !== "collapsed");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [input, setInput] = useState("");
  const [rounds, setRounds] = useState<FollowupRound[]>(() =>
    initialState === "thinking" || initialState === "answered" || initialState === "multi-collapsed"
      ? createSeedRounds(initialState)
      : [],
  );
  const [sending, setSending] = useState(initialState === "thinking");
  const [error, setError] = useState<string | null>(null);
  const count = rounds.length;
  const latestRound = rounds[count - 1];
  const historyRounds = rounds.slice(0, Math.max(0, count - 1));
  const canUseApi = isReportFollowupEnabled();

  async function handleSend() {
    const question = input.trim();
    const report = state.report;
    if (!question || sending || !report?.interpretation_id || !report.report) {
      return;
    }

    setPanelOpen(true);
    setInput("");
    setError(null);
    setSending(true);
    const roundIndex = rounds.length;
    setRounds((current) => [...current, { question }]);

    if (!canUseApi) {
      window.setTimeout(() => {
        setRounds((current) =>
          current.map((round, index) =>
            index === roundIndex
              ? {
                  ...round,
                  answer:
                    "这段追问会基于当前报告模块继续展开。当前本地预览先展示交互形态，真实回答会接入报告追问接口。",
                }
              : round,
          ),
        );
        setSending(false);
      }, 650);
      return;
    }

    try {
      const response = await createReportFollowup({
        report_id: report.interpretation_id,
        question,
        report_mode: report.version,
        final_report_md: report.report,
        final_report: report.structured ?? {},
        visual_draft: report.visual_draft ?? null,
        history: rounds.flatMap((round) =>
          round.answer
            ? [
                { role: "user" as const, content: round.question },
                { role: "assistant" as const, content: round.answer },
              ]
            : [{ role: "user" as const, content: round.question }],
        ),
        theme: uploadDraft?.theme ?? "wealth",
        theme_label: themeLabel,
        painting_intention: uploadDraft?.paintingIntention ?? "",
        painting_feeling: uploadDraft?.paintingFeeling ?? "",
      });
      setRounds((current) =>
        current.map((round, index) =>
          index === roundIndex
            ? { ...round, answer: stripMarkdownText(response.answer_md) }
            : round,
        ),
      );
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "追问暂时没有成功，请稍后再试。");
    } finally {
      setSending(false);
    }
  }

  if (!panelOpen && count > 0) {
    return (
      <button
        type="button"
        className="am-pro-followup-summary"
        onClick={() => setPanelOpen(true)}
      >
        <span>已追问 {count} 次，展开查看</span>
        <ChevronGlyph />
      </button>
    );
  }

  if (!panelOpen) {
    return (
      <div className="am-pro-followup-button-row">
        <button
          type="button"
          className="am-pro-followup-pill"
          onClick={() => setPanelOpen(true)}
        >
          <FollowupGlyph />
          <span>追问</span>
        </button>
      </div>
    );
  }

  return (
    <div className="am-pro-followup-panel">
      <div className="am-pro-followup-panel__header">
        <span>{count > 0 ? `追问记录 · ${count}` : "追问记录"}</span>
        <button
          type="button"
          onClick={() => setPanelOpen(false)}
          className="am-pro-followup-panel__collapse"
        >
          收起
          <ChevronGlyph expanded />
        </button>
      </div>

      {historyRounds.length > 0 ? (
        <div className="am-pro-followup-history">
          <button
            type="button"
            className="am-pro-followup-history__toggle"
            onClick={() => setHistoryOpen((current) => !current)}
          >
            <span>已追问 {historyRounds.length} 次，{historyOpen ? "收起历史" : "展开全部"}</span>
            <ChevronGlyph expanded={historyOpen} />
          </button>
          {historyOpen ? (
            <div className="am-pro-followup-history__list">
              {historyRounds.map((round, index) => (
                <div key={`${round.question}-${index}`} className="am-pro-followup-round is-history">
                  <div className="am-pro-followup-question">{round.question}</div>
                  {round.answer ? (
                    <div className="am-pro-followup-answer">
                      <span>补充解读</span>
                      <p>{round.answer}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {latestRound ? (
        <div className="am-pro-followup-round">
          <div className="am-pro-followup-question">{latestRound.question}</div>
          {sending && !latestRound.answer ? (
            <div className="am-pro-followup-thinking">
              <LoadingGlyph />
              <span>正在基于本段报告思考...</span>
            </div>
          ) : null}
          {latestRound.answer ? (
            <div className="am-pro-followup-answer">
              <span>补充解读</span>
              <p>{latestRound.answer}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? <div className="am-pro-followup-error">{error}</div> : null}

      <div className="am-pro-followup-input-row">
        <input
          value={input}
          disabled={sending}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !sending) {
              event.preventDefault();
              void handleSend();
            }
          }}
          placeholder="请输入你想追问的问题"
          className="am-pro-followup-input"
          aria-label={`${module.title}追问输入`}
        />
        <button
          type="button"
          disabled={sending || !input.trim()}
          onClick={() => void handleSend()}
          className="am-pro-followup-send"
          aria-label="发送追问"
        >
          {sending ? <LoadingGlyph /> : <SendGlyph />}
        </button>
      </div>
    </div>
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
  const reportDocument = useMemo(() => buildReportDocument(state, "pro"), [state]);
  const title = useMemo(
    () => reportDocument.title || extractProTitle(state),
    [reportDocument.title, state],
  );
  const sections = useMemo(() => parseProMarkdown(state), [state]);
  const documentSections = useMemo(
    () =>
      reportDocument.modules.map((module, index) => ({
        module,
        section: sections[index] ?? {
          title: module.title,
          body: module.body,
        },
      })),
    [reportDocument.modules, sections],
  );
  const summary = useMemo(() => extractProSummary(state, sections), [sections, state]);
  const hasProReport = state.report?.version === "pro" && documentSections.length > 0;
  const isError = state.step === "error" && Boolean(state.lastError);
  const isGenerating = !hasProReport && !isError;
  const themeLabel = getThemeDisplayName(uploadDraft?.theme) ?? "财富关系";
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
        <SharedAppTopBar
          title="Pro版完整解读"
          backLabel="返回上一页"
          onBack={onBackAction}
        />

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

                  <div className="am-pro-report-module-list">
                    {documentSections.map(({ module, section }, index) => {
                      const followupState =
                        index === 0
                          ? "collapsed"
                          : index === 1
                            ? "input"
                            : index === 2
                              ? "thinking"
                              : index === 3
                                ? "multi-collapsed"
                                : "answered";
                      return (
                        <div key={module.id} className="am-pro-report-module">
                          <ProReportMarkdown sections={[section]} />
                          <ProInlineFollowup
                            module={module}
                            state={state}
                            uploadDraft={uploadDraft}
                            themeLabel={themeLabel}
                            initialState={followupState}
                          />
                        </div>
                      );
                    })}
                  </div>
                </>
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
    </div>
  );
}
