export type Confidence = '高' | '中' | '低' | '待核验';

export type Track =
  | 'AI 心理伴侣'
  | 'AI 日记与自我探索'
  | 'AI 教练与个人成长'
  | '职场心理健康'
  | '临床与机构工作流'
  | '国内观察'
  | '待核验线索';

export interface Product {
  slug: string;
  name: string;
  track: Track;
  oneLiner: string;
  coreExperience: string;
  worthLearning: string;
  risk: string;
  confidence: Confidence;
  imageSource: string;
  image: string;
  imageAlt?: string;
  url?: string;
  // Detail fields
  detail?: {
    take30s: string;
    positioning: string;
    userPain: string[];
    coreExperienceLong: string;
    psychMechanism: string[];
    aiRole: string;
    technical?: {
      evidenceLevel: string;
      architecture: string;
      verified: string[];
      likelyPath: string[];
      risks: string[];
      openQuestions: string[];
      notFacts: string[];
    };
    business: string;
    safety: string;
    inspiration: string[];
    learningCard: string;
    sources: { label: string; note: string }[];
  };
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tag: string;
  readTime: string;
  status?: 'published' | 'planned';
  body?: { type: 'h2' | 'h3' | 'p' | 'quote' | 'ul'; text?: string; items?: string[] }[];
}
