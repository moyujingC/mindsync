// 排版骨架抽取：从公众号正文 HTML 提取「完整 HTML 骨架」，实现 1:1 无损复刻。
//
// 与旧版「字段 token 抽取」的本质区别：
//   旧版：预设字段（字号/颜色/间距…）→ 抽取数值 → 重新拼一个"干净"的 HTML（有损，丢嵌套/布局）
//   本版：不预设字段，把原文每个块级元素的「标签 + 完整 style + 嵌套关系」原样保留，
//         只把文字/图片 URL 替换成占位符。复刻时把新文字填回占位符，排版 100% 一致。
//
// 产物结构（骨架库）：
//   {
//     name, source,
//     blocks: [ { role, count, skeleton, listItem? } ], // 每种块级排版变体的完整 HTML 骨架（list 含 listItem 项模板）
//     inline: { strong: { color, weight, background } }  // 内联强调（strong/b/em…）的样式库
//   }

import { parse } from "node-html-parser";

// 块级标签：这些元素作为「块」被切分 / 骨架化时保留标签
const BLOCK_TAGS = new Set([
  "section", "p", "div", "blockquote",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "figure", "table", "pre",
]);

// 内联强调标签：骨架化时拍平，样式抽到 inline 库
const EMPHASIS_TAGS = new Set(["strong", "b", "em", "i", "u", "s", "del"]);

// ---------- 属性清洗 ----------

// 剔除「内容相关」的 data-* 属性（不影响排版，且每张图/每段都不同，会污染变体签名）。
// img 的 data-src 是微信懒加载的图片真实 URL，属于「内容」，单独转占位符。
function cleanAttrs(tag, attrs) {
  const out = {};
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k.startsWith("data-")) continue;
    out[k] = v;
  }
  return out;
}

// ---------- 序列化 ----------

// 把标签 + 属性序列化。inner === undefined 表示自闭合（img/br 等）。
function serializeTag(tag, attrs, inner) {
  let s = `<${tag}`;
  for (const [k, v] of Object.entries(attrs || {})) {
    s += ` ${k}="${String(v).replace(/"/g, "&quot;")}"`;
  }
  if (inner === undefined) return `${s}>`;
  return `${s}>${inner}</${tag}>`;
}

// ---------- 骨架化 ----------

// 从 style 字符串提取单个属性值（兼容 "color:rgb(...);font-weight:bold" 及分号前后有无空格）。
function pickStyleProp(style, prop) {
  const m = style.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, "i"));
  return m ? m[1].trim() : null;
}

// 纯列表符号（• / 数字. 等）作为「排版的一部分」保留原样，不转 {{text}}。
function isListMarkerText(t) {
  return /^[•◦▪●○□■◆－—–-]$/.test(t) || /^\d{1,2}[.、)]$/.test(t);
}

