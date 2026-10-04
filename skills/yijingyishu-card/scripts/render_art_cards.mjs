// 一镜一梳插画拼贴卡渲染器：cards.json → 逐张 PNG
// 竖版 portrait  1080×1440（小红书/公众号图文 3:4）
// 横版 landscape 1080×608（公众号配图 16:9）
// cards.json: [{ "name": "01-封面", "canvas": "portrait",
//   "badge_class": "badge-clay",                 // badge-blue|badge-clay|badge-green
//   "title": "一、先做好自我定位", "sub": "先知道自己是谁", "sub_rule": true,
//   "para": "两行正文，\n可换行", "badge": "认识自己", "watermark": "轻疗愈",
//   "images": { "main": "art/main.png", "m1": "a.png", "m2": "b.png", "m3": "c.png" } }]
// images 路径相对 cards.json 所在目录；main 必填，m1~m3 可缺省
// 用法：node render_art_cards.mjs <cards.json> <out目录>
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname, resolve, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const [jsonPath, outDirArg] = process.argv.slice(2);
if (!jsonPath || !outDirArg) { console.error("用法：node render_art_cards.mjs <cards.json> <out目录>"); process.exit(1); }
const outDir = isAbsolute(outDirArg) ? outDirArg : join(process.cwd(), outDirArg);
mkdirSync(outDir, { recursive: true });
const jsonDir = dirname(resolve(jsonPath));

const tpl = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../assets/template-art-card.html"), "utf8");
const cards = JSON.parse(readFileSync(jsonPath, "utf8"));
const { chromium } = await import("playwright");
const browser = await chromium.launch();

const SIZES = { portrait: [1080, 1440], landscape: [1080, 608] };

// 赭石笔触下划线（SVG）
const UL = `<svg class="art-ul" width="230" height="16" viewBox="0 0 230 16"><path d="M6 11 C 66 4, 160 15, 224 8" stroke="#b8623c" stroke-width="6" fill="none" stroke-linecap="round" opacity=".85" filter="url(#brushRough)"/></svg>`;
// 小枝叶（徽章两侧）
const LEAF = `<svg width="58" height="58" viewBox="0 0 86 86" fill="none">
<path d="M40 80 C42 54 44 30 52 10" stroke="#6c7f5c" stroke-width="4" stroke-linecap="round"/>
<path d="M44 58 C30 52 22 42 20 28 C34 32 42 42 44 58Z" fill="#6c7f5c" opacity=".85"/>
<path d="M46 40 C58 34 66 24 68 10 C54 14 47 24 46 40Z" fill="#8a9a6e" opacity=".85"/></svg>`;
const LEAF_PAIR = `<span class="leaf-pair">${LEAF.replace('width="58" height="58"', 'width="40" height="40"')}${LEAF.replace('width="58" height="58"', 'width="40" height="40" style="transform:scaleX(-1)"')}</span>`;

