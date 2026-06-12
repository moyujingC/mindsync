import type {
  PlannerRequest,
  PlannerResponse,
  SplitStrategy,
  WechatInlineSectionType,
} from "../src/app/content-planning";
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

const DEFAULT_KNOWLEDGE_CARD_STYLE_GUIDE = `视觉风格：蓝雾静读 · 手绘知识卡

整体风格：
在手绘涂鸦笔记 / Sketchnote 的信息组织方式上，降低饱和度和可爱感，偏安静、专业、疗愈。

背景：
浅绿米白渐变为主，可加入少量雾蓝、灰白、浅暖灰。

配色：
草绿、天蓝、暖黄为基础，但整体压低饱和度；深绿或深灰蓝用于轮廓和重点文字。

字体：
清晰可辨的中文手写体风格，不能花哨，优先保证可读性。

限制：
不要科技霓虹，不要儿童贴纸感，不要营销海报感，不要复杂装饰。`;

function resolveKnowledgeCardStyleGuide(request: PlannerRequest) {
  return request.knowledgeCardStyleGuide?.trim() || DEFAULT_KNOWLEDGE_CARD_STYLE_GUIDE;
}

function renderReferenceImages(request: PlannerRequest) {
  const images = request.knowledgeCardReferenceImages?.filter((item) => item.url?.trim()) ?? [];
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
    .replace("{{REFERENCE_IMAGES}}", renderReferenceImages(request));
}

function attachExternalStyleGuideToPromptText(promptText: string | undefined, request: PlannerRequest) {
  const source = promptText?.trim() || "";
  const appendix = `## 外挂视觉风格设定（必须遵守）

${resolveKnowledgeCardStyleGuide(request)}

${renderReferenceImages(request)}`;

  if (!source) return appendix;
  if (source.includes("## 外挂视觉风格设定")) return source;
  return `${source}

${appendix}`;
}

