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

const KNOWLEDGE_CARD_PROMPT_RULES = `【文字渲染规则 - 严格遵守】
（以下规则适用于豆包/即梦等国内绘画AI模型，使用Google/nano banana pro等工具可忽略）
只渲染提示词中用反引号 \`\` 明确标注的文字内容，原样呈现。
凡是提示词中没有用反引号标注的地方，一律不得自行添加任何文字、字母、数字或符号。
图标、插画、装饰元素可以自由发挥，但不得在其上附加任何未经指定的文字。`;

const KNOWLEDGE_CARD_PROMPT_STYLE_BLOCK = `## 整体风格说明（与本系列所有图保持一致）

整体风格：手绘涂鸦笔记 (Sketchnote) 风格，所有线条和图形带有轻微手绘感，不要过于僵硬和完美

画幅比例：独立的3:4竖版（宽750px × 高1000px 或等比例）

视觉风格：蓝雾静读 · 手绘知识卡

背景：浅绿米白渐变为主，可加入少量雾蓝、灰白、浅暖灰

配色：草绿、天蓝、暖黄为基础，但整体压低饱和度；深绿或深灰蓝用于轮廓和重点文字

字体：清晰可辨的中文手写体风格`;

const KNOWLEDGE_CARD_PROMPT_CUSTOM_STYLE_BLOCK = `## 当前项目硬性约束

- 版面优先服务信息阅读，不要把画面做成纯装饰海报
- 手绘感可以保留，但不要过度可爱，不要太像儿童贴纸
- 不要科技霓虹，不要儿童贴纸感，不要营销海报感，不要复杂装饰`;

export function buildKnowledgeCardPrompt({
  articleTitle,
  cardIndex,
  cardTotal,
  promptText,
  cardTitle,
  cardSummary,
  cardTheme,
  cardLayoutHint,
  cardTextBlocks,
  cardIllustrationHints,
  cardTitleVisualHint,
  cardContentSections,
  cardDecorationHint,
  cardEndingLabel,
  bodyPreview,
}: {
  articleTitle: string;
  cardIndex: number;
  cardTotal: number;
  promptText?: string;
  cardTitle: string;
  cardSummary: string;
  cardTheme?: string;
  cardLayoutHint?: string;
  cardTextBlocks?: string[];
  cardIllustrationHints?: string[];
  cardTitleVisualHint?: string;
  cardContentSections?: Array<{
    name: string;
    position: string;
    items: Array<{
      text: string;
      illustration: string;
    }>;
  }>;
  cardDecorationHint?: string;
  cardEndingLabel?: string;
  bodyPreview: string;
}) {
  if (promptText?.trim()) {
    return `${promptText.trim()}

## 当前项目硬性约束

- 严格遵守上方“整体风格说明”里的风格设定，不要自行切换成其他视觉风格
- 版面优先服务信息阅读，不要把画面做成纯装饰海报
- 手绘感可以保留，但不要过度可爱，不要太像儿童贴纸`;
  }

  const textBlocks = (cardTextBlocks || []).filter(Boolean).slice(0, 4);
  const illustrationHints = (cardIllustrationHints || []).filter(Boolean).slice(0, textBlocks.length || 4);
  const upperBlocks = textBlocks.slice(0, Math.max(1, Math.ceil(textBlocks.length / 2)));
  const lowerBlocks = textBlocks.slice(upperBlocks.length);
  const upperRendered = upperBlocks
    .map((block, index) => {
      const hint = illustrationHints[index];
      return `- \`${block}\`${hint ? `（旁边画${hint}）` : ""}`;
    })
    .join("\n");
  const lowerRendered = lowerBlocks
    .map((block, index) => {
      const hint = illustrationHints[index + upperBlocks.length];
      return `- \`${block}\`${hint ? `（旁边画${hint}）` : ""}`;
    })
    .join("\n");
  const totalLabel = String(cardTotal).padStart(2, "0");
  const indexLabel = String(cardIndex).padStart(2, "0");
  const renderedSections =
    cardContentSections && cardContentSections.length > 0
      ? cardContentSections
          .map((section) => {
            const items = section.items
              .map((item) => `- \`${item.text}\`（旁边画${item.illustration}）`)
              .join("\n");
            return `【${section.name}】（${section.position}）：
${items}`;
          })
          .join("\n\n")
      : `【核心信息区】（位于画面上半部分中心位置）：
${upperRendered || `- \`${cardSummary}\`（旁边画与主题相关的简笔画插图）`}

${lowerRendered ? `【补充信息区】（位于画面下半部分）：
${lowerRendered}` : ""}`;

  return `${KNOWLEDGE_CARD_PROMPT_RULES}

---

【第${cardIndex}张图 - 独立完整的一张图，单独占据一个完整的3:4竖版画布，请勿与其他图合并】

${KNOWLEDGE_CARD_PROMPT_STYLE_BLOCK}

${KNOWLEDGE_CARD_PROMPT_CUSTOM_STYLE_BLOCK}

系列标识：右上角标注序号"${indexLabel}/${totalLabel}"

---

## 本张图内容

主题：${cardTheme || cardSummary}

构图：${cardLayoutHint || "竖向递进卡片型"}

