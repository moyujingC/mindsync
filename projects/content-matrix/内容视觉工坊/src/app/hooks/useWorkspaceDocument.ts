import { useMemo, useState } from "react";
import { workspaceData as initialWorkspaceData } from "../mockData";
import { parseMarkdownFileContent } from "../lib/markdown";
import { planKnowledgeCardsFromArticle } from "../lib/cardPlanning";
import type { WorkspaceData } from "../types";

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
    const planned = planKnowledgeCardsFromArticle(text);

    setRawMarkdownText(text);
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
          };
        }
        return stage;
      }),
    }));
  }

  return {
    workspace,
    derived,
    importMarkdownFile,
  };
}
