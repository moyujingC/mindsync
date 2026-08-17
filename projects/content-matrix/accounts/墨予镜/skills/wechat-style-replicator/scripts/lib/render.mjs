// 骨架库 + 成稿正文 → 公众号草稿 HTML（内联样式）。
// 供 render-wechat.mjs（落盘预览）与 publish-draft.mjs（直发草稿箱）共用，
// 保证两处渲染结果一致。

import { buildWechatArticleBlocks, inlineMarkdownToHtml, escapeHtml } from "./wechat-blocks.mjs";
import { pickSkeleton, fillSkeleton, fillListSkeleton } from "./skeleton.mjs";

// markdown 正文 + 骨架库 → 完整正文 HTML（含外层容器包裹）。
export function renderArticleBody(body, lib) {
  const blocks = buildWechatArticleBlocks(body);
  const strongStyle = lib.inline?.strong ?? {};
  const blocksHtml = blocks.map((block) => renderBlock(block, lib, strongStyle)).filter(Boolean).join("\n");
  return lib.container ? lib.container.replace("{{content}}", blocksHtml) : blocksHtml;
}

// 单块 → HTML。有骨架用骨架，无骨架降级到简单兜底。
function renderBlock(block, lib, strongStyle) {
  const html = (raw) => inlineMarkdownToHtml(raw, strongStyle);

  if (block.type === "paragraph") {
    const skel = pickSkeleton(lib, "paragraph");
    return skel
      ? fillSkeleton(skel.skeleton, { text: html(block.text) })
      : `<p style="margin:10px 0;font-size:16px;line-height:1.8;color:#333;">${html(block.text)}</p>`;
  }

  if (block.type === "quote") {
    const skel = pickSkeleton(lib, "quote");
    if (!skel) {
      return `<blockquote style="margin:16px 0;padding:10px 16px;border-left:3px solid #bbb;color:#666;">${html(block.text)}</blockquote>`;
    }
    const paras = block.text.split("\n").map((t) => t.trim()).filter(Boolean);
    const texts = paras.length ? paras.map(html) : [html(block.text)];
    return fillSkeleton(skel.skeleton, { text: texts });
  }

  if (block.type === "list") {
    const skel = pickSkeleton(lib, "list");
    if (!skel) {
      const tag = block.ordered ? "ol" : "ul";
      const items = block.items.map((it) => `<li>${html(it)}</li>`).join("");
      return `<${tag} style="margin:10px 0;padding-left:1.4em;font-size:16px;line-height:1.8;color:#333;">${items}</${tag}>`;
    }
    return fillListSkeleton(skel.skeleton, skel.listItem, block.items.map(html));
  }

  if (block.type === "image") {
    const skel = pickSkeleton(lib, "image");
    const url = block.imageUrl || "";
    if (!skel) {
      return `<p style="text-align:center;margin:20px 0;"><img src="${escapeHtml(url)}" alt="${escapeHtml(block.label)}" style="max-width:100%;height:auto;" /></p>`;
    }
    return fillSkeleton(skel.skeleton, { imgUrl: url });
  }

  if (block.type === "heading") {
    const skel = pickSkeleton(lib, "heading");
    if (!skel) {
      const tag = block.level === "primary" ? "h2" : "h3";
      return `<${tag} style="margin:24px 0 12px;font-size:20px;font-weight:bold;color:#333;">${escapeHtml(block.title)}</${tag}>`;
    }
    return fillSkeleton(skel.skeleton, { text: escapeHtml(block.title) });
  }

  return "";
}
