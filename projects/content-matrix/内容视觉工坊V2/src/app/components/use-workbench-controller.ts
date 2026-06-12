import { useRef, useState, type ChangeEvent } from "react";
import { postGenerateImages, postPlanCards } from "../api";
import type { PlannerRequest, PlannerResponse, SplitStrategy } from "../content-planning";
import { DEFAULT_PRESET_KEYS, findPreset } from "../image-presets";
import type {
  GeneratedImageItem,
  GenerationPurposeKey,
  GenerationRecord,
  PlanningState,
  WorkbenchState,
  WorkbenchStatusLevel,
  WorkbenchStatusMessage,
  WorkbenchTaskPhase,
  WorkspaceArticle,
  WorkspaceTab,
} from "../workspace";
import {
  buildFallbackCardPlan,
  buildFallbackInlineImagePlan,
  buildKnowledgeCardPrompt,
  buildGenerationTasks,
  mergeRecordImages,
  QUOTES,
  sortImagesByCardIndex,
  type WorkbenchOutputs,
} from "./workbench-data";

type KnowledgeCardHistorySnapshot = {
  imageUrl: string;
  prompt: string;
  title: string;
  summary: string;
  source: "generated" | "replaced" | "rollback";
  createdAt: string;
};

type UseWorkbenchControllerArgs = {
  currentArticle: WorkspaceArticle;
  setCurrentArticle: (article: WorkspaceArticle) => void;
  generationRecords: GenerationRecord[];
  latestGeneration: GenerationRecord | null;
  planningState: PlanningState | null;
  savePlanningState: (planning: PlanningState) => void;
  clearPlanningState: () => void;
  saveGenerationRecord: (record: GenerationRecord) => void;
  clearGenerationRecords: (purposeKeys?: GenerationPurposeKey[]) => void;
  workbenchState: WorkbenchState;
  setWorkbenchState: React.Dispatch<React.SetStateAction<WorkbenchState>>;
  setActiveTab: (tab: WorkspaceTab) => void;
};

type ReplanSummary = {
  preservedQuoteCount: number;
  clearedQuoteCount: number;
  preservedKnowledgeCount: number;
  staleKnowledgeCount: number;
};

const DEFAULT_KNOWLEDGE_CARD_STYLE_GUIDE = `视觉风格：蓝雾静读 · 手绘知识卡

整体风格：
在手绘涂鸦笔记 / Sketchnote 的信息组织方式上，降低饱和度和可爱感，偏安静、专业、疗愈。

背景：
浅绿米白渐变为主，可加入少量雾蓝、灰白、浅暖灰。

配色：
草绿、天蓝、暖黄为基础，但整体压低饱和度；深绿或深灰蓝用于轮廓和重点文字。

字体：
清晰可辨的中文手写体风格，不能花哨，优先保证可读性。

限制：
不要科技霓虹，不要儿童贴纸感，不要营销海报感，不要复杂装饰。`;

function buildArticleSignature(article: WorkspaceArticle) {
  return `${article.title.trim()}::${article.body.replace(/\s+/g, " ").trim()}`;
}

