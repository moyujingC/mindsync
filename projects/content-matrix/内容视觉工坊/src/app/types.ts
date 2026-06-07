export type InputMode = "md" | "text";

export type CardGenerationState = "ok" | "failed";

export type ReviewCheckStatus = "pass" | "warn" | "fail";

export type GenerationStageStatus = "idle" | "processing" | "success" | "failed";

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
}

export interface MarkdownStructureSummary {
  headings: number;
  subheadings: number;
  bolds: number;
  quotes: number;
  lists: number;
}

export interface ParsedMarkdownDocument {
  status: "parsed";
  structure: MarkdownStructureSummary;
  structureTags: string[];
}

export interface ImageGenerationSource {
  contentKind: "full-article-text";
  strategy: string;
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

export interface CoverTheme {
  title: string;
  keywords: string;
}

export interface ArticleAnalysis {
  imageGenerationSource: ImageGenerationSource;
  cardOutlineTitles: string[];
  keyQuotes: string[];
  coverTheme: CoverTheme;
}

export interface GenerationOverview {
  generatedAt: string;
  cardsCount: number;
  coversCount: number;
  layoutStatus: string;
  summaryMeta: DraftMetaSummaryItem[];
}

export interface LayoutImagePlacement {
  cardNumber: string;
  placementLabel: string;
  anchorText: string;
  rationale: string;
}

export interface DraftReview {
  readyTitle: string;
  readyDescription: string;
  reviewChecks: ReviewCheck[];
  syncStatus: SyncStatusItem[];
  imagePlacements: LayoutImagePlacement[];
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
  parsedMarkdown: ParsedMarkdownDocument;
  analysis: ArticleAnalysis;
  outputToggles: OutputToggleItem[];
  cardSize: CardSizeSpec;
  styleAssets: StyleAsset[];
  activeStyleIndex: number;
  generation: GenerationOverview;
  knowledgeCards: KnowledgeCardItem[];
  covers: CoverAsset[];
  draftReview: DraftReview;
}

export interface WorkspaceLayoutState {
  inputMode: InputMode;
  isLeftPanelOpen: boolean;
  isRightPanelOpen: boolean;
}
