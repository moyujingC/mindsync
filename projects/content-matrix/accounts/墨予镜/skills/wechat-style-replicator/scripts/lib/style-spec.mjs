// 排版风格规格：抽取 + 视口自适应。
// 核心思路：风格存「比例化 token」（字号用相对正文字号的比例），
// 切换视口 = 换正文字号基准，比例不变。公众号视口 bodySize≈16，小红书视口 bodySize≈34。

import { parse } from "node-html-parser";

// 默认风格（账号现有「蓝雾静读版」），作为抽取 fallback。
export const DEFAULT_SPEC = {
  name: "蓝雾静读版",
  source: "",
  colors: {
    title: "#303543",             // 主标题/一级标题（H1）
    heading: "#6e7fa8",           // 小节标题 primary（蓝雾）
    headingSecondary: "#6e7fa8",  // 子标题 secondary（独立键，避免被 primary 覆盖）
    body: "#393d49",              // 正文
    strong: "#333333",            // 加粗强调
    meta: "#a8b1c4",              // 辅助/图注
    blockBg: "#f0f3fa",           // 引用块背景
    quoteBorder: "#bfbfbf",       // 引用块左边框色
    quoteText: "#666666",         // 引用块文字色
  },
  typography: {
    body: { size: 16, lineHeight: 1.8, weight: 400, letterSpacing: 0 },
    title: { sizeRatio: 1.5, color: "title", weight: 700, border: null },
    headingPrimary: { sizeRatio: 1.5, color: "heading", weight: 600, border: null },
    headingSecondary: { sizeRatio: 1.25, color: "headingSecondary", weight: 600, border: null },
    strong: { color: "strong", weight: 700 },
    quote: { sizeRatio: 1.0, color: "quoteText", weight: 400, borderColor: "quoteBorder", borderWidth: 3 },
  },
  spacing: {
    paraGap: 18,           // 段落上边距 margin-top（px，公众号视口基准）
    paraPadding: 8,        // 段落上下内边距 padding-top/bottom（px）
    headingTop: 30,        // 标题上边距 margin-top（px）
    headingBottom: 15,     // 标题下边距 margin-bottom（px）
    containerPadding: 0,   // 容器左右内边距 padding-left/right（px）
  },
};

// ---------- 抽取 ----------

