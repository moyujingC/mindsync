import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type {
  CardPlan,
  InlineImagePlan,
  PlannerResponse,
} from "./content-planning";

export type ArticleBlock =
  | { type: "eyebrow"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "section"; title: string; body: string }
  | { type: "note"; text: string }
  | { type: "image"; label: string; sectionKey?: string; imageUrl?: string };

export type WorkspaceArticle = {
  title: string;
  body: string;
};

export type GeneratedImageItem = {
  id: string;
  imageUrl: string;
  prompt: string;
  width: number;
  height: number;
  inlineLink?: {
    index?: number;
    sectionKey: string;
    sectionHeading: string;
    sectionSummary: string;
  };
  cardLink?: {
    index: number;
    title: string;
    summary: string;
  };
  coverLink?: {
    index: number;
    title: string;
    variant?: "large" | "thumb";
  };
};

export type GenerationPurposeKey =
  | "xhs_card"
  | "quote"
  | "wx_cover"
  | "wx_inline"
  | "xhs_full";

export type WorkbenchTaskPhase =
  | "idle"
  | "planning"
  | "generating"
  | "completed"
  | "failed";

export type WorkbenchStatusLevel = "info" | "success" | "error";

export type WorkbenchStatusMessage = {
  scope: string;
  level: WorkbenchStatusLevel;
  text: string;
  timestamp: string;
};

export type WorkbenchTaskState = {
  phase: WorkbenchTaskPhase;
  currentStepLabel: string;
  completedTasks: number;
  totalTasks: number;
  lastError: WorkbenchStatusMessage | null;
  statusMessage: WorkbenchStatusMessage | null;
};

export type WorkbenchQuoteGenerationSelection = {
  selectedQuoteIndexes: number[];
  selectedQuoteTexts: string[];
  generatedAtPlanningRevision: number;
};

export type WorkbenchImportedMarkdownMeta = {
  fileName: string;
  wordCount: number;
  importedAt: string;
};

export type WorkbenchCoverSelection = {
  selectedCoverIndex: number;
  finalizedCoverIndex?: number | null;
  updatedAt: string;
};

export type WorkbenchCoverThumbMode = "crop" | "separate";

export type GenerationRecord = {
  id: string;
  source: "general-image";
  title: string;
  purposeKey: GenerationPurposeKey;
  purposeLabel: string;
  presetLabel: string;
  styleName: string;
  images: GeneratedImageItem[];
  createdAt: string;
};

export type WorkspaceTab = "workbench" | "wechat" | "assets" | "image" | "sync";
export type WechatPreviewMode = "sample" | "article";

export type PlanningState = {
  provider: PlannerResponse["provider"];
  articleSignature: string;
  cardPlan: CardPlan[];
  candidateQuotes: string[];
  inlineImagePlan: InlineImagePlan[];
  coverTheme: PlannerResponse["analysis"]["coverTheme"];
  strategySummary: string;
  updatedAt: string;
};

export type WorkbenchState = {
  lockedKnowledgeCardIndexes: number[];
  knowledgeCardStatuses: Record<
    string,
    {
      edited?: boolean;
      replaced?: boolean;
      regenerated?: boolean;
      needsRegeneration?: boolean;
      finalized?: boolean;
      updatedAt: string;
    }
  >;
  knowledgeCardHistories: Record<
    string,
    Array<{
      imageUrl: string;
      prompt: string;
      title: string;
      summary: string;
      source: "generated" | "replaced" | "rollback";
      createdAt: string;
    }>
  >;
  taskState: WorkbenchTaskState;
  quoteGenerationSelection: WorkbenchQuoteGenerationSelection | null;
  coverSelection: WorkbenchCoverSelection | null;
  coverThumbMode: WorkbenchCoverThumbMode;
  importedMarkdownMeta: WorkbenchImportedMarkdownMeta | null;
  replanRevision: number;
};

type WorkspaceContextValue = {
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
  wechatPreviewMode: WechatPreviewMode;
  setWechatPreviewMode: (mode: WechatPreviewMode) => void;
  currentArticle: WorkspaceArticle;
  setCurrentArticle: (next: WorkspaceArticle) => void;
  currentArticleBlocks: ArticleBlock[];
  currentArticleMeta: string;
  generationRecords: GenerationRecord[];
  latestGeneration: GenerationRecord | null;
  saveGenerationRecord: (record: GenerationRecord) => void;
  clearGenerationRecords: (purposeKeys?: GenerationPurposeKey[]) => void;
  planningState: PlanningState | null;
  savePlanningState: (planning: PlanningState) => void;
  clearPlanningState: () => void;
  workbenchState: WorkbenchState;
  setWorkbenchState: Dispatch<SetStateAction<WorkbenchState>>;
};

