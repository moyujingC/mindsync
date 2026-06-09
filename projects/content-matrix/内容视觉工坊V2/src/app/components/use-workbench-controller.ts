import { useRef, useState, type ChangeEvent } from "react";
import { postGenerateImages, postPlanCards } from "../api";
import type { PlannerRequest, SplitStrategy } from "../content-planning";
import { DEFAULT_PRESET_KEYS, findPreset } from "../image-presets";
import type {
  GenerationPurposeKey,
  GenerationRecord,
  PlanningState,
  WorkbenchState,
  WorkspaceArticle,
  WorkspaceTab,
} from "../workspace";
import {
  buildFallbackCardPlan,
  buildFallbackInlineImagePlan,
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
  generationRecords: GenerationRecord[];
  latestGeneration: GenerationRecord | null;
  planningState: PlanningState | null;
  savePlanningState: (planning: PlanningState) => void;
  saveGenerationRecord: (record: GenerationRecord) => void;
  workbenchState: WorkbenchState;
  setWorkbenchState: React.Dispatch<React.SetStateAction<WorkbenchState>>;
  setActiveTab: (tab: WorkspaceTab) => void;
};

export function useWorkbenchController({
  currentArticle,
  generationRecords,
  latestGeneration,
  planningState,
  savePlanningState,
  saveGenerationRecord,
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
  const [selectedQuotes, setSelectedQuotes] = useState<number[]>([0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [generationError, setGenerationError] = useState("");
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
  const knowledgeImagesByCard = new Map(
    (knowledgeGeneration?.images ?? [])
      .filter((image) => image.cardLink)
      .map((image) => [image.cardLink!.index, image])
  );
  const quoteGeneration = generationRecords.find((item) => item.purposeKey === "quote");
  const coverGeneration = generationRecords.find((item) => item.purposeKey === "wx_cover");
  const inlineGeneration = generationRecords.find((item) => item.purposeKey === "wx_inline");
  const latestGenerationTime = latestGeneration
    ? new Date(latestGeneration.createdAt).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "14:35";
  const latestLogText = latestGeneration
    ? `${latestGeneration.purposeLabel} · ${latestGeneration.images.length} 张`
    : "cover_03 → 桌面与一杯茶";
  const lockedKnowledgeCardIndexes = workbenchState.lockedKnowledgeCardIndexes;
  const knowledgeCardStatuses = workbenchState.knowledgeCardStatuses;
  const knowledgeCardHistories = workbenchState.knowledgeCardHistories;
  const unlockedPlannedCards = plannedCards.filter(
    (card) => !lockedKnowledgeCardIndexes.includes(card.index)
  );
  const estimatedCredits =
    (outputs.knowledge ? unlockedPlannedCards.length : 0) +
    (outputs.quote ? Math.max(1, selectedQuotes.length) : 0) +
    (outputs.cover ? 3 : 0) +
    (outputs.inline ? plannedInlineImages.length : 0);

  function toggleOutput(key: keyof WorkbenchOutputs) {
    setOutputs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleQuote(index: number) {
    setSelectedQuotes((prev) =>
      prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index]
    );
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

    const nextImage = {
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
    setGenerationStatus(`知识卡 ${String(editingCardIndex).padStart(2, "0")} 文案已保存`);
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
    });
    setWorkbenchState((prev) => ({
      ...prev,
      knowledgeCardHistories: {
        ...prev.knowledgeCardHistories,
        [String(cardIndex)]: (prev.knowledgeCardHistories[String(cardIndex)] || []).slice(1),
      },
    }));
    setGenerationStatus(`知识卡 ${String(cardIndex).padStart(2, "0")} 已回退上一版`);
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
    setGenerationError("");
    setGenerationStatus(`正在重生成知识卡 ${String(cardIndex).padStart(2, "0")}`);

    try {
      const record = await postGenerateImages({
        articleTitle: currentArticle.title,
        prompt: `为文章《${currentArticle.title}》的第 ${resolvedCard.index} 张小红书知识卡片生成主视觉。卡片标题：${resolvedCard.title}。卡片摘要：${resolvedCard.summary}。整组基调仍然是低饱和、雾蓝、克制、适合知识传播，但这一张需要围绕当前卡片观点形成单卡视觉重心。`,
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
      });
      setGenerationStatus(`知识卡 ${String(cardIndex).padStart(2, "0")} 已更新`);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "知识卡重生成失败");
      setGenerationStatus("知识卡重生成失败");
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
      });
      setGenerationStatus(
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
    const request: PlannerRequest = {
      articleTitle: currentArticle.title,
      rawText: currentArticle.body,
      knowledgeCardStyleName: "蓝雾静读",
      inlineImageStyleName: "留白水墨",
      cardRatio: knowledgePreset?.aspect || "3:4",
      cardWidth: knowledgePreset?.w || 1280,
      cardHeight: knowledgePreset?.h || 1706,
      splitStrategy,
      minCards,
      maxCards,
    };

    const planning = await postPlanCards(request);
    savePlanningState({
      provider: planning.provider,
      cardPlan: planning.cardPlan,
      candidateQuotes: planning.analysis.keyQuotes,
      inlineImagePlan: planning.inlineImagePlan,
      coverTheme: planning.analysis.coverTheme,
      strategySummary: planning.analysis.imageGenerationSource.strategy,
      updatedAt: new Date().toISOString(),
    });

    return planning;
  }

  async function handleStartGeneration() {
    setIsGenerating(true);
    setGenerationError("");

    try {
      setGenerationStatus("正在拆解内容与提炼候选金句 · 1/2");
      const planning = await runPlanning();
      const resolvedQuotes = selectedQuotes
        .map((index) => planning.analysis.keyQuotes[index] ?? planning.analysis.keyQuotes[0])
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
        setGenerationStatus("内容拆解已完成");
        if (outputs.layout) {
          setActiveTab("wechat");
        }
        return;
      }

      const groupedRecords = new Map<GenerationPurposeKey, GenerationRecord>();
      for (let index = 0; index < tasks.length; index += 1) {
        const task = tasks[index];
        setGenerationStatus(`正在生成 ${task.purposeLabel} · ${index + 1}/${tasks.length}`);
        const record = await postGenerateImages(task);

        if (record.purposeKey === "xhs_card") {
          const existing = groupedRecords.get(record.purposeKey);
          const mergedRecord = mergeRecordImages(existing, record);
          groupedRecords.set(record.purposeKey, mergedRecord);
          saveGenerationRecord(mergedRecord);
          record.images.forEach((image) => {
            if (image.cardLink?.index != null) {
              updateKnowledgeCardStatus(image.cardLink.index, {
                replaced: false,
                regenerated: false,
              });
            }
          });
          continue;
        }

        groupedRecords.set(record.purposeKey, record);
        saveGenerationRecord(record);
      }

      setGenerationStatus(`已完成 ${tasks.length} 个输出项`);
      if (outputs.layout) {
        setActiveTab("wechat");
      }
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "生成失败");
      setGenerationStatus("生成中断");
    } finally {
      setIsGenerating(false);
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
    latestGenerationTime,
    latestLogText,
    lockedKnowledgeCardIndexes,
    knowledgeCardStatuses,
    knowledgeCardHistories,
    estimatedCredits,
    isGenerating,
    generationStatus,
    setGenerationStatus,
    generationError,
    setGenerationError,
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
  };
}
