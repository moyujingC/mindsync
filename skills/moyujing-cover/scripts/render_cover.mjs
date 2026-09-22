// 账号统一封面渲染：HTML 模板 → Playwright 截图，直出 900×383。
// 用法：node scripts/render_cover.mjs --title "主标题" --subtitle "副标题" --date 2026.09.22 --out /abs/dir
// 可选：--watermark 墨予镜（默认） --template cover-v1 --name wx-cover-01
//        --palette "bg=#...,stripe=#..." 覆盖配色
//        --art <图片路径> 使用已有底图；--gen-art "<提示词>" 先用 gpt-image-2 生成底图（存 <out>/cover-art.png）
//        --veil 0.35 底图压暗系数（0=不压，默认 --art/--gen-art 时 0.35，纯底色时 0）
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

// Playwright setContent 页（about:blank 源）禁止加载 file:// 子资源，
// 字体与底图一律内联成 base64 data URL，跨机器渲染结果才一致。
const dataUrl = (path, mime) => `data:${mime};base64,${readFileSync(path).toString("base64")}`;
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SKILL = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > -1 ? process.argv[i + 1] : d; };

const title = arg("title"), subtitle = arg("subtitle"), date = arg("date"), outDir = arg("out");
if (!title || !subtitle || !date || !outDir) {
  console.error("用法：node scripts/render_cover.mjs --title 主标题 --subtitle 副标题 --date 2026.09.22 --out /abs/dir");
  process.exit(1);
}
const watermark = arg("watermark", "墨予镜");
const tplName = arg("template", "cover-v1");
const name = arg("name", "wx-cover-01");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// 混排整齐化：拉丁/数字 run 包 .lat（两侧对称间隙），全角标点包 .pq（挤压空位）
// 先去掉所有空格（拉丁 run 的 margin 会补回对称间隙，手敲空格反而破环对称）
const rich = (s) => esc(s.replace(/\s+/g, ""))
  .replace(/[A-Za-z0-9]+/g, (m) => `<span class="lat">${m}</span>`)
  .replace(/([，。！？；：、「」『』（）《》])/g, (m) => `<span class="pq">${m}</span>`);
let bgImage = "", artDisplay = "none", veil = Number(arg("veil", "-1"));
const artArg = arg("art"), genArt = arg("gen-art");
if (genArt) {
  const { genImage, fitSize } = await import("/Users/xinran/Downloads/dev/mindsync/projects/content-matrix/排版工坊/engine/lib/img.mjs");
  const artPath = join(outDir, "cover-art.png");
  console.log("gpt-image-2 生成底图…");
  await genImage({ prompt: genArt, size: fitSize(900, 383), quality: arg("quality", "low"), out: artPath });
  console.log("✓ 底图 → " + artPath);
  bgImage = dataUrl(artPath, "image/png"); artDisplay = "block";
  if (veil < 0) veil = 0.35;
} else if (artArg) {
  const artPath = artArg.startsWith("/") ? artArg : join(process.cwd(), artArg);
  const mime = artPath.toLowerCase().endsWith(".jpg") || artPath.toLowerCase().endsWith(".jpeg") ? "image/jpeg" : "image/png";
  bgImage = dataUrl(artPath, mime); artDisplay = "block";
  if (veil < 0) veil = 0.35;
} else if (veil < 0) veil = 0;

const html = readFileSync(join(SKILL, "templates", tplName + ".html"), "utf8")
  .replace("{{BG_IMAGE}}", bgImage)
  .replace("{{ART_DISPLAY}}", artDisplay)
  .replace("{{VEIL_OPACITY}}", String(veil))
  .replace("{{WATERMARK}}", esc(watermark))
  .replace("{{TITLE}}", rich(title))
  .replace("{{SUBTITLE}}", esc(subtitle))
  .replace("{{DATE}}", esc(date));

const { chromium } = await import("playwright");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 383 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: "networkidle" });
const palette = arg("palette");
if (palette) {
  const vars = palette.split(",").map((kv) => {
    const [k, v] = kv.split("=");
    return `--${k.trim()}: ${v.trim()};`;
  }).join(" ");
  await page.addStyleTag({ content: `:root { ${vars} }` });
}
await page.evaluate(() => document.fonts.ready);
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, name + ".png");
await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 900, height: 383 } });
await browser.close();
console.log(outPath);
