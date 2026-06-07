import { TopNav } from "./components/TopNav";
import { LeftPanel } from "./components/LeftPanel";
import { CenterPanel } from "./components/CenterPanel";
import { RightPanel } from "./components/RightPanel";
import { useWorkspaceLayout } from "./hooks/useWorkspaceLayout";
import { useWorkspaceDocument } from "./hooks/useWorkspaceDocument";
import { Button } from "./components/ui/button";
import { PanelLeft, FileText } from "lucide-react";

export default function App() {
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
  } = useWorkspaceDocument();

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
