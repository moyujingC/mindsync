import { useState } from "react";
import {
  FileText,
  ClipboardPaste,
  Upload,
  Sparkles,
  RefreshCw,
  Quote,
  Image as ImageIcon,
  Layers,
  Layout,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Pencil,
  ArrowUpRight,
  ClipboardCopy,
  ExternalLink,
  Wand2,
  Minus,
  Plus,
} from "lucide-react";
import { Panel, Btn, Tag, COLORS, FoggyArt, Divider } from "./ui-kit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useWorkspace } from "../workspace";
import { COVER_DRAFTS, ILLUSTRATIONS } from "./workbench-data";
import {
  ControlTowerSidebar,
  KnowledgeCardResults,
  ResultRow,
} from "./workbench-panels";
import { useWorkbenchController } from "./use-workbench-controller";

export function Workbench() {
  const {
    setActiveTab,
    currentArticle,
    setCurrentArticle,
    currentArticleMeta,
    generationRecords,
    latestGeneration,
    saveGenerationRecord,
    planningState,
    savePlanningState,
    workbenchState,
    setWorkbenchState,
  } = useWorkspace();

  const [inputMode, setInputMode] = useState<"upload" | "paste">("paste");
  const [openCovers, setOpenCovers] = useState(false);
  const [openIllus, setOpenIllus] = useState(false);
  const [openQuotes, setOpenQuotes] = useState(false);
  const {
    knowledgePreset,
    quotePreset,
    coverPreset,
    inlinePreset,
    outputs,
    toggleOutput,
    splitStrategy,
    setSplitStrategy,
    minCards,
    setMinCards,
    maxCards,
    setMaxCards,
    selectedQuotes,
    toggleQuote,
    plannedCards,
    plannedQuotes,
    plannedInlineImages,
    knowledgeImagesByCard,
    quoteGeneration,
    coverGeneration,
    inlineGeneration,
    latestGenerationTime,
    latestLogText,
    lockedKnowledgeCardIndexes,
    knowledgeCardStatuses,
    knowledgeCardHistories,
    estimatedCredits,
    isGenerating,
    generationStatus,
    generationError,
    regeneratingCardIndex,
    replaceCardInputRef,
    editingCardIndex,
    editingCardTitle,
    setEditingCardTitle,
    editingCardSummary,
    setEditingCardSummary,
    openKnowledgeCardEditor,
    closeKnowledgeCardEditor,
    saveKnowledgeCardDraft,
    toggleKnowledgeCardLock,
    handleRollbackKnowledgeCard,
    handleRegenerateKnowledgeCard,
    handleReplaceKnowledgeCardClick,
    handleKnowledgeCardFileChange,
    handleEditAndRegenerateKnowledgeCard,
    handleStartGeneration,
    runPlanning,
  } = useWorkbenchController({
    currentArticle,
    generationRecords,
    latestGeneration,
    planningState,
    savePlanningState,
    saveGenerationRecord,
    workbenchState,
    setWorkbenchState,
    setActiveTab,
  });

  return (
    <div className="grid grid-cols-[332px_1fr_300px] h-full overflow-hidden">
      {/* LEFT — first fold: input + output types + primary CTA */}
      <aside
        className="overflow-y-auto px-6 py-6 border-r"
        style={{ borderColor: COLORS.border, background: COLORS.pageBg }}
      >
        {/* STEP 01 — input */}
        <Step kicker="01" title="原稿输入" />
        <div
          className="flex p-1 rounded-md mb-3 mt-2.5"
          style={{ background: COLORS.borderSoft }}
        >
          {[
            { k: "upload", l: "上传 Markdown", I: Upload },
            { k: "paste", l: "粘贴正文", I: ClipboardPaste },
          ].map((t) => {
            const Icon = t.I;
            const active = inputMode === t.k;
            return (
              <button
                key={t.k}
                onClick={() => setInputMode(t.k as any)}
                className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded"
                style={{
                  background: active ? COLORS.surface : "transparent",
                  color: active ? COLORS.text : COLORS.textMuted,
                  fontSize: 12.5,
                  boxShadow: active ? "0 1px 1.5px rgba(43,55,72,0.05)" : "none",
                }}
              >
                <Icon size={12} strokeWidth={1.6} />
                {t.l}
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
              <div style={{ color: COLORS.text, fontSize: 13 }}>论专注 · v3.md</div>
              <div style={{ color: COLORS.textFaint, fontSize: 11, marginTop: 1 }}>
                12.4 KB · 1,284 字 · 已解析
              </div>
            </div>
            <button
              style={{ color: COLORS.textMuted, fontSize: 12 }}
              className="hover:underline"
            >
              替换
            </button>
          </div>
        ) : (
          <div className="space-y-2">
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
              <span>自动保存 · 14:32</span>
            </div>
          </div>
        )}

        {/* STEP 02 — outputs (compact selector) */}
        <div className="mt-6">
          <Step kicker="02" title="本次输出类型" />
        </div>

        {/* Group 1: 本次生成内容 */}
        <div
          className="mt-2.5 mb-1.5 flex items-center gap-2"
          style={{ color: COLORS.textFaint, fontSize: 10.5, letterSpacing: "0.06em" }}
        >
          <span>本次生成内容</span>
          <span
            className="flex-1"
            style={{ height: 1, background: COLORS.borderSoft }}
          />
        </div>
        <div
          className="rounded-md overflow-hidden"
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          {[
            { k: "knowledge" as const, l: "知识卡片", n: "自动", auto: true },
            { k: "quote" as const, l: "金句卡", n: "按勾选" },
            { k: "cover" as const, l: "公众号封面", n: "3" },
            { k: "inline" as const, l: "正文配图", n: "3" },
          ].map((o, i, arr) => (
            <CompactToggle
              key={o.k}
              label={o.l}
              count={o.n}
              auto={o.auto}
              checked={outputs[o.k]}
              onChange={() => toggleOutput(o.k)}
              last={i === arr.length - 1}
            />
          ))}
        </div>

        {/* Group 2: 后续处理 */}
        <div
          className="mt-3 mb-1.5 flex items-center gap-2"
          style={{ color: COLORS.textFaint, fontSize: 10.5, letterSpacing: "0.06em" }}
        >
          <span>后续处理</span>
          <span
            className="flex-1"
            style={{ height: 1, background: COLORS.borderSoft }}
          />
        </div>
        <div
          className="rounded-md overflow-hidden"
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.borderSoft}`,
          }}
        >
          <CompactToggle
            label="公众号排版"
            count="—"
            checked={outputs.layout}
            onChange={() => toggleOutput("layout")}
            last
          />
        </div>

        {/* Knowledge-card model constraints — leaning + bounds */}
        {outputs.knowledge && (
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
              <span
                style={{ color: COLORS.textMid, fontSize: 11.5, lineHeight: 1.55 }}
              >
                由模型自动判断拆分张数，下面两项用于约束模型，而非手工指定。
              </span>
            </div>

            <div className="mt-3">
              <div
                className="mb-1.5"
                style={{ color: COLORS.textFaint, fontSize: 11 }}
              >
                拆分倾向
              </div>
              <div
                className="flex p-0.5 rounded"
                style={{ background: COLORS.borderSoft }}
              >
                {[
                  { k: "less", l: "偏少" },
                  { k: "auto", l: "自动" },
                  { k: "more", l: "偏多" },
                ].map((s) => {
                  const active = splitStrategy === s.k;
                  return (
                    <button
                      key={s.k}
                      onClick={() => setSplitStrategy(s.k as any)}
                      className="flex-1 h-6 rounded text-center"
                      style={{
                        background: active ? COLORS.surface : "transparent",
                        color: active ? COLORS.text : COLORS.textMuted,
                        fontSize: 11.5,
                        boxShadow: active
                          ? "0 1px 1.5px rgba(43,55,72,0.05)"
                          : "none",
                      }}
                    >
                      {s.l}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3">
              <div
                className="mb-1.5 flex items-baseline justify-between"
              >
                <span style={{ color: COLORS.textFaint, fontSize: 11 }}>
                  数量边界
                </span>
                <span style={{ color: COLORS.text, fontSize: 12.5 }}>
                  {minCards} – {maxCards} 张
                </span>
              </div>
              <div className="flex items-center gap-2">
                <RangeField
                  label="最少"
                  value={minCards}
                  onMinus={() => setMinCards(Math.max(1, minCards - 1))}
                  onPlus={() => setMinCards(Math.min(maxCards - 1, minCards + 1))}
                />
                <RangeField
                  label="最多"
                  value={maxCards}
                  onMinus={() => setMaxCards(Math.max(minCards + 1, maxCards - 1))}
                  onPlus={() => setMaxCards(Math.min(8, maxCards + 1))}
                />
              </div>
              <div
                className="mt-1.5"
                style={{ color: COLORS.textFaint, fontSize: 10.5 }}
              >
                系统将把最终张数控制在 {minCards} – {maxCards} 张之间
              </div>
            </div>
          </div>
        )}

        {/* Primary CTA — first fold */}
        <div className="mt-5 flex items-center gap-2">
          <Btn
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={handleStartGeneration}
            disabled={isGenerating}
          >
            <Sparkles size={14} strokeWidth={1.6} />
            {isGenerating ? "生成中..." : "开始生成"}
          </Btn>
          <Btn variant="ghost" size="lg">
            <RefreshCw size={12} strokeWidth={1.6} />
            重新拆解
          </Btn>
        </div>
        <div
          className="mt-2 text-center"
          style={{ color: COLORS.textFaint, fontSize: 11 }}
        >
          预计 ≈ {Math.max(24, estimatedCredits * 8)}s · 消耗 {estimatedCredits} 张额度
        </div>
        {(generationStatus || generationError) && (
          <div
            className="mt-2 rounded-md px-3 py-2"
            style={{
              background: generationError ? "#FAF2EE" : COLORS.surface,
              border: `1px solid ${generationError ? "#E8D8CF" : COLORS.borderSoft}`,
              color: generationError ? "#8A5A46" : COLORS.textMid,
              fontSize: 11.5,
              lineHeight: 1.6,
            }}
          >
            {generationError || generationStatus}
          </div>
        )}

        <Divider />
        <div className="my-5" />

        {/* Style summary — collapsed by default look */}
        <div className="flex items-center justify-between">
          <div
            style={{
              color: COLORS.textFaint,
              fontSize: 11,
              letterSpacing: "0.12em",
            }}
          >
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
          ].map(([k, v], i, arr) => (
            <div
              key={k}
              className="px-3.5 py-2.5 flex items-center justify-between"
              style={{
                borderBottom:
                  i === arr.length - 1
                    ? "none"
                    : `1px solid ${COLORS.borderSoft}`,
              }}
            >
              <span style={{ color: COLORS.textFaint, fontSize: 11.5 }}>
                {k}
              </span>
              <span
                className="flex items-center gap-1.5"
                style={{ color: COLORS.text, fontSize: 12.5 }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: COLORS.blueMid }}
                />
                {v}
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

      {/* CENTER — content split is the single focus */}
      <section className="overflow-y-auto px-9 py-6">
        <div className="max-w-[800px] mx-auto">
          {/* Article header */}
          <div className="mb-5">
            <div
              style={{
                color: COLORS.textFaint,
                fontSize: 11,
                letterSpacing: "0.12em",
              }}
            >
              CURRENT ARTICLE
            </div>
            <div
              className="mt-1 flex items-baseline gap-3"
              style={{ color: COLORS.text }}
            >
              <span style={{ fontSize: 21, letterSpacing: "0.02em" }}>
                {currentArticle.title}
              </span>
              <span style={{ color: COLORS.textFaint, fontSize: 12 }}>
                2026/06/09 · {currentArticleMeta}
              </span>
            </div>
          </div>

          {/* === MAIN: 内容拆解 === */}
          <Panel padded={false} className="mb-3">
            <div className="px-5 pt-4 pb-3 flex items-end justify-between">
              <div>
                <div
                  style={{
                    color: COLORS.textFaint,
                    fontSize: 11,
                    letterSpacing: "0.12em",
                  }}
                >
                  01 / SPLIT
                </div>
                <div
                  className="mt-0.5"
                  style={{ color: COLORS.text, fontSize: 16, letterSpacing: "0.02em" }}
                >
                  内容拆解
                </div>
              </div>
              <div
                className="flex items-center gap-3"
                style={{ color: COLORS.textFaint, fontSize: 12 }}
              >
                <span
                  className="flex items-center gap-1.5"
                  style={{ color: COLORS.textMid }}
                >
                  <Wand2 size={11} strokeWidth={1.6} color={COLORS.blue} />
                  本次生成 {plannedCards.length} 张知识卡 · 根据文章结构自动拆分
                </span>
                <button
                  onClick={() => {
                    void (async () => {
                      try {
                        setGenerationError("");
                        setGenerationStatus("正在重新拆解内容");
                        await runPlanning();
                        setGenerationStatus("内容拆解已更新");
                      } catch (error) {
                        setGenerationError(error instanceof Error ? error.message : "重新拆解失败");
                        setGenerationStatus("重新拆解失败");
                      }
                    })();
                  }}
                  className="flex items-center gap-1"
                  style={{ color: COLORS.textMid, fontSize: 12 }}
                >
                  调整拆卡策略 <ChevronRight size={11} strokeWidth={1.6} />
                </button>
              </div>
            </div>

            <div className="px-5 pb-5">
              <div className="space-y-2">
                {plannedCards.map((c) => (
                  <div
                    key={`${c.index}-${c.title}`}
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
                      {String(c.index).padStart(2, "0")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ color: COLORS.text, fontSize: 13.5 }}>
                        {c.title}
                      </div>
                      <div
                        style={{
                          color: COLORS.textMuted,
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        {c.summary}
                      </div>
                    </div>
                    <CheckCircle2
                      size={15}
                      strokeWidth={1.6}
                      color={COLORS.success}
                    />
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          {/* === SECONDARY: 候选金句（摘要卡） === */}
          <div
            className="rounded-lg mb-3 overflow-hidden"
            style={{
              background: "#F1ECE3",
              border: `1px solid #E1D7C2`,
            }}
          >
            <div className="px-5 py-3.5 flex items-center gap-4">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(139,111,68,0.12)",
                  color: "#8B6F44",
                }}
              >
                <Quote size={15} strokeWidth={1.6} />
              </div>

              <div className="flex-1 min-w-0">
                <div
                  className="flex items-baseline gap-2.5"
                >
                  <span style={{ color: "#3D3328", fontSize: 13.5 }}>
                    候选金句
                  </span>
                  <span style={{ color: "#8B6F44", fontSize: 12 }}>
                    {plannedQuotes.length} 条 · 已选 {selectedQuotes.length} / {plannedQuotes.length}
                  </span>
                </div>
                <div
                  className="mt-1 truncate"
                  style={{ color: "#7A6244", fontSize: 11.5 }}
                >
                  「{plannedQuotes[selectedQuotes[0] ?? 0] ?? plannedQuotes[0]}」
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setOpenQuotes(!openQuotes)}
                  className="flex items-center gap-1 px-2.5 h-7 rounded"
                  style={{
                    color: "#8B6F44",
                    fontSize: 12,
                  }}
                >
                  {openQuotes ? "收起候选" : "查看候选"}
                  {openQuotes ? (
                    <ChevronDown size={11} strokeWidth={1.6} />
                  ) : (
                    <ChevronRight size={11} strokeWidth={1.6} />
                  )}
                </button>
                <Btn
                  size="sm"
                  style={{
                    background: "#8B6F44",
                    color: "#FBFAF7",
                    border: "1px solid #8B6F44",
                  }}
                >
                  生成金句卡 · {selectedQuotes.length}
                </Btn>
              </div>
            </div>

            {openQuotes && (
              <div
                className="px-5 pb-4 pt-1 space-y-2"
                style={{
                  borderTop: `1px solid rgba(225,215,194,0.7)`,
                }}
              >
                {plannedQuotes.map((q, i) => {
                  const checked = selectedQuotes.includes(i);
                  return (
                    <button
                      key={i}
                      onClick={() => toggleQuote(i)}
                      className="w-full flex items-start gap-3 px-3.5 py-2.5 rounded-md text-left transition-colors mt-2"
                      style={{
                        background: checked ? "#FBFAF7" : "rgba(255,255,255,0.45)",
                        border: `1px solid ${checked ? "#C9A86A" : "rgba(225,215,194,0.7)"}`,
                      }}
                    >
                      <span
                        className="mt-0.5 w-3.5 h-3.5 rounded-sm flex items-center justify-center shrink-0"
                        style={{
                          background: checked ? "#8B6F44" : "transparent",
                          border: `1.4px solid ${checked ? "#8B6F44" : "#B5A992"}`,
                        }}
                      >
                        {checked && (
                          <CheckCircle2 size={9} strokeWidth={2.5} color="#FBFAF7" />
                        )}
                      </span>
                      <span
                        style={{
                          color: "#3D3328",
                          fontSize: 13,
                          lineHeight: 1.7,
                        }}
                      >
                        {q}
                      </span>
                    </button>
                  );
                })}
                <div className="flex items-center justify-end mt-1">
                  <button
                    className="flex items-center gap-1"
                    style={{ color: "#8B6F44", fontSize: 11.5 }}
                  >
                    <Pencil size={11} strokeWidth={1.6} />
                    编辑文案
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* === MORE: covers + illustrations as collapsed rows === */}
          <div className="space-y-2 mb-3">
            <SecondaryRow
              icon={<ImageIcon size={13} strokeWidth={1.6} color={COLORS.textMuted} />}
              label="封面主题草案"
              count={3}
              open={openCovers}
              onToggle={() => setOpenCovers(!openCovers)}
            >
              <div className="grid grid-cols-3 gap-2 mt-3">
                {COVER_DRAFTS.map((c, i) => (
                  <div
                    key={i}
                    className="rounded-md overflow-hidden flex items-center gap-2.5 pr-2"
                    style={{
                      background: COLORS.surfaceAlt,
                      border: `1px solid ${COLORS.borderSoft}`,
                    }}
                  >
                    <FoggyArt
                      hue={i}
                      variant={c.variant}
                      style={{ width: 56, height: 44 }}
                    />
                    <div className="flex-1 min-w-0 py-1">
                      <div
                        style={{ color: COLORS.text, fontSize: 12 }}
                        className="truncate"
                      >
                        {c.title}
                      </div>
                      <div
                        style={{ color: COLORS.textFaint, fontSize: 10.5 }}
                        className="truncate"
                      >
                        {c.note}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SecondaryRow>

            <SecondaryRow
              icon={<Layout size={13} strokeWidth={1.6} color={COLORS.textMuted} />}
              label="正文配图建议"
              count={3}
              open={openIllus}
              onToggle={() => setOpenIllus(!openIllus)}
            >
              <div className="space-y-1.5 mt-3">
                {ILLUSTRATIONS.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2 rounded-md"
                    style={{
                      background: COLORS.surfaceAlt,
                      border: `1px solid ${COLORS.borderSoft}`,
                    }}
                  >
                    <FoggyArt
                      hue={i + 2}
                      variant={c.variant}
                      style={{ width: 36, height: 28 }}
                    />
                    <span style={{ color: COLORS.text, fontSize: 12.5 }}>
                      {c.title}
                    </span>
                  </div>
                ))}
              </div>
            </SecondaryRow>
          </div>

          {/* === RESULTS === */}
          <Panel>
            <div className="flex items-end justify-between mb-3">
              <div>
                <div
                  style={{
                    color: COLORS.textFaint,
                    fontSize: 11,
                    letterSpacing: "0.12em",
                  }}
                >
                  02 / RESULTS
                </div>
                <div
                  className="mt-0.5"
                  style={{ color: COLORS.text, fontSize: 16, letterSpacing: "0.02em" }}
                >
                  生成结果总览
                </div>
              </div>
              <button
                className="flex items-center gap-1"
                style={{ color: COLORS.blue, fontSize: 12 }}
              >
                全部下载 <ArrowUpRight size={12} strokeWidth={1.6} />
              </button>
            </div>

            {latestGeneration && (
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
                  <div style={{ color: COLORS.text, fontSize: 12.5 }}>
                    最近真实出图
                  </div>
                  <div style={{ color: COLORS.textFaint, fontSize: 11, marginTop: 2 }}>
                    {latestGeneration.purposeLabel} · {latestGeneration.styleName} · {latestGeneration.images.length} 张
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {latestGeneration.images.slice(0, 2).map((image) => (
                    <img
                      key={image.id}
                      src={image.imageUrl}
                      alt={latestGeneration.title}
                      className="rounded"
                      style={{
                        width: 42,
                        height: 42,
                        objectFit: "cover",
                        border: `1px solid ${COLORS.borderSoft}`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <KnowledgeCardResults
              plannedCards={plannedCards}
              knowledgeSizeLabel={
                knowledgePreset
                  ? `${knowledgePreset.aspect} 高清 · ${knowledgePreset.w}×${knowledgePreset.h}`
                  : "3:4 高清 · 1280×1706"
              }
              knowledgeAspectRatio={
                knowledgePreset
                  ? `${knowledgePreset.w} / ${knowledgePreset.h}`
                  : "1280 / 1706"
              }
              knowledgeImagesByCard={knowledgeImagesByCard}
              lockedKnowledgeCardIndexes={lockedKnowledgeCardIndexes}
              knowledgeCardStatuses={knowledgeCardStatuses}
              knowledgeCardHistories={knowledgeCardHistories}
              regeneratingCardIndex={regeneratingCardIndex}
              replaceCardInputRef={replaceCardInputRef}
              onReplaceInputChange={handleKnowledgeCardFileChange}
              onToggleLock={toggleKnowledgeCardLock}
              onEdit={openKnowledgeCardEditor}
              onRegenerate={(cardIndex) => {
                void handleRegenerateKnowledgeCard(cardIndex);
              }}
              onReplace={handleReplaceKnowledgeCardClick}
              onRollback={handleRollbackKnowledgeCard}
            />

            <div className="grid grid-cols-2 gap-5 mt-5">
              <div>
                <ResultRow
                  label="金句卡横版（公众号）"
                  size={
                    quotePreset
                      ? `公众号正文 · ${quotePreset.w}×${quotePreset.h}`
                      : "公众号正文 · 1080×608"
                  }
                  count={1}
                />
                <div
                  className="mt-2.5 rounded-md p-5 flex flex-col justify-between"
                  style={{
                    aspectRatio: quotePreset
                      ? `${quotePreset.w} / ${quotePreset.h}`
                      : "1080 / 608",
                    background: "linear-gradient(160deg,#E2E8EE 0%,#A8B7C8 100%)",
                    border: `1px solid ${COLORS.borderSoft}`,
                  }}
                >
                  {quoteGeneration?.images[0] ? (
                    <img
                      src={quoteGeneration.images[0].imageUrl}
                      alt="最新金句卡"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: 6,
                      }}
                    />
                  ) : (
                    <>
                      <Quote size={20} strokeWidth={1.4} color="#3F4E62" />
                      <div
                        style={{
                          color: "#2B3645",
                          fontSize: 17,
                          lineHeight: 1.55,
                          letterSpacing: "0.02em",
                        }}
                      >
                        {(plannedQuotes[selectedQuotes[0] ?? 0] ?? plannedQuotes[0] ?? "真正的专注不是用力，而是放弃。")
                          .split("，")
                          .map((line, index, list) => (
                            <span key={`${line}-${index}`}>
                              {line}
                              {index < list.length - 1 ? "，" : ""}
                              {index < list.length - 1 ? <br /> : null}
                            </span>
                          ))}
                      </div>
                      <div style={{ color: "#3F4E62", fontSize: 10.5 }}>
                        —— 论专注 v3
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div>
                <ResultRow
                  label="公众号封面大图"
                  size={
                    coverPreset
                      ? `列表封面 · ${coverPreset.w}×${coverPreset.h}`
                      : "列表封面 · 900×383"
                  }
                  count={3}
                />
                <div className="space-y-2 mt-2.5">
                  {COVER_DRAFTS.map((c, i) => (
                    <div
                      key={i}
                      className="rounded-md flex items-center overflow-hidden"
                      style={{
                        border: `1px solid ${COLORS.borderSoft}`,
                        background: COLORS.surfaceAlt,
                        height: 56,
                      }}
                    >
                      {coverGeneration?.images[i] ? (
                        <img
                          src={coverGeneration.images[i].imageUrl}
                          alt={`封面 ${i + 1}`}
                          style={{ width: 130, height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <FoggyArt
                          hue={i}
                          variant={c.variant}
                          style={{ width: 130, height: "100%" }}
                        />
                      )}
                      <div className="flex-1 px-3 min-w-0">
                        <div
                          style={{ color: COLORS.text, fontSize: 12.5 }}
                          className="truncate"
                        >
                          {c.title}
                        </div>
                        <div
                          style={{ color: COLORS.textFaint, fontSize: 11 }}
                          className="truncate"
                        >
                          {c.note}
                        </div>
                      </div>
                      {i === 0 && <Tag tone="blue">已选</Tag>}
                      <div className="w-3" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <ResultRow
                label="公众号正文配图"
                size={
                  inlinePreset
                    ? `横版默认 · ${inlinePreset.w}×${inlinePreset.h}`
                    : "横版默认 · 1080×608"
                }
                count={plannedInlineImages.length}
              />
              <div className="grid grid-cols-3 gap-3 mt-2.5">
                {plannedInlineImages.map((c, i) => (
                  <div
                    key={`${c.sectionHeading}-${i}`}
                    className="rounded-md overflow-hidden"
                    style={{ border: `1px solid ${COLORS.borderSoft}` }}
                  >
                    {inlineGeneration?.images[i] ? (
                      <img
                        src={inlineGeneration.images[i].imageUrl}
                        alt={`正文配图 ${i + 1}`}
                        style={{
                          width: "100%",
                          aspectRatio: inlinePreset
                            ? `${inlinePreset.w} / ${inlinePreset.h}`
                            : "1080 / 608",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <FoggyArt
                        hue={i + 1}
                        variant={
                          "variant" in c && c.variant
                            ? c.variant
                            : i % 3 === 0
                              ? "wave"
                              : i % 3 === 1
                                ? "mountain"
                                : "leaf"
                        }
                        style={{
                          aspectRatio: inlinePreset
                            ? `${inlinePreset.w} / ${inlinePreset.h}`
                            : "1080 / 608",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      </section>

      <ControlTowerSidebar
        currentArticleTitle={currentArticle.title}
        plannedKnowledgeCount={plannedCards.length}
        selectedQuoteCount={selectedQuotes.length}
        coverCount={COVER_DRAFTS.length}
        inlineCount={plannedInlineImages.length}
        latestGenerationTime={latestGenerationTime}
        latestLogText={latestLogText}
        onOpenWechat={() => setActiveTab("wechat")}
      />

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
              <div style={{ color: COLORS.textMid, fontSize: 12, marginBottom: 6 }}>
                标题
              </div>
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
              <div style={{ color: COLORS.textMid, fontSize: 12, marginBottom: 6 }}>
                摘要
              </div>
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
            <Btn
              variant="primary"
              size="md"
              onClick={() => void handleEditAndRegenerateKnowledgeCard()}
            >
              保存并重生成
            </Btn>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function CompactToggle({
  label,
  count,
  auto,
  checked,
  onChange,
  last,
}: {
  label: string;
  count: string;
  auto?: boolean;
  checked: boolean;
  onChange: () => void;
  last?: boolean;
}) {
  return (
    <button
      onClick={onChange}
      className="w-full flex items-center justify-between px-3.5"
      style={{
        height: 36,
        borderBottom: last ? "none" : `1px solid ${COLORS.borderSoft}`,
      }}
    >
      <span
        className="flex items-center gap-2.5"
        style={{ color: COLORS.text, fontSize: 13 }}
      >
        <span
          className="w-3.5 h-3.5 rounded-sm flex items-center justify-center"
          style={{
            background: checked ? COLORS.blueDeep : "transparent",
            border: `1.3px solid ${
              checked ? COLORS.blueDeep : COLORS.textFaint
            }`,
          }}
        >
          {checked && (
            <CheckCircle2 size={9} strokeWidth={2.5} color="#FBFAF7" />
          )}
        </span>
        {label}
      </span>
      <span
        className="flex items-center gap-1.5"
        style={{ color: COLORS.textFaint, fontSize: 11 }}
      >
        {auto && <Wand2 size={10} strokeWidth={1.6} color={COLORS.blue} />}
        <span style={{ color: auto ? COLORS.blueDeep : COLORS.textFaint }}>
          {count}
        </span>
      </span>
    </button>
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
        <span
          className="w-5 text-center"
          style={{ color: COLORS.text, fontSize: 12.5 }}
        >
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
      <button
        onClick={onToggle}
        className="w-full px-4 h-10 flex items-center justify-between"
      >
        <span className="flex items-center gap-2">
          {icon}
          <span style={{ color: COLORS.textMid, fontSize: 12.5 }}>
            {label}
          </span>
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
        <span
          className="flex items-center gap-1"
          style={{ color: COLORS.textMuted, fontSize: 11.5 }}
        >
          {open ? "收起" : "展开"}
          {open ? (
            <ChevronDown size={11} strokeWidth={1.6} />
          ) : (
            <ChevronRight size={11} strokeWidth={1.6} />
          )}
        </span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
