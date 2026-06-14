import type { PlannerResponse, WechatInlineImagePlan, WechatInlineSectionType } from "../types";

function extractSections(rawText: string) {
  const lines = rawText.split(/\r?\n/);
  const sections: Array<{ heading: string; body: string[] }> = [];
  let current: { heading: string; body: string[] } | null = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      current = { heading: line.replace(/^##\s+/, "").trim(), body: [] };
      sections.push(current);
      continue;
    }

    if (current) {
      current.body.push(line);
    }
  }

  return sections;
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

function classifySectionType(summary: string, quote?: string): WechatInlineSectionType {
  if (quote) return "quote";
  if (/^\d+\./m.test(summary) || /练习|步骤|方法|建议|清单/.test(summary)) return "method";
  if (/判断力|提问|留白|筛选|边界|表达|思考/.test(summary)) return "concept";
  return "transition";
}

function buildVisualDirection(sectionType: WechatInlineSectionType, sectionTheme: string) {
  if (sectionType === "quote") {
    return `围绕“${sectionTheme}”做轻观点感的编辑插图，不做大字海报，更像杂志内页的安静观点图。`;
  }
  if (sectionType === "method") {
    return `围绕“${sectionTheme}”表达方法感、秩序感和结构感，但不要做步骤罗列或教程卡片。`;
  }
  if (sectionType === "transition") {
    return `围绕“${sectionTheme}”做阅读换气图，强调停顿感、留白感和节奏缓冲，不承载完整信息。`;
  }
  return `围绕“${sectionTheme}”做抽象概念意象图，安静、克制、有人文思考感。`;
}

function pickKeyQuotes(rawText: string) {
  const quoteBlocks = rawText
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith(">"))
    .map((line) => cleanText(line.replace(/^>\s?/, "")));

  const boldSnippets = Array.from(rawText.matchAll(/\*\*([^*]+)\*\*/g)).map((match) => cleanText(match[1]));

  return [...quoteBlocks, ...boldSnippets].filter(Boolean).slice(0, 3);
}

export function planKnowledgeCardsFromArticle(rawText: string): Omit<PlannerResponse, "provider"> {
  const sections = extractSections(rawText);

  const cardPlan: CardPlan[] = sections.slice(0, 6).map((section, index) => {
    const summarySource = cleanText(section.body.join(" "));
    const summary = summarySource.length > 54 ? `${summarySource.slice(0, 54)}…` : summarySource;

    return {
      index: index + 1,
      title: section.heading || `卡片 ${index + 1}`,
      summary,
    };
  });

  const keyQuotes = pickKeyQuotes(rawText);
  const firstTitle = cardPlan[0]?.title || "文章主观点";
  const inlineImagePlan: WechatInlineImagePlan[] = cardPlan.map((card) => {
    const sectionQuote = keyQuotes.find((quote) => card.summary.includes(quote) || quote.includes(card.summary.slice(0, 12)));
    const sectionType = classifySectionType(card.summary, sectionQuote);

    return {
      sectionHeading: card.title,
      sectionType,
      sectionTheme: card.title,
      sectionKeywords: [card.title, firstTitle, ...keyQuotes].filter(Boolean).slice(0, 5),
      sectionSummary: card.summary,
      sectionQuote,
      visualDirection: buildVisualDirection(sectionType, card.title),
      rationale: `放在“${card.title}”这一节的前半段后，用来给长文阅读换气，并轻量强化当前段落主题。`,
    };
  });

  return {
    analysis: {
      imageGenerationSource: {
        contentKind: "full-article-text",
        strategy: `当前使用本地规划器基于全文拆成 ${cardPlan.length} 张卡片；后续可替换为真实大模型拆图服务。`,
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
