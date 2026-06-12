export type SplitStrategy = "auto" | "less" | "more";

export type WechatInlineSectionType = "concept" | "quote" | "method" | "transition";

export type CardPlan = {
  index: number;
  title: string;
  summary: string;
  promptText?: string;
  theme?: string;
  layoutHint?: string;
  textBlocks?: string[];
  illustrationHints?: string[];
  titleVisualHint?: string;
  contentSections?: Array<{
    name: string;
    position: string;
    items: Array<{
      text: string;
      illustration: string;
    }>;
  }>;
  decorationHint?: string;
  endingLabel?: string;
};

export type InlineImagePlan = {
  index: number;
  sectionKey: string;
  sectionHeading: string;
  sectionType: WechatInlineSectionType;
  sectionTheme: string;
  sectionKeywords: string[];
  sectionSummary: string;
  sectionQuote?: string;
  visualDirection: string;
  visualMetaphor?: string;
  promptText?: string;
  rationale: string;
};

export type PlannerRequest = {
  articleTitle: string;
  rawText: string;
  knowledgeCardStyleName: string;
  knowledgeCardStyleGuide?: string;
  knowledgeCardReferenceImages?: Array<{
    label: string;
    url: string;
    note?: string;
  }>;
  inlineImageStyleName: string;
  inlineImageStyleGuide?: string;
  inlineImageReferenceImages?: Array<{
    label: string;
    url: string;
    note?: string;
  }>;
  cardRatio: string;
  cardWidth: number;
  cardHeight: number;
  splitStrategy: SplitStrategy;
  minCards: number;
  maxCards: number;
};

export type PlannerResponse = {
  provider: "local-fallback" | "llm";
  analysis: {
    imageGenerationSource: {
      contentKind: "full-article-text";
      strategy: string;
    };
    cardOutlineTitles: string[];
    keyQuotes: string[];
    coverTheme: {
      title: string;
      keywords: string;
    };
  };
  cardPlan: CardPlan[];
  inlineImagePlan: InlineImagePlan[];
};
