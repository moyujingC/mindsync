import type { ArticleAnalysis, CardPlan, PlannerResponse } from "../types";

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
  };
}