function imgUrl(c, key) {
  const p = c.images?.[key];
  if (!p) return null;
  const abs = isAbsolute(p) ? p : resolve(jsonDir, p);
  if (!existsSync(abs)) { console.warn(`  ⚠ 图片缺失 ${c.name} images.${key}: ${abs}`); return null; }
  // Chromium 禁止 about:blank 页面加载 file:// 子资源 → 内联为 data URI
  const ext = abs.split(".").pop().toLowerCase();
  const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${readFileSync(abs).toString("base64")}`;
}

function artHtml(c, key, cls, mask) {
  const url = imgUrl(c, key);
  if (!url) return `<div class="art ${cls} hidden"></div>`;
  const focus = c.img_focus?.[key];
  const style = focus ? ` style="object-position:${focus}"` : "";
  return `<div class="art ${cls} ${mask}"><div class="paper r2"></div><div class="paper r1"></div><img src="${url}"${style}></div>`;
}

// 笔刷形毛边底（徽章/小标签共用），stretch 适配文字宽度
const BRUSH_PATH = "M20 48 C22 20 70 10 160 12 C250 10 300 22 302 50 C300 76 252 88 158 86 C66 88 18 74 20 48Z";
function brushBadge(txt, mini = false) {
  return `<span class="badge-brush" style="${mini ? "padding:12px 30px" : ""}">
    <svg viewBox="0 0 320 96" preserveAspectRatio="none"><path d="${BRUSH_PATH}" fill="var(--badge)" filter="url(#brushRough)"/></svg>
    <span class="txt" style="${mini ? "font-size:30px;letter-spacing:4px" : ""}">${txt}</span></span>`;
}
// 底部撕纸山形装饰
const MOUNTAINS = (cls) => `<svg class="mountains ${cls}" width="250" height="126" viewBox="0 0 240 120">
  <path d="M0 120 L0 70 L58 18 L118 66 L168 28 L240 82 L240 120Z" fill="#2b4d7d" opacity=".30"/>
  <path d="M0 120 L0 92 L70 48 L140 92 L202 58 L240 96 L240 120Z" fill="#b8623c" opacity=".32"/>
  <path d="M0 120 L0 104 L52 74 L112 104 L182 82 L240 108 L240 120Z" fill="#6c7f5c" opacity=".34"/>
</svg>`;
// 标题侧大枝叶
const BIG_SPRIG = `<svg class="title-sprig" width="92" height="92" viewBox="0 0 86 86" fill="none">
<path d="M40 80 C42 54 44 30 52 10" stroke="#6c7f5c" stroke-width="4" stroke-linecap="round"/>
<path d="M44 58 C30 52 22 42 20 28 C34 32 42 42 44 58Z" fill="#6c7f5c" opacity=".9"/>
<path d="M46 40 C58 34 66 24 68 10 C54 14 47 24 46 40Z" fill="#8a9a6e" opacity=".9"/>
<circle cx="52" cy="9" r="6" fill="#b8623c"/></svg>`;

function stageHeroHtml(c) {
  const url = imgUrl(c, "main");
  const focus = c.img_focus?.main;
  const style = focus ? ` style="object-position:${focus}"` : "";
  const img = url ? `<div class="hero-img"><img src="${url}"${style}></div>` : "";
  return `<div class="stage-hero">
    ${img}
    ${c.mountains === false ? "" : MOUNTAINS("ml") + MOUNTAINS("mr")}
  </div>`;
}

function stageHtml(c) {
  return `<div class="stage">
    <div class="blob blob-b blob-1"></div><div class="blob blob-g blob-2"></div><div class="blob blob-c blob-3"></div>
    ${artHtml(c, "main", "art-main", "mask-arch")}
    ${artHtml(c, "m1", "mini-1 art-mini", "mask-circle")}
    ${artHtml(c, "m2", "mini-2 art-mini", "mask-circle")}
    ${artHtml(c, "m3", "mini-3 art-mini", "mask-circle")}
  </div>`;
}

function headHtml(c) {
  const sun = c.sun ? `<div class="sun ${c.sun === "right" ? "sr" : "sl"}"></div>` : "";
  const sprigs = c.title_sprigs ? `${BIG_SPRIG}` : "";
  const sprigsR = c.title_sprigs ? BIG_SPRIG.replace('class="title-sprig"', 'class="title-sprig" style="transform:scaleX(-1)"') : "";
  const underline = c.underline === "ruledot"
    ? `<div class="title-ruledot"><span class="rule"></span><span class="dot"></span><span class="rule"></span></div>`
    : c.underline === "none" ? "" : UL;
  const sub = c.sub ? `<div class="art-sub">${c.sub_rule ? `<span class="rule"></span>${LEAF_PAIR}` : ""}<span>${c.sub}</span>${c.sub_rule ? `${LEAF_PAIR}<span class="rule"></span>` : ""}</div>` : "";
  return `<div class="art-head">${sun}<div class="art-title-row">${sprigs}<h1 class="art-title">${c.title || ""}</h1>${sprigsR}</div>${c.title ? underline : ""}${sub}</div>`;
}

function footHtml(c) {
  const paraText = (c.para || "").replace(/\n/g, "<br>");
  let para = "";
  if (c.para && c.para_layout === "split") {
    para = `<div class="split-row">${c.para_label ? `<span class="mini-label">${brushBadge(c.para_label, true)}</span>` : ""}<span class="vline"></span><p class="art-para" style="text-align:left">${paraText}</p></div>`;
  } else if (c.para) {
    para = `<p class="art-para">${paraText}</p>`;
  }
  let badge = "";
  if (c.badge) {
    badge = c.badge_style === "pill"
      ? `<div class="badge-row">${LEAF}<div class="badge">${c.badge}</div>${LEAF.replace("<svg ", '<svg style="transform:scaleX(-1)" ')}</div>`
      : `<div class="badge-row">${brushBadge(c.badge)}</div>`;
  }
  return `<div class="art-foot">${para}${badge}</div>`;
}

for (const c of cards) {
  const canvas = c.canvas === "landscape" ? "landscape" : "portrait";
  const [W, H] = SIZES[canvas];
  const layout = canvas === "portrait"
    ? (c.layout === "hero" ? `${headHtml(c)}${stageHeroHtml(c)}${footHtml(c)}` : `${headHtml(c)}${stageHtml(c)}${footHtml(c)}`)
    : `<div class="col-text">${headHtml(c)}${footHtml(c)}</div>${stageHtml(c)}`;
  const html = tpl
    .replace("{{CANVAS}}", "canvas-" + canvas)
    .replace("{{BADGE_CLASS}}", c.badge_class || "badge-clay")
    .replace("{{LAYOUT}}", layout)
    .replace("{{WATERMARK}}", c.watermark || "轻疗愈");
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: "networkidle" });
  // 溢出检测：文档滚动尺寸超画布即告警
  const scr = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth }));
  if (scr.h > (canvas === "portrait" ? 1440 : 608) || scr.w > 1080)
    console.warn(`  ⚠ 溢出风险 ${c.name}：scroll=${scr.w}x${scr.h} 画布=1080x${canvas === "portrait" ? 1440 : 608}`);
  const out = join(outDir, c.name + ".png");
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: W, height: H } });
  await page.close();
  console.log(out);
}
await browser.close();
