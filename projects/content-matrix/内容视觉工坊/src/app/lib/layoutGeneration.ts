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

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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

function renderWechatEditorHtml(workspace: WorkspaceData, preview: DraftPreview) {
  const wechatCover = workspace.covers.find((item) => item.key === "wechatCover" && item.img);
  const htmlParts: string[] = [
    `<section data-tool="content-matrix" style="font-size:16px;line-height:1.8;color:#222222;">`,
  ];

  if (wechatCover?.img) {
    htmlParts.push(
      `<p style="margin:0 0 20px;"><img src="${escapeHtml(wechatCover.img)}" alt="${escapeHtml(workspace.article.title)}" style="display:block;width:100%;max-width:720px;height:auto;border-radius:6px;" /></p>`,
    );
  }

  if (preview.intro) {
    htmlParts.push(
      `<p style="margin:0 0 18px;color:#666666;font-size:15px;"><em>${escapeHtml(preview.intro)}</em></p>`,
    );
  }

  for (const block of preview.blocks) {
    if (block.type === "heading2") {
      htmlParts.push(
        `<h2 style="margin:28px 0 12px;font-size:22px;line-height:1.45;color:#1f3a36;">${escapeHtml(block.text)}</h2>`,
      );
      continue;
    }

    if (block.type === "paragraph") {
      htmlParts.push(`<p style="margin:0 0 18px;">${escapeHtml(block.text)}</p>`);
      continue;
    }

    if (block.type === "blockquote") {
      htmlParts.push(
        `<blockquote style="margin:20px 0;padding:14px 16px;border-left:4px solid #1f3a36;background:#f6f2e8;color:#3a3a3a;">${escapeHtml(block.text)}</blockquote>`,
      );
      continue;
    }

    if (block.type === "ordered-list") {
      htmlParts.push(`<ol style="margin:0 0 18px;padding-left:22px;">`);
      for (const item of block.items) {
        htmlParts.push(`<li style="margin:0 0 8px;">${escapeHtml(item)}</li>`);
      }
      htmlParts.push(`</ol>`);
      continue;
    }

    if (block.type === "image") {
      const card = workspace.knowledgeCards.find((item) => item.n === block.cardNumber);
      if (card?.img) {
        htmlParts.push(
          `<figure style="margin:24px 0;text-align:center;"><img src="${escapeHtml(card.img)}" alt="${escapeHtml(card.title)}" style="display:block;width:100%;max-width:640px;height:auto;margin:0 auto;border-radius:6px;" /><figcaption style="margin-top:8px;font-size:13px;color:#888888;">${escapeHtml(block.caption)}</figcaption></figure>`,
        );
      } else {
        htmlParts.push(
          `<p style="margin:18px 0;padding:12px 14px;background:#faf6ee;border:1px dashed #d8cfbd;color:#8a7f6b;">[图片待补：${escapeHtml(block.caption)}]</p>`,
        );
      }
      continue;
    }

    if (block.type === "cta") {
      htmlParts.push(
        `<section style="margin:32px 0 8px;padding-top:18px;border-top:1px dashed #d8cfbd;text-align:center;"><p style="margin:0 0 12px;color:#1f3a36;">${escapeHtml(block.title)}</p><p style="margin:0;"><span style="display:inline-block;padding:7px 14px;border-radius:999px;background:#1f3a36;color:#ffffff;font-size:13px;">${escapeHtml(block.buttonText)}</span></p></section>`,
      );
    }
  }

  htmlParts.push(`</section>`);
  return htmlParts.join("");
}

export function buildDraftReview(workspace: WorkspaceData): DraftReview {
  const imagePlacements = buildImagePlacements(
    workspace.knowledgeCards,
    workspace.cardPlan.map((item) => item.title),
  );

  const preview = buildPreview(
    workspace.article.rawText,
    workspace.article.title,
    "墨予镜",
    imagePlacements,
  );

  return {
    readyTitle: "可同步到草稿箱",
    readyDescription: "系统已完成结构继承、重点识别和插图位编排",
    reviewChecks: buildReviewChecks(workspace.parsedMarkdown, imagePlacements),
    syncStatus: [
      { label: "正文排版", note: `Markdown 已转为公众号阅读稿 · ${workspace.cardPlan.length} 个内容段` },
      { label: "卡片插图位", note: `${imagePlacements.length} 处插图位置已编排` },
      { label: "封面状态", note: "已保留公众号封面和小红书封面的输出位" },
      { label: "正文复制", note: "可复制 HTML 后手动粘贴到公众号编辑器" },
    ],
    imagePlacements,
    preview,
    editorHtml: renderWechatEditorHtml(workspace, preview),
  };
}
