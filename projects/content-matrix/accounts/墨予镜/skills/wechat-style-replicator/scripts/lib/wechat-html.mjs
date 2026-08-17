// 抽自 内容视觉工坊V2/src/app/components/wechat-layout.tsx
// 文章块 → 公众号草稿 HTML（内联 style，可复制粘贴到公众号编辑器）。
// 注意：块渲染一律紧凑单行，避免模板字符串里的换行/缩进空白被浏览器
// （或微信编辑器）折叠成段首/段尾的多余空格。

import { escapeHtml, inlineMarkdownToHtml } from "./wechat-blocks.mjs";

// template: resolveWechatTemplate 生成的 style 字符串集合
//   { containerStyle, titleStyle, metaStyle, primaryHeadingStyle, secondaryHeadingStyle,
//     paragraphStyle, quoteStyle, noteStyle, eyebrowStyle, figcaptionStyle }
export function buildWechatArticleHtml(template, title, blocks, coverImageUrl, inlineImageMap) {
  const imageMap = inlineImageMap ?? new Map();
  const strongStyle = template.strongStyle || {};
  const coverHtml = coverImageUrl
    ? `<figure style="margin:18px 0 22px;text-align:center;"><img src="${escapeHtml(coverImageUrl)}" alt="公众号封面预览" style="display:block;width:100%;height:auto;margin:0 auto;border-radius:8px;object-fit:cover;background:#f0f3fa;" /></figure>`
    : "";

  const blocksHtml = blocks
    .map((block) => {
      if (block.type === "paragraph") {
        return `<p style="${template.paragraphStyle}">${inlineMarkdownToHtml(block.text, strongStyle)}</p>`;
      }

      if (block.type === "quote") {
        return `<blockquote style="${template.quoteStyle}">${inlineMarkdownToHtml(block.text, strongStyle)}</blockquote>`;
      }

      if (block.type === "list") {
        const tag = block.ordered ? "ol" : "ul";
        const items = block.items
          .map((item) => `<li style="margin:0 0 8px;padding-left:2px;">${inlineMarkdownToHtml(item, strongStyle)}</li>`)
          .join("");
        return `<${tag} style="${template.paragraphStyle}padding-left:1.35em;">${items}</${tag}>`;
      }

      if (block.type === "image") {
        const inlineImageUrl =
          block.imageUrl || (block.sectionKey ? imageMap.get(block.sectionKey) ?? null : null);
        const img = inlineImageUrl
          ? `<img src="${escapeHtml(inlineImageUrl)}" alt="${escapeHtml(block.label)}" style="display:block;width:100%;max-width:720px;height:auto;margin:0 auto;border-radius:8px;object-fit:cover;background:#f0f3fa;" />`
          : `<div style="aspect-ratio:16/9;border-radius:8px;background:linear-gradient(160deg,#DCE5EE 0%,#B9C7D5 100%);"></div>`;
        return `<figure style="margin:26px 0 12px;text-align:center;">${img}<figcaption style="${template.figcaptionStyle}">${escapeHtml(block.label)}</figcaption></figure>`;
      }

      if (block.type === "heading") {
        const isPrimary = block.level === "primary";
        const tag = isPrimary ? "h2" : "h3";
        const headingStyle = isPrimary ? template.primaryHeadingStyle : template.secondaryHeadingStyle;
        const bodyHtml = block.body
          ? `<p style="${template.paragraphStyle}">${inlineMarkdownToHtml(block.body, strongStyle)}</p>`
          : "";
        return `<${tag} style="${headingStyle}">${escapeHtml(block.title)}</${tag}>${bodyHtml}`;
      }

      return "";
    })
    .join("");

  const titleHtml = title ? `<h1 style="${template.titleStyle}">${escapeHtml(title)}</h1>` : "";
  return `<section data-tool="moyujing-wechat-article" style="${template.containerStyle}">${titleHtml}${coverHtml}${blocksHtml}</section>`;
}
