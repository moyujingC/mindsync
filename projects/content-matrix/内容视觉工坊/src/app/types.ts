export type InputMode = "md" | "text";

export type CardGenerationState = "idle" | "processing" | "ok" | "failed";
export type ImageGenerationMode = "reference-edit" | "prompt-only";

export type ReviewCheckStatus = "pass" | "warn" | "fail";

export type GenerationStageStatus = "idle" | "processing" | "success" | "failed";

export type WorkspaceStageKey =
  | "upload"
  | "markdownParse"
  | "contentAnalysis"
  | "imageGeneration"
  | "layoutGeneration"
  | "draftSync";

export type StyleAssetFamily = "主风格" | "辅风格" | "实验风格";

export type StyleAssetFit =
  | "knowledgeCards"
  | "wechatInlineImages"
  | "wechatCover"
  | "wechatShareCover"
  | "xiaohongshuCover";

export interface StyleAsset {
  accountName: string;
  family: StyleAssetFamily;
  name: string;
  desc: string;
  palette: string[];
  meta: string;
  fit: StyleAssetFit[];
  mood: string[];
  promptBase: string;
  referenceImages: string[];
  pinned?: boolean;
}

export interface WechatLayoutThemeAsset {
  accountName: string;
  name: string;
  desc: string;
  meta: string;
  previewPalette: string[];
  shellBg: string;
  articleBg: string;
  titleColor: string;
  headingColor: string;
  bodyColor: string;
  mutedColor: string;
  quoteBg: string;
  quoteBorder: string;
  quoteTextColor: string;
  quoteFontSize: number;
  quoteLineHeight: number;
  quoteLetterSpacing: number;
  quoteAlign: "left" | "justify" | "center";
  quoteWeight: number;
  quotePaddingTop: number;
  quotePaddingRight: number;
  quotePaddingBottom: number;
  quotePaddingLeft: number;
  quoteMarginTop: number;
  quoteMarginBottom: number;
  ctaBg: string;
  ctaText: string;
  figureBg: string;
  placeholderBg: string;
  placeholderBorder: string;
  titleFontSize: number;
  headingFontSize: number;
  headingLineHeight: number;
  headingLetterSpacing: number;
  headingMarginTop: number;
  headingMarginBottom: number;
  headingPaddingLeft: number;
  headingBorderLeftWidth: number;
  subheadingFontSize: number;
  subheadingLineHeight: number;
  subheadingLetterSpacing: number;
  subheadingMarginTop: number;
  subheadingMarginBottom: number;
  subheadingPaddingLeft: number;
  subheadingBorderLeftWidth: number;
  bodyFontSize: number;
  bodyLineHeight: number;
  bodyLetterSpacing: number;
  bodyAlign: "left" | "justify" | "center";
  bodyPaddingTop: number;
  bodyPaddingBottom: number;
  strongColor: string;
  strongWeight: number;
  unorderedListFontSize: number;
  unorderedListLineHeight: number;
  unorderedListLetterSpacing: number;
  unorderedListAlign: "left" | "justify" | "center";
  unorderedListMarkerColor: string;
  unorderedListMarker: "solid-circle" | "square" | "hollow-circle";
  unorderedListIndentLeft: number;
  unorderedListPaddingTop: number;
  unorderedListPaddingBottom: number;
  orderedListFontSize: number;
  orderedListLineHeight: number;
  orderedListLetterSpacing: number;
  orderedListAlign: "left" | "justify" | "center";
  orderedListMarkerColor: string;
  orderedListMarkerWeight: number;
  orderedListMarkerType: "number" | "greek" | "roman-lower" | "roman-upper" | "latin-lower" | "latin-upper";
  orderedListIndentLeft: number;
  orderedListPaddingTop: number;
  orderedListPaddingBottom: number;
  articlePaddingX: number;
  paragraphSpacing: number;
  sectionSpacing: number;
  imageRadius: number;
  quoteRadius: number;
  quoteBorderWidth: number;
  ctaRadius: number;
  captionAlign: "left" | "center";
  ctaTitle: string;
  ctaButtonText: string;
  coverBottomSpacing: number;
  inlineImageSpacing: number;
  quoteSpacing: number;
  pinned?: boolean;
}

