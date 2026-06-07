export type InputMode = "md" | "text";

export type CardGenerationState = "ok" | "failed";

export type ReviewCheckStatus = "pass" | "warn" | "fail";

export interface StyleAsset {
  name: string;
  desc: string;
  palette: string[];
  meta: string;
  pinned?: boolean;
}

export interface UploadedArticle {
  fileName: string;
  updatedAt: string;
  wordCount: number;
  title: string;
  statsLine: string;
}

export interface OutputToggleItem {
  key: "knowledgeCards" | "wechatCover" | "xiaohongshuCover";
  label: string;
  hint: string;
  enabled: boolean;
}

export interface CardSizeSpec {
  ratio: string;
  width: number;
  height: number;
  ratioOptions: string[];
}

export interface KnowledgeCardItem {
  n: string;
  title: string;
  summary: string;
  composition: string;
  img: string;
  state: CardGenerationState;
}

export interface CoverAsset {
  label: string;
  ratio: string;
  status: string;
  img: string;
  wide?: boolean;
}

export interface DraftMetaSummaryItem {
  label: string;
  value: string;
  emerald?: boolean;
}

export interface ReviewCheck {
  title: string;
  detail: string;
  status: ReviewCheckStatus;
}

export interface SyncStatusItem {
  label: string;
  note: string;
}

export interface WorkspaceData {
  article: UploadedArticle;
  outputToggles: OutputToggleItem[];
  cardSize: CardSizeSpec;
  styleAssets: StyleAsset[];
  activeStyleIndex: number;
  summaryMeta: DraftMetaSummaryItem[];
  cardOutlineTitles: string[];
  keyQuotes: string[];
  coverThemeTitle: string;
  coverThemeKeywords: string;
  knowledgeCards: KnowledgeCardItem[];
  covers: CoverAsset[];
  reviewChecks: ReviewCheck[];
  syncStatus: SyncStatusItem[];
}

export interface WorkspaceLayoutState {
  inputMode: InputMode;
  isLeftPanelOpen: boolean;
  isRightPanelOpen: boolean;
}
