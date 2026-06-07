import { useMemo, useState } from "react";
import { workspaceData as initialWorkspaceData } from "../mockData";
import { parseMarkdownFileContent } from "../lib/markdown";
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

    setRawMarkdownText(text);
    setWorkspace((prev) => ({
      ...prev,
      article: parsed.article,
      parsedMarkdown: parsed.parsedMarkdown,
    }));
  }

  return {
    workspace,
    derived,
    importMarkdownFile,
  };
}