const DEFAULT_ARTICLE: WorkspaceArticle = {
  title: "专注不是用力，而是放弃",
  body: `写在前面

当我们谈论"专注"，常常先入为主地想到压抑、克制、剥夺。但真正的专注不是用力，而是放弃。放弃那些看起来很重要、其实并不属于这一刻的事。

> 真正的专注，不是用力，而是放弃。

提示：如果你正在被碎片化拖着走，这篇文章更适合慢一点看。

一、为什么注意力会碎片化

我们以为是任务在抢夺注意力，其实是切换。每一次切换都需要重新加载上下文，而这种成本很难被察觉。它不像加班一样显眼，但会在一天结束时让人感到疲惫，却说不出做了什么。

二、专注的真正成本

真正的专注从来不是用力，而是放弃。放弃那些看起来很重要、其实并不属于这一刻的事。专注的成本，从来不在“开始”，而在“拒绝”。

图：正文配图占位 · 蓝雾静读

三、把专注当作长期能力

长期的专注需要节律，而不是冲刺。它需要被设计——环境、时段、恢复，缺一不可。当我们把它当作能力来培养，而不是当作一次决心，它才能真正稳定下来。`,
};

const STORAGE_KEYS = {
  article: "content-visual-studio.current-article.v1",
  activeTab: "content-visual-studio.active-tab.v1",
  wechatPreviewMode: "content-visual-studio.wechat-preview-mode.v1",
  generationRecords: "content-visual-studio.generation-records.v1",
  planningState: "content-visual-studio.planning-state.v1",
  workbenchState: "content-visual-studio.workbench-state.v1",
} as const;

const DEFAULT_WORKBENCH_STATE: WorkbenchState = {
  lockedKnowledgeCardIndexes: [],
  knowledgeCardStatuses: {},
  knowledgeCardHistories: {},
  taskState: {
    phase: "idle",
    currentStepLabel: "",
    completedTasks: 0,
    totalTasks: 0,
    lastError: null,
    statusMessage: null,
  },
  quoteGenerationSelection: null,
  coverSelection: null,
  coverThumbMode: "crop",
  importedMarkdownMeta: null,
  replanRevision: 0,
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() =>
    normalizeWorkspaceTab(readStoredJson(STORAGE_KEYS.activeTab, "workbench"))
  );
  const [wechatPreviewMode, setWechatPreviewMode] = useState<WechatPreviewMode>(() =>
    normalizeWechatPreviewMode(readStoredJson(STORAGE_KEYS.wechatPreviewMode, "article"))
  );
  const [currentArticle, setCurrentArticle] = useState<WorkspaceArticle>(() =>
    readStoredJson(STORAGE_KEYS.article, DEFAULT_ARTICLE)
  );
  const [generationRecords, setGenerationRecords] = useState<GenerationRecord[]>(() =>
    readStoredJson(STORAGE_KEYS.generationRecords, [])
  );
  const [planningState, setPlanningState] = useState<PlanningState | null>(() =>
    readStoredJson(STORAGE_KEYS.planningState, null)
  );
  const [workbenchState, setWorkbenchState] = useState<WorkbenchState>(() =>
    normalizeWorkbenchState(readStoredJson(STORAGE_KEYS.workbenchState, DEFAULT_WORKBENCH_STATE))
  );

  const currentArticleBlocks = useMemo(
    () => buildArticleBlocks(currentArticle.body),
    [currentArticle.body]
  );
  const currentArticleMeta = useMemo(
    () => buildArticleMeta(currentArticle.body),
    [currentArticle.body]
  );
  const latestGeneration = generationRecords[0] ?? null;

  function saveGenerationRecord(record: GenerationRecord) {
    setGenerationRecords((prev) => {
      const next = [record, ...prev.filter((item) => item.purposeKey !== record.purposeKey)];
      return next.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
  }

  function clearGenerationRecords(purposeKeys?: GenerationPurposeKey[]) {
    setGenerationRecords((prev) => {
      if (!purposeKeys || purposeKeys.length === 0) {
        return [];
      }
      return prev.filter((item) => !purposeKeys.includes(item.purposeKey));
    });
  }

  function savePlanningState(planning: PlanningState) {
    setPlanningState(planning);
  }

  function clearPlanningState() {
    setPlanningState(null);
  }

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      wechatPreviewMode,
      setWechatPreviewMode,
      currentArticle,
      setCurrentArticle,
      currentArticleBlocks,
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
    }),
    [
      activeTab,
      wechatPreviewMode,
      currentArticle,
      currentArticleBlocks,
      currentArticleMeta,
      generationRecords,
      latestGeneration,
      clearGenerationRecords,
      planningState,
      workbenchState,
    ]
  );

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.activeTab, JSON.stringify(activeTab));
  }, [activeTab]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.wechatPreviewMode, JSON.stringify(wechatPreviewMode));
  }, [wechatPreviewMode]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.article, JSON.stringify(currentArticle));
  }, [currentArticle]);

  useEffect(() => {
    if (generationRecords.length === 0) {
      window.localStorage.removeItem(STORAGE_KEYS.generationRecords);
      return;
    }
    window.localStorage.setItem(
      STORAGE_KEYS.generationRecords,
      JSON.stringify(generationRecords)
    );
  }, [generationRecords]);

  useEffect(() => {
    if (!planningState) {
      window.localStorage.removeItem(STORAGE_KEYS.planningState);
      return;
    }
    window.localStorage.setItem(STORAGE_KEYS.planningState, JSON.stringify(planningState));
  }, [planningState]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.workbenchState, JSON.stringify(workbenchState));
  }, [workbenchState]);

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}

