// 从「骨架库」反推风格 token（颜色/字号/间距/边框），供小红书 SVG 卡片使用。
//
// 公众号渲染用完整 HTML 骨架（100% 复刻）；小红书是「重新排版成 3:4 卡片」，
// 无法用 HTML 骨架，只能从骨架里抽关键数值（正文色/字号/行高、标题色/字号/左边框、
// 强调色、引用色），再按小红书视口整体放大。

import { pickSkeleton } from "./skeleton.mjs";

function pick(html, re) {
  const m = html.match(re);
  return m ? m[1].trim() : null;
}
const num = (html, prop) => pick(html, new RegExp(`${prop}\\s*:\\s*([\\d.]+)`));

// 提取「color 属性」值：用负向断言排除 border-color/background-color 等
// （color 前面不能是字母或 -），且跳过 rgba/transparent（通常是边框/背景透明色）。
function textColor(html) {
  const matches = [...html.matchAll(/(?<![-\w])color\s*:\s*([^;"']+)/g)].map((m) => m[1].trim());
  for (const c of matches) if (!/^rgba|transparent/i.test(c)) return c;
  return matches[0] || null;
}

// 从骨架库提取 token 并缩放到 viewport（默认小红书 bodySize=34）。
export function extractStyleTokens(lib, viewport = { bodySize: 34 }) {
  const tokens = {
    colors: { title: "#303543", heading: "#6E7FA8", body: "#393D49", strong: "#333333", meta: "#A8B1C4", blockBg: "#F0F3FA" },
    bodySize: 16,
    lineHeight: 1.8,
    letterSpacing: 0,
    headingSize: 20,
    headingTop: 30,
    headingBottom: 15,
    headingBorder: null,
    strongColor: "#333333",
    strongWeight: 700,
    quoteColor: "#666666",
    quoteSize: 16,
    paraGap: 10,
  };

  // paragraph → 正文基准
  const para = pickSkeleton(lib, "paragraph");
  if (para) {
    const s = para.skeleton;
    const c = textColor(s); if (c) tokens.colors.body = c;
    const fs = num(s, "font-size"); if (fs) tokens.bodySize = parseFloat(fs);
    // 行高：px → 比例（除以正文字号），em/比例 → 直接比例
    const lhM = s.match(/line-height\s*:\s*([\d.]+)(px|em|%)?/);
    if (lhM) {
      const v = parseFloat(lhM[1]);
      tokens.lineHeight = lhM[2] === "px" ? v / tokens.bodySize : lhM[2] === "%" ? v / 100 : v;
    }
    const ls = num(s, "letter-spacing"); if (ls != null) tokens.letterSpacing = parseFloat(ls);
    // 段间距：优先上下 padding（墨予镜 padding:8px 0），否则 margin-top
    const pt = num(s, "padding-top");
    const pb = num(s, "padding-bottom");
    if (pt != null || pb != null) tokens.paraGap = (parseFloat(pt ?? 0) + parseFloat(pb ?? 0)) || 10;
    else {
      const mt = num(s, "margin-top"); if (mt != null) tokens.paraGap = parseFloat(mt);
    }
  }

  // heading → 标题（字号取骨架里最大值，标题 > 正文）
  const heading = pickSkeleton(lib, "heading");
  if (heading) {
    const s = heading.skeleton;
    const c = textColor(s); if (c) tokens.colors.heading = c;
    const sizes = [...s.matchAll(/font-size\s*:\s*([\d.]+)px/g)].map((m) => parseFloat(m[1]));
    if (sizes.length) tokens.headingSize = Math.max(...sizes);
    const mt = num(s, "margin-top"); if (mt != null) tokens.headingTop = parseFloat(mt);
    const mb = num(s, "margin-bottom"); if (mb != null) tokens.headingBottom = parseFloat(mb);
    const bl = s.match(/border-left\s*:\s*([\d.]+)px\s+(\w+)\s+([^;"']+)/);
    if (bl) tokens.headingBorder = { side: "left", width: parseFloat(bl[1]), style: bl[2], color: bl[3] };
  }

  // 强调
  const strong = lib.inline?.strong;
  if (strong?.color) { tokens.colors.strong = strong.color; tokens.strongColor = strong.color; }
  if (strong?.weight) tokens.strongWeight = strong.weight === "bold" ? 700 : parseInt(strong.weight, 10) || 700;

  // 引用（文字色在内部 p，不在 blockquote 容器的 border/背景色）
  const quote = pickSkeleton(lib, "quote");
  if (quote) {
    const c = textColor(quote.skeleton); if (c) tokens.quoteColor = c;
    const fs = num(quote.skeleton, "font-size"); if (fs) tokens.quoteSize = parseFloat(fs);
  }

  // 图注色（image 骨架里的小字号灰色 p）
  const image = pickSkeleton(lib, "image");
  if (image) {
    const c = image.skeleton.match(/color\s*:\s*(#(?:[0-9a-fA-F]{3}){1,2}|rgb\([^)]*\))/);
    if (c) tokens.colors.meta = c[1];
  }

  // 标题色 = 标题/强调色（封面大字用）
  tokens.colors.title = tokens.colors.heading;

  // 整体缩放（公众号 bodySize → 小红书 viewport.bodySize）
  const base = tokens.bodySize || 16;
  const scale = viewport.bodySize / base;
  tokens.bodySize = viewport.bodySize;
  tokens.headingSize = Math.round(tokens.headingSize * scale);
  tokens.quoteSize = Math.round(tokens.quoteSize * scale);
  tokens.headingTop = Math.round(tokens.headingTop * scale);
  tokens.headingBottom = Math.round(tokens.headingBottom * scale);
  tokens.paraGap = Math.round(tokens.paraGap * scale);
  tokens.letterSpacing = Math.round(tokens.letterSpacing * scale);
  if (tokens.headingBorder) tokens.headingBorder.width = Math.max(1, Math.round(tokens.headingBorder.width * scale));

  return tokens;
}