// 从公众号 content.html 抽取风格，归一化为比例化 token。
// meta: { name, source } 可选元信息。
export function extractStyleSpec(html, meta = {}) {
  const spec = structuredClone(DEFAULT_SPEC);
  spec.name = meta.name || "未命名风格";
  spec.source = meta.source || "";

  let root;
  try {
    root = parse(html);
  } catch {
    return spec;
  }

  const styleOf = (node) => {
    const s = node.getAttribute && node.getAttribute("style");
    return s ? parseStyleString(s) : {};
  };
  const css = (node, prop) => styleOf(node)[prop];
  const px = (node, prop) => parsePx(css(node, prop));
  const weightOf = (node) => normalizeWeight(css(node, "font-weight"));

  const ps = root.querySelectorAll("p");
  const strongs = root.querySelectorAll("strong");
  const quotes = root.querySelectorAll("blockquote");
  const h1s = root.querySelectorAll("h1");
  const h2s = root.querySelectorAll("h2");
  const h3s = root.querySelectorAll("h3");

  // 正文
  const bodySize = mode(ps.map((n) => px(n, "font-size")));
  const bodyLineHeight = mode(ps.map((n) => css(n, "line-height")));
  const bodyColor = mode(ps.map((n) => normalizeColor(css(n, "color"))));
  const bodyWeight = mode(ps.map((n) => weightOf(n)));
  const bodyLetterSpacing = mode(ps.map((n) => parsePx(css(n, "letter-spacing"))));

  if (bodySize) spec.typography.body.size = bodySize;
  if (bodyLineHeight) {
    spec.typography.body.lineHeight = parseLineHeight(bodyLineHeight, bodySize || 16);
  }
  if (bodyColor) spec.colors.body = bodyColor;
  if (bodyWeight) spec.typography.body.weight = bodyWeight;
  if (bodyLetterSpacing != null) spec.typography.body.letterSpacing = bodyLetterSpacing;

  // 段落上下边距/内边距（段间距、段内留白）
  const paraMarginTop = mode(ps.map((n) => boxValue(styleOf(n), "margin", "top")));
  const paraPaddingTop = mode(ps.map((n) => boxValue(styleOf(n), "padding", "top")));
  if (paraMarginTop != null) spec.spacing.paraGap = paraMarginTop;
  if (paraPaddingTop != null) spec.spacing.paraPadding = paraPaddingTop;

  // 小节标题：公众号正文里 h2 优先（原生编辑器惯例，h1 是文章主标题），
  // 无 h2 时才用 h1（mdnice 编辑器用小节标题导出为 h1）。
  const base = bodySize || 16;
  const primaryNodes = h2s.length ? h2s : h1s;
  const secondaryNodes = h3s.length ? h3s : [];

  // 原生排版（有 h2）时，h1 是文章主标题，单独抽到 title
  if (h2s.length && h1s.length) {
    applyHeading(spec, "title", h1s, base, "title");
  }

  applyHeading(spec, "headingPrimary", primaryNodes, base, "heading");
  applyHeading(spec, "headingSecondary", secondaryNodes, base, "headingSecondary");
  // secondary 未抽到（无 h3）时回退到 primary 色，避免残留默认蓝雾色与 primary 不一致
  if (!secondaryNodes.length) {
    spec.colors.headingSecondary = spec.colors.heading;
  }

  // 标题上下边距（标题与正文之间的间距）
  const headingMarginTop = mode(primaryNodes.map((n) => boxValue(styleOf(n), "margin", "top")));
  const headingMarginBottom = mode(primaryNodes.map((n) => boxValue(styleOf(n), "margin", "bottom")));
  if (headingMarginTop != null) spec.spacing.headingTop = headingMarginTop;
  if (headingMarginBottom != null) spec.spacing.headingBottom = headingMarginBottom;

  // 强调
  const strongColor = mode(strongs.map((n) => normalizeColor(css(n, "color"))));
  const strongWeight = mode(strongs.map((n) => weightOf(n)));
  if (strongColor) spec.colors.strong = strongColor;
  if (strongWeight) spec.typography.strong.weight = strongWeight;

  // 引用块：背景 + 左边框（色/宽）+ 文字色（文字色在内部 p 上，不在 blockquote 自身）
  const quoteBg = mode(quotes.map((n) => normalizeColor(css(n, "background") || css(n, "background-color"))));
  if (quoteBg) spec.colors.blockBg = quoteBg;

  const quoteBorders = quotes.map(blockquoteBorder).filter(Boolean);
  const quoteBorderColor = mode(quoteBorders.map((b) => b.color));
  const quoteBorderWidth = mode(quoteBorders.map((b) => b.width));
  if (quoteBorderColor) spec.colors.quoteBorder = quoteBorderColor;
  if (quoteBorderWidth) spec.typography.quote.borderWidth = quoteBorderWidth;

  const quoteColor = mode(quotes.map((n) => {
    const innerP = n.querySelector("p");
    return normalizeColor(innerP ? css(innerP, "color") : css(n, "color"));
  }));
  if (quoteColor) spec.colors.quoteText = quoteColor;

  // 容器左右内边距：取根 section 的 padding-left/right
  const rootSection = root.querySelector("section");
  if (rootSection) {
    const containerPadding = boxValue(styleOf(rootSection), "padding", "left");
    if (containerPadding != null) spec.spacing.containerPadding = containerPadding;
  }

  return spec;
}

// 读取节点或其后代（第一个带样式的 span/strong/b/em）的某个 CSS 属性。
// mdnice 等编辑器把标题的字号/颜色放在 h1 内部的 span 上，而非 h1 自身。
function deepStyle(node, prop) {
  const own = styleProp(node.getAttribute?.("style"), prop);
  if (own) return own;
  const descendants = node.querySelectorAll?.("span, strong, b, em") || [];
  for (const d of descendants) {
    const v = styleProp(d.getAttribute?.("style"), prop);
    if (v) return v;
  }
  return undefined;
}

function applyHeading(spec, key, nodes, base, colorRef) {
  const t = spec.typography[key];
  if (!nodes.length) return;
  const sizePx = mode(nodes.map((n) => parsePx(deepStyle(n, "font-size"))));
  const color = mode(nodes.map((n) => normalizeColor(deepStyle(n, "color"))));
  const weight = mode(nodes.map((n) => normalizeWeight(deepStyle(n, "font-weight"))));

  if (sizePx) t.sizeRatio = round2(sizePx / base);
  if (weight) t.weight = weight;
  if (color && colorRef) spec.colors[colorRef] = color;

  // 边框装饰：抽第一个有 border-left 的标题（原生排版常用，如增长女黑客的橙色竖条）
  for (const n of nodes) {
    const border = parseBorder(deepStyle(n, "border-left"));
    if (border) {
      t.border = border;
      break;
    }
  }
}

// ---------- 解析辅助 ----------

function parseStyleString(style) {
  return style
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((acc, item) => {
      const i = item.indexOf(":");
      if (i === -1) return acc;
      const prop = item.slice(0, i).trim().toLowerCase();
      const value = item.slice(i + 1).trim();
      if (prop && value && !/^-(webkit|moz|ms)-/.test(prop)) acc[prop] = value;
      return acc;
    }, {});
}

