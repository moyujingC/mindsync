import { DEFAULT_PRESET_KEYS, findPreset } from "../image-presets";
import type {
  CardPlan,
  InlineImagePlan,
  PlannerResponse,
} from "../content-planning";
import type { GenerateImagesRequest } from "../api";
import type { GenerationRecord } from "../workspace";

export const KNOWLEDGE_CARDS = [
  {
    i: "01",
    title: "注意力的隐性税收",
    desc: "持续切换让大脑反复加载上下文，代价比想象中大。",
  },
  {
    i: "02",
    title: "专注不是用力",
    desc: "真正的专注来自更少的目标，而不是更紧的咬牙。",
  },
  {
    i: "03",
    title: "把专注当作长期能力",
    desc: "它需要环境设计、节律和恢复，而不是一次冲刺。",
  },
  {
    i: "04",
    title: "可执行的三步实验",
    desc: "从单一任务窗口到深度时段，渐进而不是激进。",
  },
];

export const QUOTES = [
  "真正的专注不是用力，而是放弃。",
  "你以为的高效，常常只是切换得更快。",
  "把专注当作能力，而不是一次决心。",
];

export const COVER_DRAFTS = [
  { title: "一座静山一盏灯", note: "克制 · 留白 · 主图偏左", variant: "mountain" as const },
  { title: "雾中的窗", note: "蓝雾基调 · 单点光源", variant: "circle" as const },
  { title: "桌面与一杯茶", note: "生活感 · 暖灰底", variant: "abstract" as const },
];

export const ILLUSTRATIONS = [
  { title: "段落一：注意力切换的代价", variant: "wave" as const },
  { title: "段落二：专注的真正成本", variant: "mountain" as const },
  { title: "段落三：能力而非决心", variant: "leaf" as const },
];

export type WorkbenchOutputs = {
  knowledge: boolean;
  quote: boolean;
  cover: boolean;
  inline: boolean;
  layout: boolean;
};

export function buildFallbackCardPlan(): CardPlan[] {
  return KNOWLEDGE_CARDS.map((card, index) => ({
    index: index + 1,
    title: card.title,
    summary: card.desc,
  }));
}

export function buildFallbackInlineImagePlan(): InlineImagePlan[] {
  return ILLUSTRATIONS.map((item, index) => ({
    sectionHeading: item.title,
    sectionType: "concept" as const,
    sectionTheme: item.title,
    sectionKeywords: [item.title],
    sectionSummary: item.title,
    visualDirection: "",
    rationale: "",
    variant: item.variant,
    index,
  }));
}

export function sortImagesByCardIndex<T extends { cardLink?: { index: number } }>(images: T[]) {
  return [...images].sort((a, b) => (a.cardLink?.index ?? 999) - (b.cardLink?.index ?? 999));
}

export function mergeRecordImages(
  existing: GenerationRecord | undefined,
  incoming: GenerationRecord
) {
  if (incoming.purposeKey !== "xhs_card") {
    return incoming;
  }

  return {
    ...(existing || incoming),
    ...incoming,
    images: sortImagesByCardIndex([
      ...(existing?.images.filter(
        (item) =>
          !incoming.images.some(
            (nextItem) => nextItem.cardLink?.index === item.cardLink?.index
          )
      ) || []),
      ...incoming.images,
    ]),
    createdAt: new Date().toISOString(),
  } satisfies GenerationRecord;
}

