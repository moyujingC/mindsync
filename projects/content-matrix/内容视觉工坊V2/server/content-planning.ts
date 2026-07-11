import type {
  CoverCandidatePlan,
  CoverPlannerRequest,
  CoverPlannerResponse,
  PlannerRequest,
  PlannerResponse,
  SplitStrategy,
  WechatInlineSectionType,
} from "../src/app/content-planning";
import {
  PAPER_INFO_BOARD_COVER_STYLE_GUIDE,
  PAPER_INFO_BOARD_INLINE_STYLE_GUIDE,
  PAPER_INFO_BOARD_KNOWLEDGE_STYLE_GUIDE,
} from "../src/app/style-guides";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KNOWLEDGE_CARD_GENERATOR_BASE = fs.readFileSync(
  path.join(__dirname, "prompts/knowledge-card-generator-base.md"),
  "utf8"
);
const WECHAT_INLINE_IMAGE_GENERATOR_BASE = fs.readFileSync(
  path.join(__dirname, "prompts/wechat-inline-image-generator-base.md"),
  "utf8"
);
const WECHAT_COVER_GENERATOR_BASE = fs.readFileSync(
  path.join(__dirname, "prompts/wechat-cover-generator-base.md"),
  "utf8"
);

function resolveKnowledgeCardStyleGuide(request: PlannerRequest) {
  return request.knowledgeCardStyleGuide?.trim() || PAPER_INFO_BOARD_KNOWLEDGE_STYLE_GUIDE;
}

function resolveInlineImageStyleGuide(request: PlannerRequest) {
  return request.inlineImageStyleGuide?.trim() || PAPER_INFO_BOARD_INLINE_STYLE_GUIDE;
}

function resolveCoverStyleGuide(request: PlannerRequest) {
  return request.coverStyleGuide?.trim() || PAPER_INFO_BOARD_COVER_STYLE_GUIDE;
}

function resolveCoverOnlyStyleGuide(request: CoverPlannerRequest) {
  return request.coverStyleGuide?.trim() || PAPER_INFO_BOARD_COVER_STYLE_GUIDE;
}

function renderReferenceImages(
  imagesInput:
    | Array<{
        label: string;
        url: string;
        note?: string;
      }>
    | undefined
) {
  const images = imagesInput?.filter((item) => item.url?.trim()) ?? [];
  if (images.length === 0) {
    return `参考图：无。本次仅使用文字风格设定，不要凭空假设具体参考图。`;
  }

  return [
    "参考图（可选，作为风格与构图参考，不要照抄其中的文字内容）：",
    ...images.map((image, index) => {
      const label = image.label?.trim() || `参考图 ${index + 1}`;
      const note = image.note?.trim() ? `；参考重点：${image.note.trim()}` : "";
      return `- ${label}：${image.url.trim()}${note}`;
    }),
  ].join("\n");
}

function buildInjectedGeneratorBase(request: PlannerRequest) {
  return KNOWLEDGE_CARD_GENERATOR_BASE
    .replace("{{STYLE_GUIDE}}", resolveKnowledgeCardStyleGuide(request))
    .replace("{{REFERENCE_IMAGES}}", renderReferenceImages(request.knowledgeCardReferenceImages));
}

function buildInjectedInlineImageBase(request: PlannerRequest) {
  return WECHAT_INLINE_IMAGE_GENERATOR_BASE
    .replace("{{STYLE_GUIDE}}", resolveInlineImageStyleGuide(request))
    .replace("{{REFERENCE_IMAGES}}", renderReferenceImages(request.inlineImageReferenceImages));
}

function buildInjectedCoverBase(request: PlannerRequest) {
  return WECHAT_COVER_GENERATOR_BASE
    .replace("{{STYLE_GUIDE}}", resolveCoverStyleGuide(request))
    .replace("{{REFERENCE_IMAGES}}", renderReferenceImages(request.coverReferenceImages));
}

function buildInjectedCoverOnlyBase(request: CoverPlannerRequest) {
  return WECHAT_COVER_GENERATOR_BASE
    .replace("{{STYLE_GUIDE}}", resolveCoverOnlyStyleGuide(request))
    .replace("{{REFERENCE_IMAGES}}", renderReferenceImages(request.coverReferenceImages));
}

function attachExternalStyleGuideToPromptText(promptText: string | undefined, request: PlannerRequest) {
  const source = promptText?.trim() || "";
  const appendix = `## 外挂视觉风格设定（必须遵守）

${resolveKnowledgeCardStyleGuide(request)}

${renderReferenceImages(request.knowledgeCardReferenceImages)}`;

  if (!source) return appendix;
  if (source.includes("## 外挂视觉风格设定")) return source;
  return `${source}

${appendix}`;
}

function attachExternalStyleGuide(response: Omit<PlannerResponse, "provider">, request: PlannerRequest) {
  const fallbackVisualDecision = classifyArticleWechatVisualType(request.articleTitle, request.rawText);
  const responseVisualType = response.analysis?.imageGenerationSource?.visualType;
  const unifiedVisualType =
    responseVisualType === "knowledge_card" || responseVisualType === "atmosphere"
      ? responseVisualType
      : response.cardPlan.find(
          (card) => card.visualType === "knowledge_card" || card.visualType === "atmosphere"
        )?.visualType || fallbackVisualDecision.visualType;
  const unifiedVisualRationale =
    response.analysis?.imageGenerationSource?.visualRationale?.trim() ||
    response.cardPlan.find((card) => card.visualRationale?.trim())?.visualRationale ||
    fallbackVisualDecision.visualRationale;

  return {
    ...response,
    analysis: {
      ...response.analysis,
      imageGenerationSource: {
        ...response.analysis.imageGenerationSource,
        visualType: unifiedVisualType,
        visualRationale: unifiedVisualRationale,
      },
      coverTheme: attachCoverStyleGuideToCoverTheme(response.analysis.coverTheme, request),
    },
    cardPlan: response.cardPlan.map((card) => ({
      ...card,
      visualType: unifiedVisualType,
      visualRationale: unifiedVisualRationale,
      promptText: attachExternalStyleGuideToPromptText(card.promptText, request),
    })),
    inlineImagePlan: response.inlineImagePlan.map((item, index) => ({
      ...item,
      index: item.index ?? index + 1,
      promptText: attachInlineImageStyleGuideToPromptText(item.promptText, item, index, request),
    })),
  };
}

