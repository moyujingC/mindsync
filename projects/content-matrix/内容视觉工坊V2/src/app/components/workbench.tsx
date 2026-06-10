import { useState } from "react";
import { useWorkspace } from "../workspace";
import { ControlTowerSidebar } from "./workbench-panels";
import {
  WorkbenchCenterSection,
  WorkbenchEditorDialog,
  WorkbenchLeftSidebar,
} from "./workbench-sections";
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
    clearGenerationRecords,
    planningState,
    savePlanningState,
    clearPlanningState,
    workbenchState,
    setWorkbenchState,
  } = useWorkspace();

  const [inputMode, setInputMode] = useState<"upload" | "paste">("paste");
  const [openCovers, setOpenCovers] = useState(false);
  const [openIllus, setOpenIllus] = useState(false);
  const [openQuotes, setOpenQuotes] = useState(false);

  const controller = useWorkbenchController({
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
  });

  return (
    <div className="grid grid-cols-[332px_1fr_300px] h-full overflow-hidden">
      <WorkbenchLeftSidebar
        inputMode={inputMode}
        setInputMode={setInputMode}
        currentArticle={currentArticle}
        setCurrentArticle={setCurrentArticle}
        currentArticleMeta={currentArticleMeta}
        outputs={controller.outputs}
        toggleOutput={controller.toggleOutput}
        splitStrategy={controller.splitStrategy}
        setSplitStrategy={controller.setSplitStrategy}
        minCards={controller.minCards}
        setMinCards={controller.setMinCards}
        maxCards={controller.maxCards}
        setMaxCards={controller.setMaxCards}
        handleStartGeneration={controller.handleStartGeneration}
        isGenerating={controller.isGenerating}
        estimatedCredits={controller.estimatedCredits}
        statusState={controller.statusState}
        importedMarkdownMeta={controller.importedMarkdownMeta}
        handleImportMarkdown={controller.handleImportMarkdown}
        handleReplan={controller.handleReplan}
        setActiveTab={setActiveTab}
      />

      <WorkbenchCenterSection
        currentArticle={currentArticle}
        currentArticleMeta={currentArticleMeta}
        plannedCards={controller.plannedCards}
        plannedQuotes={controller.plannedQuotes}
        selectedQuotes={controller.selectedQuotes}
        toggleQuote={controller.toggleQuote}
        openQuotes={openQuotes}
        setOpenQuotes={setOpenQuotes}
        openCovers={openCovers}
        setOpenCovers={setOpenCovers}
        openIllus={openIllus}
        setOpenIllus={setOpenIllus}
        handleReplan={controller.handleReplan}
        latestGeneration={latestGeneration}
        knowledgePreset={controller.knowledgePreset}
        knowledgeImagesByCard={controller.knowledgeImagesByCard}
        lockedKnowledgeCardIndexes={controller.lockedKnowledgeCardIndexes}
        knowledgeCardStatuses={controller.knowledgeCardStatuses}
        knowledgeCardHistories={controller.knowledgeCardHistories}
        regeneratingCardIndex={controller.regeneratingCardIndex}
        replaceCardInputRef={controller.replaceCardInputRef}
        handleKnowledgeCardFileChange={controller.handleKnowledgeCardFileChange}
        toggleKnowledgeCardLock={controller.toggleKnowledgeCardLock}
        handleFinalizeKnowledgeCard={controller.handleFinalizeKnowledgeCard}
        openKnowledgeCardEditor={controller.openKnowledgeCardEditor}
        handleRegenerateKnowledgeCard={controller.handleRegenerateKnowledgeCard}
        handleReplaceKnowledgeCardClick={controller.handleReplaceKnowledgeCardClick}
        handleRollbackKnowledgeCard={controller.handleRollbackKnowledgeCard}
        quotePreset={controller.quotePreset}
        quoteGeneration={controller.quoteGeneration}
        quoteGenerationSelection={controller.quoteGenerationSelection}
        replanRevision={controller.replanRevision}
        handleGenerateQuoteCard={controller.handleGenerateQuoteCard}
        coverPreset={controller.coverPreset}
        coverGeneration={controller.coverGeneration}
        coverSelection={controller.coverSelection}
        handleSelectCover={controller.handleSelectCover}
        handleFinalizeCover={controller.handleFinalizeCover}
        inlinePreset={controller.inlinePreset}
        plannedInlineImages={controller.plannedInlineImages}
        inlineGeneration={controller.inlineGeneration}
      />

      <ControlTowerSidebar
        currentArticleTitle={currentArticle.title}
        taskState={controller.taskState}
        statusState={controller.statusState}
        outputSummaries={controller.controlTowerOutputs}
        latestGenerationTime={controller.latestGenerationTime}
        latestLogText={controller.latestLogText}
        onOpenWechat={() => setActiveTab("wechat")}
      />

      <WorkbenchEditorDialog
        editingCardIndex={controller.editingCardIndex}
        closeKnowledgeCardEditor={controller.closeKnowledgeCardEditor}
        editingCardTitle={controller.editingCardTitle}
        setEditingCardTitle={controller.setEditingCardTitle}
        editingCardSummary={controller.editingCardSummary}
        setEditingCardSummary={controller.setEditingCardSummary}
        saveKnowledgeCardDraft={controller.saveKnowledgeCardDraft}
        handleEditAndRegenerateKnowledgeCard={controller.handleEditAndRegenerateKnowledgeCard}
      />
    </div>
  );
}