export type StyleSelectionKey =
  | "knowledgeCards"
  | "wechatInlineImages"
  | "wechatLayout"
  | "wechatCover"
  | "wechatShareCover"
  | "xiaohongshuCover";

export interface StyleSelectionMap {
  knowledgeCards: number;
  wechatInlineImages: number;
  wechatLayout: number;
  wechatCover: number;
  wechatShareCover: number;
  xiaohongshuCover: number;
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
  key: "knowledgeCards" | "wechatCover" | "wechatShareCover" | "xiaohongshuCover";
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
  isStale?: boolean;
  provider?: "mock" | "llm" | "image-model";
  imagePrompt?: string;
  imageGenerationMode?: ImageGenerationMode;
  savedPath?: string;
}

export interface CoverAsset {
  key: "wechatCover" | "wechatShareCover" | "xiaohongshuCover";
  label: string;
  ratio: string;
  status: string;
  img: string;
  state?: CardGenerationState;
  isStale?: boolean;
  provider?: "mock" | "image-model";
  imagePrompt?: string;
  imageGenerationMode?: ImageGenerationMode;
  savedPath?: string;
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

export interface WechatInlineImagePlan {
  sectionHeading: string;
  sectionType: WechatInlineSectionType;
  sectionTheme: string;
  sectionKeywords: string[];
  sectionSummary: string;
  sectionQuote?: string;
  visualDirection: string;
  rationale: string;
}

export interface PlannerRequest {
  articleTitle: string;
  rawText: string;
  knowledgeCardStyleName: string;
  inlineImageStyleName: string;
  cardRatio: string;
  cardWidth: number;
  cardHeight: number;
}

export interface PlannerResponse {
  provider: "local-fallback" | "llm";
  analysis: ArticleAnalysis;
  cardPlan: CardPlan[];
  inlineImagePlan: WechatInlineImagePlan[];
}

export interface GenerateCardImageRequest {
  title: string;
  summary: string;
  styleName: string;
  stylePromptBase: string;
  styleReferenceImages: string[];
  ratio: string;
  width: number;
  height: number;
}

export interface GenerateCardImageResponse {
  provider: "image-model";
  imageUrl: string;
  prompt: string;
  generationMode: ImageGenerationMode;
  savedPath: string;
}

export interface GenerateCoverImageRequest {
  label: string;
  articleTitle: string;
  coverThemeTitle: string;
  coverThemeKeywords: string;
  styleName: string;
  stylePromptBase: string;
  styleReferenceImages: string[];
  ratio: string;
}

export interface GenerateCoverImageResponse {
  provider: "image-model";
  imageUrl: string;
  prompt: string;
  generationMode: ImageGenerationMode;
  savedPath: string;
}

export type WechatInlineSectionType = "concept" | "quote" | "method" | "transition";

export interface WechatInlineImageAsset {
  id: string;
  placementLabel: string;
  sectionHeading: string;
  sectionType: WechatInlineSectionType;
  sectionTheme: string;
  sectionKeywords: string[];
  sectionSummary: string;
  sectionQuote?: string;
  visualDirection: string;
  rationale: string;
  ratio: string;
  width: number;
  height: number;
  img: string;
  state: CardGenerationState;
  isStale?: boolean;
  provider?: "mock" | "image-model";
  imagePrompt?: string;
  imageGenerationMode?: ImageGenerationMode;
  savedPath?: string;
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
  stylePromptBase: string;
  styleReferenceImages: string[];
  ratio: string;
  width: number;
  height: number;
}

export interface GenerateWechatInlineImageResponse {
  provider: "image-model";
  imageUrl: string;
  prompt: string;
  generationMode: ImageGenerationMode;
  savedPath: string;
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
  sectionHeading: string;
  anchorText: string;
  rationale: string;
  sectionType: WechatInlineSectionType;
}

export type DraftPreviewBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading2"; text: string }
  | { type: "heading3"; text: string }
  | { type: "blockquote"; text: string }
  | { type: "ordered-list"; items: string[] }
  | { type: "unordered-list"; items: string[] }
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
  layoutThemes: WechatLayoutThemeAsset[];
  styleSelections: StyleSelectionMap;
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