// 递归骨架化一个节点：
//   - 文本节点（非空）→ {{text}}（纯列表符号除外，保留原样）
//   - <img> → 保留 class/style，剔除 data-*，data-src → {{img}}
//   - 强调标签（strong/b/em…）→ 抽 color/font-weight 进 inline 库，标签拍平（文字并入 {{text}}）
//   - 块级元素 → 保留标签 + 清洗后 style，内部递归，并合并内部多个 {{text}} 成一个
//   - 其余内联元素（span/a/br…）→ 标签拍平，只保留内部文字（span 拆分是内容，非排版）
// 返回骨架字符串；inlineLib 收集 { tag: { style, color, weight } }。
export function skeletonize(node, inlineLib) {
  // 文本节点
  if (node.nodeType === 3) {
    const t = (node.rawText ?? node.text ?? "").trim();
    if (!t) return "";
    return isListMarkerText(t) ? t : "{{text}}";
  }

  const tag = (node.rawTagName || "").toLowerCase();

  // 图片：保留 class/style，data-src → {{img}}，剔除其余 data-*
  if (tag === "img") {
    const attrs = cleanAttrs(tag, node.attributes);
    attrs["data-src"] = "{{img}}";
    return serializeTag(tag, attrs);
  }

  // 内联强调：抽 color/weight/background 进库，标签拍平（bold 位置是内容，样式才是排版）
  if (EMPHASIS_TAGS.has(tag)) {
    const style = node.getAttribute?.("style") || "";
    const color = pickStyleProp(style, "color");
    const weight = pickStyleProp(style, "font-weight");
    const bg = pickStyleProp(style, "background-color");
    // 忽略「透明/白色」背景（浏览器默认值展开，非真实高亮）
    const hasBg = bg && !/transparent|rgba?\(\s*255\s*,\s*255\s*,\s*255\s*(?:,\s*0)?\s*\)/i.test(bg);
    const entry = (inlineLib[tag] ??= { color: null, weight: null, background: null });
    entry.color ??= color;
    entry.weight ??= weight;
    if (hasBg) entry.background ??= bg;
    return (node.childNodes || []).map((c) => skeletonize(c, inlineLib)).join("");
  }

  // 块级元素：保留标签 + 清洗后属性，内部递归并合并连续 {{text}}
  if (isBlockElement(node)) {
    const inner = (node.childNodes || []).map((c) => skeletonize(c, inlineLib)).join("");
    return serializeTag(tag, cleanAttrs(tag, node.attributes), mergePlaceholders(inner));
  }

  // 内联元素若声明了块级 display（display:block/flex/grid），视为「伪块级」保留标签
  // （增长女黑客的列表项用 <span display:block> 实现，需保留其缩进/符号结构）
  const inlineStyle = node.getAttribute?.("style") || "";
  if (/display\s*:\s*(block|flex|grid|inline-block|inline-flex)/i.test(inlineStyle)) {
    const inner = (node.childNodes || []).map((c) => skeletonize(c, inlineLib)).join("");
    return serializeTag(tag, cleanAttrs(tag, node.attributes), mergePlaceholders(inner));
  }

  // 其余内联元素（span/a/br…）：标签拍平，只保留内部文字
  return (node.childNodes || []).map((c) => skeletonize(c, inlineLib)).join("");
}

// 合并连续/重复的 {{text}} 占位符（强调标签拍平后会相邻）。
function mergePlaceholders(s) {
  return s.replace(/(\{\{text\}\}\s*)+/g, "{{text}}");
}

// ---------- 块切分 ----------

function isBlockElement(node) {
  return node && node.nodeType === 1 && BLOCK_TAGS.has((node.rawTagName || "").toLowerCase());
}

// 语义容器：这些元素「整体」作为一个块，不下钻（保留边框/列表符号/表格结构）。
const SEMANTIC_CONTAINERS = new Set(["blockquote", "ul", "ol", "figure", "table", "pre"]);

// 「单链块」= 块级元素中，所有块级后代每个节点最多 1 个块级子元素（不分支）。
// 用于把「容器 + 单内容」的链（如 <div><p>文字</p></div>）合并成一个块。
function isChainBlock(node) {
  const stack = [node];
  while (stack.length) {
    const n = stack.pop();
    const childBlocks = (n.childNodes || []).filter(isBlockElement);
    if (childBlocks.length > 1) return false; // 分支，不是单链
    stack.push(...childBlocks);
  }
  return true;
}

// 隐藏元素（display:none，如微信的版权声明/阅读原文尾巴）整体跳过。
function isHidden(node) {
  const style = node.getAttribute?.("style") || "";
  return /display\s*:\s*none/.test(style);
}

// 切块：
//   语义容器（blockquote/ul/ol/figure/table）→ 整体一个块
//   单链块（叶子块，或「容器+单内容」链）→ 整体一个块
//   分叉容器（如 mdnice 的外层 section，含多个 h1/p）→ 下钻到子块
//   隐藏元素 → 跳过
function collectBlocks(root) {
  const all = [];
  const walk = (node) => {
    if (isHidden(node)) return;
    if (isBlockElement(node)) {
      const tag = (node.rawTagName || "").toLowerCase();
      if (SEMANTIC_CONTAINERS.has(tag) || isChainBlock(node)) {
        all.push(node);
        return;
      }
      (node.childNodes || []).forEach(walk);
      return;
    }
    (node.childNodes || []).forEach(walk);
  };
  walk(root);
  return all;
}

