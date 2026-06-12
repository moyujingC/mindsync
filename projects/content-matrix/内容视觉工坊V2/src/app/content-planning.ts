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
  coverStyleName?: string;
  coverStyleGuide?: string;
  coverReferenceImages?: Array<{
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
      direction?: string;
      visualMetaphor?: string;
      promptText?: string;
    };
  };
  cardPlan: CardPlan[];
  inlineImagePlan: InlineImagePlan[];
};

export type CoverCandidatePlan = {
  index: number;
  title: string;
  composition: string;
  visualMetaphor: string;
  thumbKeyword?: string;
  thumbShape?: "circle" | "square";
  promptText: string;
};

export type CoverPlannerRequest = {
  articleTitle: string;
  rawText: string;
  coverStyleName?: string;
  coverStyleGuide?: string;
  coverReferenceImages?: Array<{
    label: string;
    url: string;
    note?: string;
  }>;
};

export type CoverPlannerResponse = {
  provider: "local-fallback" | "llm";
  coverTheme: {
    title: string;
    keywords: string;
    direction: string;
    visualMetaphor: string;
  };
  coverPlan: CoverCandidatePlan[];
};
