import OpenAI from "openai";
import type { PlannerRequest, PlannerResponse } from "./plannerTypes";

function buildPrompt(request: PlannerRequest) {
  return `
你是一个内容视觉策划助手。你的任务不是写文章，而是根据一篇已经写好的中文文章，输出知识卡片拆图方案和封面主题。

请根据我提供的全文内容，完成：
1. 判断适合拆成几张知识卡片
2. 为每张卡片生成标题
3. 为每张卡片生成一句摘要
4. 提炼 1-3 句重点句
5. 生成一个封面主题和关键词
6. 规划公众号正文配图，决定哪些小节需要配图，并给出每张图的用途和视觉方向

必须返回 JSON，不要输出额外解释。

要求：
- 输出语言为中文
- 卡片数量控制在 3-6 张
- 标题必须短、清楚、适合做视觉卡片标题
- 摘要是一句话，适合显示在工作台里
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
      "summary": "卡片摘要"
    }
  ],
  "inlineImagePlan": [
    {
      "sectionHeading": "文章中的某个 H2 小节标题",
      "sectionType": "concept",
      "sectionTheme": "这一张图要表达的主题",
      "sectionKeywords": ["关键词1", "关键词2"],
      "sectionSummary": "这一节的简短摘要",
      "sectionQuote": "可选的重点句，没有就留空字符串",
      "visualDirection": "这张图该怎么画，偏什么气质",
      "rationale": "为什么这一节需要配图，以及它应该放在这里承担什么作用"
    }
  ]
}
`.trim();
}

function extractJson(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) {
    return objectMatch[0];
  }

  throw new Error("No JSON payload found in LLM response");
}

export async function planCardsWithLLM(request: PlannerRequest): Promise<PlannerResponse> {
  const apiKey = process.env.AITECHFLUX_API_KEY;
  if (!apiKey) {
    throw new Error("Missing AITECHFLUX_API_KEY");
  }

  const baseURL = process.env.AITECHFLUX_BASE_URL || "https://aitechflux.com/v1";
  const model = process.env.AITECHFLUX_PLAN_MODEL || "deepseek-v4-pro";

  const client = new OpenAI({
    apiKey,
    baseURL,
  });

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: "你是一个严格返回 JSON 的中文内容视觉策划助手。sectionType 只能是 concept、quote、method、transition。",
      },
      {
        role: "user",
        content: buildPrompt(request),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty completion content");
  }

  const parsed = JSON.parse(extractJson(content)) as Omit<PlannerResponse, "provider">;

  return {
    provider: "llm",
    ...parsed,
  };
}