export function buildGenerationTasks({
  articleTitle,
  articleBody,
  planning,
  selectedQuotes,
  outputs,
  lockedKnowledgeCardIndexes,
}: {
  articleTitle: string;
  articleBody: string;
  planning: PlannerResponse;
  selectedQuotes: string[];
  outputs: WorkbenchOutputs;
  lockedKnowledgeCardIndexes: number[];
}) {
  const bodyPreview = articleBody.replace(/\s+/g, " ").trim().slice(0, 140);
  const tasks: GenerateImagesRequest[] = [];

  if (outputs.knowledge) {
    const preset = findPreset(DEFAULT_PRESET_KEYS.knowledgeCard)?.preset;
    if (preset) {
      planning.cardPlan
        .filter((card) => !lockedKnowledgeCardIndexes.includes(card.index))
        .forEach((card) => {
          tasks.push({
            articleTitle,
            prompt: `为文章《${articleTitle}》的第 ${card.index} 张小红书知识卡片生成主视觉。卡片标题：${card.title}。卡片摘要：${card.summary}。整组基调仍然是低饱和、雾蓝、克制、适合知识传播，但这一张需要围绕当前卡片观点形成单卡视觉重心。文章摘要：${bodyPreview}。`,
            negativePrompt: "高饱和、霓虹、强对比、卡通、复杂装饰、营销感排版",
            width: preset.w,
            height: preset.h,
            count: 1,
            purposeKey: "xhs_card",
            purposeLabel: "小红书知识卡片 / 图文配图",
            presetKey: preset.k,
            presetLabel: preset.label,
            styleName: "蓝雾静读",
            cardLink: {
              index: card.index,
              title: card.title,
              summary: card.summary,
            },
          });
        });
    }
  }

  if (outputs.quote) {
    const preset = findPreset(DEFAULT_PRESET_KEYS.quoteCard)?.preset;
    if (preset) {
      const quoteText = selectedQuotes[0] || "真正的专注不是用力，而是放弃。";
      tasks.push({
        articleTitle,
        prompt: `为文章《${articleTitle}》生成一张公众号横版金句卡。核心文案是：“${quoteText}”。画面需留白、安静、疗愈，便于后续叠加文字。`,
        negativePrompt: "高饱和、霓虹、复杂纹理、人物特写、卡通插画、杂乱文字",
        width: preset.w,
        height: preset.h,
        count: 1,
        purposeKey: "quote",
        purposeLabel: "金句卡",
        presetKey: preset.k,
        presetLabel: preset.label,
        styleName: "蓝雾静读",
      });
    }
  }

  if (outputs.cover) {
    const preset = findPreset(DEFAULT_PRESET_KEYS.wechatCover)?.preset;
    if (preset) {
      const coverTheme = planning.analysis.coverTheme;
      tasks.push({
        articleTitle,
        prompt: `为公众号文章《${articleTitle}》生成 3 张封面候选图。封面主题是“${coverTheme.title}”，关键词：${coverTheme.keywords}。方向克制、留白、低饱和雾蓝与暖灰，适合知识型内容封面。文章摘要：${bodyPreview}。`,
        negativePrompt: "高饱和、霓虹、强商业营销感、人物大头、复杂拼贴、文字",
        width: preset.w,
        height: preset.h,
        count: 3,
        purposeKey: "wx_cover",
        purposeLabel: "公众号封面",
        presetKey: preset.k,
        presetLabel: preset.label,
        styleName: "蓝雾静读",
      });
    }
  }

  if (outputs.inline) {
    const preset = findPreset(DEFAULT_PRESET_KEYS.wechatInline)?.preset;
    if (preset) {
      const inlineThemes = planning.inlineImagePlan
        .map((item) => `${item.sectionHeading}：${item.visualDirection}`)
        .join("；");
      tasks.push({
        articleTitle,
        prompt: `为文章《${articleTitle}》生成 ${planning.inlineImagePlan.length} 张公众号正文配图。当前配图规划：${inlineThemes}。要求适合段落间穿插，风格安静、克制、雾蓝主色，具备抽象自然意象。文章摘要：${bodyPreview}。`,
        negativePrompt: "高饱和、霓虹、复杂场景、卡通、重文字、噪点过多",
        width: preset.w,
        height: preset.h,
        count: planning.inlineImagePlan.length,
        purposeKey: "wx_inline",
        purposeLabel: "公众号正文配图",
        presetKey: preset.k,
        presetLabel: preset.label,
        styleName: "留白水墨",
      });
    }
  }

  return tasks;
}
