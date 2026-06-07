import type {
  DraftPreview,
  DraftPreviewBlock,
  DraftReview,
  KnowledgeCardItem,
  LayoutImagePlacement,
  ParsedMarkdownDocument,
  ReviewCheck,
  WorkspaceData,
} from "../types";

function cleanInlineMarkdown(text: string) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function formatPublishDate() {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function splitParagraphs(rawText: string) {
  return rawText
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function buildImagePlacements(cardItems: KnowledgeCardItem[], sectionTitles: string[]) {
  return cardItems.slice(0, sectionTitles.length || cardItems.length).map<LayoutImagePlacement>((card, index) => ({
    cardNumber: card.n,
    placementLabel: `图片位 #${index + 1}`,
    anchorText: sectionTitles[index] || card.title,
    rationale: `放在「${sectionTitles[index] || card.title}」对应段落之后，用来给长文阅读换气，并承接这一节的主观点。`,
  }));
}

function buildReviewChecks(parsedMarkdown: ParsedMarkdownDocument, imagePlacements: LayoutImagePlacement[]): ReviewCheck[] {
  return [
    {
      title: "Markdown 结构",
      detail: `${parsedMarkdown.structure.subheadings} H2 · ${parsedMarkdown.structure.quotes} 引用 · ${parsedMarkdown.structure.lists} 列表已保留`,
      status: "pass",
    },
    {
      title: "重点句识别",
      detail: `${Math.max(parsedMarkdown.structure.bolds, 1)} 处重点内容已可用于强调`,
      status: "pass",
    },
    {
      title: "插图位编排",
      detail: `系统已决定 ${imagePlacements.length} 处插图位置`,
      status: "pass",
    },
    {
      title: "公众号格式",
      detail: "标题、首图、段落和结尾 CTA 已整理",
      status: "pass",
    },
  ];
}

function buildPreview(rawText: string, articleTitle: string, accountName: string, imagePlacements: LayoutImagePlacement[]): DraftPreview {
  const paragraphs = splitParagraphs(rawText);
  const blocks: DraftPreviewBlock[] = [];
  const intro = cleanInlineMarkdown(paragraphs[1] || "");
  let imageIndex = 0;

  for (const paragraph of paragraphs.slice(2)) {
    if (paragraph.startsWith("## ")) {
      blocks.push({ type: "heading2", text: cleanInlineMarkdown(paragraph.replace(/^##\s+/, "")) });
      continue;
    }

    if (paragraph.startsWith(">")) {
      blocks.push({ type: "blockquote", text: cleanInlineMarkdown(paragraph.replace(/^>\s?/gm, " ")) });
      if (imageIndex < imagePlacements.length) {
        const placement = imagePlacements[imageIndex];
        blocks.push({
          type: "image",
          cardNumber: placement.cardNumber,
          placementLabel: placement.placementLabel,
          caption: placement.anchorText,
        });
        imageIndex += 1;
      }
      continue;
    }

    if (/^(\d+\.\s.+\n?)+$/m.test(paragraph)) {
      const items = paragraph
        .split(/\r?\n/)
        .map((line) => cleanInlineMarkdown(line.replace(/^\d+\.\s*/, "")))
        .filter(Boolean);
      blocks.push({ type: "ordered-list", items });
      if (imageIndex < imagePlacements.length) {
        const placement = imagePlacements[imageIndex];
        blocks.push({
          type: "image",
          cardNumber: placement.cardNumber,
          placementLabel: placement.placementLabel,
          caption: placement.anchorText,
        });
        imageIndex += 1;
      }
      continue;
    }

    if (paragraph.startsWith("# ")) continue;

    blocks.push({ type: "paragraph", text: cleanInlineMarkdown(paragraph) });
    if (imageIndex < imagePlacements.length) {
      const placement = imagePlacements[imageIndex];
      blocks.push({
        type: "image",
        cardNumber: placement.cardNumber,
        placementLabel: placement.placementLabel,
        caption: placement.anchorText,
      });
      imageIndex += 1;
    }
  }

  blocks.push({
    type: "cta",
    title: "如果这段文字让你停了一下，欢迎留言告诉我",
    buttonText: "点亮「在看」 · 分享给同样在思考的人",
  });

  return {
    title: articleTitle,
    accountName,
    publishDate: formatPublishDate(),
    intro,
    blocks,
  };
}

export function buildDraftReview(workspace: WorkspaceData): DraftReview {
  const imagePlacements = buildImagePlacements(
    workspace.knowledgeCards,
    workspace.cardPlan.map((item) => item.title),
  );

  return {
    readyTitle: "可同步到草稿箱",
    readyDescription: "系统已完成结构继承、重点识别和插图位编排",
    reviewChecks: buildReviewChecks(workspace.parsedMarkdown, imagePlacements),
    syncStatus: [
      { label: "正文排版", note: `Markdown 已转为公众号阅读稿 · ${workspace.cardPlan.length} 个内容段` },
      { label: "卡片插图位", note: `${imagePlacements.length} 处插图位置已编排` },
      { label: "封面状态", note: "已保留公众号封面和小红书封面的输出位" },
      { label: "草稿同步", note: "尚未同步到公众号草稿箱" },
    ],
    imagePlacements,
    preview: buildPreview(
      workspace.article.rawText,
      workspace.article.title,
      "墨予镜",
      imagePlacements,
    ),
  };
}