// 统计 node 子树内（不含自身）的块级元素数量。
function countBlockDescendants(node) {
  let n = 0;
  const walk = (x) => {
    if (x !== node && isBlockElement(x)) n += 1;
    (x.childNodes || []).forEach(walk);
  };
  walk(node);
  return n;
}

// 识别「全文外层容器」：root 下覆盖大部分内容的那个分叉容器（如 mdnice 的外层 section，
// 带 padding/字体等全局样式）。平铺结构（卡兹克）无容器，返回 null。
function findContainer(root) {
  const visible = (root.childNodes || []).filter((c) => c.nodeType === 1 && !isHidden(c));
  if (visible.length === 0) return null;
  let total = 0;
  let best = null;
  let bestN = 0;
  for (const c of visible) {
    const n = countBlockDescendants(c);
    total += n;
    if (n > bestN) { best = c; bestN = n; }
  }
  // 单一容器覆盖 >60% 的块，且自身是分叉容器（>1 个块级后代）才是外层容器
  if (best && bestN > 1 && total > 0 && bestN / total > 0.6) return best;
  return null;
}

// ---------- 角色推断 ----------

// 从块级 DOM 节点提取「叶子的字号」（递归找所有 font-size，取众数）。
function leafFontSize(node) {
  const sizes = [];
  const walk = (n) => {
    const style = n.getAttribute?.("style") || "";
    const m = style.match(/font-size\s*:\s*([\d.]+)px/i);
    if (m) sizes.push(parseFloat(m[1]));
    (n.childNodes || []).forEach(walk);
  };
  walk(node);
  if (!sizes.length) return null;
  const c = new Map();
  for (const s of sizes) c.set(s, (c.get(s) || 0) + 1);
  let best = null, bestN = 0;
  for (const [s, n] of c) if (n > bestN) { best = s; bestN = n; }
  return best;
}

function containsImg(node) {
  return !!node.querySelector?.("img");
}

// 手动列表项：块内存在「仅含列表符号」的叶子 span（如 • / ◦ / 数字.），
// 常见于不用 ul/ol、改用 section + 负缩进 实现的列表（增长女黑客等）。
function hasListMarker(node) {
  const spans = node.querySelectorAll?.("span") || [];
  for (const s of spans) {
    const t = (s.textContent || s.rawText || "").trim();
    if (!t) continue;
    if (/^[•◦▪●○□■◆－—–-]/.test(t) && t.length <= 4) return true;
    if (/^\d{1,2}[.、)]/.test(t) && t.length <= 4) return true;
  }
  return false;
}

