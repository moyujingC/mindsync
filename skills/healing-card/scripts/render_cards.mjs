// 卡片渲染器：cards.json → 逐张 PNG（1080×1440，3:4）
// cards.json: [{ "name": "09-数据会不会泄露", "theme": "theme-light",
//   "logo": "HA7CH", "series": "FDE SPRINT / ENTERPRISE", "page": "09 / 13",
//   "index": "09", "foot_l": "BUILD IN THE FIELD.", "foot_r": "HATCH INTO IMPACT.",
//   "content": "<h1 class='title'>...</h1>..." }]
// 用法：node render_cards.mjs <cards.json> <out目录> [--width 1080]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const [jsonPath, outDirArg] = process.argv.slice(2);
if (!jsonPath || !outDirArg) { console.error("用法：node render_cards.mjs <cards.json> <out目录>"); process.exit(1); }
const outDir = outDirArg.startsWith("/") ? outDirArg : join(process.cwd(), outDirArg);
mkdirSync(outDir, { recursive: true });

const tpl = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../assets/template-healing-card.html"), "utf8");
const cards = JSON.parse(readFileSync(jsonPath, "utf8"));
const { chromium } = await import("playwright");
const browser = await chromium.launch();

for (const c of cards) {
  const html = tpl
    .replace("{{THEME}}", c.theme || "theme-light")
    .replace("{{LOGO}}", c.logo || "")
    .replace("{{SERIES}}", c.series || "")
    .replace("{{PAGE}}", c.page || "")
    .replace("{{INDEX}}", c.index || "")
    .replace("{{FOOT_L}}", c.foot_l || "")
    .replace("{{FOOT_R}}", c.foot_r || "")
    .replace("{{CONTENT}}", c.content || "");
  const page = await browser.newPage({ viewport: { width: 1080, height: 1440 }, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: "networkidle" });
  // 溢出检测：内容高度超画布或侵入页脚带（底部 120px）即告警
  const m = await page.evaluate(() => {
    const body = document.querySelector(".body");
    const foot = document.querySelector(".foot");
    const bodyBottom = body.getBoundingClientRect().bottom;
    const footTop = foot.getBoundingClientRect().top;
    return { bodyBottom, footTop, scroll: document.body.scrollHeight, overflow: document.body.scrollHeight > 1440 || bodyBottom > footTop - 12 };
  });
  if (m.overflow) console.warn(`  ⚠ 溢出风险 ${c.name}：scroll=${m.scroll} bodyBottom=${Math.round(m.bodyBottom)} footTop=${Math.round(m.footTop)}`);
  const out = join(outDir, c.name + ".png");
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1080, height: 1440 } });
  await page.close();
  console.log(out);
}
await browser.close();
