// 排版风格规格：抽取 + 视口自适应。
// 核心思路：风格存「比例化 token」（字号用相对正文字号的比例），
// 切换视口 = 换正文字号基准，比例不变。公众号视口 bodySize≈16，小红书视口 bodySize≈34。

import { parse } from "node-html-parser";

// 默认风格（账号现有「蓝雾静读版」），作为抽取 fallback。
export const DEFAULT_SPEC = {
  name: "蓝雾静读版",
  source: "",
  colors: {
    title: "#303543",   // 主标题/一级标题
    heading: "#6e7fa8", // 小节标题/强调色（蓝雾）
    body: "#393d49",    // 正文
    strong: "#333333",  // 加粗强调
    meta: "#a8b1c4",    // 辅助/图注
    blockBg: "#f0f3fa", // 引用块背景
  },
  typography: {
    body: { size: 16, lineHeight: 1.8, weight: 400 },
    title: { sizeRatio: 1.44, color: "title", weight: 600 },
    headingPrimary: { sizeRatio: 1.5, color: "heading", weight: 600, border: null },
    headingSecondary: { sizeRatio: 1.38, color: "heading", weight: 600, border: null },
    strong: { color: "strong", weight: 600 },
    quote: { sizeRatio: 1.0, color: "heading", weight: 400 },
  },
  spacing: { paraGap: 1.125, headingTop: 2.125, headingBottom: 0.94 },
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

  if (bodySize) spec.typography.body.size = bodySize;
  if (bodyLineHeight) {
    spec.typography.body.lineHeight = parseLineHeight(bodyLineHeight, bodySize || 16);
  }
  if (bodyColor) spec.colors.body = bodyColor;
  if (bodyWeight) spec.typography.body.weight = bodyWeight;

  // 小节标题：公众号正文里 h2 优先（原生编辑器惯例，h1 是文章主标题），
  // 无 h2 时才用 h1（mdnice 编辑器用小节标题导出为 h1）。
  const base = bodySize || 16;
  const primaryNodes = h2s.length ? h2s : h1s;
  const secondaryNodes = h3s.length ? h3s : [];

  applyHeading(spec, "headingPrimary", primaryNodes, base, "heading");
  applyHeading(spec, "headingSecondary", secondaryNodes, base, "heading");

  // 若标题色与正文色相同（没抽到独立标题色），回退到默认强调色
  if (normalizeColor(spec.colors.heading) === normalizeColor(spec.colors.body)) {
    // 保持默认，不强制改
  }

  // 强调
  const strongColor = mode(strongs.map((n) => normalizeColor(css(n, "color"))));
  const strongWeight = mode(strongs.map((n) => weightOf(n)));
  if (strongColor) spec.colors.strong = strongColor;
  if (strongWeight) spec.typography.strong.weight = strongWeight;

  // 引用块背景
  const quoteBg = mode(quotes.map((n) => normalizeColor(css(n, "background") || css(n, "background-color"))));
  if (quoteBg) spec.colors.blockBg = quoteBg;

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
  if (color && colorRef === "heading") spec.colors.heading = color;

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

  return {
    colors: c,
    bodySize,
    lineHeight: t.body.lineHeight,
    titleSize: Math.round(bodySize * t.title.sizeRatio),
    headingSize: Math.round(bodySize * t.headingPrimary.sizeRatio),
    secondarySize: Math.round(bodySize * t.headingSecondary.sizeRatio),
    quoteSize: Math.round(bodySize * (t.quote?.sizeRatio ?? 1.0)),
    titleWeight: t.title.weight,
    headingWeight: t.headingPrimary.weight,
    strongColor: color(t.strong?.color || "strong"),
    headingColor: color(t.headingPrimary.color),
    titleColor: color(t.title.color),
    paraGap: Math.round(bodySize * sp.paraGap),
    headingTop: Math.round(bodySize * sp.headingTop),
    headingBottom: Math.round(bodySize * sp.headingBottom),
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
    containerStyle: `font-size:${s.bodySize}px;line-height:${lh};color:${c.body};background:#ffffff;padding:0 30px;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;`,
    titleStyle: `margin:0 0 12px;color:${c.title};font-size:${s.titleSize}px;line-height:1.45;font-weight:${s.titleWeight};letter-spacing:0;`,
    metaStyle: `margin:0 0 18px;color:${c.meta};font-size:11px;line-height:1.6;`,
    primaryHeadingStyle: `margin:0 0 15px;color:${c.heading};font-size:${s.headingSize}px;line-height:1.5;letter-spacing:0;font-weight:${s.headingWeight};${borderCss(s.headingBorder)}`,
    secondaryHeadingStyle: `margin:0 0 12px;color:${c.heading};font-size:${s.secondarySize}px;line-height:1.55;letter-spacing:0;font-weight:${s.headingWeight};${borderCss(s.secondaryBorder)}`,
    paragraphStyle: `margin:18px 0 0;padding:8px 0;color:${c.body};font-size:${s.bodySize}px;line-height:${lh};text-align:justify;`,
    quoteStyle: `margin:20px 0 12px;padding:10px 14px;border-left:3px solid ${c.heading};background:${c.blockBg};color:${c.heading};font-size:${s.quoteSize}px;line-height:${lh};border-radius:0 8px 8px 0;`,
    noteStyle: `margin:18px 0 0;padding:10px 12px;border:1px solid #ECEAE3;border-radius:8px;background:#FAF7F2;color:${c.body};font-size:${Math.max(s.bodySize - 1, 12)}px;line-height:${lh};`,
    eyebrowStyle: `margin:18px 0 8px;color:${c.heading};font-size:11.5px;letter-spacing:0.14em;`,
    figcaptionStyle: `margin-top:8px;color:${c.meta};font-size:10.5px;line-height:1.6;text-align:center;`,
  };
}