function attachExternalStyleGuide(response: Omit<PlannerResponse, "provider">, request: PlannerRequest) {
  return {
    ...response,
    cardPlan: response.cardPlan.map((card) => ({
      ...card,
      promptText: attachExternalStyleGuideToPromptText(card.promptText, request),
    })),
  };
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
}) {
  const indexLabel = String(cardIndex).padStart(2, "0");
  const totalLabel = String(cardTotal).padStart(2, "0");

  return `【文字渲染规则 - 严格遵守】
（以下规则适用于豆包/即梦等国内绘画AI模型，使用Google/nano banana pro等工具可忽略）
只渲染提示词中用反引号 \`\` 明确标注的文字内容，原样呈现。
凡是提示词中没有用反引号标注的地方，一律不得自行添加任何文字、字母、数字或符号。
图标、插画、装饰元素可以自由发挥，但不得在其上附加任何未经指定的文字。

---

【第${cardIndex}张图 - 独立完整的一张图，单独占据一个完整的3:4竖版画布，请勿与其他图合并】

## 整体风格说明（与本系列所有图保持一致）

整体风格：手绘涂鸦笔记 (Sketchnote) 风格，所有线条和图形带有轻微手绘感，不要过于僵硬和完美

画幅比例：独立的3:4竖版（宽750px × 高1000px 或等比例）

${styleGuide}

${referenceImages}

字体：清晰可辨的中文手写体风格

系列标识：右上角标注序号"${indexLabel}/${totalLabel}"

---

## 本张图内容

主题：${cardTheme}

构图：${cardLayoutHint}

标题区（画面顶部15-20%）：
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

export function planKnowledgeCardsFromArticle(
  request: PlannerRequest
): Omit<PlannerResponse, "provider"> {
  const styleGuide = resolveKnowledgeCardStyleGuide(request);
  const referenceImages = renderReferenceImages(request);
  const sections = extractSections(request.rawText);
  const targetCount = resolveTargetCardCount(sections.length, request);
  const normalizedSections =
    sections.length > 0
      ? sections.slice(0, targetCount)
      : [{ heading: request.articleTitle || "文章主线", body: [request.rawText] }];

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
  const inlineImagePlan = cardPlan.slice(0, 3).map((card) => {
    const sectionQuote = keyQuotes.find(
      (quote) => card.summary.includes(quote) || quote.includes(card.summary.slice(0, 12))
    );
    const sectionType = classifySectionType(card.summary, sectionQuote);

    return {
      sectionHeading: card.title,
      sectionType,
      sectionTheme: card.title,
      sectionKeywords: [card.title, firstTitle, ...keyQuotes].filter(Boolean).slice(0, 5),
      sectionSummary: card.summary,
      sectionQuote,
      visualDirection: buildVisualDirection(sectionType, card.title),
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
        strategy: `当前由模型策略“${splitStrategyLabel[request.splitStrategy]}”在 ${request.minCards}-${request.maxCards} 张范围内自动拆解，本次得到 ${cardPlan.length} 张知识卡。`,
      },
      cardOutlineTitles: cardPlan.map((card) => card.title),
      keyQuotes,
      coverTheme: {
        title: firstTitle.replace(/^一[、.·]\s*/, ""),
        keywords: keyQuotes.join(" / ") || firstTitle,
      },
    },
    cardPlan,
    inlineImagePlan,
  }, request);
}

function buildPrompt(request: PlannerRequest) {
  return `
下面是知识卡片提示词生成器的运行版基座。它保留原教程的拆分规则、构图库、输出流程和代码块模板；视觉风格库已经移除，改为注入“视觉风格设定”和可选参考图。

${buildInjectedGeneratorBase(request)}

请使用上面的生成器规则处理这篇文章，并额外遵守以下系统约束：
- 必须返回 JSON，不要输出 Markdown 代码块，不要输出额外解释。
- 卡片数量控制在 ${request.minCards}-${request.maxCards} 张。
- 拆卡策略偏好：${request.splitStrategy}。
- 每张卡的 promptText 是主产物，必须是完整绘图提示词，可以直接投喂绘图模型。
- 每张卡必须是独立完整的一张 3:4 竖版图，不允许把多张卡合并到一张图。
- 每张卡保留 3-4 个信息点，信息点要尽量来自原文，不要压缩成空泛金句。
- 每条需要上图的文字都必须放在反引号里。
- 每条文字都要绑定具体插画描述。
- promptText 中的“整体风格说明”必须使用注入的视觉风格设定；如果有参考图，只作为风格、配色、构图参考，不要复制参考图里的文字。
- 正文配图不是知识卡片，不是封面，不是海报；只规划 1-4 张，服务长文阅读节奏。

文章标题：${request.articleTitle}
知识卡风格名称：${request.knowledgeCardStyleName}
正文配图风格名称：${request.inlineImageStyleName}
卡片比例：${request.cardRatio}
卡片尺寸：${request.cardWidth}x${request.cardHeight}

文章全文：
${request.rawText}

请按以下 JSON 结构返回：
{
  "analysis": {
    "imageGenerationSource": {
      "contentKind": "full-article-text",
      "strategy": "一句话说明这次拆图逻辑"
    },
    "cardOutlineTitles": ["标题1", "标题2"],
    "keyQuotes": ["重点句1", "重点句2"],
    "coverTheme": {
      "title": "封面主题",
      "keywords": "关键词1 / 关键词2 / 关键词3"
    }
  },
  "cardPlan": [
    {
      "index": 1,
      "title": "卡片标题",
      "summary": "卡片摘要",
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
      "sectionHeading": "文章中的某个小节标题",
      "sectionType": "concept",
      "sectionTheme": "这一张图要表达的主题",
      "sectionKeywords": ["关键词1", "关键词2"],
      "sectionSummary": "这一节的简短摘要",
      "sectionQuote": "可选重点句，没有就留空字符串",
      "visualDirection": "这张图该怎么画，偏什么气质",
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
            "你是一个严格返回 JSON 的中文知识卡片提示词生成器。promptText 是最重要字段，必须像可直接投喂绘图模型的成熟提示词。sectionType 只能是 concept、quote、method、transition。",
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
