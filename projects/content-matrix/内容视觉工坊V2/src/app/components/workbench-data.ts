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

export function buildKnowledgeCardPrompt({
  articleTitle,
  cardIndex,
  cardTitle,
  cardSummary,
  bodyPreview,
}: {
  articleTitle: string;
  cardIndex: number;
  cardTitle: string;
  cardSummary: string;
  bodyPreview: string;
}) {
  return `【文字渲染规则 - 严格遵守】
只渲染提示词中用反引号 \`\` 明确标注的文字内容，原样呈现。
凡是提示词中没有用反引号标注的地方，一律不得自行添加任何文字、字母、数字或符号。

【第${cardIndex}张图 - 独立完整的一张图，单独占据一个完整的3:4竖版画布，请勿与其他图合并】

整体风格说明：
- 这是小红书知识卡，不是金句卡，不是纯主视觉海报
- 每张图都必须是一张信息含量明确的完整知识卡
- 保持当前产品的低饱和、雾蓝、克制、安静、专业气质
- 画面是被整理过的知识信息板，不要做夸张插画海报

画幅比例：独立的3:4竖版
系列标识：右上角标注 \`${String(cardIndex).padStart(2, "0")}/04\`

本张图内容：
- 主标题放在画面顶部醒目区域：\`${cardTitle}\`
- 核心摘要放在标题下方信息区：\`${cardSummary}\`
- 根据文章《${articleTitle}》和这张卡片主题，自动补全 3 到 4 个简短信息点
- 每个信息点控制在 18 到 36 字之间，放在独立信息容器内
- 每个信息点都服务于解释标题，不要重复抒情，不要只写口号
- 可以使用箭头、分区框、便签、序号、细线连接，但不要把内容挤成一整段

内容来源约束：
- 文章主题：${articleTitle}
- 本张卡主题：${cardTitle}
- 本张卡摘要：${cardSummary}
- 文章上下文摘要：${bodyPreview}
- 信息必须围绕当前卡片主题展开，不要偏到别的卡片

版式要求：
- 标题区占顶部 15% 到 20%
- 中部为 3 到 4 个信息模块，信息层级清楚，便于扫描
- 底部可有一行很轻的结论或提醒，但不要做成大金句
- 整体更像高信息密度知识卡，而不是一句话观点卡

避免：
- 不要只生成一句大字标题加很少文字
- 不要做金句卡
- 不要做纯情绪插画
- 不要高饱和、霓虹、强对比、卡通、复杂装饰、营销感排版`;
}

export function buildFallbackCardPlan(): CardPlan[] {
  return KNOWLEDGE_CARDS.map((card, index) => ({
    index: index + 1,
    title: card.title,
    summary: card.desc,
  }));
}

export function buildFallbackInlineImagePlan(): InlineImagePlan[] {
  return ILLUSTRATIONS.map((item, index) => ({
    sectionKey: item.title.replace(/\s+/g, " ").trim().toLowerCase(),
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
            prompt: buildKnowledgeCardPrompt({
              articleTitle,
              cardIndex: card.index,
              cardTitle: card.title,
              cardSummary: card.summary,
              bodyPreview,
            }),
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
    if (preset && selectedQuotes.length > 0) {
      const quoteText = selectedQuotes[0];
      tasks.push({
        articleTitle,
        prompt: `为文章《${articleTitle}》生成一张公众号横版金句底图。核心文案是：“${quoteText}”。画面需留白、安静、疗愈，便于后续叠加文字。`,
        negativePrompt: "高饱和、霓虹、复杂纹理、人物特写、卡通插画、杂乱文字",
        width: preset.w,
        height: preset.h,
        count: 1,
        purposeKey: "quote",
        purposeLabel: "金句底图",
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
        inlineLinks: planning.inlineImagePlan.map((item) => ({
          sectionKey: item.sectionKey,
          sectionHeading: item.sectionHeading,
          sectionSummary: item.sectionSummary,
        })),
      });
    }
  }

  return tasks;
}
