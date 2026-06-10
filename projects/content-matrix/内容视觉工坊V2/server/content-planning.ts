import type {
  PlannerRequest,
  PlannerResponse,
  SplitStrategy,
  WechatInlineSectionType,
} from "../src/app/content-planning";

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
  const sections = extractSections(request.rawText);
  const targetCount = resolveTargetCardCount(sections.length, request);
  const normalizedSections =
    sections.length > 0
      ? sections.slice(0, targetCount)
      : [{ heading: request.articleTitle || "文章主线", body: [request.rawText] }];

  const cardPlan = normalizedSections.map((section, index) => {
    const summarySource = cleanText(section.body.join(" ") || section.heading);
    const summary = summarySource.length > 54 ? `${summarySource.slice(0, 54)}…` : summarySource;
    const textBlocks = buildCardTextBlocks(section, section.heading, summary || section.heading);
    return {
      index: index + 1,
      title: section.heading || `知识卡 ${index + 1}`,
      summary: summary || "等待文章内容补充后再生成摘要。",
      layoutHint: buildCardLayoutHint(index, normalizedSections.length),
      textBlocks,
      illustrationHints: buildIllustrationHints(section.heading || `知识卡 ${index + 1}`, textBlocks),
      decorationHint: "使用分区框、箭头、便签和轻手绘装饰组织信息，避免堆成一段",
      endingLabel: index === normalizedSections.length - 1 ? "完结" : undefined,
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

  return {
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
  };
}

function buildPrompt(request: PlannerRequest) {
  return `
你是一个内容视觉策划助手。你的任务不是写文章，而是根据一篇已经写好的中文文章，输出知识卡片拆解方案、候选金句和正文配图规划。

请根据全文内容完成：
1. 判断适合拆成几张知识卡片
2. 为每张卡片生成标题
3. 为每张卡片生成一句摘要
3.1 为每张卡片生成 3-4 个可直接上图的简短信息点
3.2 为每张卡片生成一个构图提示
4. 提炼 1-3 句重点句
5. 生成一个封面主题和关键词
6. 规划公众号正文配图，决定哪些小节需要配图，并给出每张图的用途和视觉方向

必须返回 JSON，不要输出额外解释。

要求：
- 输出语言为中文
- 卡片数量控制在 ${request.minCards}-${request.maxCards} 张
- 拆卡策略偏好：${request.splitStrategy}
- 标题必须短、清楚、适合做视觉卡片标题
- 摘要是一句话，适合显示在工作台里
- 每张卡必须有 3-4 个信息点，不要只给空泛观点
- 每个信息点应尽量来自原文，不要改写成口号
- 每个信息点长度控制在 12-36 字，适合直接渲染到卡片
- 构图提示要像“上下对比型 / 原因拆解型 / 中心发散型 / 问题提出型”这种可执行描述
- 不要编造原文没有的观点
- 正文配图不是知识卡片，不是封面，不是海报
- 正文配图应优先对应文章里的 \`##\` 小节
- 不是每个小节都必须配图，按需要决定，控制在 1-4 张
- 配图要服务阅读节奏，不要让图抢掉正文中心

文章标题：${request.articleTitle}
知识卡风格参考：${request.knowledgeCardStyleName}
正文配图风格参考：${request.inlineImageStyleName}
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
      "layoutHint": "上下对比型",
      "textBlocks": ["信息点1", "信息点2", "信息点3"],
      "illustrationHints": ["插图提示1", "插图提示2", "插图提示3"],
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
            "你是一个严格返回 JSON 的中文内容视觉策划助手。sectionType 只能是 concept、quote、method、transition。",
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
    ...parsed,
  };
}