function attachCoverStyleGuideToCoverTheme(
  coverTheme: PlannerResponse["analysis"]["coverTheme"],
  request: PlannerRequest
) {
  const promptText = coverTheme.promptText?.trim();
  const nextCoverTheme = {
    ...coverTheme,
    direction: coverTheme.direction || "公众号首发封面，克制、留白、标题清楚",
    visualMetaphor: coverTheme.visualMetaphor || coverTheme.title,
  };

  if (promptText?.includes("## 外挂公众号封面风格设定")) {
    return nextCoverTheme;
  }

  const appendix = `## 外挂公众号封面风格设定（必须遵守）

${resolveCoverStyleGuide(request)}

${renderReferenceImages(request.coverReferenceImages)}`;

  return {
    ...nextCoverTheme,
    promptText: promptText
      ? `${promptText}

${appendix}`
      : buildWechatCoverPromptText({
          articleTitle: request.articleTitle,
          coverTitle: coverTheme.title,
          keywords: coverTheme.keywords,
          direction: nextCoverTheme.direction,
          visualMetaphor: nextCoverTheme.visualMetaphor,
          styleGuide: resolveCoverStyleGuide(request),
          referenceImages: renderReferenceImages(request.coverReferenceImages),
        }),
  };
}

function attachInlineImageStyleGuideToPromptText(
  promptText: string | undefined,
  item: { sectionHeading: string; sectionSummary: string; visualDirection: string },
  index: number,
  request: PlannerRequest
) {
  const source = promptText?.trim();
  const appendix = `## 外挂正文配图风格设定（必须遵守）

${resolveInlineImageStyleGuide(request)}

${renderReferenceImages(request.inlineImageReferenceImages)}`;

  if (source?.includes("## 外挂正文配图风格设定")) return source;
  if (source) return `${source}

${appendix}`;

  return buildInlineImagePromptText({
    articleTitle: request.articleTitle,
    imageIndex: index + 1,
    imageTotal: Math.max(1, request.maxCards),
    sectionHeading: item.sectionHeading,
    sectionSummary: item.sectionSummary,
    sectionType: "concept",
    visualDirection: item.visualDirection,
    styleGuide: resolveInlineImageStyleGuide(request),
    referenceImages: renderReferenceImages(request.inlineImageReferenceImages),
  });
}

