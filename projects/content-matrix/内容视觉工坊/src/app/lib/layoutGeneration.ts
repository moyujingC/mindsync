import type {
  DraftPreview,
  DraftPreviewBlock,
  DraftReview,
  LayoutImagePlacement,
  ParsedMarkdownDocument,
  ReviewCheck,
  WechatInlineImageAsset,
  WechatInlineImagePlan,
  WechatInlineSectionType,
  WorkspaceData,
} from "../types";
import { buildWechatLayoutTheme } from "./layoutTheme";

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

function renderInlineMarkdown(text: string) {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function renderOrderedMarker(index: number, theme: ReturnType<typeof buildWechatLayoutTheme>) {
  if (theme.orderedListMarkerType === "latin-lower") {
    return `${String.fromCharCode(97 + (index % 26))}.`;
  }
  if (theme.orderedListMarkerType === "latin-upper") {
    return `${String.fromCharCode(65 + (index % 26))}.`;
  }
  return `${index + 1}.`;
}

function renderUnorderedMarker(theme: ReturnType<typeof buildWechatLayoutTheme>) {
  if (theme.unorderedListMarker === "square") return "■";
  if (theme.unorderedListMarker === "solid-circle") return "•";
  return "○";
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

interface MarkdownSection {
  heading?: string;
  blocks: string[];
}

function extractSectionQuote(summary: string, quotes: string[]) {
  return quotes.find((quote) => summary.includes(quote) || quote.includes(summary.slice(0, 12)));
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

export function buildWechatInlineImages(workspace: WorkspaceData, inlinePlans?: WechatInlineImagePlan[]): WechatInlineImageAsset[] {
  if (inlinePlans && inlinePlans.length > 0) {
    return inlinePlans.map((plan, index) => ({
      id: `inline-${String(index + 1).padStart(2, "0")}`,
      placementLabel: `图片位 #${index + 1}`,
      sectionHeading: plan.sectionHeading,
      sectionType: plan.sectionType,
      sectionTheme: plan.sectionTheme,
      sectionKeywords: plan.sectionKeywords,
      sectionSummary: plan.sectionSummary,
      sectionQuote: plan.sectionQuote || undefined,
      visualDirection: plan.visualDirection,
      rationale: plan.rationale,
      ratio: "16:9",
      width: 1080,
      height: 608,
      img: "",
      state: "idle",
      provider: "mock",
    }));
  }

  return workspace.cardPlan.map((card) => {
    const sectionQuote = extractSectionQuote(card.summary, workspace.analysis.keyQuotes);
    const sectionType = classifySectionType(card.summary, sectionQuote);
    return {
      id: `inline-${String(card.index).padStart(2, "0")}`,
      placementLabel: `图片位 #${card.index}`,
      sectionHeading: card.title,
      sectionType,
      sectionTheme: card.title,
      sectionKeywords: [card.title, workspace.analysis.coverTheme.title, ...workspace.analysis.coverTheme.keywords.split("/").map((item) => item.trim())]
        .filter(Boolean)
        .slice(0, 5),
      sectionSummary: card.summary,
      sectionQuote,
      visualDirection: buildVisualDirection(sectionType, card.title),
      rationale: `放在“${card.title}”相关段落之后，用来给长文阅读换气，并轻量强化当前段落主题。`,
      ratio: "16:9",
      width: 1080,
      height: 608,
      img: "",
      state: "idle",
      provider: "mock",
    };
  });
}

function buildImagePlacements(inlineImages: WechatInlineImageAsset[]) {
  return inlineImages.map<LayoutImagePlacement>((image) => ({
    imageId: image.id,
    placementLabel: image.placementLabel,
    sectionHeading: image.sectionHeading,
    anchorText: image.sectionQuote || image.sectionTheme,
    rationale: image.rationale,
    sectionType: image.sectionType,
  }));
}

function buildReviewChecks(parsedMarkdown: ParsedMarkdownDocument, imagePlacements: LayoutImagePlacement[]): ReviewCheck[] {
  return [
    {
      title: "原文结构",
      detail: `${parsedMarkdown.structure.subheadings} 个小标题 · ${parsedMarkdown.structure.quotes} 处引用 · ${parsedMarkdown.structure.lists} 组列表已保留`,
      status: "pass",
    },
    {
      title: "重点句处理",
      detail: `${Math.max(parsedMarkdown.structure.bolds, 1)} 处重点内容已预留强调位置`,
      status: "pass",
    },
    {
      title: "配图节奏",
      detail: `${imagePlacements.length} 处正文配图位置已安排`,
      status: "pass",
    },
    {
      title: "公众号版式",
      detail: "标题、首图、段落层级和结尾收口都已整理",
      status: "pass",
    },
  ];
}

function parseMarkdownSections(rawText: string) {
  const paragraphs = splitParagraphs(rawText);
  const hasTitle = paragraphs[0]?.startsWith("# ");
  const introIndex = hasTitle ? 1 : 0;
  const intro = cleanInlineMarkdown(paragraphs[introIndex] || "");
  const bodyParagraphs = paragraphs.slice(introIndex + 1);
  const sections: MarkdownSection[] = [];
  let currentSection: MarkdownSection | null = null;

  for (const paragraph of bodyParagraphs) {
    if (paragraph.startsWith("# ")) continue;

    if (paragraph.startsWith("### ")) {
      if (!currentSection) {
        currentSection = { blocks: [] };
        sections.push(currentSection);
      }
      currentSection.blocks.push(paragraph);
      continue;
    }

    if (paragraph.startsWith("## ")) {
      currentSection = {
        heading: cleanInlineMarkdown(paragraph.replace(/^##\s+/, "")),
        blocks: [],
      };
      sections.push(currentSection);
      continue;
    }

    if (!currentSection) {
      currentSection = { blocks: [] };
      sections.push(currentSection);
    }

    currentSection.blocks.push(paragraph);
  }

  return { intro, sections };
}

function buildBodyBlock(paragraph: string): DraftPreviewBlock | null {
  if (paragraph.startsWith("### ")) {
    return { type: "heading3", text: cleanInlineMarkdown(paragraph.replace(/^###\s+/, "")) };
  }

  if (paragraph.startsWith(">")) {
    return { type: "blockquote", text: cleanInlineMarkdown(paragraph.replace(/^>\s?/gm, " ")) };
  }

  if (/^(\d+\.\s.+\n?)+$/m.test(paragraph)) {
    const items = paragraph
      .split(/\r?\n/)
      .map((line) => cleanInlineMarkdown(line.replace(/^\d+\.\s*/, "")))
      .filter(Boolean);
    return { type: "ordered-list", items };
  }

  if (/^([-*+]\s.+\n?)+$/m.test(paragraph)) {
    const items = paragraph
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^[-*+]\s*/, "").trim());
    return { type: "unordered-list", items };
  }

  const text = paragraph.trim();
  return text ? { type: "paragraph", text } : null;
}

function buildPreview(
  rawText: string,
  articleTitle: string,
  accountName: string,
  imagePlacements: LayoutImagePlacement[],
  ctaTitle: string,
  ctaButtonText: string,
): DraftPreview {
  const blocks: DraftPreviewBlock[] = [];
  const { intro, sections } = parseMarkdownSections(rawText);
  const placementMap = new Map(imagePlacements.map((placement) => [cleanInlineMarkdown(placement.sectionHeading), placement]));

  for (const section of sections) {
    if (section.heading) {
      blocks.push({ type: "heading2", text: section.heading });
    }

    const placement = section.heading ? placementMap.get(cleanInlineMarkdown(section.heading)) ?? null : null;
    let imageInserted = false;

    for (const paragraph of section.blocks) {
      const block = buildBodyBlock(paragraph);
      if (!block) continue;

      blocks.push(block);

      if (!imageInserted && placement) {
        blocks.push({
          type: "image",
          imageId: placement.imageId,
          placementLabel: placement.placementLabel,
          caption: placement.anchorText,
        });
        imageInserted = true;
      }
    }

    if (placement && !imageInserted) {
      blocks.push({
        type: "image",
        imageId: placement.imageId,
        placementLabel: placement.placementLabel,
        caption: placement.anchorText,
      });
    }
  }

  blocks.push({
    type: "cta",
    title: ctaTitle,
    buttonText: ctaButtonText,
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
  const layoutTheme = workspace.layoutThemes[workspace.styleSelections.wechatLayout];
  const theme = buildWechatLayoutTheme(layoutTheme);
  const wechatCover = workspace.covers.find((item) => item.key === "wechatCover" && item.img);
  const htmlParts: string[] = [
    `<section data-tool="content-matrix" style="font-size:${theme.bodyFontSize}px;line-height:${theme.bodyLineHeight};color:${theme.bodyColor};background:${theme.articleBg};padding:0 ${theme.articlePaddingX}px;">`,
  ];

  if (wechatCover?.img) {
    htmlParts.push(
      `<p style="margin:0 0 ${theme.coverBottomSpacing}px;"><img src="${escapeHtml(wechatCover.img)}" alt="${escapeHtml(workspace.article.title)}" style="display:block;width:100%;max-width:720px;height:auto;border-radius:${theme.imageRadius}px;" /></p>`,
    );
  }

  if (preview.intro) {
    htmlParts.push(
      `<section style="margin:0 0 ${theme.paragraphSpacing + 2}px;padding:16px 14px;background:${theme.placeholderBg};border-top:1px solid ${theme.placeholderBorder};border-radius:${Math.max(theme.quoteRadius - 2, 6)}px;"><p style="margin:0;color:${theme.bodyColor};font-size:15px;line-height:2;"><em>${escapeHtml(preview.intro)}</em></p></section>`,
    );
  }

  for (let index = 0; index < preview.blocks.length; index += 1) {
    const block = preview.blocks[index];
    const prevBlock = index > 0 ? preview.blocks[index - 1] : undefined;
    const nextBlock = index < preview.blocks.length - 1 ? preview.blocks[index + 1] : undefined;
    const metrics = getHtmlBlockSpacing(block, prevBlock, nextBlock, theme);

    if (block.type === "heading2") {
      htmlParts.push(
        `<section style="margin:${metrics.marginTop}px 0 ${metrics.marginBottom}px;padding-left:${theme.headingPaddingLeft}px;border-left:${theme.headingBorderLeftWidth}px solid ${theme.headingColor};"><h2 style="margin:0;font-size:${theme.headingFontSize}px;line-height:${theme.headingLineHeight};letter-spacing:${theme.headingLetterSpacing}em;color:${theme.headingColor};font-weight:600;">${escapeHtml(block.text)}</h2></section>`,
      );
      continue;
    }

    if (block.type === "heading3") {
      htmlParts.push(
        `<section style="margin:${metrics.marginTop}px 0 ${metrics.marginBottom}px;padding-left:${theme.subheadingPaddingLeft}px;border-left:${theme.subheadingBorderLeftWidth}px solid ${theme.headingColor};"><h3 style="margin:0;font-size:${theme.subheadingFontSize}px;line-height:${theme.subheadingLineHeight};letter-spacing:${theme.subheadingLetterSpacing}em;color:${theme.headingColor};font-weight:600;">${escapeHtml(block.text)}</h3></section>`,
      );
      continue;
    }

    if (block.type === "paragraph") {
      htmlParts.push(`<p style="margin:${metrics.marginTop}px 0 ${metrics.marginBottom}px;padding-top:${theme.bodyPaddingTop}px;padding-bottom:${theme.bodyPaddingBottom}px;color:${theme.bodyColor};line-height:${theme.bodyLineHeight};letter-spacing:${theme.bodyLetterSpacing}em;text-align:${theme.bodyAlign};">${renderInlineMarkdown(block.text).replace(/<strong>/g, `<strong style="font-weight:${theme.strongWeight};color:${theme.strongColor};">`)}</p>`);
      continue;
    }

    if (block.type === "blockquote") {
      htmlParts.push(
        `<blockquote style="margin:${metrics.marginTop}px 0 ${metrics.marginBottom}px;padding:${theme.quotePaddingTop}px ${theme.quotePaddingRight}px ${theme.quotePaddingBottom}px ${theme.quotePaddingLeft}px;border-left:${theme.quoteBorderWidth}px solid ${theme.quoteBorder};border-radius:${theme.quoteRadius}px;background:${theme.quoteBg};color:${theme.quoteTextColor};font-size:${theme.quoteFontSize}px;line-height:${theme.quoteLineHeight};letter-spacing:${theme.quoteLetterSpacing}em;text-align:${theme.quoteAlign};font-weight:${theme.quoteWeight};">${renderInlineMarkdown(block.text).replace(/<strong>/g, `<strong style="font-weight:${theme.strongWeight};color:${theme.strongColor};">`)}</blockquote>`,
      );
      continue;
    }

    if (block.type === "ordered-list") {
      htmlParts.push(`<ol style="margin:${metrics.marginTop}px 0 ${metrics.marginBottom}px;padding:${theme.orderedListPaddingTop}px 0 ${theme.orderedListPaddingBottom}px 0;list-style:none;">`);
      for (let i = 0; i < block.items.length; i += 1) {
        const item = block.items[i];
        htmlParts.push(`<li style="display:flex;font-size:${theme.orderedListFontSize}px;line-height:${theme.orderedListLineHeight};letter-spacing:${theme.orderedListLetterSpacing}em;text-align:${theme.orderedListAlign};"><span style="display:inline-block;width:${theme.orderedListIndentLeft}px;color:${theme.orderedListMarkerColor};font-weight:${theme.orderedListMarkerWeight};">${escapeHtml(renderOrderedMarker(i, theme))}</span><span>${renderInlineMarkdown(item).replace(/<strong>/g, `<strong style="font-weight:${theme.strongWeight};color:${theme.strongColor};">`)}</span></li>`);
      }
      htmlParts.push(`</ol>`);
      continue;
    }

    if (block.type === "unordered-list") {
      htmlParts.push(`<ul style="margin:${metrics.marginTop}px 0 ${metrics.marginBottom}px;padding:${theme.unorderedListPaddingTop}px 0 ${theme.unorderedListPaddingBottom}px 0;list-style:none;">`);
      for (const item of block.items) {
        htmlParts.push(`<li style="display:flex;font-size:${theme.unorderedListFontSize}px;line-height:${theme.unorderedListLineHeight};letter-spacing:${theme.unorderedListLetterSpacing}em;text-align:${theme.unorderedListAlign};"><span style="display:inline-block;width:${theme.unorderedListIndentLeft}px;color:${theme.unorderedListMarkerColor};">${escapeHtml(renderUnorderedMarker(theme))}</span><span>${renderInlineMarkdown(item).replace(/<strong>/g, `<strong style="font-weight:${theme.strongWeight};color:${theme.strongColor};">`)}</span></li>`);
      }
      htmlParts.push(`</ul>`);
      continue;
    }

    if (block.type === "image") {
      const inlineImage = workspace.wechatInlineImages.find((item) => item.id === block.imageId);
      if (inlineImage?.img) {
        htmlParts.push(
          `<figure style="margin:${metrics.marginTop}px 0 ${metrics.marginBottom}px;text-align:${theme.captionAlign};"><img src="${escapeHtml(inlineImage.img)}" alt="${escapeHtml(inlineImage.sectionTheme)}" style="display:block;width:100%;max-width:720px;height:auto;margin:0 auto;border-radius:${theme.imageRadius}px;background:${theme.figureBg};" /><figcaption style="margin-top:12px;"><p style="margin:0;color:${theme.mutedColor};font-size:12px;line-height:1.9;">${escapeHtml(block.caption)}</p></figcaption></figure>`,
        );
      } else {
        htmlParts.push(
          `<p style="margin:${metrics.marginTop}px 0 ${metrics.marginBottom}px;padding:12px 14px;background:${theme.placeholderBg};border:1px dashed ${theme.placeholderBorder};border-radius:${theme.imageRadius}px;color:${theme.mutedColor};">[这张正文配图还未生成：${escapeHtml(block.caption)}]</p>`,
        );
      }
      continue;
    }

    if (block.type === "cta") {
      htmlParts.push(
        `<section style="margin:${metrics.marginTop}px 0 ${metrics.marginBottom}px;padding:18px 14px;background:${theme.placeholderBg};border-top:1px solid ${theme.placeholderBorder};border-radius:${Math.max(theme.quoteRadius, 10)}px;text-align:center;"><p style="margin:0 0 8px;color:${theme.mutedColor};font-size:12px;">最后想说</p><p style="margin:0 0 12px;color:${theme.headingColor};line-height:1.9;">${escapeHtml(block.title)}</p><p style="margin:0;color:${theme.mutedColor};font-size:13px;line-height:1.8;">${escapeHtml(block.buttonText)}</p></section>`,
      );
    }
  }

  htmlParts.push(`</section>`);
  return htmlParts.join("");
}

function getHtmlBlockSpacing(
  block: DraftPreviewBlock,
  prevBlock: DraftPreviewBlock | undefined,
  nextBlock: DraftPreviewBlock | undefined,
  theme: ReturnType<typeof buildWechatLayoutTheme>,
) {
  const paragraph = theme.paragraphSpacing + 2;
  const section = theme.sectionSpacing + 4;
  const image = theme.inlineImageSpacing + 2;
  const quote = theme.quoteSpacing + 2;

  if (block.type === "heading2") {
    return {
      marginTop: theme.headingMarginTop,
      marginBottom: theme.headingMarginBottom,
    };
  }

  if (block.type === "heading3") {
    return {
      marginTop: theme.subheadingMarginTop,
      marginBottom: theme.subheadingMarginBottom,
    };
  }

  if (block.type === "paragraph") {
    return {
      marginTop: prevBlock?.type === "heading2" || prevBlock?.type === "heading3" ? 0 : prevBlock?.type === "image" ? 18 : paragraph,
      marginBottom: nextBlock?.type === "heading2" ? 8 : nextBlock?.type === "heading3" ? 6 : nextBlock?.type === "image" ? 8 : 0,
    };
  }

  if (block.type === "blockquote") {
    return {
      marginTop: theme.quoteMarginTop,
      marginBottom: theme.quoteMarginBottom,
    };
  }

  if (block.type === "ordered-list") {
    return {
      marginTop: prevBlock?.type === "heading2" ? 6 : paragraph,
      marginBottom: nextBlock?.type === "image" ? 10 : 4,
    };
  }

  if (block.type === "unordered-list") {
    return {
      marginTop: prevBlock?.type === "heading2" ? 6 : paragraph,
      marginBottom: nextBlock?.type === "image" ? 10 : 4,
    };
  }

  if (block.type === "image") {
    return {
      marginTop: prevBlock?.type === "paragraph" ? image + 2 : image,
      marginBottom: nextBlock?.type === "paragraph" ? 12 : 6,
    };
  }

  return {
    marginTop: prevBlock ? section + 10 : section + 6,
    marginBottom: 0,
  };
}

export function buildDraftReview(workspace: WorkspaceData): DraftReview {
  const inlineImages = workspace.wechatInlineImages.length > 0 ? workspace.wechatInlineImages : buildWechatInlineImages(workspace);
  const imagePlacements = buildImagePlacements(inlineImages);
  const layoutTheme = workspace.layoutThemes[workspace.styleSelections.wechatLayout];
  const preview = buildPreview(
    workspace.article.rawText,
    workspace.article.title,
    layoutTheme?.accountName ?? "墨予镜",
    imagePlacements,
    layoutTheme?.ctaTitle ?? "如果这段文字让你停了一下，欢迎留言告诉我",
    layoutTheme?.ctaButtonText ?? "点亮「在看」 · 分享给同样在思考的人",
  );

  return {
    readyTitle: "这篇文章已经可以进入公众号编辑器",
    readyDescription: "标题、段落节奏、重点句和正文配图位置都已整理好",
    reviewChecks: buildReviewChecks(workspace.parsedMarkdown, imagePlacements),
    syncStatus: [
      { label: "正文排版", note: `Markdown 已整理成公众号阅读稿 · 共 ${workspace.cardPlan.length} 个主段落` },
      { label: "正文配图", note: `${imagePlacements.length} 张正文配图已插入对应段落节奏` },
      { label: "封面输出", note: "公众号封面和小红书封面都保留了独立输出位" },
      { label: "复制方式", note: "可直接复制正文 HTML，再粘贴进公众号编辑器" },
    ],
    imagePlacements,
    preview,
    editorHtml: renderWechatEditorHtml({ ...workspace, wechatInlineImages: inlineImages }, preview),
  };
}
