// 账号统一封面渲染：HTML 模板 → Playwright 截图，直出 900×383。
// 用法：node scripts/render_cover.mjs --title "主标题" --subtitle "副标题" --date 2026.09.22 --out /abs/dir
// 可选：--watermark 墨予镜（默认） --template cover-v1 --name wx-cover-01
//        --palette "bg=#1e525d,stripe=#8a6d1f,subtitle-bg=#97a0b4,badge=#8a6d1f,watermark=#4d8291" 覆盖配色
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
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

const FONT_URL = "file://" + join(SKILL, "assets/fonts/Muyao-Softbrush.ttf");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const html = readFileSync(join(SKILL, "templates", tplName + ".html"), "utf8")
  .replace("{{FONT_URL}}", FONT_URL)
  .replace("{{WATERMARK}}", esc(watermark))
  .replace("{{TITLE}}", esc(title))
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
