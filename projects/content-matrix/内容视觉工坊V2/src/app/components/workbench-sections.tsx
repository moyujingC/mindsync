import { useId, useState } from "react";
import JSZip from "jszip";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  ClipboardPaste,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Minus,
  Plus,
  RefreshCw,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";
import { Btn, COLORS, Divider, FoggyArt, Panel, Tag } from "./ui-kit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { KnowledgeCardResults, ResultRow } from "./workbench-panels";
import type { CardPlan } from "../content-planning";
import type {
  GeneratedImageItem,
  WorkbenchImportedMarkdownMeta,
  WorkbenchStatusMessage,
} from "../workspace";
import { downloadGeneratedImage } from "../api";
import { formatScopeLabel } from "./use-workbench-controller";

export function WorkbenchLeftSidebar({
  inputMode,
  setInputMode,
  currentArticle,
  setCurrentArticle,
  currentArticleMeta,
  splitStrategy,
  setSplitStrategy,
  minCards,
  setMinCards,
  maxCards,
  setMaxCards,
  handleStartGeneration,
  isGenerating,
  estimatedCredits,
  statusState,
  importedMarkdownMeta,
  handleImportMarkdown,
  handleReplan,
  setActiveTab,
}: {
  inputMode: "upload" | "paste";
  setInputMode: (mode: "upload" | "paste") => void;
  currentArticle: { title: string; body: string };
  setCurrentArticle: (article: { title: string; body: string }) => void;
  currentArticleMeta: string;
  splitStrategy: "auto" | "less" | "more";
  setSplitStrategy: (strategy: "auto" | "less" | "more") => void;
  minCards: number;
  setMinCards: React.Dispatch<React.SetStateAction<number>>;
  maxCards: number;
  setMaxCards: React.Dispatch<React.SetStateAction<number>>;
  handleStartGeneration: () => void;
  isGenerating: boolean;
  estimatedCredits: number;
  statusState: WorkbenchStatusMessage | null;
  importedMarkdownMeta: WorkbenchImportedMarkdownMeta | null;
  handleImportMarkdown: (file: File | null) => void;
  handleReplan: () => Promise<unknown>;
  setActiveTab: (tab: "workbench" | "wechat" | "assets" | "image" | "sync") => void;
}) {
  const uploadInputId = useId();
  return (
    <aside
      className="overflow-y-auto px-6 py-6 border-r"
      style={{ borderColor: COLORS.border, background: COLORS.pageBg }}
    >
      <Step kicker="01" title="原稿输入" />
      <div className="flex p-1 rounded-md mb-3 mt-2.5" style={{ background: COLORS.borderSoft }}>
        {[
          { k: "upload" as const, l: "上传 Markdown", I: Upload },
          { k: "paste" as const, l: "粘贴正文", I: ClipboardPaste },
        ].map((item) => {
          const Icon = item.I;
          const active = inputMode === item.k;
          return (
            <button
              key={item.k}
              onClick={() => setInputMode(item.k)}
              className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded"
              style={{
                background: active ? COLORS.surface : "transparent",
                color: active ? COLORS.text : COLORS.textMuted,
                fontSize: 12.5,
                boxShadow: active ? "0 1px 1.5px rgba(43,55,72,0.05)" : "none",
              }}
            >
              <Icon size={12} strokeWidth={1.6} />
              {item.l}
            </button>
          );
        })}
      </div>

      {inputMode === "upload" ? (
        <div
          className="rounded-md px-3.5 py-3 flex items-center gap-3"
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <div
            className="w-9 h-9 rounded flex items-center justify-center shrink-0"
            style={{ background: COLORS.blueTint, color: COLORS.blueDeep }}
          >
            <FileText size={16} strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div style={{ color: COLORS.text, fontSize: 13 }}>
              {importedMarkdownMeta?.fileName || "尚未导入 Markdown"}
            </div>
            <div style={{ color: COLORS.textFaint, fontSize: 11, marginTop: 1 }}>
              {importedMarkdownMeta
                ? `${importedMarkdownMeta.wordCount} 字 · ${new Date(
                    importedMarkdownMeta.importedAt
                  ).toLocaleTimeString("zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })} 导入`
                : "仅支持 .md / Markdown / 纯文本"}
            </div>
          </div>
          <label
            htmlFor={uploadInputId}
            style={{ color: COLORS.textMuted, fontSize: 12, cursor: "pointer" }}
            className="hover:underline"
          >
            {importedMarkdownMeta ? "替换" : "导入"}
          </label>
          <input
            id={uploadInputId}
            type="file"
            accept=".md,text/markdown,text/plain"
            className="hidden"
            onChange={(event) => {
              void handleImportMarkdown(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
        </div>
      ) : null}

      <div className="space-y-2 mt-2">
        <input
          value={currentArticle.title}
          onChange={(event) =>
            setCurrentArticle({ ...currentArticle, title: event.target.value })
          }
          className="w-full px-3 rounded-md outline-none"
          style={{
            height: 34,
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.text,
            fontSize: 13,
          }}
          placeholder="文章标题"
        />
        <textarea
          value={currentArticle.body}
          onChange={(event) =>
            setCurrentArticle({ ...currentArticle, body: event.target.value })
          }
          className="w-full px-3 py-2.5 rounded-md outline-none resize-none"
          style={{
            height: 110,
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.textMid,
            fontSize: 12.5,
            lineHeight: 1.7,
          }}
        />
        <div
          className="flex items-center justify-between"
          style={{ color: COLORS.textFaint, fontSize: 11 }}
        >
          <span>{currentArticleMeta}</span>
          <span>自动保存</span>
        </div>
      </div>

      <div className="mt-6">
        <Step kicker="02" title="知识卡拆解" />
      </div>

      <SectionLabel>V2.8 主链路</SectionLabel>
      <div
        className="rounded-md px-3.5 py-3"
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          color: COLORS.textMid,
          fontSize: 12,
          lineHeight: 1.65,
        }}
      >
        <div className="flex items-start gap-2">
          <CheckCircle2
            size={14}
            strokeWidth={1.7}
            color={COLORS.success}
            style={{ marginTop: 2 }}
          />
          <div>
            <div style={{ color: COLORS.text, fontSize: 13 }}>本轮生成公众号横版图</div>
            <div style={{ marginTop: 2 }}>
              导入文章后，先确认 3-5 张知识卡计划，再生成、重生成和导出。
            </div>
          </div>
        </div>
      </div>

      <div
        className="mt-2 rounded-md px-3.5 py-3"
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.borderSoft}`,
        }}
      >
        <div className="flex items-start gap-1.5">
          <Wand2
            size={11}
            strokeWidth={1.6}
            color={COLORS.blue}
            style={{ marginTop: 3 }}
          />
          <span style={{ color: COLORS.textMid, fontSize: 11.5, lineHeight: 1.55 }}>
            由模型自动判断拆分张数，下面两项用于约束模型，而非手工指定。
          </span>
        </div>

          <div className="mt-3">
            <div className="mb-1.5" style={{ color: COLORS.textFaint, fontSize: 11 }}>
              拆分倾向
            </div>
            <div className="flex p-0.5 rounded" style={{ background: COLORS.borderSoft }}>
              {[
                { k: "less" as const, l: "偏少" },
                { k: "auto" as const, l: "自动" },
                { k: "more" as const, l: "偏多" },
              ].map((item) => {
                const active = splitStrategy === item.k;
                return (
                  <button
                    key={item.k}
                    onClick={() => setSplitStrategy(item.k)}
                    className="flex-1 h-6 rounded text-center"
                    style={{
                      background: active ? COLORS.surface : "transparent",
                      color: active ? COLORS.text : COLORS.textMuted,
                      fontSize: 11.5,
                      boxShadow: active ? "0 1px 1.5px rgba(43,55,72,0.05)" : "none",
                    }}
                  >
                    {item.l}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span style={{ color: COLORS.textFaint, fontSize: 11 }}>数量边界</span>
              <span style={{ color: COLORS.text, fontSize: 12.5 }}>
                {minCards} – {maxCards} 张
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RangeField
                label="最少"
                value={minCards}
                onMinus={() => setMinCards(Math.max(3, minCards - 1))}
                onPlus={() => setMinCards(Math.min(maxCards - 1, minCards + 1))}
              />
              <RangeField
                label="最多"
                value={maxCards}
                onMinus={() => setMaxCards(Math.max(minCards + 1, maxCards - 1))}
                onPlus={() => setMaxCards(Math.min(5, maxCards + 1))}
              />
            </div>
            <div className="mt-1.5" style={{ color: COLORS.textFaint, fontSize: 10.5 }}>
              系统将把最终张数控制在 {minCards} – {maxCards} 张之间
            </div>
          </div>
      </div>

      <SectionLabel className="mt-3">本轮冻结能力</SectionLabel>
      <div
        className="rounded-md px-3.5 py-3"
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.borderSoft}`,
          color: COLORS.textFaint,
          fontSize: 11.5,
          lineHeight: 1.8,
        }}
      >
        金句卡、封面、正文配图、公众号排版先保留历史入口，本轮不参与主按钮生成。
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Btn
          variant="primary"
          size="lg"
          className="flex-1"
          onClick={handleStartGeneration}
          disabled={isGenerating}
        >
          <Sparkles size={14} strokeWidth={1.6} />
          {isGenerating ? "生成中..." : "开始生成公众号横版图"}
        </Btn>
        <Btn variant="ghost" size="lg" onClick={() => void handleReplan()} disabled={isGenerating}>
          <RefreshCw size={12} strokeWidth={1.6} />
          重新拆解
        </Btn>
      </div>
      <div className="mt-2 text-center" style={{ color: COLORS.textFaint, fontSize: 11 }}>
        预计 ≈ {Math.max(30, estimatedCredits * 25)}s · 约 {estimatedCredits} 个生成任务
      </div>
      {statusState ? (
        <div
          className="mt-2 rounded-md px-3 py-2"
          style={{
            background: statusState.level === "error" ? "#FAF2EE" : COLORS.surface,
            border: `1px solid ${statusState.level === "error" ? "#E8D8CF" : COLORS.borderSoft}`,
            color: statusState.level === "error" ? "#8A5A46" : COLORS.textMid,
            fontSize: 11.5,
            lineHeight: 1.6,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <span style={{ color: statusState.level === "error" ? "#8A5A46" : COLORS.textFaint }}>
              {statusState.level === "error"
                ? formatScopeLabel(statusState.scope)
                : formatStatusScope(statusState.scope)}
            </span>
            <span style={{ color: COLORS.textFaint, fontSize: 10.5 }}>
              {new Date(statusState.timestamp).toLocaleTimeString("zh-CN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </span>
          </div>
          <div className="mt-1">{statusState.text}</div>
        </div>
      ) : null}

      <Divider />
      <div className="my-5" />

      <div className="flex items-center justify-between">
        <div style={{ color: COLORS.textFaint, fontSize: 11, letterSpacing: "0.12em" }}>
          STYLE · 摘要
        </div>
        <button
          onClick={() => setActiveTab("assets")}
          className="flex items-center gap-1"
          style={{ color: COLORS.blue, fontSize: 12 }}
        >
          管理风格
          <ExternalLink size={11} strokeWidth={1.6} />
        </button>
      </div>

      <div
        className="mt-2.5 rounded-md overflow-hidden"
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        {[
          ["知识卡片", "蓝雾静读"],
          ["正文配图", "留白水墨"],
          ["公众号封面", "蓝雾静读 · 主图偏左"],
        ].map(([key, value], index, arr) => (
          <div
            key={key}
            className="px-3.5 py-2.5 flex items-center justify-between"
            style={{
              borderBottom: index === arr.length - 1 ? "none" : `1px solid ${COLORS.borderSoft}`,
            }}
          >
            <span style={{ color: COLORS.textFaint, fontSize: 11.5 }}>{key}</span>
            <span className="flex items-center gap-1.5" style={{ color: COLORS.text, fontSize: 12.5 }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: COLORS.blueMid }} />
              {value}
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={() => setActiveTab("assets")}
        className="mt-2 flex items-center gap-1 mx-auto"
        style={{ color: COLORS.textMuted, fontSize: 11.5 }}
      >
        调整本次任务风格
        <ChevronRight size={11} strokeWidth={1.6} />
      </button>
    </aside>
  );
}

function formatStatusScope(scope: string) {
  if (scope === "planning") return "内容拆解";
  if (scope === "quote-generation") return "金句底图";
  if (scope === "inline-image-generation") return "正文配图";
  if (scope.startsWith("inline-image-")) {
    const index = scope.replace("inline-image-", "");
    return `正文配图 ${String(Number(index)).padStart(2, "0")}`;
  }
  if (scope === "cover-generation") return "公众号封面";
  if (scope === "markdown-import") return "Markdown 导入";
  if (scope.startsWith("knowledge-card-")) {
    const index = scope.replace("knowledge-card-", "");
    return `知识卡 ${String(Number(index)).padStart(2, "0")}`;
  }
  return "当前任务";
}

export function WorkbenchCenterSection({
  currentArticle,
  currentArticleMeta,
  plannedCards,
  handleReplan,
  latestGeneration,
  knowledgePreset,
  knowledgeImagesByCard,
  lockedKnowledgeCardIndexes,
  knowledgeCardStatuses,
  knowledgeCardHistories,
  regeneratingCardIndex,
  replaceCardInputRef,
  handleKnowledgeCardFileChange,
  toggleKnowledgeCardLock,
  handleFinalizeKnowledgeCard,
  openKnowledgeCardEditor,
  handleRegenerateKnowledgeCard,
  handleReplaceKnowledgeCardClick,
  handleRollbackKnowledgeCard,
}: {
  currentArticle: { title: string };
  currentArticleMeta: string;
  plannedCards: CardPlan[];
  handleReplan: () => Promise<unknown>;
  latestGeneration: {
    title: string;
    purposeLabel: string;
    styleName: string;
    images: Array<{ id: string; imageUrl: string }>;
  } | null;
  knowledgePreset?: { aspect: string; w: number; h: number };
  knowledgeImagesByCard: Map<number, any>;
  lockedKnowledgeCardIndexes: number[];
  knowledgeCardStatuses: Record<string, any>;
  knowledgeCardHistories: Record<string, Array<unknown> | undefined>;
  regeneratingCardIndex: number | null;
  replaceCardInputRef: React.RefObject<HTMLInputElement | null>;
  handleKnowledgeCardFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  toggleKnowledgeCardLock: (cardIndex: number) => void;
  handleFinalizeKnowledgeCard: (cardIndex: number) => void;
  openKnowledgeCardEditor: (cardIndex: number) => void;
  handleRegenerateKnowledgeCard: (cardIndex: number) => Promise<void>;
  handleReplaceKnowledgeCardClick: (cardIndex: number) => void;
  handleRollbackKnowledgeCard: (cardIndex: number) => void;
}) {
  const [inspectionCardIndex, setInspectionCardIndex] = useState<number | null>(null);
  const inspectionCard =
    inspectionCardIndex == null
      ? null
      : plannedCards.find((card) => card.index === inspectionCardIndex) || null;
  const articleVisualType = plannedCards[0]?.visualType === "atmosphere" ? "横版氛围图" : "横版知识卡";
  const articleVisualRationale = plannedCards[0]?.visualRationale;

  return (
    <section className="overflow-y-auto px-9 py-6">
      <div className="max-w-[800px] mx-auto">
        <div className="mb-5">
          <div style={{ color: COLORS.textFaint, fontSize: 11, letterSpacing: "0.12em" }}>
            CURRENT ARTICLE
          </div>
          <div className="mt-1 flex items-baseline gap-3" style={{ color: COLORS.text }}>
            <span style={{ fontSize: 21, letterSpacing: "0.02em" }}>{currentArticle.title}</span>
            <span style={{ color: COLORS.textFaint, fontSize: 12 }}>
              2026/06/09 · {currentArticleMeta}
            </span>
          </div>
        </div>

        <Panel padded={false} className="mb-3">
          <div className="px-5 pt-4 pb-3 flex items-end justify-between">
            <div>
              <div style={{ color: COLORS.textFaint, fontSize: 11, letterSpacing: "0.12em" }}>
                01 / SPLIT
              </div>
              <div className="mt-0.5" style={{ color: COLORS.text, fontSize: 16, letterSpacing: "0.02em" }}>
                内容拆解
              </div>
            </div>
            <div className="flex items-center gap-3" style={{ color: COLORS.textFaint, fontSize: 12 }}>
              <span className="flex items-center gap-1.5" style={{ color: COLORS.textMid }}>
                <Wand2 size={11} strokeWidth={1.6} color={COLORS.blue} />
                本次生成 {plannedCards.length} 张公众号横版图 · 本篇图型二选一
              </span>
              <button
                onClick={() => void handleReplan()}
                className="flex items-center gap-1"
                style={{ color: COLORS.textMid, fontSize: 12 }}
              >
                调整拆卡策略 <ChevronRight size={11} strokeWidth={1.6} />
              </button>
            </div>
          </div>

          <div className="px-5 pb-5">
            <div
              className="mb-3 rounded-md px-3.5 py-2.5"
              style={{
                background: COLORS.blueTint,
                border: `1px solid ${COLORS.borderSoft}`,
                color: COLORS.textMid,
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              <span style={{ color: COLORS.blueDeep }}>本篇统一图型：{articleVisualType}</span>
              {articleVisualRationale ? ` · ${articleVisualRationale}` : ""}
            </div>
            <div className="space-y-2">
              {plannedCards.map((card) => (
                <div
                  key={`${card.index}-${card.title}`}
                  className="flex items-start gap-3 px-3.5 py-3 rounded-md"
                  style={{
                    background: COLORS.surfaceAlt,
                    border: `1px solid ${COLORS.borderSoft}`,
                  }}
                >
                  <div
                    className="w-7 h-7 rounded flex items-center justify-center shrink-0"
                    style={{
                      background: COLORS.blueTint,
                      color: COLORS.blueDeep,
                      fontSize: 11,
                      letterSpacing: "0.06em",
                    }}
                  >
                    {String(card.index).padStart(2, "0")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ color: COLORS.text, fontSize: 13.5 }}>{card.title}</div>
                    <div style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>
                      {card.summary}
                    </div>
                    <div style={{ color: COLORS.textFaint, fontSize: 11, marginTop: 4 }}>
                      跟随本篇统一图型：{articleVisualType}
                    </div>
                    <button
                      onClick={() => setInspectionCardIndex(card.index)}
                      className="mt-2 flex items-center gap-1"
                      style={{ color: COLORS.blueDeep, fontSize: 11.5 }}
                    >
                      查看完整拆解 <ChevronRight size={11} strokeWidth={1.6} />
                    </button>
                  </div>
                  <CheckCircle2 size={15} strokeWidth={1.6} color={COLORS.success} />
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Dialog
          open={inspectionCard != null}
          onOpenChange={(open) => {
            if (!open) setInspectionCardIndex(null);
          }}
        >
          <DialogContent className="max-w-[760px]">
            <DialogHeader>
              <DialogTitle>
                {inspectionCard
                  ? `公众号横版图 ${String(inspectionCard.index).padStart(2, "0")} · 完整拆解`
                  : "完整拆解"}
              </DialogTitle>
              <DialogDescription>
                这里展示当前卡片的完整拆解内容，便于直接判断生成质量。
              </DialogDescription>
            </DialogHeader>
            {inspectionCard ? (
              <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-4">
                <div>
                  <div style={{ color: COLORS.textFaint, fontSize: 11, marginBottom: 6 }}>标题</div>
                  <div style={{ color: COLORS.text, fontSize: 15 }}>{inspectionCard.title}</div>
                </div>
                <div>
                  <div style={{ color: COLORS.textFaint, fontSize: 11, marginBottom: 6 }}>
                    推荐图型
                  </div>
                  <div style={{ color: COLORS.textMid, fontSize: 13.5, lineHeight: 1.7 }}>
                    {inspectionCard.visualType === "atmosphere" ? "横版氛围图" : "横版知识卡"}
                    {inspectionCard.visualRationale ? ` · ${inspectionCard.visualRationale}` : ""}
                  </div>
                </div>
                <div>
                  <div style={{ color: COLORS.textFaint, fontSize: 11, marginBottom: 6 }}>摘要</div>
                  <div style={{ color: COLORS.textMid, fontSize: 13.5, lineHeight: 1.7 }}>
                    {inspectionCard.summary}
                  </div>
                </div>
                {inspectionCard.contentSections?.length ? (
                  <div>
                    <div style={{ color: COLORS.textFaint, fontSize: 11, marginBottom: 8 }}>
                      内容区域
                    </div>
                    <div className="space-y-3">
                      {inspectionCard.contentSections.map((section, sectionIndex) => (
                        <div
                          key={`${section.name}-${sectionIndex}`}
                          className="rounded-md px-3.5 py-3"
                          style={{
                            background: COLORS.surfaceAlt,
                            border: `1px solid ${COLORS.borderSoft}`,
                          }}
                        >
                          <div style={{ color: COLORS.text, fontSize: 13 }}>
                            {section.name}
                          </div>
                          <div style={{ color: COLORS.textFaint, fontSize: 11, marginTop: 2 }}>
                            {section.position}
                          </div>
                          <div className="mt-2 space-y-2">
                            {section.items.map((item, itemIndex) => (
                              <div key={`${item.text}-${itemIndex}`}>
                                <div style={{ color: COLORS.textMid, fontSize: 12.5, lineHeight: 1.7 }}>
                                  {item.text}
                                </div>
                                <div style={{ color: COLORS.textFaint, fontSize: 11, marginTop: 2 }}>
                                  插画：{item.illustration}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {inspectionCard.textBlocks?.length ? (
                  <div>
                    <div style={{ color: COLORS.textFaint, fontSize: 11, marginBottom: 6 }}>
                      信息点
                    </div>
                    <div className="space-y-1.5">
                      {inspectionCard.textBlocks.map((block, index) => (
                        <div key={`${block}-${index}`} style={{ color: COLORS.textMid, fontSize: 12.5 }}>
                          {index + 1}. {block}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {inspectionCard.promptText ? (
                  <div>
                    <div style={{ color: COLORS.textFaint, fontSize: 11, marginBottom: 6 }}>
                      完整 Prompt
                    </div>
                    <pre
                      className="rounded-md p-3 whitespace-pre-wrap break-words"
                      style={{
                        background: COLORS.surfaceAlt,
                        border: `1px solid ${COLORS.borderSoft}`,
                        color: COLORS.textMid,
                        fontSize: 12,
                        lineHeight: 1.7,
                        fontFamily:
                          'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace',
                      }}
                    >
                      {inspectionCard.promptText}
                    </pre>
                  </div>
                ) : null}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <WorkbenchResultsPanel
          currentArticle={currentArticle}
          latestGeneration={latestGeneration}
          plannedCards={plannedCards}
          knowledgePreset={knowledgePreset}
          knowledgeImagesByCard={knowledgeImagesByCard}
          lockedKnowledgeCardIndexes={lockedKnowledgeCardIndexes}
          knowledgeCardStatuses={knowledgeCardStatuses}
          knowledgeCardHistories={knowledgeCardHistories}
          regeneratingCardIndex={regeneratingCardIndex}
          replaceCardInputRef={replaceCardInputRef}
          handleKnowledgeCardFileChange={handleKnowledgeCardFileChange}
          toggleKnowledgeCardLock={toggleKnowledgeCardLock}
          handleFinalizeKnowledgeCard={handleFinalizeKnowledgeCard}
          openKnowledgeCardEditor={openKnowledgeCardEditor}
          handleRegenerateKnowledgeCard={handleRegenerateKnowledgeCard}
          handleReplaceKnowledgeCardClick={handleReplaceKnowledgeCardClick}
          handleRollbackKnowledgeCard={handleRollbackKnowledgeCard}
        />
      </div>
    </section>
  );
}

export function WorkbenchEditorDialog({
  editingCardIndex,
  closeKnowledgeCardEditor,
  editingCardTitle,
  setEditingCardTitle,
  editingCardSummary,
  setEditingCardSummary,
  saveKnowledgeCardDraft,
  handleEditAndRegenerateKnowledgeCard,
}: {
  editingCardIndex: number | null;
  closeKnowledgeCardEditor: () => void;
  editingCardTitle: string;
  setEditingCardTitle: React.Dispatch<React.SetStateAction<string>>;
  editingCardSummary: string;
  setEditingCardSummary: React.Dispatch<React.SetStateAction<string>>;
  saveKnowledgeCardDraft: () => void;
  handleEditAndRegenerateKnowledgeCard: () => Promise<void>;
}) {
  return (
    <Dialog
      open={editingCardIndex != null}
      onOpenChange={(open) => {
        if (!open) closeKnowledgeCardEditor();
      }}
    >
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle>编辑知识卡文案</DialogTitle>
          <DialogDescription>
            修改标题和摘要后，可以直接保存或保存并重生成当前卡片。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <div style={{ color: COLORS.textMid, fontSize: 12, marginBottom: 6 }}>标题</div>
            <input
              value={editingCardTitle}
              onChange={(event) => setEditingCardTitle(event.target.value)}
              className="w-full px-3 rounded-md outline-none"
              style={{
                height: 36,
                background: COLORS.pageBg,
                border: `1px solid ${COLORS.border}`,
                color: COLORS.text,
                fontSize: 13,
              }}
            />
          </div>
          <div>
            <div style={{ color: COLORS.textMid, fontSize: 12, marginBottom: 6 }}>摘要</div>
            <textarea
              value={editingCardSummary}
              onChange={(event) => setEditingCardSummary(event.target.value)}
              className="w-full px-3 py-2 rounded-md outline-none resize-none"
              style={{
                height: 120,
                background: COLORS.pageBg,
                border: `1px solid ${COLORS.border}`,
                color: COLORS.text,
                fontSize: 13,
                lineHeight: 1.7,
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Btn variant="ghost" size="md" onClick={closeKnowledgeCardEditor}>
            取消
          </Btn>
          <Btn variant="secondary" size="md" onClick={saveKnowledgeCardDraft}>
            仅保存
          </Btn>
          <Btn variant="primary" size="md" onClick={() => void handleEditAndRegenerateKnowledgeCard()}>
            保存并重生成
          </Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WorkbenchResultsPanel({
  currentArticle,
  latestGeneration,
  plannedCards,
  knowledgePreset,
  knowledgeImagesByCard,
  lockedKnowledgeCardIndexes,
  knowledgeCardStatuses,
  knowledgeCardHistories,
  regeneratingCardIndex,
  replaceCardInputRef,
  handleKnowledgeCardFileChange,
  toggleKnowledgeCardLock,
  handleFinalizeKnowledgeCard,
  openKnowledgeCardEditor,
  handleRegenerateKnowledgeCard,
  handleReplaceKnowledgeCardClick,
  handleRollbackKnowledgeCard,
}: any) {
  const [previewImage, setPreviewImage] = useState<{
    imageUrl: string;
    alt: string;
    sourceImage?: GeneratedImageItem;
  } | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [isExportingReleasePack, setIsExportingReleasePack] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string>("");
  const finalizedKnowledgeImages = plannedCards
    .map((card) => {
      const status = knowledgeCardStatuses[String(card.index)];
      const image = knowledgeImagesByCard.get(card.index);
      if (!status?.finalized || !image) return null;
      return {
        kind: "knowledge" as const,
        cardIndex: card.index,
        title: card.title,
        imageUrl: image.imageUrl,
      };
    })
    .filter(Boolean);
  const fallbackKnowledgeImages = plannedCards
    .map((card) => {
      const image = knowledgeImagesByCard.get(card.index);
      if (!image) return null;
      return {
        kind: "knowledge" as const,
        cardIndex: card.index,
        title: card.title,
        imageUrl: image.imageUrl,
      };
    })
    .filter(Boolean);
  const exportKnowledgeImages =
    finalizedKnowledgeImages.length > 0 ? finalizedKnowledgeImages : fallbackKnowledgeImages;
  const releaseAssets = [
    ...exportKnowledgeImages.map((item: any) => ({
      kind: item.kind,
      imageUrl: item.imageUrl,
      filename: `release-wechat-visual-${String(item.cardIndex).padStart(2, "0")}.png`,
      label: `公众号横版图 ${String(item.cardIndex).padStart(2, "0")} · ${item.title}`,
    })),
  ].filter(Boolean) as Array<{
    kind: "cover" | "knowledge" | "quote" | "inline";
    imageUrl: string;
    sourceImage?: GeneratedImageItem;
    filename: string;
    label: string;
  }>;
  const downloadableImages = [
    ...(Array.from(knowledgeImagesByCard.values()) as Array<{ imageUrl: string }>),
  ];

  function handlePreviewImage(imageUrl: string, alt: string, sourceImage?: GeneratedImageItem) {
    setPreviewImage({ imageUrl, alt, sourceImage });
  }

  async function downloadImage(url: string, filename: string) {
    try {
      const blob = await downloadGeneratedImage(url);
      downloadBlob(blob, filename);
      setExportFeedback(`已开始下载：${filename}`);
    } catch {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.target = "_blank";
      link.rel = "noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportFeedback(`已尝试打开原图地址：${filename}`);
    }
  }

  async function buildDownloadBlob(image: GeneratedImageItem) {
    return await downloadGeneratedImage(image.imageUrl);
  }

  function downloadBlob(blob: Blob, filename: string) {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  async function buildZipBlob(files: Array<{ filename: string; blob: Blob }>) {
    const zip = new JSZip();
    for (const file of files) {
      zip.file(file.filename, file.blob);
    }
    return await zip.generateAsync({ type: "blob" });
  }

  function slugifyFilename(value: string) {
    return value
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-")
      .slice(0, 48);
  }

  async function handleDownloadAll() {
    if (downloadableImages.length === 0 || isDownloadingAll) return;
    setIsDownloadingAll(true);
    setExportFeedback("");
    try {
      const files = await Promise.all(
        downloadableImages.map(async (image, index) => ({
          filename: `content-visual-${String(index + 1).padStart(2, "0")}.png`,
          blob: await buildDownloadBlob(image as GeneratedImageItem),
        }))
      );
      const zipBlob = await buildZipBlob(files);
      downloadBlob(
        zipBlob,
        `${slugifyFilename(currentArticle.title || "content-visual")}-all-assets.zip`
      );
      setExportFeedback(`已打包 ${files.length} 个文件，开始下载 zip 压缩包`);
    } catch (error) {
      setExportFeedback(error instanceof Error ? `全部下载失败：${error.message}` : "全部下载失败");
    } finally {
      setIsDownloadingAll(false);
    }
  }

  async function handleExportReleasePack() {
    if (releaseAssets.length === 0 || isExportingReleasePack) return;
    setIsExportingReleasePack(true);
    setExportFeedback("");
    try {
      const manifestLines = [
        `文章标题：${currentArticle.title}`,
        `导出时间：${new Date().toLocaleString("zh-CN", { hour12: false })}`,
        `公众号横版图：${
          finalizedKnowledgeImages.length > 0
            ? `定稿 ${finalizedKnowledgeImages.length} 张`
            : `未定稿，改为导出当前结果 ${exportKnowledgeImages.length} 张`
        }`,
        "本轮范围：导出公众号横版图包。金句卡、封面、公众号排版暂缓。",
        "",
        "素材清单：",
        ...releaseAssets.map((item, index) => `${index + 1}. ${item.label} -> ${item.filename}`),
      ];
      const manifestBlob = new Blob([manifestLines.join("\n")], {
        type: "text/plain;charset=utf-8",
      });
      const assetFiles = await Promise.all(
        releaseAssets.map(async (asset) => ({
          filename: asset.filename,
          blob: asset.sourceImage
            ? await buildDownloadBlob(asset.sourceImage)
            : await downloadGeneratedImage(asset.imageUrl),
        }))
      );
      const files = [
        { filename: "release-assets-manifest.txt", blob: manifestBlob },
        ...assetFiles,
      ];
      const zipBlob = await buildZipBlob(files);
      downloadBlob(
        zipBlob,
        `${slugifyFilename(currentArticle.title || "content-visual")}-release-assets.zip`
      );
      setExportFeedback(`已打包 ${files.length} 个定稿文件，开始下载 zip 压缩包`);
    } catch (error) {
      setExportFeedback(
        error instanceof Error ? `导出定稿失败：${error.message}` : "导出定稿失败"
      );
    } finally {
      setIsExportingReleasePack(false);
    }
  }

  return (
    <Panel>
      <div className="flex items-end justify-between mb-3">
        <div>
          <div style={{ color: COLORS.textFaint, fontSize: 11, letterSpacing: "0.12em" }}>
            02 / RESULTS
          </div>
          <div className="mt-0.5" style={{ color: COLORS.text, fontSize: 16, letterSpacing: "0.02em" }}>
            公众号横版图结果与导出
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Btn
            variant="secondary"
            size="sm"
            onClick={() => void handleExportReleasePack()}
            disabled={releaseAssets.length === 0 || isExportingReleasePack}
          >
            {isExportingReleasePack ? "导出中" : "导出公众号图包"}
          </Btn>
          <button
            className="flex items-center gap-1"
            style={{ color: COLORS.blue, fontSize: 12 }}
            onClick={() => void handleDownloadAll()}
            disabled={downloadableImages.length === 0 || isDownloadingAll}
          >
            {isDownloadingAll ? "下载中" : "全部下载"} <ArrowUpRight size={12} strokeWidth={1.6} />
          </button>
        </div>
      </div>

      <div
        className="mb-4 rounded-md px-3.5 py-2.5 flex items-center justify-between gap-4"
        style={{
          background: COLORS.pageBg,
          border: `1px solid ${COLORS.borderSoft}`,
        }}
      >
        <div style={{ color: COLORS.textFaint, fontSize: 11.5 }}>
          导出会优先带出已定稿公众号横版图；如果还没定稿，会导出当前可用图，并附一份素材清单。
        </div>
        <div className="flex items-center gap-2 text-right" style={{ color: COLORS.textMid, fontSize: 11.5 }}>
          <span>公众号横版图 {exportKnowledgeImages.length}</span>
        </div>
      </div>

      {exportFeedback ? (
        <div
          className="mb-4 rounded-md px-3.5 py-2.5"
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.borderSoft}`,
            color: COLORS.textMid,
            fontSize: 11.5,
            lineHeight: 1.6,
          }}
        >
          {exportFeedback}
        </div>
      ) : null}

      {latestGeneration ? (
        <div
          className="mb-5 rounded-md px-4 py-3 flex items-center gap-3"
          style={{
            background: COLORS.pageBg,
            border: `1px solid ${COLORS.borderSoft}`,
          }}
        >
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
            style={{ background: COLORS.blueTint, color: COLORS.blueDeep }}
          >
            <ImageIcon size={16} strokeWidth={1.6} />
          </div>
          <div className="flex-1 min-w-0">
            <div style={{ color: COLORS.text, fontSize: 12.5 }}>最近真实出图</div>
            <div style={{ color: COLORS.textFaint, fontSize: 11, marginTop: 2 }}>
              {latestGeneration.purposeLabel} · {latestGeneration.styleName} · {latestGeneration.images.length} 张
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {latestGeneration.images.slice(0, 2).map((image: any) => (
              <img
                key={image.id}
                src={image.imageUrl}
                alt={latestGeneration.title}
                onClick={() => handlePreviewImage(image.imageUrl, latestGeneration.title)}
                className="rounded"
                style={{
                  width: 42,
                  height: 42,
                  objectFit: "cover",
                  border: `1px solid ${COLORS.borderSoft}`,
                  cursor: "zoom-in",
                }}
              />
            ))}
          </div>
        </div>
      ) : null}

      <KnowledgeCardResults
        plannedCards={plannedCards}
        knowledgeSizeLabel={
          knowledgePreset
            ? `${knowledgePreset.aspect} 高清 · ${knowledgePreset.w}×${knowledgePreset.h}`
            : "16:9 横版 · 1080×608"
        }
        knowledgeAspectRatio={
          knowledgePreset ? `${knowledgePreset.w} / ${knowledgePreset.h}` : "1080 / 608"
        }
        knowledgeImagesByCard={knowledgeImagesByCard}
        lockedKnowledgeCardIndexes={lockedKnowledgeCardIndexes}
        knowledgeCardStatuses={knowledgeCardStatuses}
        knowledgeCardHistories={knowledgeCardHistories}
        regeneratingCardIndex={regeneratingCardIndex}
        replaceCardInputRef={replaceCardInputRef}
        onReplaceInputChange={handleKnowledgeCardFileChange}
        onToggleLock={toggleKnowledgeCardLock}
        onFinalize={handleFinalizeKnowledgeCard}
        onEdit={openKnowledgeCardEditor}
        onRegenerate={(cardIndex) => {
          void handleRegenerateKnowledgeCard(cardIndex);
        }}
        onReplace={handleReplaceKnowledgeCardClick}
        onRollback={handleRollbackKnowledgeCard}
        onPreview={handlePreviewImage}
      />

      <Dialog
        open={previewImage != null}
        onOpenChange={(open) => {
          if (!open) setPreviewImage(null);
        }}
      >
        <DialogContent className="max-w-[980px]">
          <DialogHeader>
            <DialogTitle>{previewImage?.alt || "图片预览"}</DialogTitle>
            <DialogDescription>这里展示当前图片的放大预览。</DialogDescription>
          </DialogHeader>
          {previewImage ? (
            <div className="max-h-[75vh] overflow-auto">
              <img
                src={previewImage.imageUrl}
                alt={previewImage.alt}
                style={{
                  width: "100%",
                  height: "auto",
                  objectFit: "contain",
                  borderRadius: 8,
                  border: `1px solid ${COLORS.borderSoft}`,
                }}
              />
            </div>
          ) : null}
          {previewImage ? (
            <DialogFooter>
              <Btn
                variant="secondary"
                size="md"
                onClick={() =>
                  void (previewImage.sourceImage
                    ? downloadImage(previewImage.sourceImage.imageUrl, `${(previewImage.alt || "preview").replace(/\s+/g, "-")}.png`)
                    : downloadImage(
                        previewImage.imageUrl,
                        `${(previewImage.alt || "preview").replace(/\s+/g, "-")}.png`
                      ))
                }
              >
                下载当前图片
              </Btn>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    </Panel>
  );
}

function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mb-1.5 flex items-center gap-2 ${className ?? ""}`.trim()}
      style={{ color: COLORS.textFaint, fontSize: 10.5, letterSpacing: "0.06em" }}
    >
      <span>{children}</span>
      <span className="flex-1" style={{ height: 1, background: COLORS.borderSoft }} />
    </div>
  );
}

function Step({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex items-center justify-center"
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          background: COLORS.blueTint,
          color: COLORS.blueDeep,
          fontSize: 10.5,
          letterSpacing: "0.04em",
        }}
      >
        {kicker}
      </span>
      <span style={{ color: COLORS.text, fontSize: 13.5 }}>{title}</span>
    </div>
  );
}

function RangeField({
  label,
  value,
  onMinus,
  onPlus,
}: {
  label: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div
      className="flex-1 flex items-center justify-between rounded-md"
      style={{
        background: COLORS.surfaceAlt,
        border: `1px solid ${COLORS.borderSoft}`,
        height: 30,
        paddingLeft: 10,
        paddingRight: 4,
      }}
    >
      <span style={{ color: COLORS.textFaint, fontSize: 11 }}>{label}</span>
      <div className="flex items-center">
        <button
          onClick={onMinus}
          className="w-6 h-6 flex items-center justify-center rounded"
          style={{ color: COLORS.textMuted }}
        >
          <Minus size={11} strokeWidth={1.6} />
        </button>
        <span className="w-5 text-center" style={{ color: COLORS.text, fontSize: 12.5 }}>
          {value}
        </span>
        <button
          onClick={onPlus}
          className="w-6 h-6 flex items-center justify-center rounded"
          style={{ color: COLORS.textMuted }}
        >
          <Plus size={11} strokeWidth={1.6} />
        </button>
      </div>
    </div>
  );
}

function SecondaryRow({
  icon,
  label,
  count,
  open,
  onToggle,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-md"
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.borderSoft}`,
      }}
    >
      <button onClick={onToggle} className="w-full px-4 h-10 flex items-center justify-between">
        <span className="flex items-center gap-2">
          {icon}
          <span style={{ color: COLORS.textMid, fontSize: 12.5 }}>{label}</span>
          <span
            className="px-1.5 rounded"
            style={{
              background: COLORS.borderSoft,
              color: COLORS.textMuted,
              fontSize: 10.5,
              height: 16,
              lineHeight: "16px",
            }}
          >
            {count}
          </span>
        </span>
        <span className="flex items-center gap-1" style={{ color: COLORS.textMuted, fontSize: 11.5 }}>
          {open ? "收起" : "展开"}
          {open ? (
            <ChevronDown size={11} strokeWidth={1.6} />
          ) : (
            <ChevronRight size={11} strokeWidth={1.6} />
          )}
        </span>
      </button>
      {open ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}