标题区（画面顶部15-20%）：
- 标题文字：\`${cardTitle}\`
- 视觉设计：${cardTitleVisualHint || `放在醒目的浅绿色圆角横幅内，旁边画一个与“${cardTitle}”相关的简笔画插图`}
- 序号标识：右上角标注"${indexLabel}/${totalLabel}"

内容与排版：

${renderedSections}

整体装饰元素：
- ${cardDecorationHint || "画面边缘点缀浅绿色装饰线条，不同信息区用轻分区框区分，元素间用简约箭头连接"}

内容来源约束：
- 文章标题：${articleTitle}
- 本张卡主题：${cardTitle}
- 本张卡摘要：${cardSummary}
- 文章上下文摘要：${bodyPreview}
- 所有信息必须围绕当前卡片主题展开，不要偏到别的卡片，不要偷换观点，不要压缩成一句大口号。
${cardEndingLabel ? `
结尾特殊标识：
- 画面底部加"${cardEndingLabel}"标记，字体为手写体风格，颜色为深绿色` : ""}
`;
}

export function buildFallbackCardPlan(): CardPlan[] {
  return KNOWLEDGE_CARDS.map((card, index) => ({
    index: index + 1,
    title: card.title,
    summary: card.desc,
    theme: card.desc,
    layoutHint: index === 0 ? "问题提出型" : index === 1 ? "上下对比型" : index === 2 ? "原因拆解型" : "行动建议型",
    textBlocks: buildFallbackKnowledgeBlocks(index),
    illustrationHints: buildFallbackIllustrationHints(index),
    titleVisualHint: "放在醒目的浅绿色圆角横幅内，旁边画一个相关主题的简笔画插图",
    contentSections: buildFallbackContentSections(index),
    decorationHint: "使用轻分区框、箭头和便签感小元素组织信息",
    endingLabel: index === KNOWLEDGE_CARDS.length - 1 ? "完结" : undefined,
  }));
}

function buildFallbackContentSections(index: number) {
  const blocks = buildFallbackKnowledgeBlocks(index);
  const hints = buildFallbackIllustrationHints(index);
  if (index === 1) {
    return [
      {
        name: "过去状态区",
        position: "位于画面上半部分",
        items: [{ text: blocks[0], illustration: hints[0] }],
      },
      {
        name: "现在状态区",
        position: "位于画面下半部分",
        items: blocks.slice(1).map((text, itemIndex) => ({
          text,
          illustration: hints[itemIndex + 1] || "相关简笔画插图",
        })),
      },
    ];
  }
  if (index === 2) {
    return [
      {
        name: "表层结果区",
        position: "位于画面上半部分",
        items: [{ text: blocks[0], illustration: hints[0] }],
      },
      {
        name: "深层原因区",
        position: "位于画面下半部分",
        items: blocks.slice(1).map((text, itemIndex) => ({
          text,
          illustration: hints[itemIndex + 1] || "相关简笔画插图",
        })),
      },
    ];
  }
  if (index === 3) {
    return [
      {
        name: "核心原则区",
        position: "位于画面中心位置",
        items: [{ text: blocks[0], illustration: hints[0] }],
      },
      {
        name: "行动指引区",
        position: "围绕核心原则区分布",
        items: blocks.slice(1).map((text, itemIndex) => ({
          text,
          illustration: hints[itemIndex + 1] || "相关简笔画插图",
        })),
      },
    ];
  }
  return [
    {
      name: "核心观点区",
      position: "位于画面上半部分中心位置",
      items: blocks.slice(0, 2).map((text, itemIndex) => ({
        text,
        illustration: hints[itemIndex] || "相关简笔画插图",
      })),
    },
    {
      name: "对比铺垫区",
      position: "位于画面下半部分",
      items: blocks.slice(2).map((text, itemIndex) => ({
        text,
        illustration: hints[itemIndex + 2] || "相关简笔画插图",
      })),
    },
  ];
}

function buildFallbackKnowledgeBlocks(index: number) {
  if (index === 0) {
    return [
      "持续切换会反复消耗上下文加载成本",
      "表面做了很多事，实际精力被零碎请求抽空",
      "疲惫常常来自隐性税收，而不是显眼的大任务",
    ];
  }
  if (index === 1) {
    return [
      "专注的难点不是开始，而是持续拒绝干扰",
      "目标越少，判断链路越短，执行越稳",
      "咬牙坚持不等于真正聚焦",
    ];
  }
  if (index === 2) {
    return [
      "环境、时段与恢复共同决定专注上限",
      "长期能力需要节律，不靠一次性冲刺",
      "把专注当能力培养，才会稳定复用",
    ];
  }
  return [
    "先只开一个任务窗口，减少并行切换",
    "给深度时段设开始和结束边界",
    "用渐进实验替代激进改造，降低反弹",
  ];
}

function buildFallbackIllustrationHints(index: number) {
  if (index === 0) {
    return ["上下文切换的小脑图", "被拉扯的注意力箭头", "隐性消耗的计费感图标"];
  }
  if (index === 1) {
    return ["减少目标的清单图标", "屏蔽干扰的挡板", "收束焦点的小圆点"];
  }
  if (index === 2) {
    return ["节律感时间轴", "恢复与留白的呼吸感符号", "长期积累的小叶片"];
  }
  return ["单任务窗口", "时间边界线", "渐进实验的台阶"];
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
              cardTotal: planning.cardPlan.length,
              promptText: card.promptText,
              cardTitle: card.title,
              cardSummary: card.summary,
              cardTheme: card.theme,
              cardLayoutHint: card.layoutHint,
              cardTextBlocks: card.textBlocks,
              cardIllustrationHints: card.illustrationHints,
              cardTitleVisualHint: card.titleVisualHint,
              cardContentSections: card.contentSections,
              cardDecorationHint: card.decorationHint,
              cardEndingLabel: card.endingLabel,
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