function cleanText(text: string) {
  return text
    .replace(/\*\*/g, "")
    .replace(/^>\s?/gm, "")
    .replace(/^\d+\.\s?/gm, "")
    .replace(/^\-\s?/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSentences(text: string) {
  return text
    .split(/(?<=[。！？；])/)
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function extractSections(rawText: string) {
  const chunks = rawText
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  const sections: Array<{ heading: string; body: string[] }> = [];
  let pendingHeading = "";

  for (const chunk of chunks) {
    if (/^##\s+/.test(chunk)) {
      pendingHeading = chunk.replace(/^##\s+/, "").trim();
      sections.push({ heading: pendingHeading, body: [] });
      continue;
    }

    if (/^([一二三四五六七八九十]+、|[0-9]+\.)/.test(chunk)) {
      pendingHeading = chunk.trim();
      sections.push({ heading: pendingHeading, body: [] });
      continue;
    }

    if (sections.length === 0) {
      sections.push({ heading: "文章主线", body: [chunk] });
      continue;
    }

    sections[sections.length - 1]?.body.push(chunk);
  }

  return sections.filter((section) => section.heading || section.body.length > 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function resolveTargetCardCount(
  sectionCount: number,
  request: Pick<PlannerRequest, "splitStrategy" | "minCards" | "maxCards">
) {
  const boundedSections = clamp(sectionCount || 3, request.minCards, request.maxCards);
  if (request.splitStrategy === "less") return clamp(boundedSections - 1, request.minCards, request.maxCards);
  if (request.splitStrategy === "more") return clamp(boundedSections + 1, request.minCards, request.maxCards);
  return boundedSections;
}

function buildCardLayoutHint(index: number, total: number) {
  if (index === 0) return "问题提出型 / 竖向递进卡";
  if (index === total - 1) return "行动建议型 / 中心发散卡";
  if (index === 1) return "上下对比型";
  return "原因拆解型 / 分区信息卡";
}

function classifyArticleWechatVisualType(articleTitle: string, rawText: string) {
  const text = cleanText(`${articleTitle} ${rawText}`);
  const knowledgeMatches =
    text.match(/方法|步骤|模型|结构|机制|原因|判断|原则|清单|流程|对比|策略|框架|路径|行动|建议|实验|拆解/g) ?? [];
  const atmosphereMatches =
    text.match(/感受|情绪|疲惫|焦虑|安静|孤独|夜晚|清晨|关系|记忆|故事|场景|隐喻|生活|身体|内心|停顿/g) ?? [];

  if (knowledgeMatches.length >= atmosphereMatches.length + 2) {
    return {
      visualType: "knowledge_card" as const,
      visualRationale: "整篇文章以方法、结构、机制或行动建议为主，适合统一做横版知识卡。",
    };
  }

  if (atmosphereMatches.length >= knowledgeMatches.length + 2) {
    return {
      visualType: "atmosphere" as const,
      visualRationale: "整篇文章以叙事、情绪、场景或隐喻为主，适合统一做横版氛围图。",
    };
  }

  const sectionCount = extractSections(rawText).length;
  const sentenceCount = splitSentences(rawText).length;
  const hasDenseStructure = sectionCount >= 3 || sentenceCount >= 12 || rawText.length > 900;

  return {
    visualType: hasDenseStructure ? ("knowledge_card" as const) : ("atmosphere" as const),
    visualRationale:
      hasDenseStructure
        ? "整篇文章结构和信息密度较高，统一做横版知识卡更利于理解。"
        : "整篇文章信息较轻或更偏阅读感，统一做横版氛围图更适合公众号阅读节奏。",
  };
}

function buildTitleVisualHint(title: string) {
  return `放在醒目的浅绿色圆角横幅内，旁边画一个与“${title}”相关的简笔画插图`;
}

function renderPromptSections(
  sections: Array<{
    name: string;
    position: string;
    items: Array<{ text: string; illustration: string }>;
  }>
) {
  return sections
    .map((section) => {
      const items = section.items
        .map((item) => `- \`${item.text}\`（旁边画${item.illustration}）`)
        .join("\n");
      return `【${section.name}】（${section.position}）：
${items}`;
    })
    .join("\n\n");
}

function buildKnowledgeCardPromptText({
  styleGuide,
  referenceImages,
  cardIndex,
  cardTotal,
  cardTitle,
  cardTheme,
  cardLayoutHint,
  titleVisualHint,
  contentSections,
  decorationHint,
  endingLabel,
  visualType,
  visualRationale,
}: {
  styleGuide: string;
  referenceImages: string;
  cardIndex: number;
  cardTotal: number;
  cardTitle: string;
  cardTheme: string;
  cardLayoutHint: string;
  titleVisualHint: string;
  contentSections: Array<{
    name: string;
    position: string;
    items: Array<{ text: string; illustration: string }>;
  }>;
  decorationHint: string;
  endingLabel?: string;
  visualType?: "knowledge_card" | "atmosphere";
  visualRationale?: string;
}) {
  const indexLabel = String(cardIndex).padStart(2, "0");
  const totalLabel = String(cardTotal).padStart(2, "0");
  const visualTypeLabel = visualType === "atmosphere" ? "横版氛围图" : "横版知识卡";
  const visualTypeRule =
    visualType === "atmosphere"
      ? "本图是横版氛围图：只表达一个情绪、场景或视觉隐喻，文字只保留标题和 0-1 句短标注，不要做多模块知识卡。"
      : "本图是横版知识卡：可以承载 2-4 个结构化信息区，用分区、箭头、图标帮助读者理解。";

  return `【文字渲染规则 - 严格遵守】
（以下规则适用于豆包/即梦等国内绘画AI模型，使用Google/nano banana pro等工具可忽略）
只渲染提示词中用反引号 \`\` 明确标注的文字内容，原样呈现。
凡是提示词中没有用反引号标注的地方，一律不得自行添加任何文字、字母、数字或符号。
图标、插画、装饰元素可以自由发挥，但不得在其上附加任何未经指定的文字。

---

【第${cardIndex}张图 - 独立完整的一张公众号横版图，单独占据一个完整的横版画布，请勿与其他图合并】

## 整体风格说明（与本系列所有图保持一致）

整体风格：手绘涂鸦笔记 (Sketchnote) 风格，所有线条和图形带有轻微手绘感，不要过于僵硬和完美

画幅比例：公众号正文横版图，默认 1080×608 或等比例 16:9

${styleGuide}

${referenceImages}

字体：清晰可辨的中文手写体风格

系列标识：右上角标注序号"${indexLabel}/${totalLabel}"

---

## 本张图内容

主题：${cardTheme}

推荐类型：${visualTypeLabel}${visualRationale ? `（${visualRationale}）` : ""}
类型规则：${visualTypeRule}

构图：${cardLayoutHint}

标题区（画面左侧或上方 20-30% 安全区）：
- 标题文字：\`${cardTitle}\`
- 视觉设计：${titleVisualHint}
- 序号标识：右上角标注"${indexLabel}/${totalLabel}"

内容与排版：

${renderPromptSections(contentSections)}

整体装饰元素：
- ${decorationHint}
${endingLabel ? `

结尾特殊标识：
- 画面底部加"${endingLabel}"标记，字体为手写体风格，颜色为深绿色` : ""}
`;
}

function buildCardTextBlocks(section: { heading: string; body: string[] }, title: string, summary: string) {
  const source = splitSentences(section.body.join(" "));
  const picked = source.filter((sentence) => sentence.length >= 12).slice(0, 4);
  if (picked.length >= 3) {
    return picked;
  }

  const fallback = [
    summary,
    section.body[0] ? cleanText(section.body[0]).slice(0, 34) : "",
    section.body[1] ? cleanText(section.body[1]).slice(0, 34) : "",
  ].filter(Boolean);

  return Array.from(new Set([title, ...fallback]))
    .map((item) => cleanText(item))
    .filter((item) => item.length >= 8)
    .slice(0, 4);
}

function buildIllustrationHints(title: string, textBlocks: string[]) {
  return textBlocks.slice(0, 4).map((block) => `与“${title} / ${block.slice(0, 10)}”相关的极简手绘符号`);
}

function buildContentSections(
  layoutHint: string,
  textBlocks: string[],
  illustrationHints: string[]
) {
  const upperBlocks = textBlocks.slice(0, Math.max(1, Math.ceil(textBlocks.length / 2)));
  const lowerBlocks = textBlocks.slice(upperBlocks.length);
  const upperItems = upperBlocks.map((text, index) => ({
    text,
    illustration: illustrationHints[index] || "与该句含义相关的简笔画插图",
  }));
  const lowerItems = lowerBlocks.map((text, index) => ({
    text,
    illustration:
      illustrationHints[index + upperBlocks.length] || "与该句含义相关的简笔画插图",
  }));

  if (layoutHint.includes("上下对比")) {
    return [
      {
        name: "上半部分信息区",
        position: "位于画面上半部分",
        items: upperItems,
      },
      {
        name: "下半部分信息区",
        position: "位于画面下半部分",
        items: lowerItems.length > 0 ? lowerItems : upperItems.slice(0, 1),
      },
    ];
  }

  if (layoutHint.includes("中心发散")) {
    return [
      {
        name: "核心原则区",
        position: "位于画面中心位置",
        items: upperItems.slice(0, 1),
      },
      {
        name: "行动指引区",
        position: "围绕核心原则区分布",
        items: lowerItems.length > 0 ? lowerItems : upperItems.slice(1),
      },
    ];
  }

  if (layoutHint.includes("原因拆解")) {
    return [
      {
        name: "表层结果区",
        position: "位于画面上半部分",
        items: upperItems,
      },
      {
        name: "深层原因区",
        position: "位于画面下半部分",
        items: lowerItems.length > 0 ? lowerItems : upperItems.slice(0, 1),
      },
    ];
  }

  return [
    {
      name: "核心观点区",
      position: "位于画面上半部分中心位置",
      items: upperItems,
    },
    {
      name: "补充说明区",
      position: "位于画面下半部分",
      items: lowerItems.length > 0 ? lowerItems : upperItems.slice(0, 1),
    },
  ];
}

function classifySectionType(summary: string, quote?: string): WechatInlineSectionType {
  if (quote) return "quote";
  if (/^\d+\./m.test(summary) || /练习|步骤|方法|建议|清单/.test(summary)) return "method";
  if (/判断力|提问|留白|筛选|边界|表达|思考|专注|注意力/.test(summary)) return "concept";
  return "transition";
}

function buildVisualDirection(sectionType: WechatInlineSectionType, sectionTheme: string) {
  if (sectionType === "quote") {
    return `围绕“${sectionTheme}”做轻观点感的编辑插图，不做大字海报，更像安静的杂志内页。`;
  }
  if (sectionType === "method") {
    return `围绕“${sectionTheme}”表达方法感、秩序感和结构感，但不要做教程卡片。`;
  }
  if (sectionType === "transition") {
    return `围绕“${sectionTheme}”做阅读换气图，强调停顿感、留白感和节奏缓冲。`;
  }
  return `围绕“${sectionTheme}”做抽象概念意象图，安静、克制、有人文思考感。`;
}

function buildVisualMetaphor(sectionType: WechatInlineSectionType, sectionTheme: string) {
  if (sectionType === "quote") return `用一盏小灯、半开的窗和安静桌面承接“${sectionTheme}”的观点感`;
  if (sectionType === "method") return `用收束线团、关闭标签页或划定边界的动作表达“${sectionTheme}”`;
  if (sectionType === "transition") return `用门、桥、雾中小路或翻页动作表达“${sectionTheme}”的转场`;
  return `用低科技装置、桌面物件或空间光影把“${sectionTheme}”变成可感知的隐喻`;
}

function buildInlineImagePromptText({
  articleTitle,
  imageIndex,
  imageTotal,
  sectionHeading,
  sectionSummary,
  sectionType,
  visualDirection,
  visualMetaphor,
  styleGuide,
  referenceImages,
}: {
  articleTitle: string;
  imageIndex: number;
  imageTotal: number;
  sectionHeading: string;
  sectionSummary: string;
  sectionType: WechatInlineSectionType;
  visualDirection: string;
  visualMetaphor?: string;
  styleGuide: string;
  referenceImages: string;
}) {
  const indexLabel = String(imageIndex).padStart(2, "0");
  const totalLabel = String(imageTotal).padStart(2, "0");
  const anchorMap: Record<WechatInlineSectionType, string> = {
    concept: "概念隐喻",
    quote: "观点判断",
    method: "方法动作",
    transition: "段落转场",
  };
  const metaphor = visualMetaphor || buildVisualMetaphor(sectionType, sectionHeading);

  return `【公众号正文配图 - 独立完整的一张图】

用途：插入公众号文章《${articleTitle}》正文中，服务小节「${sectionHeading}」的阅读节奏。

画幅比例：公众号正文横版 1080×608。

序号：${indexLabel}/${totalLabel}

## 视觉风格

${styleGuide}

${referenceImages}

## 本张图要表达

小节主题：${sectionHeading}

认知锚点：${anchorMap[sectionType]}

小节摘要：${sectionSummary}

情绪方向：${visualDirection}

画面隐喻：${metaphor}

## 构图

横版构图，主体位于画面偏左或偏下三分之一，右侧或上方保留大面积呼吸留白；光线柔和，背景干净，像公众号文章中段落之间的一次停顿。

## 画面元素

- 主体：围绕“${sectionHeading}”设计一个具体小物件、人物背影或低科技装置
- 辅助元素：1-3 个低饱和辅助元素，用来补足语义，不要堆满
- 空间关系：主体和辅助元素之间要形成清楚的方向或张力，但整体安静

## 中文标注

默认无文字；如需要标注，只允许 1-3 个极短中文手写标注词，必须逐个用反引号包裹。

## 禁止

不要知识卡片，不要信息图，不要大标题海报，不要多段文字，不要复杂流程图，不要营销封面感，不要夸张负面情绪。`;
}

function buildWechatCoverPromptText({
  articleTitle,
  coverTitle,
  keywords,
  direction,
  visualMetaphor,
  styleGuide,
  referenceImages,
}: {
  articleTitle: string;
  coverTitle: string;
  keywords: string;
  direction: string;
  visualMetaphor: string;
  styleGuide: string;
  referenceImages: string;
}) {
  return `【公众号封面图 - 3 张候选，横版 900×383】

用途：公众号文章《${articleTitle}》首发封面。

## 文字渲染规则

只渲染反引号中的文字。不得自行添加未经指定的文字、字母、数字、栏目名、日期、水印或符号。

## 共同风格

${styleGuide}

${referenceImages}

## 文章入口判断

封面主题：${coverTitle}

关键词：${keywords}

视觉隐喻：${visualMetaphor}

情绪方向：${direction}

## 候选 1

构图：标题左置，占画面左侧 45%-55%；右侧用一个克制的纸本隐喻物件承接主题，背景保留大面积温白纸面。

标题文字：\`${articleTitle}\`

画面元素：一张主纸片、少量胶带、一个与“${visualMetaphor}”相关的低饱和小物件或小图框。

重点：标题可读，纸本质感明确，主题隐喻清楚。

## 候选 2

构图：中心纸片承载标题，背后只有轻微纸张叠层和低饱和色块，右下角放一个小型隐喻物件。

标题文字：\`${articleTitle}\`

画面元素：中心标题纸片、浅雾蓝/浅卡其色块、铅笔或便签边角。

重点：更安静，更适合知识型公众号。

## 候选 3

构图：标题区与主体物件错位，标题放在中左纸片上，右侧或下方用边角纸张层次和轻扫描感制造入口气质。

标题文字：\`${articleTitle}\`

画面元素：错位纸片、回形针或胶带、一个象征“${keywords}”的简洁物件。

重点：入口感稍强，但不能商业营销化。

## 禁止

不要知识卡片布局，不要小红书竖版卡片，不要信息图，不要段落文字，不要人物大头，不要复杂拼贴，不要高饱和营销海报。`;
}

function pickKeyQuotes(rawText: string) {
  const quoteBlocks = rawText
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith(">"))
    .map((line) => cleanText(line.replace(/^>\s?/, "")));

  const boldSnippets = Array.from(rawText.matchAll(/\*\*([^*]+)\*\*/g)).map((match) =>
    cleanText(match[1])
  );

  const paragraphSnippets = rawText
    .split(/\n{2,}/)
    .map((item) => cleanText(item))
    .filter((item) => item.length >= 16 && item.length <= 42);

  return [...quoteBlocks, ...boldSnippets, ...paragraphSnippets].filter(Boolean).slice(0, 3);
}

function buildCoverCandidates({
  articleTitle,
  coverTitle,
  keywords,
  direction,
  visualMetaphor,
  styleGuide,
  referenceImages,
}: {
  articleTitle: string;
  coverTitle: string;
  keywords: string;
  direction: string;
  visualMetaphor: string;
  styleGuide: string;
  referenceImages: string;
}): CoverCandidatePlan[] {
  const candidates = [
    {
      title: "中心纸片",
      composition:
        "中心纸片承载原标题，标题和主要视觉都放在中心安全区，确保从大封面中心裁成 1:1 小封面后仍完整可读。",
      elementHint: `中心纸片、少量胶带、一个与“${visualMetaphor}”相关的低饱和小物件。`,
      focus: "标题居中可读，中心裁切可用，纸本质感明确。",
    },
    {
      title: "中心聚焦",
      composition:
        "中心聚焦构图，标题置于画面中心，四周用低饱和色块和少量纸本元素形成入口氛围。",
      elementHint: "中心标题区、浅雾蓝/浅卡其色块、铅笔或便签边角。",
      focus: "更安静，更适合知识型公众号，中心安全区稳定。",
    },
    {
      title: "对称留白",
      composition:
        "近似对称构图，标题位于中心略上位置，主体物件围绕标题下方或两侧展开，边缘保持干净。",
      elementHint: `居中标题纸片、回形针或胶带、一个象征“${keywords}”的简洁物件。`,
      focus: "入口感稍强，但不能商业营销化，不能影响中心裁切。",
    },
  ];

  return candidates.map((candidate, index) => ({
    index: index + 1,
    title: candidate.title,
    composition: candidate.composition,
    visualMetaphor,
    promptText: `【公众号封面图 - 候选 ${index + 1}，横版 900×383】

用途：公众号文章《${articleTitle}》首发封面。

## 文字渲染规则

只渲染反引号中的文字。不得自行添加未经指定的文字、字母、数字、栏目名、日期、水印或符号。

## 视觉风格

${styleGuide}

${referenceImages}

## 文章入口判断

封面主题：${coverTitle}

关键词：${keywords}

视觉隐喻：${visualMetaphor}

情绪方向：${direction}

## 本张候选

构图：${candidate.composition}

标题文字：\`${articleTitle}\`

画面元素：${candidate.elementHint}

重点：${candidate.focus}

小封面适配：公众号小封面直接从这张大封面中心裁切 383×383，不单独生成小封面。因此标题和核心视觉必须位于中心安全区，不能放在左右边缘。

## 禁止

不要知识卡片布局，不要小红书竖版卡片，不要信息图，不要段落文字，不要人物大头，不要复杂拼贴，不要高饱和营销海报，不要左置标题，不要右置标题。`,
  }));
}

export function planKnowledgeCardsFromArticle(
  request: PlannerRequest
): Omit<PlannerResponse, "provider"> {
  const styleGuide = resolveKnowledgeCardStyleGuide(request);
  const referenceImages = renderReferenceImages(request.knowledgeCardReferenceImages);
  const inlineStyleGuide = resolveInlineImageStyleGuide(request);
  const inlineReferenceImages = renderReferenceImages(request.inlineImageReferenceImages);
  const sections = extractSections(request.rawText);
  const targetCount = resolveTargetCardCount(sections.length, request);
  const normalizedSections =
    sections.length > 0
      ? sections.slice(0, targetCount)
      : [{ heading: request.articleTitle || "文章主线", body: [request.rawText] }];
  const articleVisualDecision = classifyArticleWechatVisualType(request.articleTitle, request.rawText);

  const cardPlan = normalizedSections.map((section, index) => {
    const summarySource = cleanText(section.body.join(" ") || section.heading);
    const summary = summarySource.length > 54 ? `${summarySource.slice(0, 54)}…` : summarySource;
    const title = section.heading || `知识卡 ${index + 1}`;
    const layoutHint = buildCardLayoutHint(index, normalizedSections.length);
    const textBlocks = buildCardTextBlocks(section, title, summary || title);
    const illustrationHints = buildIllustrationHints(title, textBlocks);
    const contentSections = buildContentSections(layoutHint, textBlocks, illustrationHints);
    const titleVisualHint = buildTitleVisualHint(title);
    const theme = summary || title;
    const decorationHint = "使用分区框、箭头、便签和轻手绘装饰组织信息，避免堆成一段";
    const endingLabel = index === normalizedSections.length - 1 ? "完结" : undefined;

    return {
      index: index + 1,
      title,
      summary: summary || "等待文章内容补充后再生成摘要。",
      visualType: articleVisualDecision.visualType,
      visualRationale: articleVisualDecision.visualRationale,
      promptText: buildKnowledgeCardPromptText({
        styleGuide,
        referenceImages,
        cardIndex: index + 1,
        cardTotal: normalizedSections.length,
        cardTitle: title,
        cardTheme: theme,
        cardLayoutHint: layoutHint,
        titleVisualHint,
        contentSections,
        decorationHint,
        endingLabel,
        visualType: articleVisualDecision.visualType,
        visualRationale: articleVisualDecision.visualRationale,
      }),
      theme,
      layoutHint,
      textBlocks,
      illustrationHints,
      titleVisualHint,
      contentSections,
      decorationHint,
      endingLabel,
    };
  });

  const keyQuotes = pickKeyQuotes(request.rawText);
  const firstTitle = cardPlan[0]?.title || request.articleTitle || "文章主观点";
  const coverTitle = firstTitle.replace(/^一[、.·]\s*/, "");
  const coverKeywords = keyQuotes.join(" / ") || firstTitle;
  const coverDirection = "克制、清醒、留白，有轻微疲惫感但不消极，适合知识型公众号首发入口";
  const coverVisualMetaphor = `用纸本文稿、便签和一个与“${coverTitle}”相关的安静桌面物件表达文章入口`;
  const inlineImagePlan = cardPlan.slice(0, 3).map((card, index) => {
    const sectionQuote = keyQuotes.find(
      (quote) => card.summary.includes(quote) || quote.includes(card.summary.slice(0, 12))
    );
    const sectionType = classifySectionType(card.summary, sectionQuote);
    const visualDirection = buildVisualDirection(sectionType, card.title);
    const visualMetaphor = buildVisualMetaphor(sectionType, card.title);

    return {
      index: index + 1,
      sectionKey: `inline-${index + 1}-${card.title.replace(/\s+/g, "-").toLowerCase()}`,
      sectionHeading: card.title,
      sectionType,
      sectionTheme: card.title,
      sectionKeywords: [card.title, firstTitle, ...keyQuotes].filter(Boolean).slice(0, 5),
      sectionSummary: card.summary,
      sectionQuote,
      visualDirection,
      visualMetaphor,
      promptText: buildInlineImagePromptText({
        articleTitle: request.articleTitle,
        imageIndex: index + 1,
        imageTotal: Math.min(3, cardPlan.length),
        sectionHeading: card.title,
        sectionSummary: card.summary,
        sectionType,
        visualDirection,
        visualMetaphor,
        styleGuide: inlineStyleGuide,
        referenceImages: inlineReferenceImages,
      }),
      rationale: `放在“${card.title}”这一节附近，用来给长文阅读换气，并轻量强化当前段落主题。`,
    };
  });

  const splitStrategyLabel: Record<SplitStrategy, string> = {
    auto: "自动",
    less: "偏少",
    more: "偏多",
  };

  return attachExternalStyleGuide({
    analysis: {
      imageGenerationSource: {
        contentKind: "full-article-text",
        strategy: `当前由模型策略“${splitStrategyLabel[request.splitStrategy]}”在 ${request.minCards}-${request.maxCards} 张范围内自动拆解，本次得到 ${cardPlan.length} 张公众号横版图；整篇文章统一采用${articleVisualDecision.visualType === "atmosphere" ? "横版氛围图" : "横版知识卡"}。`,
        visualType: articleVisualDecision.visualType,
        visualRationale: articleVisualDecision.visualRationale,
      },
      cardOutlineTitles: cardPlan.map((card) => card.title),
      keyQuotes,
      coverTheme: {
        title: coverTitle,
        keywords: coverKeywords,
        direction: coverDirection,
        visualMetaphor: coverVisualMetaphor,
        promptText: buildWechatCoverPromptText({
          articleTitle: request.articleTitle,
          coverTitle,
          keywords: coverKeywords,
          direction: coverDirection,
          visualMetaphor: coverVisualMetaphor,
          styleGuide: resolveCoverStyleGuide(request),
          referenceImages: renderReferenceImages(request.coverReferenceImages),
        }),
      },
    },
    cardPlan,
    inlineImagePlan,
  }, request);
}

export function planWechatCoverFromArticle(
  request: CoverPlannerRequest
): Omit<CoverPlannerResponse, "provider"> {
  const styleGuide = resolveCoverOnlyStyleGuide(request);
  const referenceImages = renderReferenceImages(request.coverReferenceImages);
  const keyQuotes = pickKeyQuotes(request.rawText);
  const cleanTitle = request.articleTitle.trim() || "公众号文章封面";
  const keywords = keyQuotes.join(" / ") || cleanText(request.rawText).slice(0, 42) || cleanTitle;
  const coverTitle = cleanTitle;
  const direction = "克制、清醒、留白，有轻微疲惫感但不消极，适合知识型公众号首发入口";
  const visualMetaphor = `用纸本文稿、便签、胶带和一个安静桌面物件表达“${cleanTitle}”的入口感`;

  return {
    coverTheme: {
      title: coverTitle,
      keywords,
      direction,
      visualMetaphor,
    },
    coverPlan: buildCoverCandidates({
      articleTitle: cleanTitle,
      coverTitle,
      keywords,
      direction,
      visualMetaphor,
      styleGuide,
      referenceImages,
    }),
  };
}

function buildCoverOnlyPrompt(request: CoverPlannerRequest) {
  return `
你只负责公众号封面阶段一：文生文。

【公众号封面提示词生成器】

${buildInjectedCoverOnlyBase(request)}

文章标题：${request.articleTitle}
封面风格名称：${request.coverStyleName || "极简纸本公众号封面"}

文章全文：
${request.rawText}

请只返回 JSON，不要输出 Markdown 代码块，不要额外解释：
{
  "coverTheme": {
    "title": "必须使用文章原标题",
    "keywords": "关键词1 / 关键词2 / 关键词3",
    "direction": "封面的情绪和入口气质",
    "visualMetaphor": "封面的具体视觉隐喻"
  },
  "coverPlan": [
    {
      "index": 1,
      "title": "候选中心封面",
      "composition": "本候选的构图说明",
      "visualMetaphor": "本候选的视觉隐喻",
      "promptText": "只生成这一张封面图的完整绘图提示词，横版 900×383，只包含一个封面，不要拼接多候选"
    }
  ]
}

硬性要求：
- coverPlan 必须正好 3 条。
- 每条 promptText 只能生成一张独立公众号封面，不能写“三张候选”，不能让模型把多张拼到一张图。
- 标题必须使用文章原标题，不得改写，不得添加导语、摘要、副标题、作者名、日期或水印。
- 标题和主体视觉必须放在中心安全区，便于从大封面中心裁切小封面。
- 不要信息图，不要多段正文。`.trim();
}

export async function planWechatCoverWithLLM(
  request: CoverPlannerRequest
): Promise<CoverPlannerResponse> {
  const apiKey = requireEnv("AITECHFLUX_API_KEY");
  const baseUrl = process.env.AITECHFLUX_BASE_URL?.trim() || "https://aitechflux.com/v1";
  const model = process.env.AITECHFLUX_PLAN_MODEL?.trim() || "deepseek-v4-pro";

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content:
            "你是公众号封面文生文规划器，只返回 JSON。coverPlan 必须 3 条，每条是一张独立封面图的 promptText。",
        },
        {
          role: "user",
          content: buildCoverOnlyPrompt(request),
        },
      ],
    }),
  });

  const payload = (await response.json()) as ChatCompletionResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message || `封面规划接口失败: ${response.status}`);
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("封面规划接口没有返回内容");
  }

  const parsed = JSON.parse(extractJson(content)) as Omit<CoverPlannerResponse, "provider">;
  const fallback = planWechatCoverFromArticle(request);
  return {
    provider: "llm",
    coverTheme: {
      ...fallback.coverTheme,
      ...parsed.coverTheme,
      title: request.articleTitle,
    },
    coverPlan: parsed.coverPlan?.length === 3 ? parsed.coverPlan : fallback.coverPlan,
  };
}

