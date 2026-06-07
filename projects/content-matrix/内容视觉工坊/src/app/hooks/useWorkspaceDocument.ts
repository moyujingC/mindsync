import { useMemo, useState } from "react";
import { workspaceData as initialWorkspaceData } from "../mockData";
import { parseMarkdownFileContent } from "../lib/markdown";
import { planCards } from "../lib/planCards";
import { generateCardImage } from "../lib/generateCardImage";
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

export function useWorkspaceDocument() {
  const [workspace, setWorkspace] = useState<WorkspaceData>(initialWorkspaceData);
  const [rawMarkdownText, setRawMarkdownText] = useState<string>("");

  const derived = useMemo(() => {
    return {
      hasUploadedMarkdown: workspace.article.fileName.length > 0,
      rawMarkdownText,
    };
  }, [workspace, rawMarkdownText]);

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

    setWorkspace((prev) => ({
      ...prev,
      article: parsed.article,
      parsedMarkdown: parsed.parsedMarkdown,
      analysis: planned.analysis,
      cardPlan: planned.cardPlan,
      workflowStages: prev.workflowStages.map((stage) => {
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
        return stage;
      }),
    }));
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
        workflowStages: prev.workflowStages.map((stage) =>
          stage.key === "imageGeneration"
            ? { ...stage, status: "success", detail: `卡片 ${cardNumber} 图片已生成`, providerLabel: "gpt-image-2" }
            : stage,
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
    const cards = workspace.knowledgeCards;
    if (cards.length === 0) return;

    setWorkspace((prev) => ({
      ...prev,
      knowledgeCards: prev.knowledgeCards.map((item) => ({ ...item, state: "processing" })),
      workflowStages: prev.workflowStages.map((stage) =>
        stage.key === "imageGeneration"
          ? {
              ...stage,
              status: "processing",
              detail: `正在批量生成 ${prev.knowledgeCards.length} 张卡片图片…`,
              providerLabel: "gpt-image-2",
              retryable: false,
            }
          : stage,
      ),
    }));

    let successCount = 0;
    let failedCount = 0;

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
                  detail: `批量生成中：已完成 ${successCount}/${cards.length} 张`,
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
                  detail: `批量生成中：已完成 ${successCount + failedCount}/${cards.length} 张，失败 ${failedCount} 张`,
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
      workflowStages: prev.workflowStages.map((stage) =>
        stage.key === "imageGeneration"
          ? failedCount === 0
            ? {
                ...stage,
                status: "success",
                detail: `已完成 ${successCount} 张卡片图片生成`,
                providerLabel: "gpt-image-2",
                retryable: false,
              }
            : {
                ...stage,
                status: "failed",
                detail: `已生成 ${successCount} 张，失败 ${failedCount} 张，可局部重试`,
                providerLabel: "gpt-image-2",
                retryable: true,
              }
          : stage,
      ),
    }));
  }

  return {
    workspace,
    derived,
    importMarkdownFile,
    regenerateCardImage,
    regenerateAllCardImages,
  };
}
