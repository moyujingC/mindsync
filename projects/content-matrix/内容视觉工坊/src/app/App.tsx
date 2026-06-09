import { TopNav } from "./components/TopNav";
import { LeftPanel } from "./components/LeftPanel";
import { CenterPanel } from "./components/CenterPanel";
import { RightPanel } from "./components/RightPanel";
import { useWorkspaceLayout } from "./hooks/useWorkspaceLayout";
import { useWorkspaceDocument } from "./hooks/useWorkspaceDocument";
import { Button } from "./components/ui/button";
import { PanelLeft, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { loadLatestWechatEditorImport, parseWechatEditorPastePayload, saveWechatEditorImport } from "./lib/wechatEditorImport";
import type { SavedWechatEditorImport, WechatEditorImportSummary } from "./types";

export default function App() {
  const [wechatEditorImportSummary, setLocalWechatEditorImportSummary] = useState<WechatEditorImportSummary | null>(null);
  const [savedWechatEditorImport, setSavedWechatEditorImport] = useState<SavedWechatEditorImport | null>(null);
  const { layout, isTablet, setInputMode, toggleLeftPanel, toggleRightPanel, closePanels } = useWorkspaceLayout();
  const {
    workspace,
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
    setOutputToggle,
    setStyleSelection,
    setCardSize,
    updateWechatLayoutTheme,
    exportWechatLayoutTheme,
    importWechatLayoutTheme,
    setWechatEditorImportSummary: syncWechatEditorImportSummary,
    setMarkdownHeadingMode,
  } = useWorkspaceDocument();

  function importWechatEditorClipboard(payload: { html: string; plainText: string }) {
    const summary = parseWechatEditorPastePayload(payload.html, payload.plainText);
    setLocalWechatEditorImportSummary(summary);
    syncWechatEditorImportSummary(summary);
    setSavedWechatEditorImport(null);
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrapLatestWechatEditorImport() {
      try {
        const summary = await loadLatestWechatEditorImport();
        if (!summary || cancelled) return;
        setLocalWechatEditorImportSummary(summary);
        syncWechatEditorImportSummary(summary);
      } catch (error) {
        console.warn("[wechat-editor-import] bootstrap failed", error);
      }
    }

    void bootstrapLatestWechatEditorImport();

    return () => {
      cancelled = true;
    };
  }, [syncWechatEditorImportSummary]);

  async function handleSaveWechatEditorImport() {
    if (!wechatEditorImportSummary) return;
    const saved = await saveWechatEditorImport({
      title: workspace.article.title || "wechat-editor-import",
      html: wechatEditorImportSummary.html,
      plainText: wechatEditorImportSummary.plainText,
      summary: wechatEditorImportSummary,
    });
    setSavedWechatEditorImport(saved);
  }

  return (
    <div className="size-full flex flex-col bg-background text-foreground" style={{ fontFamily: "var(--font-sans-cn)" }}>
      <TopNav />
      <div className="flex-1 min-h-0 flex relative overflow-hidden">
        {isTablet && (
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            <Button
              variant="secondary"
              size="sm"
              className="pointer-events-auto shadow-sm"
              onClick={toggleLeftPanel}
            >
              <PanelLeft className="w-4 h-4" />
              输入与设置
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="pointer-events-auto shadow-sm"
              onClick={toggleRightPanel}
            >
              <FileText className="w-4 h-4" />
              审稿预览
            </Button>
          </div>
        )}

        <LeftPanel
          data={workspace}
          inputMode={layout.inputMode}
          textModeTitle={textModeTitle}
          textModeBody={textModeBody}
          setInputMode={setInputMode}
          onTextModeTitleChange={setTextModeTitle}
          onTextModeBodyChange={setTextModeBody}
          onImportPlainText={importPlainText}
          onImportMarkdown={importMarkdownFile}
          onGenerateAll={regenerateAllCardImages}
          onGenerateLayout={generateLayoutPreview}
          onSetOutputToggle={setOutputToggle}
          onSetStyleSelection={setStyleSelection}
          onSetCardSize={setCardSize}
          onUpdateWechatLayoutTheme={updateWechatLayoutTheme}
          onExportWechatLayoutTheme={exportWechatLayoutTheme}
          onImportWechatLayoutTheme={importWechatLayoutTheme}
          onSetMarkdownHeadingMode={setMarkdownHeadingMode}
          onImportWechatEditorClipboard={importWechatEditorClipboard}
          wechatEditorImportSummary={wechatEditorImportSummary}
          savedWechatEditorImport={savedWechatEditorImport}
          onSaveWechatEditorImport={handleSaveWechatEditorImport}
          isTablet={isTablet}
          isOpen={layout.isLeftPanelOpen}
          onClose={closePanels}
        />
        <CenterPanel
          data={workspace}
          inputMode={layout.inputMode}
          onReplanContent={replanContent}
          onRegenerateCardImage={regenerateCardImage}
          onRegenerateInlineImage={regenerateWechatInlineImageAsset}
          onRegenerateAllCardImages={regenerateAllCardImages}
          onRegenerateCoverAsset={regenerateCoverAsset}
        />
        <RightPanel
          data={workspace}
          inputMode={layout.inputMode}
          copyFeedback={copyFeedback}
          onCopyWechatHtml={copyWechatHtml}
          isTablet={isTablet}
          isOpen={layout.isRightPanelOpen}
          onClose={closePanels}
        />
      </div>
    </div>
  );
}
