import { useMemo, useState } from "react";
import { workspaceData as initialWorkspaceData } from "../mockData";
import { parseMarkdownFileContent } from "../lib/markdown";
import { planCards } from "../lib/planCards";
import { generateCardImage } from "../lib/generateCardImage";
import { generateCoverImage } from "../lib/generateCoverImage";
import { generateWechatInlineImage } from "../lib/generateWechatInlineImage";
import { buildDraftReview, buildWechatInlineImages } from "../lib/layoutGeneration";
import type { StyleSelectionKey, WorkspaceData } from "../types";

function formatNowTime() {
  return new Date().toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function updateGenerationTimestamp(workspace: WorkspaceData, generatedAt: string): WorkspaceData["generation"] {
  return {
    ...workspace.generation,
    generatedAt,
    summaryMeta: workspace.generation.summaryMeta.map((item) =>
      item.label === "生成时间" ? { ...item, value: generatedAt } : item,
    ),
  };
}

function getImageStyleName(workspace: WorkspaceData, key: Exclude<StyleSelectionKey, "wechatLayout">) {
  const index = workspace.styleSelections[key];
  return workspace.styleAssets[index]?.name ?? workspace.styleAssets[0]?.name ?? "默认风格";
}

function getImageStyleAsset(workspace: WorkspaceData, key: Exclude<StyleSelectionKey, "wechatLayout">) {
  const index = workspace.styleSelections[key];
  return workspace.styleAssets[index] ?? workspace.styleAssets[0];
}

function buildCoverRequest(workspace: WorkspaceData, coverKey: "wechatCover" | "wechatShareCover" | "xiaohongshuCover") {
  const cover = workspace.covers.find((item) => item.key === coverKey);
  if (!cover) return null;
  const styleAsset = getImageStyleAsset(workspace, coverKey);

  return {
    label: cover.label,
    articleTitle: workspace.article.title,
    coverThemeTitle: workspace.analysis.coverTheme.title,
    coverThemeKeywords: workspace.analysis.coverTheme.keywords,
    styleName: styleAsset?.name ?? "默认风格",
    stylePromptBase: styleAsset?.promptBase ?? "",
    styleReferenceImages: styleAsset?.referenceImages ?? [],
    ratio: cover.ratio,
  };
}

function isOutputEnabled(workspace: WorkspaceData, key: "knowledgeCards" | "wechatCover" | "wechatShareCover" | "xiaohongshuCover") {
  return workspace.outputToggles.find((item) => item.key === key)?.enabled ?? false;
}

function buildWechatInlineImageRequest(workspace: WorkspaceData, imageId: string) {
  const image = workspace.wechatInlineImages.find((item) => item.id === imageId);
  if (!image) return null;
  const styleAsset = getImageStyleAsset(workspace, "wechatInlineImages");

  return {
    articleTheme: workspace.analysis.coverTheme.title,
    sectionType: image.sectionType,
    sectionTheme: image.sectionTheme,
    sectionKeywords: image.sectionKeywords,
    sectionSummary: image.sectionSummary,
    sectionQuote: image.sectionQuote,
    visualDirection: image.visualDirection,
    styleName: styleAsset?.name ?? "默认风格",
    stylePromptBase: styleAsset?.promptBase ?? "",
    styleReferenceImages: styleAsset?.referenceImages ?? [],
    ratio: image.ratio,
    width: image.width,
    height: image.height,
  };
}

function markDraftSyncPending(workspace: WorkspaceData, detail: string): WorkspaceData["workflowStages"] {
  return workspace.workflowStages.map((stage) => {
    if (stage.key === "draftSync") {
      return { ...stage, status: "idle", detail };
    }
    return stage;
  });
}

function withFreshDraftReview(workspace: WorkspaceData) {
  return {
    ...workspace,
    draftReview: buildDraftReview(workspace),
  };
}

function htmlToPlainText(html: string) {
  if (typeof document === "undefined") return html;
  const container = document.createElement("div");
  container.innerHTML = html;
  return container.innerText.replace(/\n{3,}/g, "\n\n").trim();
}

async function copyHtmlViaSelection(html: string) {
  if (typeof document === "undefined") return false;

  const container = document.createElement("div");
  container.innerHTML = html;
  container.contentEditable = "true";
  container.style.position = "fixed";
  container.style.pointerEvents = "none";
  container.style.opacity = "0";
  container.style.left = "-9999px";
  container.style.top = "0";
  document.body.appendChild(container);

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(container);
  selection?.removeAllRanges();
  selection?.addRange(range);

  const copied = document.execCommand("copy");

  selection?.removeAllRanges();
  document.body.removeChild(container);
  return copied;
}

function createLayoutThemeDefaults() {
  return initialWorkspaceData.layoutThemes[0];
}

function normalizeImportedLayoutTheme(input: unknown): WorkspaceData["layoutThemes"][number] {
  const fallback = createLayoutThemeDefaults();
  const raw = (input && typeof input === "object") ? input as Record<string, unknown> : {};

  const readString = (key: keyof typeof fallback) =>
    typeof raw[key] === "string" && raw[key] ? raw[key] as string : fallback[key] as string;
  const readNumber = (key: keyof typeof fallback) =>
    typeof raw[key] === "number" && Number.isFinite(raw[key]) ? raw[key] as number : fallback[key] as number;

  const previewPalette = Array.isArray(raw.previewPalette)
    ? raw.previewPalette.filter((item): item is string => typeof item === "string").slice(0, 4)
    : fallback.previewPalette;

  return {
    accountName: readString("accountName"),
    name: readString("name"),
    desc: readString("desc"),
    meta: readString("meta"),
    previewPalette: previewPalette.length === 4 ? previewPalette : fallback.previewPalette,
    shellBg: readString("shellBg"),
    articleBg: readString("articleBg"),
    titleColor: readString("titleColor"),
    headingColor: readString("headingColor"),
    bodyColor: readString("bodyColor"),
    mutedColor: readString("mutedColor"),
    quoteBg: readString("quoteBg"),
    quoteBorder: readString("quoteBorder"),
    ctaBg: readString("ctaBg"),
    ctaText: readString("ctaText"),
    figureBg: readString("figureBg"),
    placeholderBg: readString("placeholderBg"),
    placeholderBorder: readString("placeholderBorder"),
    headingFontSize: readNumber("headingFontSize"),
    paragraphSpacing: readNumber("paragraphSpacing"),
    sectionSpacing: readNumber("sectionSpacing"),
    imageRadius: readNumber("imageRadius"),
    quoteRadius: readNumber("quoteRadius"),
    quoteBorderWidth: readNumber("quoteBorderWidth"),
    ctaRadius: readNumber("ctaRadius"),
    captionAlign: raw.captionAlign === "left" ? "left" : raw.captionAlign === "center" ? "center" : fallback.captionAlign,
    ctaTitle: readString("ctaTitle"),
    ctaButtonText: readString("ctaButtonText"),
    coverBottomSpacing: readNumber("coverBottomSpacing"),
    inlineImageSpacing: readNumber("inlineImageSpacing"),
    quoteSpacing: readNumber("quoteSpacing"),
    pinned: typeof raw.pinned === "boolean" ? raw.pinned : fallback.pinned,
  };
}

function buildKnowledgeCardComposition(title: string, index: number) {
  const presets = [
    "主标题居中偏上 / 纸感底纹 / 留白底部 30%",
    "观点标题突出 / 层次简洁 / 视觉重心稳定",
    "结构感排版 / 信息层级清楚 / 适合知识卡展示",
    "克制留白 / 轻编辑感 / 强调单一主题",
  ];

  return presets[(index - 1) % presets.length] || `围绕「${title}」做单张知识卡排版`;
}

function buildKnowledgeCardsFromPlan(workspace: WorkspaceData, plan: WorkspaceData["cardPlan"]) {
  return plan.map((card) => ({
    n: String(card.index).padStart(2, "0"),
    title: card.title,
    summary: card.summary,
    composition: buildKnowledgeCardComposition(card.title, card.index),
    img: "",
    state: "idle" as const,
    isStale: false,
    provider: "mock" as const,
  }));
}

function resetCoversForReplan(workspace: WorkspaceData) {
  return workspace.covers.map((cover) => ({
    ...cover,
    img: "",
    state: "idle" as const,
    isStale: false,
    provider: undefined,
    imagePrompt: undefined,
    status: "待生成",
  }));
}

function markAssetsStaleForStyle(workspace: WorkspaceData, key: StyleSelectionKey) {
  if (key === "knowledgeCards") {
    return {
      ...workspace,
      knowledgeCards: workspace.knowledgeCards.map((item) => ({ ...item, isStale: Boolean(item.img) || item.state === "failed" })),
    };
  }

  if (key === "wechatInlineImages") {
    return {
      ...workspace,
      wechatInlineImages: workspace.wechatInlineImages.map((item) => ({ ...item, isStale: Boolean(item.img) || item.state === "failed" })),
    };
  }

  if (key === "wechatLayout") {
    return workspace;
  }

  return {
    ...workspace,
    covers: workspace.covers.map((item) =>
      item.key === key ? { ...item, isStale: Boolean(item.img) || item.state === "failed" } : item,
    ),
  };
}

function markKnowledgeCardsStaleForSize(workspace: WorkspaceData, nextCardSize: WorkspaceData["cardSize"]) {
  return {
    ...workspace,
    cardSize: nextCardSize,
    knowledgeCards: workspace.knowledgeCards.map((item) => ({ ...item, isStale: Boolean(item.img) || item.state === "failed" })),
  };
}

function buildGenerationSummary(workspace: WorkspaceData, cardCount: number) {
  return {
    ...workspace.generation,
    cardsCount: cardCount,
    coversCount: workspace.covers.length,
    layoutStatus: "已生成",
    summaryMeta: workspace.generation.summaryMeta.map((item) => {
      if (item.label === "知识卡片") return { ...item, value: `${cardCount} 张` };
      if (item.label === "封面") return { ...item, value: `${workspace.covers.length} 张` };
      if (item.label === "排版") return { ...item, value: "已生成", emerald: true };
      return item;
    }),
  };
}

function buildTextOnlyDraftReview(title: string): WorkspaceData["draftReview"] {
  return {
    readyTitle: "纯文本模式仅生成图片",
    readyDescription: "当前模式不会生成公众号排版、审稿预览或可复制 HTML",
    reviewChecks: [
      { title: "输入模式", detail: "当前为纯文本模式，仅走拆图与出图链路", status: "pass" },
      { title: "排版状态", detail: "未生成公众号正文排版", status: "warn" },
      { title: "草稿同步", detail: "未启用公众号复制与同步", status: "warn" },
      { title: "后续动作", detail: "可继续生成知识卡片、正文配图和封面", status: "pass" },
    ],
    syncStatus: [
      { label: "图片生成", note: "纯文本模式可继续生成知识卡片、正文配图与封面" },
      { label: "公众号排版", note: "当前未生成" },
      { label: "正文复制", note: "当前未启用" },
      { label: "草稿同步", note: "当前未启用" },
    ],
    imagePlacements: [],
    preview: {
      title,
      accountName: "墨予镜",
      publishDate: new Date().toLocaleDateString("zh-CN"),
      intro: "纯文本模式不会生成公众号正文预览。",
      blocks: [{ type: "paragraph", text: "请使用 Markdown 模式进入公众号排版与复制链路。" }],
    },
    editorHtml: "",
  };
}

export function useWorkspaceDocument() {
  const [workspace, setWorkspace] = useState<WorkspaceData>(initialWorkspaceData);
  const [rawMarkdownText, setRawMarkdownText] = useState<string>("");
  const [copyFeedback, setCopyFeedback] = useState<string>("");
  const [textModeTitle, setTextModeTitle] = useState("");
  const [textModeBody, setTextModeBody] = useState("");

  const derived = useMemo(() => {
    return {
      hasUploadedMarkdown: workspace.article.fileName.length > 0,
      rawMarkdownText,
    };
  }, [workspace, rawMarkdownText]);

  async function generateLayoutPreview(nextWorkspace?: WorkspaceData) {
    const baseWorkspace = nextWorkspace ?? workspace;

    setWorkspace((prev) => ({
      ...prev,
      workflowStages: prev.workflowStages.map((stage) =>
        stage.key === "layoutGeneration"
          ? { ...stage, status: "processing", detail: "正在生成公众号排版预览…", providerLabel: "本地排版器" }
          : stage,
      ),
    }));

    const draftReview = buildDraftReview(baseWorkspace);

    setWorkspace((prev) => ({
      ...baseWorkspace,
      draftReview,
      generation: {
        ...baseWorkspace.generation,
        layoutStatus: "已生成",
        summaryMeta: baseWorkspace.generation.summaryMeta.map((item) =>
          item.label === "排版" ? { ...item, value: "已生成", emerald: true } : item,
        ),
      },
      workflowStages: markDraftSyncPending(
        {
          ...baseWorkspace,
          workflowStages: baseWorkspace.workflowStages.map((stage) =>
            stage.key === "layoutGeneration"
              ? {
                  ...stage,
                  status: "success",
                  detail: `排版预览已生成，并编排 ${draftReview.imagePlacements.length} 处插图位`,
                  providerLabel: "本地排版器",
                }
              : stage,
          ),
        },
        "排版已更新，可同步到公众号草稿箱",
      ),
    }));
  }

  async function copyWechatHtml() {
    const html = workspace.draftReview.editorHtml;
    if (!html) return;

    const plainText = htmlToPlainText(html);

    if (window.ClipboardItem && navigator.clipboard?.write) {
      const item = new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plainText], { type: "text/plain" }),
      });
      await navigator.clipboard.write([item]);
    } else {
      const copied = await copyHtmlViaSelection(html);
      if (!copied) {
        await navigator.clipboard.writeText(plainText);
      }
    }

    setCopyFeedback("已复制富文本内容，可直接粘贴到公众号编辑器");

    setWorkspace((prev) => ({
      ...prev,
      workflowStages: prev.workflowStages.map((stage) =>
        stage.key === "draftSync"
          ? { ...stage, status: "success", detail: "公众号富文本内容已复制到剪贴板", providerLabel: "手动粘贴" }
          : stage,
      ),
      draftReview: {
        ...prev.draftReview,
        syncStatus: prev.draftReview.syncStatus.map((row) =>
          row.label === "复制方式"
            ? { ...row, note: "富文本内容已复制，可直接粘贴到公众号编辑器" }
            : row,
        ),
      },
    }));
  }

  async function importMarkdownFile(file: File) {
    const text = await file.text();
    const parsed = parseMarkdownFileContent(file.name, text);

    setRawMarkdownText(text);

    setWorkspace((prev) => ({
      ...prev,
      workflowStages: prev.workflowStages.map((stage) => {
        if (stage.key === "upload") {
          return { ...stage, status: "success", detail: "Markdown 文件已读取" };
        }
        if (stage.key === "markdownParse") {
          return { ...stage, status: "success", detail: "标题、引用、列表等结构已识别" };
        }
        if (stage.key === "contentAnalysis") {
          return { ...stage, status: "processing", detail: "正在调用拆图规划服务…" };
        }
        return stage;
      }),
    }));

    const planned = await planCards({
      articleTitle: parsed.article.title,
      rawText: text,
      knowledgeCardStyleName: getImageStyleName(workspace, "knowledgeCards"),
      inlineImageStyleName: getImageStyleName(workspace, "wechatInlineImages"),
      cardRatio: initialWorkspaceData.cardSize.ratio,
      cardWidth: initialWorkspaceData.cardSize.width,
      cardHeight: initialWorkspaceData.cardSize.height,
    });

    const nextWorkspace: WorkspaceData = {
      ...workspace,
      article: parsed.article,
      parsedMarkdown: parsed.parsedMarkdown,
      analysis: planned.analysis,
      cardPlan: planned.cardPlan,
      knowledgeCards: buildKnowledgeCardsFromPlan(workspace, planned.cardPlan),
      wechatInlineImages: buildWechatInlineImages({
        ...workspace,
        article: parsed.article,
        parsedMarkdown: parsed.parsedMarkdown,
        analysis: planned.analysis,
        cardPlan: planned.cardPlan,
      } as WorkspaceData, planned.inlineImagePlan),
      covers: resetCoversForReplan(workspace),
      generation: buildGenerationSummary(workspace, planned.cardPlan.length),
      workflowStages: workspace.workflowStages.map((stage) => {
        if (stage.key === "upload") {
          return { ...stage, status: "success", detail: "Markdown 文件已读取" };
        }
        if (stage.key === "markdownParse") {
          return { ...stage, status: "success", detail: "标题、引用、列表等结构已识别" };
        }
        if (stage.key === "contentAnalysis") {
          return {
            ...stage,
            status: "success",
            detail: `已拆为 ${planned.cardPlan.length} 张卡片，并提炼金句与封面主题`,
            providerLabel: planned.provider === "llm" ? "真实 LLM" : "本地兜底",
          };
        }
        if (stage.key === "layoutGeneration") {
          return { ...stage, status: "idle", detail: "等待生成公众号排版预览", providerLabel: undefined };
        }
        if (stage.key === "draftSync") {
          return { ...stage, status: "idle", detail: "排版更新后可同步到公众号草稿箱", providerLabel: undefined };
        }
        return stage;
      }),
    };

    setWorkspace(nextWorkspace);
    await generateLayoutPreview(nextWorkspace);
  }

  async function importPlainText() {
    const title = textModeTitle.trim();
    const body = textModeBody.trim();
    if (!title || !body) return;

    const rawText = `# ${title}\n\n${body}`;
    const article = {
      fileName: "粘贴文本",
      updatedAt: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }),
      wordCount: body.length,
      title,
      rawText,
    };

    setWorkspace((prev) => ({
      ...prev,
      workflowStages: prev.workflowStages.map((stage) => {
        if (stage.key === "upload") {
          return { ...stage, status: "success", detail: "纯文本内容已录入" };
        }
        if (stage.key === "markdownParse") {
          return { ...stage, status: "idle", detail: "纯文本模式未做 Markdown 解析", providerLabel: undefined };
        }
        if (stage.key === "contentAnalysis") {
          return { ...stage, status: "processing", detail: "正在调用拆图规划服务…" };
        }
        if (stage.key === "layoutGeneration") {
          return { ...stage, status: "idle", detail: "纯文本模式未生成公众号排版", providerLabel: undefined };
        }
        if (stage.key === "draftSync") {
          return { ...stage, status: "idle", detail: "纯文本模式未启用公众号复制", providerLabel: undefined };
        }
        return stage;
      }),
    }));

    const planned = await planCards({
      articleTitle: title,
      rawText,
      knowledgeCardStyleName: getImageStyleName(workspace, "knowledgeCards"),
      inlineImageStyleName: getImageStyleName(workspace, "wechatInlineImages"),
      cardRatio: workspace.cardSize.ratio,
      cardWidth: workspace.cardSize.width,
      cardHeight: workspace.cardSize.height,
    });

    const nextWorkspace: WorkspaceData = {
      ...workspace,
      article,
      parsedMarkdown: {
        status: "idle",
        structure: { headings: 0, subheadings: 0, bolds: 0, quotes: 0, lists: 0 },
        structureTags: ["纯文本模式"],
      },
      analysis: planned.analysis,
      cardPlan: planned.cardPlan,
      knowledgeCards: buildKnowledgeCardsFromPlan(workspace, planned.cardPlan),
      wechatInlineImages: buildWechatInlineImages({
        ...workspace,
        article,
        analysis: planned.analysis,
        cardPlan: planned.cardPlan,
      } as WorkspaceData, planned.inlineImagePlan),
      covers: resetCoversForReplan(workspace),
      generation: {
        ...buildGenerationSummary(workspace, planned.cardPlan.length),
        layoutStatus: "未生成",
        summaryMeta: buildGenerationSummary(workspace, planned.cardPlan.length).summaryMeta.map((item) =>
          item.label === "排版" ? { ...item, value: "未生成", emerald: false } : item,
        ),
      },
      draftReview: buildTextOnlyDraftReview(title),
      workflowStages: workspace.workflowStages.map((stage) => {
        if (stage.key === "upload") {
          return { ...stage, status: "success", detail: "纯文本内容已录入" };
        }
        if (stage.key === "markdownParse") {
          return { ...stage, status: "idle", detail: "纯文本模式未做 Markdown 解析", providerLabel: undefined };
        }
        if (stage.key === "contentAnalysis") {
          return {
            ...stage,
            status: "success",
            detail: `已拆为 ${planned.cardPlan.length} 张卡片，并生成正文配图规划`,
            providerLabel: planned.provider === "llm" ? "真实 LLM" : "本地兜底",
          };
        }
        if (stage.key === "layoutGeneration") {
          return { ...stage, status: "idle", detail: "纯文本模式未生成公众号排版", providerLabel: undefined };
        }
        if (stage.key === "draftSync") {
          return { ...stage, status: "idle", detail: "纯文本模式未启用公众号复制", providerLabel: undefined };
        }
        return stage;
      }),
    };

    setWorkspace(nextWorkspace);
  }

  async function replanContent() {
    if (!workspace.article.rawText.trim()) return;

    setWorkspace((prev) => ({
      ...prev,
      workflowStages: prev.workflowStages.map((stage) => {
        if (stage.key === "contentAnalysis") {
          return { ...stage, status: "processing", detail: "正在重新调用拆图规划服务…", providerLabel: undefined };
        }
        if (stage.key === "imageGeneration") {
          return { ...stage, status: "idle", detail: "等待基于新规划生成图片", retryable: false, providerLabel: undefined };
        }
        if (stage.key === "layoutGeneration") {
          return { ...stage, status: "idle", detail: "等待基于新规划生成排版预览", providerLabel: undefined };
        }
        if (stage.key === "draftSync") {
          return { ...stage, status: "idle", detail: "等待基于新规划重新生成正文", providerLabel: undefined };
        }
        return stage;
      }),
    }));

    const planned = await planCards({
      articleTitle: workspace.article.title,
      rawText: workspace.article.rawText,
      knowledgeCardStyleName: getImageStyleName(workspace, "knowledgeCards"),
      inlineImageStyleName: getImageStyleName(workspace, "wechatInlineImages"),
      cardRatio: workspace.cardSize.ratio,
      cardWidth: workspace.cardSize.width,
      cardHeight: workspace.cardSize.height,
    });

    const nextWorkspace: WorkspaceData = {
      ...workspace,
      analysis: planned.analysis,
      cardPlan: planned.cardPlan,
      knowledgeCards: buildKnowledgeCardsFromPlan(workspace, planned.cardPlan),
      wechatInlineImages: buildWechatInlineImages({
        ...workspace,
        analysis: planned.analysis,
        cardPlan: planned.cardPlan,
      } as WorkspaceData, planned.inlineImagePlan),
      covers: resetCoversForReplan(workspace),
      generation: buildGenerationSummary(workspace, planned.cardPlan.length),
      workflowStages: workspace.workflowStages.map((stage) => {
        if (stage.key === "contentAnalysis") {
          return {
            ...stage,
            status: "success",
            detail: `已重新拆为 ${planned.cardPlan.length} 张卡片，并更新正文配图规划`,
            providerLabel: planned.provider === "llm" ? "真实 LLM" : "本地兜底",
          };
        }
        if (stage.key === "imageGeneration") {
          return { ...stage, status: "idle", detail: "等待基于新规划生成图片", retryable: false, providerLabel: undefined };
        }
        if (stage.key === "layoutGeneration") {
          return { ...stage, status: "idle", detail: "等待生成公众号排版预览", providerLabel: undefined };
        }
        if (stage.key === "draftSync") {
          return { ...stage, status: "idle", detail: "排版更新后可复制到公众号编辑器", providerLabel: undefined };
        }
        return stage;
      }),
    };

    setWorkspace(nextWorkspace);
    await generateLayoutPreview(nextWorkspace);
  }

  async function regenerateCardImage(cardNumber: string) {
    const card = workspace.knowledgeCards.find((item) => item.n === cardNumber);
    if (!card) return;

    setWorkspace((prev) => ({
      ...prev,
      knowledgeCards: prev.knowledgeCards.map((item) =>
        item.n === cardNumber ? { ...item, state: "processing" } : item,
      ),
      workflowStages: prev.workflowStages.map((stage) =>
        stage.key === "imageGeneration"
          ? { ...stage, status: "processing", detail: `正在生成卡片 ${cardNumber} 图片…`, providerLabel: "gpt-image-2" }
          : stage,
      ),
    }));

    try {
      const styleAsset = getImageStyleAsset(workspace, "knowledgeCards");
      const result = await generateCardImage({
        title: card.title,
        summary: card.summary,
        styleName: styleAsset?.name ?? "默认风格",
        stylePromptBase: styleAsset?.promptBase ?? "",
        styleReferenceImages: styleAsset?.referenceImages ?? [],
        ratio: workspace.cardSize.ratio,
        width: workspace.cardSize.width,
        height: workspace.cardSize.height,
      });

      setWorkspace((prev) => ({
        ...prev,
        generation: updateGenerationTimestamp(prev, formatNowTime()),
        knowledgeCards: prev.knowledgeCards.map((item) =>
          item.n === cardNumber
            ? { ...item, img: result.imageUrl, state: "ok", isStale: false, provider: result.provider, imagePrompt: result.prompt, imageGenerationMode: result.generationMode }
            : item,
        ),
        workflowStages: markDraftSyncPending(
          {
            ...prev,
            workflowStages: prev.workflowStages.map((stage) =>
              stage.key === "imageGeneration"
                ? { ...stage, status: "success", detail: `卡片 ${cardNumber} 图片已生成`, providerLabel: "gpt-image-2" }
                : stage,
            ),
          },
          "图片已更新，如需入库请重新同步草稿",
        ),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "图片生成失败";
      setWorkspace((prev) => ({
        ...prev,
        knowledgeCards: prev.knowledgeCards.map((item) =>
          item.n === cardNumber ? { ...item, state: "failed" } : item,
        ),
        workflowStages: prev.workflowStages.map((stage) =>
          stage.key === "imageGeneration"
            ? { ...stage, status: "failed", detail: message, retryable: true, providerLabel: "gpt-image-2" }
            : stage,
        ),
      }));
    }
  }

  async function regenerateWechatInlineImageAsset(imageId: string) {
    const request = buildWechatInlineImageRequest(workspace, imageId);
    if (!request) return;

    setWorkspace((prev) => ({
      ...prev,
      wechatInlineImages: prev.wechatInlineImages.map((item) =>
        item.id === imageId ? { ...item, state: "processing" } : item,
      ),
      workflowStages: prev.workflowStages.map((stage) =>
        stage.key === "imageGeneration"
          ? { ...stage, status: "processing", detail: `正在生成正文配图 ${imageId}…`, providerLabel: "gpt-image-2" }
          : stage,
      ),
    }));

    try {
      const result = await generateWechatInlineImage(request);
      setWorkspace((prev) => {
        const nextWorkspace = withFreshDraftReview({
          ...prev,
          generation: updateGenerationTimestamp(prev, formatNowTime()),
          wechatInlineImages: prev.wechatInlineImages.map((item) =>
            item.id === imageId
              ? { ...item, img: result.imageUrl, state: "ok", isStale: false, provider: result.provider, imagePrompt: result.prompt, imageGenerationMode: result.generationMode }
              : item,
          ),
        });

        return {
          ...nextWorkspace,
          workflowStages: markDraftSyncPending(
            {
              ...nextWorkspace,
              workflowStages: nextWorkspace.workflowStages.map((stage) =>
                stage.key === "imageGeneration"
                  ? { ...stage, status: "success", detail: `正文配图 ${imageId} 已生成`, providerLabel: "gpt-image-2" }
                  : stage,
              ),
            },
            "正文配图已更新，如需入库请重新同步草稿",
          ),
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "正文配图生成失败";
      setWorkspace((prev) => ({
        ...prev,
        wechatInlineImages: prev.wechatInlineImages.map((item) =>
          item.id === imageId ? { ...item, state: "failed" } : item,
        ),
        workflowStages: prev.workflowStages.map((stage) =>
          stage.key === "imageGeneration"
            ? { ...stage, status: "failed", detail: message, retryable: true, providerLabel: "gpt-image-2" }
            : stage,
        ),
      }));
    }
  }

  async function regenerateAllCardImages() {
    const shouldGenerateCards = isOutputEnabled(workspace, "knowledgeCards");
    const enabledCoverKeys = workspace.covers
      .filter((cover) => isOutputEnabled(workspace, cover.key))
      .map((cover) => cover.key);
    const inlineImages = workspace.wechatInlineImages;
    const cards = shouldGenerateCards ? workspace.knowledgeCards : [];

    if (cards.length === 0 && enabledCoverKeys.length === 0 && inlineImages.length === 0) return;

    setWorkspace((prev) => ({
      ...prev,
      knowledgeCards: prev.knowledgeCards.map((item) =>
        shouldGenerateCards ? { ...item, state: "processing" } : item,
      ),
      covers: prev.covers.map((item) =>
        enabledCoverKeys.includes(item.key) ? { ...item, state: "processing", status: "生成中" } : item,
      ),
      wechatInlineImages: prev.wechatInlineImages.map((item) => ({ ...item, state: "processing" })),
      workflowStages: prev.workflowStages.map((stage) =>
        stage.key === "imageGeneration"
          ? {
              ...stage,
              status: "processing",
              detail: `正在批量生成 ${cards.length} 张知识卡片、${inlineImages.length} 张正文配图和 ${enabledCoverKeys.length} 张封面…`,
              providerLabel: "gpt-image-2",
              retryable: false,
            }
          : stage,
      ),
    }));

    let successCount = 0;
    let failedCount = 0;
    const totalAssets = cards.length + inlineImages.length + enabledCoverKeys.length;

    for (const card of cards) {
      try {
        const styleAsset = getImageStyleAsset(workspace, "knowledgeCards");
        const result = await generateCardImage({
          title: card.title,
          summary: card.summary,
          styleName: styleAsset?.name ?? "默认风格",
          stylePromptBase: styleAsset?.promptBase ?? "",
          styleReferenceImages: styleAsset?.referenceImages ?? [],
          ratio: workspace.cardSize.ratio,
          width: workspace.cardSize.width,
          height: workspace.cardSize.height,
        });

        successCount += 1;
        setWorkspace((prev) => ({
          ...prev,
          knowledgeCards: prev.knowledgeCards.map((item) =>
            item.n === card.n
              ? { ...item, img: result.imageUrl, state: "ok", isStale: false, provider: result.provider, imagePrompt: result.prompt, imageGenerationMode: result.generationMode }
              : item,
          ),
          workflowStages: prev.workflowStages.map((stage) =>
            stage.key === "imageGeneration"
              ? {
                  ...stage,
                  status: "processing",
                  detail: `批量生成中：已完成 ${successCount + failedCount}/${totalAssets} 项`,
                  providerLabel: "gpt-image-2",
                }
              : stage,
          ),
        }));
      } catch {
        failedCount += 1;
        setWorkspace((prev) => ({
          ...prev,
          knowledgeCards: prev.knowledgeCards.map((item) =>
            item.n === card.n ? { ...item, state: "failed" } : item,
          ),
          workflowStages: prev.workflowStages.map((stage) =>
            stage.key === "imageGeneration"
              ? {
                  ...stage,
                  status: "processing",
                  detail: `批量生成中：已完成 ${successCount + failedCount}/${totalAssets} 项，失败 ${failedCount} 项`,
                  providerLabel: "gpt-image-2",
                }
              : stage,
          ),
        }));
      }
    }

    for (const inlineImage of inlineImages) {
      const request = buildWechatInlineImageRequest(workspace, inlineImage.id);
      if (!request) continue;

      try {
        const result = await generateWechatInlineImage(request);
        successCount += 1;
        setWorkspace((prev) => ({
          ...prev,
          wechatInlineImages: prev.wechatInlineImages.map((item) =>
            item.id === inlineImage.id
              ? { ...item, img: result.imageUrl, state: "ok", isStale: false, provider: result.provider, imagePrompt: result.prompt, imageGenerationMode: result.generationMode }
              : item,
          ),
          workflowStages: prev.workflowStages.map((stage) =>
            stage.key === "imageGeneration"
              ? {
                  ...stage,
                  status: "processing",
                  detail: `批量生成中：已完成 ${successCount + failedCount}/${totalAssets} 项`,
                  providerLabel: "gpt-image-2",
                }
              : stage,
          ),
        }));
      } catch {
        failedCount += 1;
        setWorkspace((prev) => ({
          ...prev,
          wechatInlineImages: prev.wechatInlineImages.map((item) =>
            item.id === inlineImage.id ? { ...item, state: "failed" } : item,
          ),
          workflowStages: prev.workflowStages.map((stage) =>
            stage.key === "imageGeneration"
              ? {
                  ...stage,
                  status: "processing",
                  detail: `批量生成中：已完成 ${successCount + failedCount}/${totalAssets} 项，失败 ${failedCount} 项`,
                  providerLabel: "gpt-image-2",
                }
              : stage,
          ),
        }));
      }
    }

    for (const cover of workspace.covers.filter((item) => enabledCoverKeys.includes(item.key))) {
      const request = buildCoverRequest(workspace, cover.key);
      if (!request) continue;

      try {
        const result = await generateCoverImage(request);
        successCount += 1;
        setWorkspace((prev) => ({
          ...prev,
          covers: prev.covers.map((item) =>
            item.key === cover.key
              ? {
                  ...item,
                  img: result.imageUrl,
                  state: "ok",
                  isStale: false,
                  provider: result.provider,
                  imagePrompt: result.prompt,
                  imageGenerationMode: result.generationMode,
                  status: "已生成 · AI",
                }
              : item,
          ),
          workflowStages: prev.workflowStages.map((stage) =>
            stage.key === "imageGeneration"
              ? {
                  ...stage,
                  status: "processing",
                  detail: `批量生成中：已完成 ${successCount + failedCount}/${totalAssets} 项`,
                  providerLabel: "gpt-image-2",
                }
              : stage,
          ),
        }));
      } catch {
        failedCount += 1;
        setWorkspace((prev) => ({
          ...prev,
          covers: prev.covers.map((item) =>
            item.key === cover.key ? { ...item, state: "failed", status: "生成失败" } : item,
          ),
          workflowStages: prev.workflowStages.map((stage) =>
            stage.key === "imageGeneration"
              ? {
                  ...stage,
                  status: "processing",
                  detail: `批量生成中：已完成 ${successCount + failedCount}/${totalAssets} 项，失败 ${failedCount} 项`,
                  providerLabel: "gpt-image-2",
                }
              : stage,
          ),
        }));
      }
    }

    const generatedAt = formatNowTime();

    setWorkspace((prev) => {
      const nextWorkspace = withFreshDraftReview({
        ...prev,
        generation: updateGenerationTimestamp(prev, generatedAt),
      });

      return {
        ...nextWorkspace,
        workflowStages: markDraftSyncPending(
          {
            ...nextWorkspace,
            workflowStages: nextWorkspace.workflowStages.map((stage) =>
              stage.key === "imageGeneration"
                ? failedCount === 0
                  ? {
                      ...stage,
                      status: "success",
                      detail: `已完成 ${successCount} 项视觉素材生成`,
                      providerLabel: "gpt-image-2",
                      retryable: false,
                    }
                  : {
                      ...stage,
                      status: "failed",
                      detail: `已生成 ${successCount} 项，失败 ${failedCount} 项，可局部重试`,
                      providerLabel: "gpt-image-2",
                      retryable: true,
                    }
                : stage,
            ),
          },
          "图片已更新，如需入库请重新同步草稿",
        ),
      };
    });
  }

  async function regenerateCoverAsset(coverKey: "wechatCover" | "wechatShareCover" | "xiaohongshuCover") {
    if (!isOutputEnabled(workspace, coverKey)) return;

    const request = buildCoverRequest(workspace, coverKey);
    if (!request) return;

    setWorkspace((prev) => ({
      ...prev,
      covers: prev.covers.map((item) =>
        item.key === coverKey ? { ...item, state: "processing", status: "生成中" } : item,
      ),
      workflowStages: prev.workflowStages.map((stage) =>
        stage.key === "imageGeneration"
          ? { ...stage, status: "processing", detail: `正在生成${request.label}…`, providerLabel: "gpt-image-2" }
          : stage,
      ),
    }));

    try {
      const result = await generateCoverImage(request);
      setWorkspace((prev) => {
        const nextWorkspace = withFreshDraftReview({
          ...prev,
          generation: updateGenerationTimestamp(prev, formatNowTime()),
          covers: prev.covers.map((item) =>
            item.key === coverKey
              ? {
                  ...item,
                  img: result.imageUrl,
                  state: "ok",
                  isStale: false,
                  provider: result.provider,
                  imagePrompt: result.prompt,
                  imageGenerationMode: result.generationMode,
                  status: "已生成 · AI",
                }
              : item,
          ),
        });

        return {
          ...nextWorkspace,
          workflowStages: markDraftSyncPending(
            {
              ...nextWorkspace,
              workflowStages: nextWorkspace.workflowStages.map((stage) =>
                stage.key === "imageGeneration"
                  ? { ...stage, status: "success", detail: `${request.label}已生成`, providerLabel: "gpt-image-2" }
                  : stage,
              ),
            },
            "封面已更新，如需入库请重新同步草稿",
          ),
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "封面生成失败";
      setWorkspace((prev) => ({
        ...prev,
        covers: prev.covers.map((item) =>
          item.key === coverKey ? { ...item, state: "failed", status: "生成失败" } : item,
        ),
        workflowStages: prev.workflowStages.map((stage) =>
          stage.key === "imageGeneration"
            ? { ...stage, status: "failed", detail: message, retryable: true, providerLabel: "gpt-image-2" }
            : stage,
        ),
      }));
    }
  }

  return {
    workspace,
    derived,
    textModeTitle,
    textModeBody,
    setTextModeTitle,
    setTextModeBody,
    importMarkdownFile,
    importPlainText,
    replanContent,
    regenerateCardImage,
    regenerateWechatInlineImageAsset,
    regenerateAllCardImages,
    regenerateCoverAsset,
    generateLayoutPreview,
    copyWechatHtml,
    copyFeedback,
    setOutputToggle: (key: "knowledgeCards" | "wechatCover" | "wechatShareCover" | "xiaohongshuCover", enabled: boolean) => {
      setWorkspace((prev) => ({
        ...prev,
        outputToggles: prev.outputToggles.map((item) =>
          item.key === key ? { ...item, enabled } : item,
        ),
      }));
    },
    setStyleSelection: (key: StyleSelectionKey, index: number) => {
      setWorkspace((prev) => {
        const baseWorkspace = {
          ...prev,
          styleSelections: {
            ...prev.styleSelections,
            [key]: index,
          },
        };

        if (key === "wechatLayout") {
          const nextWorkspace = withFreshDraftReview(baseWorkspace);
          return {
            ...nextWorkspace,
            workflowStages: markDraftSyncPending(
              {
                ...nextWorkspace,
                workflowStages: nextWorkspace.workflowStages.map((stage) =>
                  stage.key === "layoutGeneration"
                    ? {
                        ...stage,
                        status: "success",
                        detail: "公众号排版风格已更新",
                        providerLabel: "本地排版器",
                      }
                    : stage,
                ),
              },
              "排版风格已调整，可重新复制到公众号编辑器",
            ),
          };
        }

        const nextWorkspace = markAssetsStaleForStyle(baseWorkspace, key);

        return {
          ...nextWorkspace,
          workflowStages: markDraftSyncPending(nextWorkspace, "风格已调整，相关图片建议重新生成"),
        };
      });
    },
    setCardSize: (nextCardSize: WorkspaceData["cardSize"]) => {
      setWorkspace((prev) => {
        const nextWorkspace = markKnowledgeCardsStaleForSize(prev, nextCardSize);
        return {
          ...nextWorkspace,
          workflowStages: markDraftSyncPending(nextWorkspace, "卡片尺寸已调整，知识卡片建议重新生成"),
        };
      });
    },
    updateWechatLayoutTheme: (index: number, patch: Partial<WorkspaceData["layoutThemes"][number]>) => {
      setWorkspace((prev) => {
        const baseWorkspace = {
          ...prev,
          layoutThemes: prev.layoutThemes.map((theme, themeIndex) =>
            themeIndex === index ? { ...theme, ...patch } : theme,
          ),
        };
        const nextWorkspace = withFreshDraftReview(baseWorkspace);

        return {
          ...nextWorkspace,
          workflowStages: markDraftSyncPending(
            {
              ...nextWorkspace,
              workflowStages: nextWorkspace.workflowStages.map((stage) =>
                stage.key === "layoutGeneration"
                  ? {
                      ...stage,
                      status: "success",
                      detail: "公众号排版主题已更新",
                      providerLabel: "本地排版器",
                    }
                  : stage,
              ),
            },
            "排版主题已调整，可重新复制到公众号编辑器",
          ),
        };
      });
    },
    exportWechatLayoutTheme: async (index: number) => {
      const theme = workspace.layoutThemes[index];
      if (!theme) return;

      const slug = theme.name.replace(/\s+/g, "-").replace(/[^\w\u4e00-\u9fa5-]+/g, "").toLowerCase() || "wechat-layout-theme";
      const blob = new Blob([`${JSON.stringify(theme, null, 2)}\n`], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slug}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
    importWechatLayoutTheme: async (file: File) => {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const nextTheme = normalizeImportedLayoutTheme(parsed);

      setWorkspace((prev) => {
        const nextThemes = [...prev.layoutThemes, nextTheme];
        const nextWorkspace = withFreshDraftReview({
          ...prev,
          layoutThemes: nextThemes,
          styleSelections: {
            ...prev.styleSelections,
            wechatLayout: nextThemes.length - 1,
          },
        });

        return {
          ...nextWorkspace,
          workflowStages: markDraftSyncPending(
            {
              ...nextWorkspace,
              workflowStages: nextWorkspace.workflowStages.map((stage) =>
                stage.key === "layoutGeneration"
                  ? {
                      ...stage,
                      status: "success",
                      detail: `已导入排版主题：${nextTheme.name}`,
                      providerLabel: "本地排版器",
                    }
                  : stage,
              ),
            },
            "排版主题已导入，可重新复制到公众号编辑器",
          ),
        };
      });
    },
  };
}