function styleProp(style, prop) {
  return style ? parseStyleString(style)[prop] : undefined;
}

function parsePx(value) {
  if (!value) return null;
  const m = String(value).match(/([\d.]+)/);
  return m ? Number(m[1]) : null;
}

function parseLineHeight(value, bodySize) {
  if (!value) return null;
  const raw = String(value).trim();
  const isPx = /px/i.test(raw);
  const s = raw.replace(/px/gi, "").trim();
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return null;
  return isPx ? round2(n / bodySize) : n;
}

// 解析 border-left 简写（如 "4px solid #E8501A"）→ { side, width, color, style }
function parseBorder(value) {
  if (!value) return null;
  const tokens = String(value).trim().split(/\s+/);
  let width = null;
  let style = null;
  let color = null;
  for (const tk of tokens) {
    if (/^\d+(\.\d+)?(px)?$/.test(tk)) width = parseFloat(tk);
    else if (/^(solid|dashed|dotted|double)$/.test(tk)) style = tk;
    else {
      const c = normalizeColor(tk);
      if (c) color = c;
    }
  }
  if (!color) return null; // none / 抽不到颜色 → 无边框
  return { side: "left", width: width && width > 0 ? width : 3, color, style: style || "solid" };
}

// 解析 blockquote 的左边框：长写 border-left-color/width/style 优先，简写 border-left 兜底。
function blockquoteBorder(node) {
  const rawStyle = node.getAttribute && node.getAttribute("style");
  const s = rawStyle ? parseStyleString(rawStyle) : {};
  let color = normalizeColor(s["border-left-color"]);
  let width = parsePx(s["border-left-width"]);
  let borderStyle = s["border-left-style"];
  if (!color || !width) {
    const b = parseBorder(s["border-left"]);
    if (b) {
      color = color || b.color;
      width = width || b.width;
      borderStyle = borderStyle || b.style;
    }
  }
  if (!color) return null;
  return { color, width: width && width > 0 ? width : 3, style: borderStyle || "solid" };
}

// 从 margin/padding 的简写或长写里取某一边的值（px）。
// 支持 1/2/3/4 值简写：1=四边同，2=上下/左右，3=上/左右/下，4=上右下左。
function boxValue(styleObj, prop, side) {
  const long = styleObj[`${prop}-${side}`];
  if (long != null) {
    const v = parsePx(long);
    if (v != null) return v;
  }
  const short = styleObj[prop];
  if (!short) return null;
  const parts = String(short).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return null;
  let idx;
  if (parts.length === 1) idx = 0;
  else if (parts.length === 2) idx = side === "top" || side === "bottom" ? 0 : 1;
  else if (parts.length === 3) idx = side === "top" ? 0 : side === "bottom" ? 2 : 1;
  else idx = { top: 0, right: 1, bottom: 2, left: 3 }[side] ?? 0;
  return parsePx(parts[idx] ?? parts[0]);
}

const NAMED_COLORS = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  blue: "#0000ff",
  green: "#008000",
  gray: "#808080",
  grey: "#808080",
  orange: "#ffa500",
  yellow: "#ffff00",
  purple: "#800080",
};

function normalizeColor(value) {
  if (!value) return null;
  const s = String(value).trim().toLowerCase();
  if (NAMED_COLORS[s]) return NAMED_COLORS[s];
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(s)) return s;
  const rgb = s.match(/^rgba?\(([^)]+)\)$/);
  if (rgb) {
    const parts = rgb[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (parts.length < 3) return null;
    // rgba：第 4 位是 alpha，透明（<1）视为无效颜色
    if (parts.length >= 4 && parts[3] < 1) return null;
    return `#${toHex(parts[0])}${toHex(parts[1])}${toHex(parts[2])}`;
  }
  return null;
}

function toHex(n) {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
}