// 推断块的角色。baseSize = 正文基准字号。
function inferRole(node, baseSize) {
  const tag = (node.rawTagName || "").toLowerCase();
  if (containsImg(node)) return "image";
  if (tag === "blockquote") return "quote";
  if (tag === "ul" || tag === "ol" || tag === "li") return "list";
  if (tag === "pre" || tag === "table") return tag;
  // 有背景色 + 左边框的块视为引用（秀米等可能不用 blockquote）
  const style = node.getAttribute?.("style") || "";
  if (/background(?:-color)?\s*:[^;]*[^#0]/.test(style) && /border-left/.test(style)) {
    return "quote";
  }
  if (hasListMarker(node)) return "list";
  const size = leafFontSize(node);
  if (baseSize && size && size > baseSize + 1) return "heading";
  return "paragraph";
}

// ---------- 主入口 ----------

// 列表块：把「容器」和「重复项」分离，供复刻时复制项模板 N 次。
//   ul/ol → 项是 li；手动列表（section + 块级 span）→ 项是重复最多的直接子元素。
// 返回 { containerSkel（含 {{items}} 占位）, itemSkel（含 {{text}} 占位） }。
function extractListStructure(blockNode) {
  const containerTag = (blockNode.rawTagName || "").toLowerCase();
  const children = (blockNode.childNodes || []).filter((c) => c.nodeType === 1);

  // 项模板 = 出现次数最多的直接子元素骨架
  const groups = new Map();
  for (const c of children) {
    const skel = mergePlaceholders(skeletonize(c, {}));
    groups.set(skel, (groups.get(skel) || 0) + 1);
  }
  let itemSkel = "{{text}}";
  let best = 0;
  for (const [skel, n] of groups) if (n > best) { itemSkel = skel; best = n; }

  const containerSkel = serializeTag(containerTag, cleanAttrs(containerTag, blockNode.attributes), "{{items}}");
  return { containerSkel, itemSkel };
}

// 从公众号正文 HTML 提取骨架库。
export function extractSkeletonLibrary(html, meta = {}) {
  const lib = {
    name: meta.name || "未命名风格",
    source: meta.source || "",
    blocks: [],
    inline: {},
  };

  const root = parse(html);
  const blocks = collectBlocks(root);

  // 外层容器：识别并保留全局样式（padding/字体等），渲染时包裹所有块
  const containerNode = findContainer(root);
  if (containerNode) {
    const tag = (containerNode.rawTagName || "").toLowerCase();
    lib.container = serializeTag(tag, cleanAttrs(tag, containerNode.attributes), "{{content}}");
  }

  // 先算正文基准字号（paragraph 候选的字号众数）
  const paraSizes = [];
  for (const b of blocks) {
    const t = (b.rawTagName || "").toLowerCase();
    if (!containsImg(b) && !SEMANTIC_CONTAINERS.has(t) && !hasListMarker(b)) {
      const s = leafFontSize(b);
      if (s) paraSizes.push(s);
    }
  }
  const baseSize = mode(paraSizes);

  // 逐块骨架化 + 分组（按骨架字符串去重）
  const groupMap = new Map();
  for (const b of blocks) {
    const role = inferRole(b, baseSize);
    let skel;
    let listItem = null;

    if (role === "list") {
      const { containerSkel, itemSkel } = extractListStructure(b);
      skel = containerSkel;
      listItem = itemSkel;
    } else {
      skel = mergePlaceholders(skeletonize(b, {}));
    }

    if (!skel.includes("{{text}}") && !skel.includes("{{img}}") && !skel.includes("{{items}}")) continue;

    if (!groupMap.has(skel)) {
      groupMap.set(skel, { role, count: 0, skeleton: skel, listItem });
    }
    groupMap.get(skel).count += 1;
  }

  lib.blocks = [...groupMap.values()].sort((a, b) => b.count - a.count);

  // 内联强调样式库（全局收集一次）
  const inlineLib = {};
  for (const b of blocks) skeletonize(b, inlineLib);
  lib.inline = inlineLib;

  return lib;
}

function mode(values) {
  const c = new Map();
  for (const v of values) {
    if (v == null) continue;
    c.set(v, (c.get(v) || 0) + 1);
  }
  let best = null, bestN = 0;
  for (const [v, n] of c) if (n > bestN) { best = v; bestN = n; }
  return best;
}

// ---------- 填空 ----------

// 把新文字（内联 HTML，已含 <strong> 等）/图片 URL 填回骨架占位符。
//   text 为数组时按顺序填多个 {{text}}（如多段引用）；为字符串时填第一个。
export function fillSkeleton(skeleton, { text = "", imgUrl = "" } = {}) {
  let out = skeleton;
  if (imgUrl) out = out.replaceAll("{{img}}", imgUrl);
  if (Array.isArray(text)) {
    for (const t of text) out = out.replace("{{text}}", t);
  } else if (text) {
    out = out.replace("{{text}}", text);
  }
  return out;
}

// 填列表：容器模板（含 {{items}}）+ 项模板（含 {{text}}）+ 列表项数组（内联 HTML）。
export function fillListSkeleton(containerSkel, itemSkel, items = []) {
  const itemsHtml = items.map((it) => itemSkel.replaceAll("{{text}}", it)).join("");
  return containerSkel.replace("{{items}}", itemsHtml);
}

// 从骨架库取某角色的变体（取 count 最多的）。返回 { role, count, skeleton, listItem }。
export function pickSkeleton(lib, role) {
  const candidates = lib.blocks.filter((b) => b.role === role);
  if (!candidates.length) return null;
  return candidates[0];
}
