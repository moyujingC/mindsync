import type { DraftPreview, DraftPreviewBlock, WorkspaceData } from "../types";

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInlineMarkdown(text: string) {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

interface WechatTypographyPresetV2 {
  articlePaddingX: number;
  introStyle: string;
  paragraphStyle: string;
  primaryHeadingWrapperStyle: string;
  primaryHeadingContentStyle: string;
  secondaryHeadingWrapperStyle: string;
  secondaryHeadingContentStyle: string;
  strongStyle: string;
  orderedListStyle: string;
  orderedListItemStyle: string;
  orderedMarkerStyle: string;
  unorderedListStyle: string;
  unorderedListItemStyle: string;
  unorderedMarkerStyle: string;
  blockquoteStyle: string;
  imageFigureStyle: string;
  imageStyle: string;
  imageCaptionStyle: string;
  ctaWrapperStyle: string;
  ctaEyebrowStyle: string;
  ctaTitleStyle: string;
  ctaBodyStyle: string;
}

function buildPresetV2(): WechatTypographyPresetV2 {
  return {
    articlePaddingX: 10,
    introStyle:
      "color: rgb(51, 51, 51); font-size: 16px; line-height: 1.8em; letter-spacing: 0em; text-align: left; text-indent: 0em; margin-top: 0px; margin-bottom: 0px; margin-left: 0px; margin-right: 0px; padding-top: 8px; padding-bottom: 8px; padding-left: 0px; padding-right: 0px;",
    paragraphStyle:
      "color: rgb(51, 51, 51); font-size: 16px; line-height: 1.8em; letter-spacing: 0em; text-align: left; text-indent: 0em; margin-top: 0px; margin-bottom: 0px; margin-left: 0px; margin-right: 0px; padding-top: 8px; padding-bottom: 8px; padding-left: 0px; padding-right: 0px;",
    primaryHeadingWrapperStyle:
      "margin-top: 30px; margin-bottom: 15px; margin-left: 0px; margin-right: 0px; padding-top: 0px; padding-bottom: 0px; padding-left: 0px; padding-right: 0px; display: block;",
    primaryHeadingContentStyle:
      "font-size: 24px; color: rgb(110, 127, 168); line-height: 1.5em; letter-spacing: 0em; text-align: left; font-weight: bold; display: block;",
    secondaryHeadingWrapperStyle:
      "margin-top: 30px; margin-bottom: 15px; margin-left: 0px; margin-right: 0px; padding-top: 0px; padding-bottom: 0px; padding-left: 10px; padding-right: 0px; border-left: 4px solid rgb(110, 127, 168); display: block;",
    secondaryHeadingContentStyle:
      "font-size: 18px; color: rgb(110, 127, 168); line-height: 1.8em; letter-spacing: 0em; text-align: left; font-weight: bold; display: block;",
    strongStyle:
      "color: rgba(51, 51, 51, 0.96); font-weight: bold; background-color: rgba(255, 255, 255, 0);",
    orderedListStyle:
      "margin-top: 8px; margin-bottom: 4px; margin-left: 0px; margin-right: 0px; padding-top: 8px; padding-bottom: 8px; padding-left: 0px; padding-right: 0px; list-style: none;",
    orderedListItemStyle:
      "display: flex; color: rgb(51, 51, 51); font-size: 16px; line-height: 1.8em; letter-spacing: 0em; text-align: left; padding-top: 0px; padding-bottom: 0px;",
    orderedMarkerStyle:
      "display: inline-block; width: 25px; color: rgb(1, 1, 1); font-weight: 400; flex: none;",
    unorderedListStyle:
      "margin-top: 8px; margin-bottom: 4px; margin-left: 0px; margin-right: 0px; padding-top: 8px; padding-bottom: 8px; padding-left: 0px; padding-right: 0px; list-style: none;",
    unorderedListItemStyle:
      "display: flex; color: rgb(51, 51, 51); font-size: 16px; line-height: 1.8em; letter-spacing: 0em; text-align: left; padding-top: 0px; padding-bottom: 0px;",
    unorderedMarkerStyle:
      "display: inline-block; width: 25px; color: rgb(1, 1, 1); flex: none;",
    blockquoteStyle:
      "margin-top: 20px; margin-bottom: 20px; margin-left: 0px; margin-right: 0px; padding-top: 16px; padding-bottom: 16px; padding-left: 18px; padding-right: 12px; border-left: 4px solid rgb(110, 127, 168); background-color: rgb(247, 249, 253); color: rgb(102, 102, 102); font-size: 16px; line-height: 1.8em; letter-spacing: 0em; text-align: left;",
    imageFigureStyle:
      "margin-top: 24px; margin-bottom: 12px; margin-left: 0px; margin-right: 0px; text-align: center;",
    imageStyle:
      "display: block; width: 100%; max-width: 720px; height: auto; margin: 0 auto; border-radius: 8px;",
    imageCaptionStyle:
      "margin-top: 12px; margin-bottom: 0px; color: rgb(102, 102, 102); font-size: 12px; line-height: 1.9em; text-align: center;",
    ctaWrapperStyle:
      "margin-top: 28px; margin-bottom: 0px; margin-left: 0px; margin-right: 0px; padding-top: 18px; padding-bottom: 18px; padding-left: 14px; padding-right: 14px; background-color: rgb(247, 249, 253); border-top: 1px solid rgb(221, 227, 240); border-radius: 10px; text-align: center;",
    ctaEyebrowStyle:
      "margin-top: 0px; margin-bottom: 8px; color: rgb(102, 102, 102); font-size: 12px; line-height: 1.8em;",
    ctaTitleStyle:
      "margin-top: 0px; margin-bottom: 12px; color: rgb(110, 127, 168); font-size: 16px; line-height: 1.8em; font-weight: bold;",
    ctaBodyStyle:
      "margin-top: 0px; margin-bottom: 0px; color: rgb(102, 102, 102); font-size: 13px; line-height: 1.8em;",
  };
}

function normalizeLeftAlign(styleText: string) {
  if (!styleText) return styleText;
  if (/text-align\s*:/i.test(styleText)) {
    return styleText.replace(/text-align\s*:\s*[^;]+/i, "text-align: left");
  }
  return `${styleText}; text-align: left`;
}

function readStyleFromNode(root: ParentNode, selector: string, options?: { mergeContent?: boolean }) {
  const node = root.querySelector(selector);
  if (!node) return "";

  const ownStyle = node.getAttribute("style")?.trim() ?? "";
  if (!options?.mergeContent) return ownStyle;

  const contentStyle =
    (node.querySelector(".content") as Element | null)?.getAttribute("style")?.trim() ??
    node.firstElementChild?.getAttribute("style")?.trim() ??
    "";

  return [ownStyle, contentStyle].filter(Boolean).join("; ");
}

function buildPresetFromImportedHtml(html: string) {
  if (typeof DOMParser === "undefined" || !html.trim()) return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const preset = buildPresetV2();

  const paragraphStyle = readStyleFromNode(doc.body, "p");
  const primaryHeadingWrapperStyle = readStyleFromNode(doc.body, "h1");
  const primaryHeadingContentStyle = readStyleFromNode(doc.body, "h1", { mergeContent: true });
  const secondaryHeadingWrapperStyle = readStyleFromNode(doc.body, "h2");
  const secondaryHeadingContentStyle = readStyleFromNode(doc.body, "h2", { mergeContent: true });
  const strongStyle = readStyleFromNode(doc.body, "strong");
  const blockquoteStyle = readStyleFromNode(doc.body, "blockquote");
  const orderedListStyle = readStyleFromNode(doc.body, "ol");
  const orderedListItemStyle = readStyleFromNode(doc.body, "ol li");
  const unorderedListStyle = readStyleFromNode(doc.body, "ul");
  const unorderedListItemStyle = readStyleFromNode(doc.body, "ul li");

  return {
    ...preset,
    paragraphStyle: paragraphStyle ? normalizeLeftAlign(paragraphStyle) : preset.paragraphStyle,
    introStyle: paragraphStyle ? normalizeLeftAlign(paragraphStyle) : preset.introStyle,
    primaryHeadingWrapperStyle: primaryHeadingWrapperStyle || preset.primaryHeadingWrapperStyle,
    primaryHeadingContentStyle: primaryHeadingContentStyle || preset.primaryHeadingContentStyle,
    secondaryHeadingWrapperStyle: secondaryHeadingWrapperStyle || preset.secondaryHeadingWrapperStyle,
    secondaryHeadingContentStyle: secondaryHeadingContentStyle || preset.secondaryHeadingContentStyle,
    strongStyle: strongStyle || preset.strongStyle,
    blockquoteStyle: blockquoteStyle ? normalizeLeftAlign(blockquoteStyle) : preset.blockquoteStyle,
    orderedListStyle: orderedListStyle || preset.orderedListStyle,
    orderedListItemStyle: orderedListItemStyle ? normalizeLeftAlign(orderedListItemStyle) : preset.orderedListItemStyle,
    unorderedListStyle: unorderedListStyle || preset.unorderedListStyle,
    unorderedListItemStyle: unorderedListItemStyle ? normalizeLeftAlign(unorderedListItemStyle) : preset.unorderedListItemStyle,
  };
}

function renderPrimaryHeading(text: string, preset: WechatTypographyPresetV2) {
  return `<h1 data-tool="content-matrix-v2" style="${preset.primaryHeadingWrapperStyle}"><span class="prefix" style="display: none;"></span><span class="content" style="${preset.primaryHeadingContentStyle}">${escapeHtml(text)}</span><span class="suffix" style="display: none;"></span></h1>`;
}

function renderSecondaryHeading(text: string, preset: WechatTypographyPresetV2) {
  return `<h2 data-tool="content-matrix-v2" style="${preset.secondaryHeadingWrapperStyle}"><span class="prefix" style="display: none;"></span><span class="content" style="${preset.secondaryHeadingContentStyle}">${escapeHtml(text)}</span><span class="suffix" style="display: none;"></span></h2>`;
}

function renderParagraph(text: string, preset: WechatTypographyPresetV2) {
  return `<p data-tool="content-matrix-v2" style="${preset.paragraphStyle}">${renderInlineMarkdown(text).replace(/<strong>/g, `<strong style="${preset.strongStyle}">`)}</p>`;
}

function renderOrderedList(items: string[], preset: WechatTypographyPresetV2) {
  const parts = [`<ol data-tool="content-matrix-v2" style="${preset.orderedListStyle}">`];
  for (let i = 0; i < items.length; i += 1) {
    parts.push(
      `<li style="${preset.orderedListItemStyle}"><span style="${preset.orderedMarkerStyle}">${String.fromCharCode(97 + (i % 26))}.</span><span>${renderInlineMarkdown(items[i]).replace(/<strong>/g, `<strong style="${preset.strongStyle}">`)}</span></li>`,
    );
  }
  parts.push("</ol>");
  return parts.join("");
}

function renderUnorderedList(items: string[], preset: WechatTypographyPresetV2) {
  const parts = [`<ul data-tool="content-matrix-v2" style="${preset.unorderedListStyle}">`];
  for (const item of items) {
    parts.push(
      `<li style="${preset.unorderedListItemStyle}"><span style="${preset.unorderedMarkerStyle}">◦</span><span>${renderInlineMarkdown(item).replace(/<strong>/g, `<strong style="${preset.strongStyle}">`)}</span></li>`,
    );
  }
  parts.push("</ul>");
  return parts.join("");
}

function renderBlock(block: DraftPreviewBlock, workspace: WorkspaceData, preset: WechatTypographyPresetV2) {
  if (block.type === "heading2") return renderPrimaryHeading(block.text, preset);
  if (block.type === "heading3") return renderSecondaryHeading(block.text, preset);
  if (block.type === "paragraph") return renderParagraph(block.text, preset);
  if (block.type === "blockquote") {
    return `<blockquote data-tool="content-matrix-v2" style="${preset.blockquoteStyle}">${renderInlineMarkdown(block.text).replace(/<strong>/g, `<strong style="${preset.strongStyle}">`)}</blockquote>`;
  }
  if (block.type === "ordered-list") return renderOrderedList(block.items, preset);
  if (block.type === "unordered-list") return renderUnorderedList(block.items, preset);
  if (block.type === "image") {
    const inlineImage = workspace.wechatInlineImages.find((item) => item.id === block.imageId);
    if (!inlineImage?.img) {
      return `<p data-tool="content-matrix-v2" style="${preset.paragraphStyle}">[这张正文配图还未生成：${escapeHtml(block.caption)}]</p>`;
    }

    return `<figure data-tool="content-matrix-v2" style="${preset.imageFigureStyle}"><img src="${escapeHtml(inlineImage.img)}" alt="${escapeHtml(inlineImage.sectionTheme)}" style="${preset.imageStyle}" /><figcaption><p style="${preset.imageCaptionStyle}">${escapeHtml(block.caption)}</p></figcaption></figure>`;
  }
  if (block.type === "cta") {
    return `<section data-tool="content-matrix-v2" style="${preset.ctaWrapperStyle}"><p style="${preset.ctaEyebrowStyle}">最后想说</p><p style="${preset.ctaTitleStyle}">${escapeHtml(block.title)}</p><p style="${preset.ctaBodyStyle}">${escapeHtml(block.buttonText)}</p></section>`;
  }
  return "";
}

export function renderWechatEditorHtmlV2(workspace: WorkspaceData, preview: DraftPreview) {
  const preset = workspace.wechatEditorImportSummary?.html
    ? buildPresetFromImportedHtml(workspace.wechatEditorImportSummary.html) ?? buildPresetV2()
    : buildPresetV2();
  const parts: string[] = [
    `<section id="nice" data-tool="content-matrix-v2" style="margin-top: 0px; margin-bottom: 0px; margin-left: 0px; margin-right: 0px; padding-top: 0px; padding-bottom: 0px; padding-left: ${preset.articlePaddingX}px; padding-right: ${preset.articlePaddingX}px; background-attachment: scroll; background-clip: border-box; background-color: rgba(0, 0, 0, 0); background-image: none; background-origin: padding-box; background-position-x: left; background-position-y: top; background-repeat: no-repeat; background-size: auto; width: auto; font-family: Optima, 'Microsoft YaHei', PingFangSC-regular, serif; font-size: 16px; color: rgb(0, 0, 0); line-height: 1.5em; word-spacing: 0em; letter-spacing: 0em; word-break: break-word; overflow-wrap: break-word; text-align: left;">`,
  ];

  if (preview.intro) {
    parts.push(`<p data-tool="content-matrix-v2" style="${preset.introStyle}">${escapeHtml(preview.intro)}</p>`);
  }

  for (const block of preview.blocks) {
    parts.push(renderBlock(block, workspace, preset));
  }

  parts.push("</section>");
  return parts.join("");
}
