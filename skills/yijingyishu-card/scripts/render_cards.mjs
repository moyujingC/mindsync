// 一镜一梳疗愈书院卡渲染器：cards.json → 逐张 PNG（1080×1440，3:4）
// cards.json: [{ "name": "01-接纳情绪", "stripe": "stripe-green",
//   "brand": "一镜一梳 · 疗愈学院", "page": "01 / 06",
//   "foot_l": "理解情绪", "foot_r": "轻疗愈",
//   "content": "<div class='big-num'>01</div><h1 class='title'>...</h1>..." }]
// 用法：node render_cards.mjs <cards.json> <out目录>
import { readFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const [jsonPath, outDirArg] = process.argv.slice(2);
if (!jsonPath || !outDirArg) { console.error("用法：node render_cards.mjs <cards.json> <out目录>"); process.exit(1); }
const outDir = outDirArg.startsWith("/") ? outDirArg : join(process.cwd(), outDirArg);
mkdirSync(outDir, { recursive: true });

const tpl = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../assets/template-book-card.html"), "utf8");
const cards = JSON.parse(readFileSync(jsonPath, "utf8"));
const { chromium } = await import("playwright");
const browser = await chromium.launch();

for (const c of cards) {
  const html = tpl
    .replace("{{STRIPE}}", c.stripe || "stripe-green")
    .replace("{{SPREAD}}", c.spread ? "spread" : "")
    .replace("{{BRAND}}", c.brand || "一镜一梳")
    .replace("{{PAGE}}", c.page || "")
    .replace("{{FOOT_L}}", c.foot_l || "")
    .replace("{{FOOT_R}}", c.foot_r || "轻疗愈")
    .replace("{{CONTENT}}", c.content || "");
  const page = await browser.newPage({ viewport: { width: 1080, height: 1440 }, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: "networkidle" });
  // 溢出检测：内容侵入页脚带（底部 116px）或超出画布即告警
  const m = await page.evaluate(() => {
    const body = document.querySelector(".body");
    const foot = document.querySelector(".foot");
    // 内容实际底边 = 最后一个内容子元素底边（.body 盒底不可靠，子元素可能溢出）
    const kids = [...body.children];
    const last = kids[kids.length - 1];
    const contentBottom = last ? last.getBoundingClientRect().bottom : body.getBoundingClientRect().bottom;
    const footTop = foot.getBoundingClientRect().top;
    return { contentBottom, footTop, scroll: document.body.scrollHeight,
             overflow: document.body.scrollHeight > 1440 || contentBottom > footTop - 12 };
  });
  if (m.overflow) console.warn(`  ⚠ 溢出风险 ${c.name}：scroll=${m.scroll} contentBottom=${Math.round(m.contentBottom)} footTop=${Math.round(m.footTop)}`);
  const out = join(outDir, c.name + ".png");
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1080, height: 1440 } });
  await page.close();
  console.log(out);
}
await browser.close();