function buildPrompt(request: PlannerRequest) {
  return `
下面有三套并列的运行版基座：
1. 公众号横版视觉图提示词生成器：用于拆公众号横版图，并按文章内容判断横版知识卡或横版氛围图。
2. 公众号正文配图提示词生成器：用于先生成正文配图文案 / 绘图指令，再交给文生图。
3. 公众号封面提示词生成器：用于生成 analysis.coverTheme.promptText。

三者不能混用。当前主链路面向公众号正文，不默认生成小红书 3:4 竖版图。

【公众号横版视觉图提示词生成器】

${buildInjectedGeneratorBase(request)}

【公众号正文配图提示词生成器】

${buildInjectedInlineImageBase(request)}

【公众号封面提示词生成器】

${buildInjectedCoverBase(request)}

请使用上面的生成器规则处理这篇文章，并额外遵守以下系统约束：
- 必须返回 JSON，不要输出 Markdown 代码块，不要输出额外解释。
- 卡片数量控制在 ${request.minCards}-${request.maxCards} 张。
- 拆卡策略偏好：${request.splitStrategy}。
- 每张卡的 promptText 是主产物，必须是完整绘图提示词，可以直接投喂绘图模型。
- 每张卡必须是独立完整的一张公众号横版图，不允许把多张卡合并到一张图。
- 必须先按整篇文章判断一次 visualType，整篇文章只能二选一：信息密度高、方法/结构/机制/步骤/对比明显时选 "knowledge_card"；叙事、情绪、场景、隐喻、过渡段明显时选 "atmosphere"。
- 同一篇文章内所有 cardPlan[].visualType 必须完全一致，不能有的图是知识卡、有的图是氛围图。
- analysis.imageGenerationSource.visualType 必须写入整篇文章的统一选择，analysis.imageGenerationSource.visualRationale 必须说明为什么整篇文章选这个图型。
- visualType = "knowledge_card" 时，每张图保留 2-4 个信息点，信息点要尽量来自原文，不要压缩成空泛金句。
- visualType = "atmosphere" 时，只表达一个情绪、场景或视觉隐喻，文字只保留标题和 0-1 句短标注，不要做多模块知识卡。
- 每条需要上图的文字都必须放在反引号里。
- 每条文字都要绑定具体插画描述。
- promptText 中的“整体风格说明”必须使用注入的视觉风格设定；如果有参考图，只作为风格、配色、构图参考，不要复制参考图里的文字。
- 正文配图必须先生成配图文案 / 绘图指令，也就是 inlineImagePlan[].promptText。
- 正文配图不是知识卡片，不是封面，不是海报；只规划 1-4 张，服务长文阅读节奏。
- 正文配图必须按“观点 / 流程 / 情绪 / 隐喻 / 方法动作”寻找认知锚点，每张图只表达一个锚点。
- 公众号封面必须生成 analysis.coverTheme.promptText，封面只做入口图，不做知识拆解，不做正文配图，不放多段正文。
- 封面标题必须使用文章原标题，不要改写，不要增加导语、摘要、副标题、日期、作者或水印。

文章标题：${request.articleTitle}
知识卡风格名称：${request.knowledgeCardStyleName}
正文配图风格名称：${request.inlineImageStyleName}
公众号封面风格名称：${request.coverStyleName || "极简纸本公众号封面"}
公众号横版图比例：${request.cardRatio}
公众号横版图尺寸：${request.cardWidth}x${request.cardHeight}

文章全文：
${request.rawText}

请按以下 JSON 结构返回：
{
  "analysis": {
    "imageGenerationSource": {
      "contentKind": "full-article-text",
      "strategy": "一句话说明这次拆图逻辑",
      "visualType": "knowledge_card",
      "visualRationale": "为什么整篇文章统一选择横版知识卡或横版氛围图"
    },
    "cardOutlineTitles": ["标题1", "标题2"],
    "keyQuotes": ["重点句1", "重点句2"],
    "coverTheme": {
      "title": "封面主题",
      "keywords": "关键词1 / 关键词2 / 关键词3",
      "direction": "封面的情绪和入口气质",
      "visualMetaphor": "封面的具体视觉隐喻",
      "promptText": "完整公众号封面绘图提示词，包含 3 张候选构图"
    }
  },
  "cardPlan": [
    {
      "index": 1,
      "title": "卡片标题",
      "summary": "卡片摘要",
      "visualType": "knowledge_card",
      "visualRationale": "为什么这一张应该做横版知识卡或横版氛围图",
      "promptText": "完整绘图提示词",
      "theme": "本张图主题",
      "layoutHint": "上下对比型",
      "textBlocks": ["信息点1", "信息点2", "信息点3"],
      "illustrationHints": ["插图提示1", "插图提示2", "插图提示3"],
      "titleVisualHint": "放在醒目的浅绿色圆角横幅内，旁边画一个相关简笔画插图",
      "contentSections": [
        {
          "name": "核心观点区",
          "position": "位于画面上半部分中心位置",
          "items": [
            {
              "text": "内容文字1",
              "illustration": "对应插画描述1"
            }
          ]
        }
      ],
      "decorationHint": "边框、箭头、分区等装饰建议",
      "endingLabel": "完结"
    }
  ],
  "inlineImagePlan": [
    {
      "index": 1,
      "sectionKey": "inline-1",
      "sectionHeading": "文章中的某个小节标题",
      "sectionType": "concept",
      "sectionTheme": "这一张图要表达的主题",
      "sectionKeywords": ["关键词1", "关键词2"],
      "sectionSummary": "这一节的简短摘要",
      "sectionQuote": "可选重点句，没有就留空字符串",
      "visualDirection": "这张图该怎么画，偏什么气质",
      "visualMetaphor": "这张图使用的具体视觉隐喻",
      "promptText": "完整公众号正文配图绘图提示词",
      "rationale": "为什么这一节需要配图，以及它应该承担什么作用"
    }
  ]
}
`.trim();
}