function normalizeWorkbenchState(input: unknown): WorkbenchState {
  const value = (input && typeof input === "object" ? input : {}) as Partial<WorkbenchState>;
  const taskState = value.taskState ?? DEFAULT_WORKBENCH_STATE.taskState;
  return {
    lockedKnowledgeCardIndexes: Array.isArray(value.lockedKnowledgeCardIndexes)
      ? value.lockedKnowledgeCardIndexes
      : [],
    knowledgeCardStatuses:
      value.knowledgeCardStatuses && typeof value.knowledgeCardStatuses === "object"
        ? value.knowledgeCardStatuses
        : {},
    knowledgeCardHistories:
      value.knowledgeCardHistories && typeof value.knowledgeCardHistories === "object"
        ? value.knowledgeCardHistories
        : {},
    taskState: {
      phase: taskState.phase ?? "idle",
      currentStepLabel: taskState.currentStepLabel ?? "",
      completedTasks: taskState.completedTasks ?? 0,
      totalTasks: taskState.totalTasks ?? 0,
      lastError: taskState.lastError ?? null,
      statusMessage: taskState.statusMessage ?? null,
    },
    quoteGenerationSelection: value.quoteGenerationSelection ?? null,
    coverSelection: value.coverSelection ?? null,
    coverThumbMode: value.coverThumbMode === "separate" ? "separate" : "crop",
    importedMarkdownMeta: value.importedMarkdownMeta ?? null,
    replanRevision: value.replanRevision ?? 0,
  };
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return value;
}

export function createGenerationId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`;
}

function readStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeWorkspaceTab(value: unknown): WorkspaceTab {
  if (
    value === "workbench" ||
    value === "wechat" ||
    value === "assets" ||
    value === "image" ||
    value === "sync"
  ) {
    return value;
  }
  return "workbench";
}

function normalizeWechatPreviewMode(value: unknown): WechatPreviewMode {
  return value === "sample" || value === "article" ? value : "article";
}

function buildArticleMeta(body: string) {
  const charCount = body.replace(/\s+/g, "").length;
  const paragraphCount = body
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean).length;
  return `${charCount} 字 · ${paragraphCount} 段`;
}

function buildArticleBlocks(body: string): ArticleBlock[] {
  const chunks = body
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  const blocks: ArticleBlock[] = [];
  let lastSectionKey: string | undefined;

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];

    if (/^(写在前面|前言|导读)$/u.test(chunk)) {
      blocks.push({ type: "eyebrow", text: chunk });
      continue;
    }

    if (/^>\s*/.test(chunk)) {
      blocks.push({ type: "quote", text: chunk.replace(/^>\s*/, "") });
      continue;
    }

    if (/^(提示|备注|Note)[:：]/i.test(chunk)) {
      blocks.push({ type: "note", text: chunk.replace(/^(提示|备注|Note)[:：]\s*/i, "") });
      continue;
    }

    if (/^(图|图片)[:：]/.test(chunk)) {
      blocks.push({
        type: "image",
        label: chunk.replace(/^(图|图片)[:：]\s*/, ""),
        sectionKey: lastSectionKey,
      });
      continue;
    }

    const markdownImage = chunk.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (markdownImage) {
      blocks.push({
        type: "image",
        label: markdownImage[1].trim() || "公众号横图",
        imageUrl: markdownImage[2].trim(),
        sectionKey: lastSectionKey,
      });
      continue;
    }

    if (/^#{1,3}\s+/.test(chunk)) {
      const title = chunk.replace(/^#{1,3}\s+/, "");
      const next = chunks[index + 1];
      if (next && !looksLikeStandaloneBlock(next)) {
        lastSectionKey = toSectionKey(title);
        blocks.push({ type: "section", title, body: next });
        index += 1;
      } else {
        blocks.push({ type: "eyebrow", text: title });
      }
      continue;
    }

    if (/^([一二三四五六七八九十]+、|[0-9]+\.)/.test(chunk)) {
      const next = chunks[index + 1];
      if (next && !looksLikeStandaloneBlock(next)) {
        lastSectionKey = toSectionKey(chunk);
        blocks.push({ type: "section", title: chunk, body: next });
        index += 1;
      } else {
        blocks.push({ type: "paragraph", text: chunk });
      }
      continue;
    }

    blocks.push({ type: "paragraph", text: chunk });
  }

  return blocks.length > 0
    ? blocks
    : [{ type: "paragraph", text: body.trim() || DEFAULT_ARTICLE.body }];
}

function toSectionKey(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function looksLikeStandaloneBlock(chunk: string) {
  return (
    /^(写在前面|前言|导读)$/u.test(chunk) ||
    /^>\s*/.test(chunk) ||
    /^(提示|备注|Note)[:：]/i.test(chunk) ||
    /^(图|图片)[:：]/.test(chunk) ||
    /^#{1,3}\s+/.test(chunk) ||
    /^([一二三四五六七八九十]+、|[0-9]+\.)/.test(chunk)
  );
}