function normalizeWeight(value) {
  if (!value) return null;
  const s = String(value).trim().toLowerCase();
  if (s === "bold") return 700;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function mode(values) {
  const counts = new Map(); // key → { count, value }
  for (const v of values) {
    if (v == null || v === "") continue;
    const k = String(v);
    const entry = counts.get(k) || { count: 0, value: v };
    entry.count += 1;
    counts.set(k, entry);
  }
  let best = null;
  let bestCount = 0;
  for (const { count, value } of counts.values()) {
    if (count > bestCount) (best = value), (bestCount = count);
  }
  return best;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}
function round2(n) {
  return Math.round(n * 100) / 100;
}

// ---------- 视口自适应 ----------

// 把比例化 token 展开成具体 px。viewport: { bodySize, width, height? }
export function resolveStyle(spec, viewport) {
  const c = spec.colors;
  const t = spec.typography;
  const sp = spec.spacing;
  const bodySize = viewport.bodySize;
  const color = (ref) => c[ref] || ref;
  const ratio = bodySize / 16; // 视口缩放比（公众号 1x，小红书 ≈2.1x）

  return {
    colors: c,
    bodySize,
    lineHeight: t.body.lineHeight,
    letterSpacing: (t.body.letterSpacing ?? 0) * ratio,
    titleSize: Math.round(bodySize * t.title.sizeRatio),
    headingSize: Math.round(bodySize * t.headingPrimary.sizeRatio),
    secondarySize: Math.round(bodySize * t.headingSecondary.sizeRatio),
    quoteSize: Math.round(bodySize * (t.quote?.sizeRatio ?? 1.0)),
    titleWeight: t.title.weight,
    headingWeight: t.headingPrimary.weight,
    secondaryWeight: t.headingSecondary.weight,
    strongColor: color(t.strong?.color || "strong"),
    strongWeight: t.strong?.weight ?? 700,
    headingColor: color(t.headingPrimary.color),
    secondaryColor: color(t.headingSecondary.color),
    titleColor: color(t.title.color),
    quoteColor: color(t.quote?.color || "quoteText"),
    quoteBorderColor: color(t.quote?.borderColor || "quoteBorder"),
    quoteBorderWidth: t.quote?.borderWidth ?? 3,
    paraGap: Math.round(sp.paraGap * ratio),
    paraPadding: Math.round(sp.paraPadding * ratio),
    headingTop: Math.round(sp.headingTop * ratio),
    headingBottom: Math.round(sp.headingBottom * ratio),
    containerPadding: Math.round(sp.containerPadding * ratio),
    headingBorder: resolveBorder(t.headingPrimary?.border, bodySize),
    secondaryBorder: resolveBorder(t.headingSecondary?.border, bodySize),
  };
}

// 边框宽度按正文字号比例缩放（公众号 4px → 小红书视口按比例加粗）。
function resolveBorder(border, bodySize) {
  if (!border || !border.color) return null;
  const ratio = bodySize / 16;
  return {
    side: border.side || "left",
    width: Math.max(1, Math.round((border.width || 3) * ratio)),
    color: border.color,
    style: border.style || "solid",
  };
}

// 从风格生成公众号草稿的 style 字符串集合（供 buildWechatArticleHtml 使用）。
export function resolveWechatTemplate(spec) {
  const s = resolveStyle(spec, { bodySize: spec.typography.body.size });
  const c = spec.colors;
  const lh = spec.typography.body.lineHeight;
  const borderCss = (b) => (b ? `border-${b.side}:${b.width}px ${b.style} ${b.color};padding-${b.side}:12px;` : "");

  return {
    strongStyle: { color: s.strongColor, weight: s.strongWeight },
    containerStyle: `font-size:${s.bodySize}px;line-height:${lh};color:${c.body};background:#ffffff;padding:0 ${s.containerPadding}px;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;`,
    titleStyle: `margin:0 0 ${s.headingBottom}px;color:${s.titleColor};font-size:${s.titleSize}px;line-height:1.45;font-weight:${s.titleWeight};letter-spacing:0;`,
    metaStyle: `margin:0 0 18px;color:${c.meta};font-size:11px;line-height:1.6;`,
    primaryHeadingStyle: `margin:${s.headingTop}px 0 ${s.headingBottom}px;color:${s.headingColor};font-size:${s.headingSize}px;line-height:1.5;letter-spacing:0;font-weight:${s.headingWeight};${borderCss(s.headingBorder)}`,
    secondaryHeadingStyle: `margin:${s.headingTop}px 0 ${s.headingBottom}px;color:${s.secondaryColor};font-size:${s.secondarySize}px;line-height:1.55;letter-spacing:0;font-weight:${s.secondaryWeight};${borderCss(s.secondaryBorder)}`,
    paragraphStyle: `margin:${s.paraGap}px 0 0;padding:${s.paraPadding}px 0;color:${c.body};font-size:${s.bodySize}px;line-height:${lh};letter-spacing:${s.letterSpacing}px;text-align:justify;`,
    quoteStyle: `margin:20px 0 12px;padding:10px 14px;border-left:${s.quoteBorderWidth}px solid ${s.quoteBorderColor};background:${c.blockBg};color:${s.quoteColor};font-size:${s.quoteSize}px;line-height:${lh};border-radius:0 8px 8px 0;`,
    noteStyle: `margin:18px 0 0;padding:10px 12px;border:1px solid #ECEAE3;border-radius:8px;background:#FAF7F2;color:${c.body};font-size:${Math.max(s.bodySize - 1, 12)}px;line-height:${lh};`,
    eyebrowStyle: `margin:18px 0 8px;color:${c.heading};font-size:11.5px;letter-spacing:0.14em;`,
    figcaptionStyle: `margin-top:8px;color:${c.meta};font-size:10.5px;line-height:1.6;text-align:center;`,
  };
}