function extractJson(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) return objectMatch[0];
  throw new Error("LLM 返回里没有找到 JSON");
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`缺少环境变量 ${name}`);
  }
  return value;
}

export async function planCardsWithLLM(request: PlannerRequest): Promise<PlannerResponse> {
  const apiKey = requireEnv("AITECHFLUX_API_KEY");
  const baseUrl = process.env.AITECHFLUX_BASE_URL?.trim() || "https://aitechflux.com/v1";
  const model = process.env.AITECHFLUX_PLAN_MODEL?.trim() || "deepseek-v4-pro";

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "你是一个严格返回 JSON 的中文公众号横版视觉图提示词生成器。promptText 是最重要字段，必须像可直接投喂绘图模型的成熟提示词。visualType 只能是 knowledge_card 或 atmosphere；sectionType 只能是 concept、quote、method、transition。",
        },
        {
          role: "user",
          content: buildPrompt(request),
        },
      ],
    }),
  });

  const payload = (await response.json()) as ChatCompletionResponse;
  if (!response.ok) {
    throw new Error(payload.error?.message || `拆解接口失败: ${response.status}`);
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("拆解接口没有返回内容");
  }

  const parsed = JSON.parse(extractJson(content)) as Omit<PlannerResponse, "provider">;
  return {
    provider: "llm",
    ...attachExternalStyleGuide(parsed, request),
  };
}
