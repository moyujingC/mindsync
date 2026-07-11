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
        handleInsertKnowledgeCardIntoArticle={controller.handleInsertKnowledgeCardIntoArticle}
      />

      <ControlTowerSidebar
        currentArticleTitle={currentArticle.title}
        taskState={controller.taskState}
        statusState={controller.statusState}
        outputSummaries={controller.controlTowerOutputs}
        latestGenerationTime={controller.latestGenerationTime}
        latestLogText={controller.latestLogText}
      />

      <WorkbenchEditorDialog
        editingCardIndex={controller.editingCardIndex}
        closeKnowledgeCardEditor={controller.closeKnowledgeCardEditor}
        editingCardTitle={controller.editingCardTitle}
        setEditingCardTitle={controller.setEditingCardTitle}
        editingCardSummary={controller.editingCardSummary}
        setEditingCardSummary={controller.setEditingCardSummary}
        editingCardPrompt={controller.editingCardPrompt}
        setEditingCardPrompt={controller.setEditingCardPrompt}
        saveKnowledgeCardDraft={controller.saveKnowledgeCardDraft}
        handleEditAndRegenerateKnowledgeCard={controller.handleEditAndRegenerateKnowledgeCard}
      />
    </div>
  );
}
