export type SplitStrategy = "auto" | "less" | "more";

export type WechatInlineSectionType = "concept" | "quote" | "method" | "transition";

export type CardPlan = {
  index: number;
  title: string;
  summary: string;
  layoutHint?: string;
  textBlocks?: string[];
  illustrationHints?: string[];
  decorationHint?: string;
  endingLabel?: string;
};

export type InlineImagePlan = {
  sectionKey: string;
  sectionHeading: string;
  sectionType: WechatInlineSectionType;
  sectionTheme: string;
  sectionKeywords: string[];
  sectionSummary: string;
  sectionQuote?: string;
  visualDirection: string;
  rationale: string;
};

export type PlannerRequest = {
  articleTitle: string;
  rawText: string;
  knowledgeCardStyleName: string;
  inlineImageStyleName: string;
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