export function useWorkbenchController({
  currentArticle,
  setCurrentArticle,
  generationRecords,
  latestGeneration,
  planningState,
  savePlanningState,
  clearPlanningState,
  saveGenerationRecord,
  clearGenerationRecords,
  workbenchState,
  setWorkbenchState,
  setActiveTab,
}: UseWorkbenchControllerArgs) {
  const knowledgePreset = findPreset(DEFAULT_PRESET_KEYS.knowledgeCard)?.preset;
  const quotePreset = findPreset(DEFAULT_PRESET_KEYS.quoteCard)?.preset;
  const coverPreset = findPreset(DEFAULT_PRESET_KEYS.wechatCover)?.preset;
  const inlinePreset = findPreset(DEFAULT_PRESET_KEYS.wechatInline)?.preset;

  const [outputs, setOutputs] = useState<WorkbenchOutputs>({
    knowledge: true,
    quote: true,
    cover: true,
    inline: true,
    layout: false,
  });
  const [splitStrategy, setSplitStrategy] = useState<SplitStrategy>("auto");
  const [minCards, setMinCards] = useState(2);
  const [maxCards, setMaxCards] = useState(6);
  const [selectedQuotes, setSelectedQuotes] = useState<number[]>([]);
  const [regeneratingCardIndex, setRegeneratingCardIndex] = useState<number | null>(null);
  const replaceCardInputRef = useRef<HTMLInputElement | null>(null);
  const [replaceTargetCardIndex, setReplaceTargetCardIndex] = useState<number | null>(null);
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);
  const [editingCardTitle, setEditingCardTitle] = useState("");
  const [editingCardSummary, setEditingCardSummary] = useState("");

  const plannedCards = planningState?.cardPlan ?? buildFallbackCardPlan();
  const plannedQuotes = planningState?.candidateQuotes?.length
    ? planningState.candidateQuotes
    : QUOTES;
  const plannedInlineImages = planningState?.inlineImagePlan?.length
    ? planningState.inlineImagePlan
    : buildFallbackInlineImagePlan();

  const knowledgeGeneration = generationRecords.find((item) => item.purposeKey === "xhs_card");
  const quoteGeneration = generationRecords.find((item) => item.purposeKey === "quote");
  const coverGeneration = generationRecords.find((item) => item.purposeKey === "wx_cover");
  const inlineGeneration = generationRecords.find((item) => item.purposeKey === "wx_inline");

  const knowledgeImagesByCard = new Map(
    (knowledgeGeneration?.images ?? [])
      .filter((image) => image.cardLink)
      .map((image) => [image.cardLink!.index, image])
  );

  const lockedKnowledgeCardIndexes = workbenchState.lockedKnowledgeCardIndexes;
  const knowledgeCardStatuses = workbenchState.knowledgeCardStatuses;
  const knowledgeCardHistories = workbenchState.knowledgeCardHistories;
  const taskState = workbenchState.taskState;
  const statusState = taskState.lastError ?? taskState.statusMessage;
  const importedMarkdownMeta = workbenchState.importedMarkdownMeta;
  const quoteGenerationSelection = workbenchState.quoteGenerationSelection;
  const coverSelection = workbenchState.coverSelection;
  const replanRevision = workbenchState.replanRevision;

  const unlockedPlannedCards = plannedCards.filter(
    (card) => !lockedKnowledgeCardIndexes.includes(card.index)
  );
  const estimatedCredits =
    (outputs.knowledge ? unlockedPlannedCards.length : 0) +
    (outputs.quote ? selectedQuotes.length : 0) +
    (outputs.cover ? 3 : 0) +
    (outputs.inline ? plannedInlineImages.length : 0);

  const latestGenerationTime = latestGeneration
    ? new Date(latestGeneration.createdAt).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : taskState.statusMessage
      ? toDisplayTime(taskState.statusMessage.timestamp)
      : "—";
  const latestLogText = taskState.lastError
    ? `${formatScopeLabel(taskState.lastError.scope)} · ${taskState.lastError.text}`
    : latestGeneration
      ? `${latestGeneration.purposeLabel} · ${latestGeneration.images.length} 张`
      : taskState.statusMessage?.text || "尚无最近动作";

  const controlTowerOutputs = {
    knowledge: buildOutputSummary({
      label: "知识卡片",
      generatedCount: knowledgeGeneration?.images.length ?? 0,
      plannedCount: plannedCards.length,
      generatedText:
        knowledgeGeneration?.images.length && knowledgeGeneration.images.length > 0
          ? `${knowledgeGeneration.images.length} 张已生成`
          : null,
      pendingText: planningState ? `${plannedCards.length} 张待生成` : "待拆解",
      modeText: "自动拆分",
    }),
    quote: buildOutputSummary({
      label: "金句底图",
      generatedCount: quoteGeneration?.images.length ?? 0,
      plannedCount: selectedQuotes.length,
      generatedText:
        quoteGenerationSelection?.selectedQuoteTexts?.length
          ? `${quoteGenerationSelection.selectedQuoteTexts.length} 条已绑定`
          : `${quoteGeneration?.images.length ?? 0} 张已生成`,
      pendingText: selectedQuotes.length > 0 ? `${selectedQuotes.length} 条待生成` : "未选择",
      modeText: selectedQuotes.length > 0 ? "按勾选生成" : "待勾选",
    }),
    cover: buildOutputSummary({
      label: "公众号封面",
      generatedCount: coverGeneration?.images.length ?? 0,
      plannedCount: 3,
      generatedText:
        coverGeneration?.images.length && coverGeneration.images.length > 0
          ? `${coverGeneration.images.length} 张已生成`
          : null,
      pendingText: "3 张待生成",
    }),
    inline: buildOutputSummary({
      label: "正文配图",
      generatedCount: inlineGeneration?.images.length ?? 0,
      plannedCount: plannedInlineImages.length,
      generatedText:
        inlineGeneration?.images.length && inlineGeneration.images.length > 0
          ? `${inlineGeneration.images.length} 张已生成`
          : null,
      pendingText: planningState
        ? `${plannedInlineImages.length} 张待生成`
        : "待拆解",
    }),
  };

  const isGenerating = taskState.phase === "planning" || taskState.phase === "generating";

  function toggleOutput(key: keyof WorkbenchOutputs) {
    setOutputs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleQuote(index: number) {
    setSelectedQuotes((prev) =>
      prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index]
    );
  }

  function resolveValidSelectedQuoteIndexes(quotes: string[], indexes: number[]) {
    return indexes.filter((index) => index >= 0 && index < quotes.length);
  }

  function toggleKnowledgeCardLock(cardIndex: number) {
    setWorkbenchState((prev) => {
      const nextLocked = prev.lockedKnowledgeCardIndexes.includes(cardIndex)
        ? prev.lockedKnowledgeCardIndexes.filter((item) => item !== cardIndex)
        : [...prev.lockedKnowledgeCardIndexes, cardIndex].sort((a, b) => a - b);
      return {
        ...prev,
        lockedKnowledgeCardIndexes: nextLocked,
      };
    });
  }

  function setTaskPhase(
    phase: WorkbenchTaskPhase,
    currentStepLabel: string,
    completedTasks: number,
    totalTasks: number
  ) {
    setWorkbenchState((prev) => ({
      ...prev,
      taskState: {
        ...prev.taskState,
        phase,
        currentStepLabel,
        completedTasks,
        totalTasks,
      },
    }));
  }

  function pushStatus(
    scope: string,
    level: WorkbenchStatusLevel,
    text: string,
    options?: {
      phase?: WorkbenchTaskPhase;
      currentStepLabel?: string;
      completedTasks?: number;
      totalTasks?: number;
      keepLastError?: boolean;
    }
  ) {
    const message: WorkbenchStatusMessage = {
      scope,
      level,
      text,
      timestamp: new Date().toISOString(),
    };
    setWorkbenchState((prev) => ({
      ...prev,
      taskState: {
        ...prev.taskState,
        phase: options?.phase ?? prev.taskState.phase,
        currentStepLabel: options?.currentStepLabel ?? prev.taskState.currentStepLabel,
        completedTasks: options?.completedTasks ?? prev.taskState.completedTasks,
        totalTasks: options?.totalTasks ?? prev.taskState.totalTasks,
        lastError:
          level === "error"
            ? message
            : options?.keepLastError
              ? prev.taskState.lastError
              : null,
        statusMessage: message,
      },
    }));
  }

  function clearTaskError() {
    setWorkbenchState((prev) => ({
      ...prev,
      taskState: {
        ...prev.taskState,
        lastError: null,
      },
    }));
  }

  function handleSelectCover(index: number) {
    setWorkbenchState((prev) => ({
      ...prev,
      coverSelection: {
        ...prev.coverSelection,
        selectedCoverIndex: index,
        updatedAt: new Date().toISOString(),
      },
    }));
    pushStatus("cover-selection", "success", `已选中封面 ${index + 1}`);
  }

  function handleFinalizeCover(index: number) {
    setWorkbenchState((prev) => ({
      ...prev,
      coverSelection: {
        selectedCoverIndex: index,
        finalizedCoverIndex: index,
        updatedAt: new Date().toISOString(),
      },
    }));
    pushStatus("cover-selection", "success", `封面 ${index + 1} 已设为定稿`);
  }

  function updateKnowledgeCardStatus(
    cardIndex: number,
    patch: Partial<NonNullable<WorkbenchState["knowledgeCardStatuses"][string]>>
  ) {
    setWorkbenchState((prev) => ({
      ...prev,
      knowledgeCardStatuses: {
        ...prev.knowledgeCardStatuses,
        [String(cardIndex)]: {
          ...prev.knowledgeCardStatuses[String(cardIndex)],
          ...patch,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  }

  function handleFinalizeKnowledgeCard(cardIndex: number) {
    updateKnowledgeCardStatus(cardIndex, { finalized: true });
    setWorkbenchState((prev) => ({
      ...prev,
      lockedKnowledgeCardIndexes: prev.lockedKnowledgeCardIndexes.includes(cardIndex)
        ? prev.lockedKnowledgeCardIndexes
        : [...prev.lockedKnowledgeCardIndexes, cardIndex].sort((a, b) => a - b),
    }));
    pushStatus(
      `knowledge-card-${cardIndex}`,
      "success",
      `知识卡 ${String(cardIndex).padStart(2, "0")} 已设为定稿`
    );
  }

  function pushKnowledgeCardHistory(
    cardIndex: number,
    snapshot: KnowledgeCardHistorySnapshot
  ) {
    setWorkbenchState((prev) => ({
      ...prev,
      knowledgeCardHistories: {
        ...prev.knowledgeCardHistories,
        [String(cardIndex)]: [
          snapshot,
          ...(prev.knowledgeCardHistories[String(cardIndex)] || []),
        ].slice(0, 6),
      },
    }));
  }

  function updateKnowledgeCardDraft(cardIndex: number, nextTitle: string, nextSummary: string) {
    if (!planningState) return;
    const nextCardPlan = planningState.cardPlan.map((card) =>
      card.index === cardIndex
        ? {
            ...card,
            title: nextTitle.trim() || card.title,
            summary: nextSummary.trim() || card.summary,
          }
        : card
    );
    savePlanningState({
      ...planningState,
      cardPlan: nextCardPlan,
      updatedAt: new Date().toISOString(),
    });
  }

  function openKnowledgeCardEditor(cardIndex: number) {
    const card = plannedCards.find((item) => item.index === cardIndex);
    if (!card) return;
    setEditingCardIndex(cardIndex);
    setEditingCardTitle(card.title);
    setEditingCardSummary(card.summary);
  }

  function closeKnowledgeCardEditor() {
    setEditingCardIndex(null);
    setEditingCardTitle("");
    setEditingCardSummary("");
  }

  function replaceKnowledgeCardImage(cardIndex: number, imageUrl: string, prompt: string) {
    const card = plannedCards.find((item) => item.index === cardIndex);
    if (!card) return;

    const existingRecord = knowledgeGeneration;
    const nextImages = existingRecord?.images ? [...existingRecord.images] : [];
    const existingIndex = nextImages.findIndex((item) => item.cardLink?.index === cardIndex);

    if (existingIndex >= 0) {
      const currentImage = nextImages[existingIndex];
      pushKnowledgeCardHistory(cardIndex, {
        imageUrl: currentImage.imageUrl,
        prompt: currentImage.prompt,
        title: currentImage.cardLink?.title || card.title,
        summary: currentImage.cardLink?.summary || card.summary,
        source: "replaced",
        createdAt: new Date().toISOString(),
      });
    }

    const nextImage: GeneratedImageItem = {
      id:
        existingIndex >= 0
          ? nextImages[existingIndex].id
          : `manual-${Date.now().toString(36)}-${cardIndex}`,
      imageUrl,
      prompt,
      width: knowledgePreset?.w || 1280,
      height: knowledgePreset?.h || 1706,
      cardLink: {
        index: card.index,
        title: card.title,
        summary: card.summary,
      },
    };

    if (existingIndex >= 0) {
      nextImages.splice(existingIndex, 1, nextImage);
    } else {
      nextImages.push(nextImage);
    }

    saveGenerationRecord({
      id: existingRecord?.id || `gen-${Date.now().toString(36)}`,
      source: "general-image",
      title: currentArticle.title,
      purposeKey: "xhs_card",
      purposeLabel: "小红书知识卡片 / 图文配图",
      presetLabel: knowledgePreset?.label || "小红书 3:4 高清 · 1280×1706",
      styleName: existingRecord?.styleName || "蓝雾静读",
      images: sortImagesByCardIndex(nextImages),
      createdAt: new Date().toISOString(),
    });
  }

  function saveKnowledgeCardDraft() {
    if (editingCardIndex == null) return;
    updateKnowledgeCardDraft(editingCardIndex, editingCardTitle, editingCardSummary);
    updateKnowledgeCardStatus(editingCardIndex, { edited: true });
    closeKnowledgeCardEditor();
    pushStatus(
      `knowledge-card-${editingCardIndex}`,
      "success",
      `知识卡 ${String(editingCardIndex).padStart(2, "0")} 文案已保存`
    );
  }

  function handleRollbackKnowledgeCard(cardIndex: number) {
    const history = knowledgeCardHistories[String(cardIndex)] || [];
    const previous = history[0];
    if (!previous) return;

    const card = plannedCards.find((item) => item.index === cardIndex);
    if (!card) return;

    updateKnowledgeCardDraft(cardIndex, previous.title, previous.summary);
    replaceKnowledgeCardImage(cardIndex, previous.imageUrl, previous.prompt);
    updateKnowledgeCardStatus(cardIndex, {
      edited: previous.title !== card.title || previous.summary !== card.summary,
      replaced: previous.source === "replaced",
      regenerated: previous.source === "generated" || previous.source === "rollback",
      needsRegeneration: false,
    });
    setWorkbenchState((prev) => ({
      ...prev,
      knowledgeCardHistories: {
        ...prev.knowledgeCardHistories,
        [String(cardIndex)]: (prev.knowledgeCardHistories[String(cardIndex)] || []).slice(1),
      },
    }));
    pushStatus(
      `knowledge-card-${cardIndex}`,
      "success",
      `知识卡 ${String(cardIndex).padStart(2, "0")} 已回退上一版`
    );
  }

  async function handleRegenerateKnowledgeCard(
    cardIndex: number,
    nextDraft?: { title: string; summary: string }
  ) {
    const preset = knowledgePreset;
    const card = plannedCards.find((item) => item.index === cardIndex);
    if (!preset || !card) return;

    const resolvedCard = nextDraft
      ? { ...card, title: nextDraft.title, summary: nextDraft.summary }
      : card;

    setRegeneratingCardIndex(cardIndex);
    clearTaskError();
    pushStatus(`knowledge-card-${cardIndex}`, "info", `正在生成知识卡 ${String(cardIndex).padStart(2, "0")}`, {
      phase: "generating",
      currentStepLabel: `生成知识卡 ${String(cardIndex).padStart(2, "0")}`,
      completedTasks: 0,
      totalTasks: 1,
    });

    try {
      const record = await postGenerateImages({
        articleTitle: currentArticle.title,
        prompt: buildKnowledgeCardPrompt({
          articleTitle: currentArticle.title,
          cardIndex: resolvedCard.index,
          cardTotal: plannedCards.length,
          promptText: resolvedCard.promptText,
          cardTitle: resolvedCard.title,
          cardSummary: resolvedCard.summary,
          cardTheme: resolvedCard.theme,
          cardLayoutHint: resolvedCard.layoutHint,
          cardTextBlocks: resolvedCard.textBlocks,
          cardIllustrationHints: resolvedCard.illustrationHints,
          cardTitleVisualHint: resolvedCard.titleVisualHint,
          cardContentSections: resolvedCard.contentSections,
          cardDecorationHint: resolvedCard.decorationHint,
          cardEndingLabel: resolvedCard.endingLabel,
          bodyPreview: currentArticle.body.replace(/\s+/g, " ").trim().slice(0, 140),
        }),
        negativePrompt: "高饱和、霓虹、强对比、卡通、复杂装饰、营销感排版",
        width: preset.w,
        height: preset.h,
        count: 1,
        purposeKey: "xhs_card",
        purposeLabel: "小红书知识卡片 / 图文配图",
        presetKey: preset.k,
        presetLabel: preset.label,
        styleName: "蓝雾静读",
        cardLink: {
          index: resolvedCard.index,
          title: resolvedCard.title,
          summary: resolvedCard.summary,
        },
      });

      const previousImage = knowledgeGeneration?.images.find(
        (item) => item.cardLink?.index === resolvedCard.index
      );
      if (previousImage) {
        pushKnowledgeCardHistory(cardIndex, {
          imageUrl: previousImage.imageUrl,
          prompt: previousImage.prompt,
          title: previousImage.cardLink?.title || card.title,
          summary: previousImage.cardLink?.summary || card.summary,
          source: "generated",
          createdAt: new Date().toISOString(),
        });
      }

      saveGenerationRecord(mergeRecordImages(knowledgeGeneration, record));
      updateKnowledgeCardStatus(cardIndex, {
        regenerated: true,
        replaced: false,
        needsRegeneration: false,
      });
      pushStatus(`knowledge-card-${cardIndex}`, "success", `知识卡 ${String(cardIndex).padStart(2, "0")} 已更新`, {
        phase: "completed",
        currentStepLabel: "完成",
        completedTasks: 1,
        totalTasks: 1,
      });
    } catch (error) {
      pushStatus(
        `knowledge-card-${cardIndex}`,
        "error",
        error instanceof Error ? error.message : "知识卡生成失败",
        {
          phase: "failed",
          currentStepLabel: `知识卡 ${String(cardIndex).padStart(2, "0")} 失败`,
          completedTasks: 0,
          totalTasks: 1,
        }
      );
    } finally {
      setRegeneratingCardIndex(null);
    }
  }

  function handleReplaceKnowledgeCardClick(cardIndex: number) {
    setReplaceTargetCardIndex(cardIndex);
    replaceCardInputRef.current?.click();
  }

  function handleKnowledgeCardFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const targetCardIndex = replaceTargetCardIndex;
    if (!file || targetCardIndex == null) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = typeof reader.result === "string" ? reader.result : "";
      if (!imageUrl) return;

      replaceKnowledgeCardImage(targetCardIndex, imageUrl, `manual replace: ${file.name}`);
      updateKnowledgeCardStatus(targetCardIndex, {
        replaced: true,
        regenerated: false,
        needsRegeneration: false,
      });
      pushStatus(
        `knowledge-card-${targetCardIndex}`,
        "success",
        `知识卡 ${String(targetCardIndex).padStart(2, "0")} 已替换为本地图片`
      );
    };
    reader.readAsDataURL(file);
    event.target.value = "";
    setReplaceTargetCardIndex(null);
  }

  async function handleEditAndRegenerateKnowledgeCard() {
    if (editingCardIndex == null) return;
    const nextTitle = editingCardTitle.trim();
    const nextSummary = editingCardSummary.trim();
    updateKnowledgeCardDraft(editingCardIndex, nextTitle, nextSummary);
    updateKnowledgeCardStatus(editingCardIndex, { edited: true });
    await handleRegenerateKnowledgeCard(editingCardIndex, {
      title:
        nextTitle ||
        plannedCards.find((item) => item.index === editingCardIndex)?.title ||
        "",
      summary:
        nextSummary ||
        plannedCards.find((item) => item.index === editingCardIndex)?.summary ||
        "",
    });
    closeKnowledgeCardEditor();
  }

  async function runPlanning() {
    return runPlanningForArticle(currentArticle);
  }

  async function runPlanningForArticle(article: WorkspaceArticle) {
    const request: PlannerRequest = {
      articleTitle: article.title,
      rawText: article.body,
      knowledgeCardStyleName: "蓝雾静读",
      knowledgeCardStyleGuide: DEFAULT_KNOWLEDGE_CARD_STYLE_GUIDE,
      knowledgeCardReferenceImages: [],
      inlineImageStyleName: "留白水墨",
      cardRatio: knowledgePreset?.aspect || "3:4",
      cardWidth: knowledgePreset?.w || 1280,
      cardHeight: knowledgePreset?.h || 1706,
      splitStrategy,
      minCards,
      maxCards,
    };

    const planning = await postPlanCards(request);
    return savePlanningResult(planning, article);
  }

  function savePlanningResult(planning: PlannerResponse, article: WorkspaceArticle) {
    const nextRevision = replanRevision + 1;
    const nextPlanningState: PlanningState = {
      provider: planning.provider,
      articleSignature: buildArticleSignature(article),
      cardPlan: planning.cardPlan,
      candidateQuotes: planning.analysis.keyQuotes,
      inlineImagePlan: planning.inlineImagePlan,
      coverTheme: planning.analysis.coverTheme,
      strategySummary: planning.analysis.imageGenerationSource.strategy,
      updatedAt: new Date().toISOString(),
    };
    savePlanningState(nextPlanningState);
    setWorkbenchState((prev) => ({
      ...prev,
      replanRevision: nextRevision,
    }));
    return {
      planning,
      nextPlanningState,
      nextRevision,
    };
  }

  function bindInlineImages(
    record: GenerationRecord,
    inlineLinks:
      | Array<{
          sectionKey: string;
          sectionHeading: string;
          sectionSummary: string;
        }>
      | undefined
  ) {
    if (record.purposeKey !== "wx_inline" || !inlineLinks?.length) {
      return record;
    }

    return {
      ...record,
      images: record.images.map((image, index) => ({
        ...image,
        inlineLink: inlineLinks[index]
          ? {
              sectionKey: inlineLinks[index].sectionKey,
              sectionHeading: inlineLinks[index].sectionHeading,
              sectionSummary: inlineLinks[index].sectionSummary,
            }
          : image.inlineLink,
      })),
    };
  }

  function syncKnowledgeImagesToNewPlan(nextCardPlan: PlanningState["cardPlan"]) {
    if (!knowledgeGeneration) {
      return { preservedKnowledgeCount: 0, staleKnowledgeCount: 0 };
    }

    const nextPlanByTitle = new Map(
      nextCardPlan.map((card) => [normalizeText(card.title), card])
    );
    const usedIndexes = new Set<number>();
    let preservedKnowledgeCount = 0;
    let staleKnowledgeCount = 0;

    const nextImages = knowledgeGeneration.images.map((image) => {
      if (!image.cardLink) return image;
      const directMatch = nextCardPlan.find(
        (card) =>
          card.index === image.cardLink!.index &&
          normalizeText(card.title) === normalizeText(image.cardLink!.title)
      );
      const titleMatch =
        directMatch ||
        (() => {
          const candidate = nextPlanByTitle.get(normalizeText(image.cardLink!.title));
          if (!candidate || usedIndexes.has(candidate.index)) return null;
          return candidate;
        })();

      if (titleMatch) {
        usedIndexes.add(titleMatch.index);
        preservedKnowledgeCount += 1;
        updateKnowledgeCardStatus(titleMatch.index, {
          needsRegeneration: false,
        });
        return {
          ...image,
          cardLink: {
            index: titleMatch.index,
            title: titleMatch.title,
            summary: titleMatch.summary,
          },
        };
      }

      staleKnowledgeCount += 1;
      updateKnowledgeCardStatus(image.cardLink.index, {
        needsRegeneration: true,
      });
      return image;
    });

    saveGenerationRecord({
      ...knowledgeGeneration,
      images: sortImagesByCardIndex(nextImages),
      createdAt: new Date().toISOString(),
    });

    return { preservedKnowledgeCount, staleKnowledgeCount };
  }

  async function handleReplan() {
    clearTaskError();
    pushStatus("planning", "info", "正在重新拆解内容", {
      phase: "planning",
      currentStepLabel: "拆解中",
      completedTasks: 0,
      totalTasks: 1,
    });

    try {
      const previousQuotes = selectedQuotes
        .map((index) => plannedQuotes[index])
        .filter(Boolean);
      const { planning, nextRevision } = await runPlanning();
      const nextQuotes = planning.analysis.keyQuotes;
      const preservedQuoteIndexes = previousQuotes
        .map((quote) => nextQuotes.findIndex((item) => normalizeText(item) === normalizeText(quote)))
        .filter((index) => index >= 0);
      const uniquePreservedQuoteIndexes = Array.from(new Set(preservedQuoteIndexes));
      const clearedQuoteCount = previousQuotes.length - uniquePreservedQuoteIndexes.length;
      setSelectedQuotes(uniquePreservedQuoteIndexes);

      const { preservedKnowledgeCount, staleKnowledgeCount } =
        syncKnowledgeImagesToNewPlan(planning.cardPlan);

      const summary: ReplanSummary = {
        preservedQuoteCount: uniquePreservedQuoteIndexes.length,
        clearedQuoteCount: Math.max(0, clearedQuoteCount),
        preservedKnowledgeCount,
        staleKnowledgeCount,
      };

      const summaryText = buildReplanSummaryText(summary);
      pushStatus(
        "planning",
        "success",
        summaryText || "内容拆解已更新",
        {
          phase: "completed",
          currentStepLabel: "完成",
          completedTasks: 1,
          totalTasks: 1,
        }
      );

      return summary;
    } catch (error) {
      pushStatus(
        "planning",
        "error",
        error instanceof Error ? error.message : "重新拆解失败",
        {
          phase: "failed",
          currentStepLabel: "拆解失败",
          completedTasks: 0,
          totalTasks: 1,
        }
      );
      throw error;
    }
  }

  async function handleGenerateQuoteCard() {
    const preset = quotePreset;
    if (!preset) return;

    const resolvedIndexes = resolveValidSelectedQuoteIndexes(plannedQuotes, selectedQuotes);
    if (resolvedIndexes.length === 0) {
      pushStatus("quote-generation", "error", "请先勾选至少 1 条候选金句", {
        phase: "failed",
        currentStepLabel: "金句底图失败",
        completedTasks: 0,
        totalTasks: 1,
      });
      return;
    }
    const resolvedTexts = resolvedIndexes
      .map((index) => plannedQuotes[index])
      .filter(Boolean);
    const primaryQuote = resolvedTexts[0];
    if (!primaryQuote) {
      pushStatus("quote-generation", "error", "当前候选金句不可用，请先重新拆解", {
        phase: "failed",
        currentStepLabel: "金句底图失败",
        completedTasks: 0,
        totalTasks: 1,
      });
      return;
    }

    clearTaskError();
    pushStatus("quote-generation", "info", "正在生成金句底图", {
      phase: "generating",
      currentStepLabel: "生成金句底图",
      completedTasks: 0,
      totalTasks: 1,
    });

    try {
      const record = await postGenerateImages({
        articleTitle: currentArticle.title,
        prompt: `为文章《${currentArticle.title}》生成一张公众号横版金句底图。核心文案是：“${primaryQuote}”。画面需留白、安静、疗愈，便于后续叠加文字。`,
        negativePrompt: "高饱和、霓虹、复杂纹理、人物特写、卡通插画、杂乱文字",
        width: preset.w,
        height: preset.h,
        count: 1,
        purposeKey: "quote",
        purposeLabel: "金句底图",
        presetKey: preset.k,
        presetLabel: preset.label,
        styleName: "蓝雾静读",
      });
      saveGenerationRecord(record);
      setWorkbenchState((prev) => ({
        ...prev,
        quoteGenerationSelection: {
          selectedQuoteIndexes: resolvedIndexes,
          selectedQuoteTexts: resolvedTexts,
          generatedAtPlanningRevision: prev.replanRevision,
        },
      }));
      pushStatus("quote-generation", "success", "金句底图已生成", {
        phase: "completed",
        currentStepLabel: "完成",
        completedTasks: 1,
        totalTasks: 1,
      });
    } catch (error) {
      pushStatus(
        "quote-generation",
        "error",
        error instanceof Error ? error.message : "金句底图生成失败",
        {
          phase: "failed",
          currentStepLabel: "金句底图失败",
          completedTasks: 0,
          totalTasks: 1,
        }
      );
    }
  }

  async function handleStartGeneration() {
    let planning: PlannerResponse;
    let nextRevision: number;
    const currentArticleSignature = buildArticleSignature(currentArticle);
    const canReusePlanning =
      planningState != null && planningState.articleSignature === currentArticleSignature;

    if (canReusePlanning) {
      planning = {
        provider: planningState.provider,
        analysis: {
          imageGenerationSource: {
            contentKind: "full-article-text",
            strategy: planningState.strategySummary,
          },
          cardOutlineTitles: planningState.cardPlan.map((card) => card.title),
          keyQuotes: planningState.candidateQuotes,
          coverTheme: planningState.coverTheme,
        },
        cardPlan: planningState.cardPlan,
        inlineImagePlan: planningState.inlineImagePlan,
      };
      nextRevision = replanRevision;
      clearTaskError();
      pushStatus("generation", "info", "复用当前拆解结果，直接开始出图", {
        phase: "generating",
        currentStepLabel: "准备出图",
        completedTasks: 0,
        totalTasks: 0,
      });
    } else {
      clearTaskError();
      pushStatus("planning", "info", "正在拆解内容", {
        phase: "planning",
        currentStepLabel: "拆解中",
        completedTasks: 0,
        totalTasks: 1,
      });

      try {
        const planningResult = await runPlanning();
        planning = planningResult.planning;
        nextRevision = planningResult.nextRevision;
        pushStatus("planning", "success", "内容拆解已完成", {
          phase: "planning",
          currentStepLabel: "拆解完成",
          completedTasks: 1,
          totalTasks: 1,
        });
      } catch (error) {
        pushStatus(
          "planning",
          "error",
          error instanceof Error ? error.message : "内容拆解失败",
          {
            phase: "failed",
            currentStepLabel: "拆解失败",
            completedTasks: 0,
            totalTasks: 1,
          }
        );
        return;
      }
    }

    const resolvedQuoteIndexes = resolveValidSelectedQuoteIndexes(
      planning.analysis.keyQuotes,
      selectedQuotes
    );
    const resolvedQuotes = resolvedQuoteIndexes
      .map((index) => planning.analysis.keyQuotes[index])
      .filter(Boolean);
    const tasks = buildGenerationTasks({
      articleTitle: currentArticle.title,
      articleBody: currentArticle.body,
      planning,
      selectedQuotes: resolvedQuotes,
      outputs,
      lockedKnowledgeCardIndexes,
    });

    if (tasks.length === 0) {
      pushStatus("generation", "success", "当前没有需要生成的输出项", {
        phase: "completed",
        currentStepLabel: "完成",
        completedTasks: 0,
        totalTasks: 0,
      });
      if (outputs.layout) {
        setActiveTab("wechat");
      }
      return;
    }

    const groupedRecords = new Map<GenerationPurposeKey, GenerationRecord>();
    for (let index = 0; index < tasks.length; index += 1) {
      const task = tasks[index];
      const scope = toTaskScope(task);
      const taskLabel = buildTaskLabel(task);
      pushStatus(scope, "info", `正在生成 ${taskLabel}`, {
        phase: "generating",
        currentStepLabel: taskLabel,
        completedTasks: index,
        totalTasks: tasks.length,
      });

      let record: GenerationRecord;
      try {
        record = bindInlineImages(await postGenerateImages(task), task.inlineLinks);
      } catch (error) {
        pushStatus(
          scope,
          "error",
          error instanceof Error ? error.message : `${taskLabel} 生成失败`,
          {
            phase: "failed",
            currentStepLabel: `${taskLabel}失败`,
            completedTasks: index,
            totalTasks: tasks.length,
          }
        );
        return;
      }

      if (record.purposeKey === "xhs_card") {
        const existing = groupedRecords.get(record.purposeKey) ?? knowledgeGeneration;
        const mergedRecord = mergeRecordImages(existing, record);
        groupedRecords.set(record.purposeKey, mergedRecord);
        saveGenerationRecord(mergedRecord);
        record.images.forEach((image) => {
          if (image.cardLink?.index != null) {
            updateKnowledgeCardStatus(image.cardLink.index, {
              replaced: false,
              regenerated: false,
              needsRegeneration: false,
            });
          }
        });
      } else {
        groupedRecords.set(record.purposeKey, record);
        saveGenerationRecord(record);
      }

      if (record.purposeKey === "wx_cover") {
        setWorkbenchState((prev) => ({
          ...prev,
          coverSelection: prev.coverSelection ?? {
            selectedCoverIndex: 0,
            updatedAt: new Date().toISOString(),
          },
        }));
      }

      if (record.purposeKey === "quote") {
        setWorkbenchState((prev) => ({
          ...prev,
          quoteGenerationSelection: {
            selectedQuoteIndexes: resolvedQuoteIndexes,
            selectedQuoteTexts: resolvedQuotes,
            generatedAtPlanningRevision: nextRevision,
          },
        }));
      }

      pushStatus(scope, "success", `${taskLabel} 已完成`, {
        phase: "generating",
        currentStepLabel: taskLabel,
        completedTasks: index + 1,
        totalTasks: tasks.length,
      });
    }

    pushStatus("generation", "success", `已完成 ${tasks.length} 个输出项`, {
      phase: "completed",
      currentStepLabel: "完成",
      completedTasks: tasks.length,
      totalTasks: tasks.length,
    });
    if (outputs.layout) {
      setActiveTab("wechat");
    }
  }

  async function handleImportMarkdown(file: File | null) {
    if (!file) return;
    const isMarkdown =
      file.name.toLowerCase().endsWith(".md") ||
      file.type === "text/markdown" ||
      file.type === "text/plain";

    if (!isMarkdown) {
      pushStatus("markdown-import", "error", "仅支持导入 Markdown 或纯文本文件");
      return;
    }

    try {
      const rawText = await file.text();
      if (!rawText.trim()) {
        throw new Error("文件内容为空");
      }

      const { title, body } = parseMarkdownArticle(rawText, file.name);
      const nextArticle = { title, body };
      const importedAt = new Date().toISOString();
      setCurrentArticle(nextArticle);
      clearGenerationRecords(["xhs_card", "quote", "wx_cover", "wx_inline"]);
      setSelectedQuotes([]);
      clearPlanningState();
      setWorkbenchState((prev) => ({
        ...prev,
        lockedKnowledgeCardIndexes: [],
        knowledgeCardStatuses: {},
        knowledgeCardHistories: {},
        quoteGenerationSelection: null,
        coverSelection: null,
        importedMarkdownMeta: {
          fileName: file.name,
          wordCount: countCharacters(rawText),
          importedAt,
        },
      }));

      pushStatus("markdown-import", "success", "已导入 Markdown", {
        phase: "idle",
        currentStepLabel: "导入完成",
        completedTasks: 0,
        totalTasks: 0,
      });

      pushStatus("planning", "info", "正在根据新文章刷新内容拆解", {
        phase: "planning",
        currentStepLabel: "导入后重拆解",
        completedTasks: 0,
        totalTasks: 1,
      });

      try {
        await runPlanningForArticle(nextArticle);
        pushStatus(
          "markdown-import",
          "success",
          "已导入 Markdown，并刷新内容拆解；旧出图结果已清空",
          {
            phase: "completed",
            currentStepLabel: "完成",
            completedTasks: 1,
            totalTasks: 1,
          }
        );
      } catch (error) {
        pushStatus(
          "planning",
          "error",
          `Markdown 已导入，但内容拆解刷新失败：${
            error instanceof Error ? error.message : "请稍后重试"
          }`,
          {
            phase: "failed",
            currentStepLabel: "拆解失败",
            completedTasks: 0,
            totalTasks: 1,
          }
        );
      }
    } catch (error) {
      pushStatus(
        "markdown-import",
        "error",
        error instanceof Error ? error.message : "Markdown 导入失败"
      );
    }
  }

  return {
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
    coverSelection,
    latestGenerationTime,
    latestLogText,
    controlTowerOutputs,
    lockedKnowledgeCardIndexes,
    knowledgeCardStatuses,
    knowledgeCardHistories,
    importedMarkdownMeta,
    quoteGenerationSelection,
    replanRevision,
    taskState,
    statusState,
    estimatedCredits,
    isGenerating,
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
    handleFinalizeKnowledgeCard,
    handleRollbackKnowledgeCard,
    handleRegenerateKnowledgeCard,
    handleReplaceKnowledgeCardClick,
    handleKnowledgeCardFileChange,
    handleEditAndRegenerateKnowledgeCard,
    handleStartGeneration,
    handleGenerateQuoteCard,
    handleSelectCover,
    handleFinalizeCover,
    handleImportMarkdown,
    handleReplan,
    runPlanning,
  };
}

function buildOutputSummary({
  label,
  modeText,
  generatedCount,
  plannedCount,
  generatedText,
  pendingText,
}: {
  label: string;
  modeText?: string;
  generatedCount: number;
  plannedCount: number;
  generatedText: string | null;
  pendingText: string;
}) {
  return {
    label,
    modeText: modeText ?? null,
    valueText:
      generatedCount > 0
        ? generatedText || `${generatedCount} 张已生成`
        : plannedCount > 0
          ? pendingText
          : "未启用",
  };
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function buildReplanSummaryText(summary: ReplanSummary) {
  const parts: string[] = [];
  if (summary.preservedQuoteCount > 0) {
    parts.push(`保留 ${summary.preservedQuoteCount} 条已选金句`);
  }
  if (summary.clearedQuoteCount > 0) {
    parts.push(`清理 ${summary.clearedQuoteCount} 条失效金句`);
  }
  if (summary.preservedKnowledgeCount > 0) {
    parts.push(`保留 ${summary.preservedKnowledgeCount} 张知识卡结果`);
  }
  if (summary.staleKnowledgeCount > 0) {
    parts.push(`${summary.staleKnowledgeCount} 张知识卡需重生成`);
  }
  return parts.join("，");
}

function toTaskScope(task: {
  purposeKey: string;
  cardLink?: { index: number };
}) {
  if (task.purposeKey === "xhs_card") {
    return `knowledge-card-${task.cardLink?.index ?? "unknown"}`;
  }
  if (task.purposeKey === "quote") return "quote-generation";
  if (task.purposeKey === "wx_inline") return "inline-image-generation";
  if (task.purposeKey === "wx_cover") return "cover-generation";
  return "generation";
}

function buildTaskLabel(task: {
  purposeLabel: string;
  purposeKey: string;
  cardLink?: { index: number };
}) {
  if (task.purposeKey === "xhs_card" && task.cardLink?.index != null) {
    return `知识卡 ${String(task.cardLink.index).padStart(2, "0")}`;
  }
  if (task.purposeKey === "quote") return "金句底图";
  if (task.purposeKey === "wx_inline") return "正文配图";
  if (task.purposeKey === "wx_cover") return "公众号封面";
  return task.purposeLabel;
}

export function formatScopeLabel(scope: string) {
  if (scope === "planning") return "拆解失败";
  if (scope === "quote-generation") return "金句底图失败";
  if (scope === "inline-image-generation") return "正文配图失败";
  if (scope === "cover-generation") return "公众号封面失败";
  if (scope === "markdown-import") return "导入失败";
  if (scope.startsWith("knowledge-card-")) {
    const index = scope.replace("knowledge-card-", "");
    return `知识卡第 ${Number(index)} 张失败`;
  }
  return "最近失败";
}

function parseMarkdownArticle(rawText: string, fileName: string) {
  const trimmed = rawText.replace(/\r\n/g, "\n").trim();
  const h1Match = trimmed.match(/^#\s+(.+)$/m);
  const fileBaseName = fileName.replace(/\.[^.]+$/, "").trim();
  let body = trimmed;

  if (h1Match) {
    body = trimmed.replace(/^#\s+(.+)\n*/m, "").trim();
  }
  if (!body) {
    throw new Error("Markdown 正文为空");
  }

  const firstParagraph =
    body
      .split(/\n\s*\n/)
      .map((part) => part.replace(/\n+/g, " ").trim())
      .find(Boolean) || body.replace(/\n+/g, " ").trim();

  const title =
    h1Match?.[1]?.trim() ||
    fileBaseName ||
    firstParagraph.slice(0, Math.min(28, firstParagraph.length));

  return { title, body };
}

function countCharacters(value: string) {
  return value.replace(/\s+/g, "").length;
}

function toDisplayTime(iso: string) {
  return new Date(iso).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
