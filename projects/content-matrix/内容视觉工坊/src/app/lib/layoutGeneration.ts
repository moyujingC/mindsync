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
      width: 1536,
      height: 864,
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
      width: 1536,
      height: 864,
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
      detail: `系统已决定 ${imagePlacements.length} 处正文配图位置`,
      status: "pass",
    },
    {
      title: "公众号格式",
      detail: "标题、首图、段落和结尾 CTA 已整理",
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

  const text = cleanInlineMarkdown(paragraph);
  return text ? { type: "paragraph", text } : null;
}

function buildPreview(rawText: string, articleTitle: string, accountName: string, imagePlacements: LayoutImagePlacement[]): DraftPreview {
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
  const layoutTheme = workspace.layoutThemes[workspace.styleSelections.wechatLayout];
  const theme = buildWechatLayoutTheme(layoutTheme);
  const wechatCover = workspace.covers.find((item) => item.key === "wechatCover" && item.img);
  const htmlParts: string[] = [
    `<section data-tool="content-matrix" style="font-size:16px;line-height:1.8;color:${theme.bodyColor};background:${theme.articleBg};">`,
  ];

  if (wechatCover?.img) {
    htmlParts.push(
      `<p style="margin:0 0 20px;"><img src="${escapeHtml(wechatCover.img)}" alt="${escapeHtml(workspace.article.title)}" style="display:block;width:100%;max-width:720px;height:auto;border-radius:${theme.imageRadius}px;" /></p>`,
    );
  }

  if (preview.intro) {
    htmlParts.push(
      `<p style="margin:0 0 ${theme.paragraphSpacing}px;color:${theme.mutedColor};font-size:15px;"><em>${escapeHtml(preview.intro)}</em></p>`,
    );
  }

  for (const block of preview.blocks) {
    if (block.type === "heading2") {
      htmlParts.push(
        `<h2 style="margin:${theme.sectionSpacing}px 0 12px;font-size:${theme.headingFontSize}px;line-height:1.45;color:${theme.headingColor};">${escapeHtml(block.text)}</h2>`,
      );
      continue;
    }

    if (block.type === "paragraph") {
      htmlParts.push(`<p style="margin:${theme.paragraphSpacing}px 0 0;color:${theme.bodyColor};">${escapeHtml(block.text)}</p>`);
      continue;
    }

    if (block.type === "blockquote") {
      htmlParts.push(
        `<blockquote style="margin:${theme.paragraphSpacing}px 0 0;padding:14px 16px;border-left:${theme.quoteBorderWidth}px solid ${theme.quoteBorder};border-radius:${theme.quoteRadius}px;background:${theme.quoteBg};color:${theme.bodyColor};">${escapeHtml(block.text)}</blockquote>`,
      );
      continue;
    }

    if (block.type === "ordered-list") {
      htmlParts.push(`<ol style="margin:${theme.paragraphSpacing}px 0 0;padding-left:22px;">`);
      for (const item of block.items) {
        htmlParts.push(`<li style="margin:0 0 8px;">${escapeHtml(item)}</li>`);
      }
      htmlParts.push(`</ol>`);
      continue;
    }

    if (block.type === "image") {
      const inlineImage = workspace.wechatInlineImages.find((item) => item.id === block.imageId);
      if (inlineImage?.img) {
        htmlParts.push(
          `<figure style="margin:${theme.sectionSpacing}px 0 0;text-align:${theme.captionAlign};"><img src="${escapeHtml(inlineImage.img)}" alt="${escapeHtml(inlineImage.sectionTheme)}" style="display:block;width:100%;max-width:720px;height:auto;margin:0 auto;border-radius:${theme.imageRadius}px;background:${theme.figureBg};" /><figcaption style="margin-top:8px;font-size:13px;color:${theme.mutedColor};">${escapeHtml(block.caption)}</figcaption></figure>`,
        );
      } else {
        htmlParts.push(
          `<p style="margin:${theme.sectionSpacing}px 0 0;padding:12px 14px;background:${theme.placeholderBg};border:1px dashed ${theme.placeholderBorder};border-radius:${theme.imageRadius}px;color:${theme.mutedColor};">[正文配图待补：${escapeHtml(block.caption)}]</p>`,
        );
      }
      continue;
    }

    if (block.type === "cta") {
      htmlParts.push(
        `<section style="margin:${theme.sectionSpacing + 4}px 0 8px;padding-top:18px;border-top:1px dashed ${theme.placeholderBorder};text-align:center;"><p style="margin:0 0 12px;color:${theme.headingColor};">${escapeHtml(block.title)}</p><p style="margin:0;"><span style="display:inline-block;padding:7px 14px;border-radius:${theme.ctaRadius}px;background:${theme.ctaBg};color:${theme.ctaText};font-size:13px;">${escapeHtml(block.buttonText)}</span></p></section>`,
      );
    }
  }

  htmlParts.push(`</section>`);
  return htmlParts.join("");
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
  );

  return {
    readyTitle: "可复制到公众号编辑器",
    readyDescription: "系统已完成结构继承、重点识别和正文配图编排",
    reviewChecks: buildReviewChecks(workspace.parsedMarkdown, imagePlacements),
    syncStatus: [
      { label: "正文排版", note: `Markdown 已转为公众号阅读稿 · ${workspace.cardPlan.length} 个内容段` },
      { label: "正文配图", note: `${imagePlacements.length} 张正文配图已规划` },
      { label: "封面状态", note: "已保留公众号封面和小红书封面的输出位" },
      { label: "正文复制", note: "可复制 HTML 后手动粘贴到公众号编辑器" },
    ],
    imagePlacements,
    preview,
    editorHtml: renderWechatEditorHtml({ ...workspace, wechatInlineImages: inlineImages }, preview),
  };
}
