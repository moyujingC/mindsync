export type InputMode = "md" | "text";

export type CardGenerationState = "idle" | "processing" | "ok" | "failed";

export type ReviewCheckStatus = "pass" | "warn" | "fail";

export type GenerationStageStatus = "idle" | "processing" | "success" | "failed";

export type WorkspaceStageKey =
  | "upload"
  | "markdownParse"
  | "contentAnalysis"
  | "imageGeneration"
  | "layoutGeneration"
  | "draftSync";

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
  rawText: string;
}

export interface MarkdownStructureSummary {
  headings: number;
  subheadings: number;
  bolds: number;
  quotes: number;
  lists: number;
}

export interface ParsedMarkdownDocument {
  status: "idle" | "parsed" | "failed";
  structure: MarkdownStructureSummary;
  structureTags: string[];
  errorMessage?: string;
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
  provider?: "mock" | "llm" | "image-model";
  imagePrompt?: string;
}

export interface CoverAsset {
  key: "wechatCover" | "xiaohongshuCover";
  label: string;
  ratio: string;
  status: string;
  img: string;
  state?: CardGenerationState;
  provider?: "mock" | "image-model";
  imagePrompt?: string;
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

export interface CardPlan {
  index: number;
  title: string;
  summary: string;
}

export interface PlannerRequest {
  articleTitle: string;
  rawText: string;
  styleName: string;
  cardRatio: string;
  cardWidth: number;
  cardHeight: number;
}

export interface PlannerResponse {
  provider: "local-fallback" | "llm";
  analysis: ArticleAnalysis;
  cardPlan: CardPlan[];
}

export interface GenerateCardImageRequest {
  title: string;
  summary: string;
  styleName: string;
  ratio: string;
  width: number;
  height: number;
}

export interface GenerateCardImageResponse {
  provider: "image-model";
  imageUrl: string;
  prompt: string;
}

export interface GenerateCoverImageRequest {
  label: string;
  articleTitle: string;
  coverThemeTitle: string;
  coverThemeKeywords: string;
  styleName: string;
  ratio: string;
}

export interface GenerateCoverImageResponse {
  provider: "image-model";
  imageUrl: string;
  prompt: string;
}

export type WechatInlineSectionType = "concept" | "quote" | "method" | "transition";

export interface WechatInlineImageAsset {
  id: string;
  placementLabel: string;
  sectionType: WechatInlineSectionType;
  sectionTheme: string;
  sectionKeywords: string[];
  sectionSummary: string;
  sectionQuote?: string;
  visualDirection: string;
  ratio: string;
  width: number;
  height: number;
  img: string;
  state: CardGenerationState;
  provider?: "mock" | "image-model";
  imagePrompt?: string;
}

export interface GenerateWechatInlineImageRequest {
  articleTheme: string;
  sectionType: WechatInlineSectionType;
  sectionTheme: string;
  sectionKeywords: string[];
  sectionSummary: string;
  sectionQuote?: string;
  visualDirection: string;
  styleName: string;
  ratio: string;
  width: number;
  height: number;
}

export interface GenerateWechatInlineImageResponse {
  provider: "image-model";
  imageUrl: string;
  prompt: string;
}

export interface GenerationOverview {
  generatedAt: string;
  cardsCount: number;
  coversCount: number;
  layoutStatus: string;
  summaryMeta: DraftMetaSummaryItem[];
}

export interface WorkflowStage {
  key: WorkspaceStageKey;
  label: string;
  status: GenerationStageStatus;
  detail: string;
  retryable?: boolean;
  providerLabel?: string;
}

export interface LayoutImagePlacement {
  imageId: string;
  placementLabel: string;
  anchorText: string;
  rationale: string;
  sectionType: WechatInlineSectionType;
}

export type DraftPreviewBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading2"; text: string }
  | { type: "blockquote"; text: string }
  | { type: "ordered-list"; items: string[] }
  | { type: "image"; imageId: string; placementLabel: string; caption: string }
  | { type: "cta"; title: string; buttonText: string };

export interface DraftPreview {
  title: string;
  accountName: string;
  publishDate: string;
  intro?: string;
  blocks: DraftPreviewBlock[];
}

export interface DraftReview {
  readyTitle: string;
  readyDescription: string;
  reviewChecks: ReviewCheck[];
  syncStatus: SyncStatusItem[];
  imagePlacements: LayoutImagePlacement[];
  preview: DraftPreview;
  editorHtml: string;
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
  cardPlan: CardPlan[];
  workflowStages: WorkflowStage[];
  outputToggles: OutputToggleItem[];
  cardSize: CardSizeSpec;
  styleAssets: StyleAsset[];
  activeStyleIndex: number;
  generation: GenerationOverview;
  knowledgeCards: KnowledgeCardItem[];
  wechatInlineImages: WechatInlineImageAsset[];
  covers: CoverAsset[];
  draftReview: DraftReview;
}

export interface WorkspaceLayoutState {
  inputMode: InputMode;
  isLeftPanelOpen: boolean;
  isRightPanelOpen: boolean;
}
