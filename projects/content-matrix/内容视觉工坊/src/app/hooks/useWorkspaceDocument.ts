import { useMemo, useState } from "react";
import { workspaceData as initialWorkspaceData } from "../mockData";
import { parseMarkdownFileContent } from "../lib/markdown";
import { planCards } from "../lib/planCards";
import { generateCardImage } from "../lib/generateCardImage";
import { generateCoverImage } from "../lib/generateCoverImage";
import { generateWechatInlineImage } from "../lib/generateWechatInlineImage";
import { buildDraftReview, buildWechatInlineImages } from "../lib/layoutGeneration";
import type { WorkspaceData } from "../types";

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

function buildCoverRequest(workspace: WorkspaceData, coverKey: "wechatCover" | "xiaohongshuCover") {
  const cover = workspace.covers.find((item) => item.key === coverKey);
  if (!cover) return null;

  return {
    label: cover.label,
    articleTitle: workspace.article.title,
    coverThemeTitle: workspace.analysis.coverTheme.title,
    coverThemeKeywords: workspace.analysis.coverTheme.keywords,
    styleName: workspace.styleAssets[workspace.activeStyleIndex]?.name ?? "默认风格",
    ratio: cover.ratio,
  };
}

function isOutputEnabled(workspace: WorkspaceData, key: "knowledgeCards" | "wechatCover" | "xiaohongshuCover") {
  return workspace.outputToggles.find((item) => item.key === key)?.enabled ?? false;
}

function buildWechatInlineImageRequest(workspace: WorkspaceData, imageId: string) {
  const image = workspace.wechatInlineImages.find((item) => item.id === imageId);
  if (!image) return null;

  return {
    articleTheme: workspace.analysis.coverTheme.title,
    sectionType: image.sectionType,
    sectionTheme: image.sectionTheme,
    sectionKeywords: image.sectionKeywords,
    sectionSummary: image.sectionSummary,
    sectionQuote: image.sectionQuote,
    visualDirection: image.visualDirection,
    styleName: workspace.styleAssets[workspace.activeStyleIndex]?.name ?? "默认风格",
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

export function useWorkspaceDocument() {
  const [workspace, setWorkspace] = useState<WorkspaceData>(initialWorkspaceData);
  const [rawMarkdownText, setRawMarkdownText] = useState<string>("");
  const [copyFeedback, setCopyFeedback] = useState<string>("");

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

    await navigator.clipboard.writeText(html);
    setCopyFeedback("已复制 HTML，可直接粘贴到公众号编辑器");

    setWorkspace((prev) => ({
      ...prev,
      workflowStages: prev.workflowStages.map((stage) =>
        stage.key === "draftSync"
          ? { ...stage, status: "success", detail: "公众号 HTML 已复制到剪贴板", providerLabel: "手动粘贴" }
          : stage,
      ),
      draftReview: {
        ...prev.draftReview,
        syncStatus: prev.draftReview.syncStatus.map((row) =>
          row.label === "正文复制"
            ? { ...row, note: "HTML 已复制，可直接粘贴到公众号编辑器" }
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
      styleName: initialWorkspaceData.styleAssets[initialWorkspaceData.activeStyleIndex]?.name ?? "默认风格",
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
      wechatInlineImages: buildWechatInlineImages({
        ...workspace,
        article: parsed.article,
        parsedMarkdown: parsed.parsedMarkdown,
        analysis: planned.analysis,
        cardPlan: planned.cardPlan,
      } as WorkspaceData),
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
      const result = await generateCardImage({
        title: card.title,
        summary: card.summary,
        styleName: workspace.styleAssets[workspace.activeStyleIndex]?.name ?? "默认风格",
        ratio: workspace.cardSize.ratio,
        width: workspace.cardSize.width,
        height: workspace.cardSize.height,
      });

      setWorkspace((prev) => ({
        ...prev,
        generation: updateGenerationTimestamp(prev, formatNowTime()),
        knowledgeCards: prev.knowledgeCards.map((item) =>
          item.n === cardNumber
            ? { ...item, img: result.imageUrl, state: "ok", provider: result.provider, imagePrompt: result.prompt }
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
        const result = await generateCardImage({
          title: card.title,
          summary: card.summary,
          styleName: workspace.styleAssets[workspace.activeStyleIndex]?.name ?? "默认风格",
          ratio: workspace.cardSize.ratio,
          width: workspace.cardSize.width,
          height: workspace.cardSize.height,
        });

        successCount += 1;
        setWorkspace((prev) => ({
          ...prev,
          knowledgeCards: prev.knowledgeCards.map((item) =>
            item.n === card.n
              ? { ...item, img: result.imageUrl, state: "ok", provider: result.provider, imagePrompt: result.prompt }
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
              ? { ...item, img: result.imageUrl, state: "ok", provider: result.provider, imagePrompt: result.prompt }
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
                  provider: result.provider,
                  imagePrompt: result.prompt,
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

    setWorkspace((prev) => ({
      ...prev,
      generation: updateGenerationTimestamp(prev, generatedAt),
      workflowStages: markDraftSyncPending(
        {
          ...prev,
          workflowStages: prev.workflowStages.map((stage) =>
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
    }));
  }

  async function regenerateCoverAsset(coverKey: "wechatCover" | "xiaohongshuCover") {
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
      setWorkspace((prev) => ({
        ...prev,
        generation: updateGenerationTimestamp(prev, formatNowTime()),
        covers: prev.covers.map((item) =>
          item.key === coverKey
            ? {
                ...item,
                img: result.imageUrl,
                state: "ok",
                provider: result.provider,
                imagePrompt: result.prompt,
                status: "已生成 · AI",
              }
            : item,
        ),
        workflowStages: markDraftSyncPending(
          {
            ...prev,
            workflowStages: prev.workflowStages.map((stage) =>
              stage.key === "imageGeneration"
                ? { ...stage, status: "success", detail: `${request.label}已生成`, providerLabel: "gpt-image-2" }
                : stage,
            ),
          },
          "封面已更新，如需入库请重新同步草稿",
        ),
      }));
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
    importMarkdownFile,
    regenerateCardImage,
    regenerateAllCardImages,
    regenerateCoverAsset,
    generateLayoutPreview,
    copyWechatHtml,
    copyFeedback,
    setOutputToggle: (key: "knowledgeCards" | "wechatCover" | "xiaohongshuCover", enabled: boolean) => {
      setWorkspace((prev) => ({
        ...prev,
        outputToggles: prev.outputToggles.map((item) =>
          item.key === key ? { ...item, enabled } : item,
        ),
      }));
    },
  };
}
