// 用风格规格给成稿排版 → 小红书 3:4 分页卡片（SVG → Chrome 转 PNG）。
// 同一份风格 JSON，切到小红书视口（bodySize 放大），自动分页。
// 用法：node scripts/render-xhs.mjs <成稿.md> <styles/风格名.json>

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { buildWechatArticleBlocks } from "./lib/wechat-blocks.mjs";
import { extractStyleTokens } from "./lib/style-tokens.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ACCOUNT_DIR = join(__dirname, "../../../");
const OUT_DIR = "/tmp/xhs-cards";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FONT = "PingFang SC, Hiragino Sans GB, Source Han Sans SC, sans-serif";

// 小红书视口：3:4 竖版
const W = 1080, H = 1440, MX = 90;
const VIEWPORT = { bodySize: 34 };

const [mdPath, specPath, subDir = "原文版"] = process.argv.slice(2);
if (!mdPath || !specPath) {
  console.error("用法：node scripts/render-xhs.mjs <成稿.md> <styles/风格名.json> [输出子目录]");
  process.exit(1);
}

const md = readFileSync(mdPath, "utf8");
const spec = JSON.parse(readFileSync(specPath, "utf8"));
const tokens = extractStyleTokens(spec, VIEWPORT);

// 中文换行：perLine 字/行，标点规避
function wrap(text, perLine) {
  const avoid = "，。、；：！？」）…";
  const out = [];
  let i = 0;
  while (i < text.length) {
    let end = Math.min(i + perLine, text.length);
    if (end < text.length) while (end > i && avoid.includes(text[end])) end--;
    out.push(text.slice(i, end));
    i = end;
  }
  return out;
}

function stripStrong(text) {
  const trimmed = text.trim();
  if (/^\*\*[^*]+\*\*$/.test(trimmed)) return { text: trimmed.slice(2, -2), strong: true };
  return { text: text.replace(/\*\*/g, ""), strong: false };
}

// blocks → 连续内容流（标题/段落/引用），忽略图片
function blocksToFlow(blocks) {
  const flow = [];
  for (const b of blocks) {
    if (b.type === "heading") flow.push({ kind: "title", text: b.title });
    else if (b.type === "paragraph") {
      const { text, strong } = stripStrong(b.text);
      flow.push({ kind: "para", text, strong });
    } else if (b.type === "quote") {
      flow.push({ kind: "quote", text: stripStrong(b.text).text });
    } else if (b.type === "list") {
      // 列表项保留符号：无序 •，有序 1. 2. 3.…
      b.items.forEach((item, i) => {
        const mark = b.ordered ? `${i + 1}. ` : "• ";
        flow.push({ kind: "para", text: mark + stripStrong(item).text, strong: false });
      });
    }
  }
  return flow;
}

function itemHeight(item) {
  if (item.kind === "title") return tokens.headingTop + tokens.headingSize + 28;
  if (item.kind === "para") return wrap(item.text, PER).length * LH + tokens.paraGap;
  if (item.kind === "quote") return 30 + 40 + wrap(item.text, 22).length * LH + 20;
  return 0;
}

// 撑满一页再换页；标题不孤行
function paginate(flow, startY, bottomY) {
  const pages = [];
  let cur = [], y = startY;
  for (let i = 0; i < flow.length; i++) {
    const item = flow[i];
    const h = itemHeight(item);
    if (cur.length && y + h > bottomY) {
      pages.push(cur);
      cur = [];
      y = startY;
    }
    if (item.kind === "title" && i + 1 < flow.length) {
      const nextH = itemHeight(flow[i + 1]);
      if (y > startY && y + h + nextH > bottomY) {
        pages.push(cur);
        cur = [];
        y = startY;
      }
    }
    cur.push(item);
    y += h;
  }
  if (cur.length) pages.push(cur);
  return pages;
}

// 标题拆两行：优先在逗号/顿号处拆
function splitTitle(title) {
  const m = title.match(/^(.{3,}[，、：])(.{2,})$/);
  if (m) return [m[1], m[2]];
  const half = Math.ceil(title.length / 2);
  return [title.slice(0, half), title.slice(half)];
}

function coverSVG(title, subtitle) {
  const [t1, t2] = splitTitle(title);
  const t1y = 600, t2y = t1y + 168, lineY = t2y + 65, subY = lineY + 85;
  const c = tokens.colors;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FONT}">
  <defs>
    <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c.heading}" stop-opacity="0.16"/>
      <stop offset="0.55" stop-color="${c.heading}" stop-opacity="0.05"/>
      <stop offset="1" stop-color="${c.heading}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="mistBottom" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="${c.heading}" stop-opacity="0.10"/>
      <stop offset="1" stop-color="${c.heading}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect width="${W}" height="640" fill="url(#mist)"/>
  <rect y="1136" width="${W}" height="304" fill="url(#mistBottom)"/>
  <text x="${W / 2}" y="240" font-size="24" fill="${c.meta}" text-anchor="middle" letter-spacing="8">墨予镜 · 企业 AI 落地观察</text>
  <text x="${W / 2}" y="${t1y}" font-size="120" fill="${c.title}" text-anchor="middle" font-weight="700">${esc(t1)}</text>
  <text x="${W / 2}" y="${t2y}" font-size="120" fill="${c.heading}" text-anchor="middle" font-weight="700">${esc(t2)}</text>
  <line x1="${W / 2 - 60}" y1="${lineY}" x2="${W / 2 + 60}" y2="${lineY}" stroke="${c.heading}" stroke-width="2" opacity="0.6"/>
  <text x="${W / 2}" y="${subY}" font-size="38" fill="${c.body}" text-anchor="middle" letter-spacing="2">${esc(subtitle || "")}</text>
  <text x="${W / 2}" y="1380" font-size="20" fill="${c.meta}" text-anchor="middle" letter-spacing="2">@墨予镜</text>
</svg>`;
}

function flowPageSVG(items, seq) {
  const c = tokens.colors;
  let y = 320;
  let body = "";
  for (const item of items) {
    if (item.kind === "title") {
      const border = tokens.headingBorder;
      const textX = border ? MX + border.width + 12 : MX;
      const textY = y + tokens.headingTop + tokens.headingSize;
      if (border) {
        const lineY1 = y + tokens.headingTop;
        const lineY2 = lineY1 + tokens.headingSize;
        body += `\n  <line x1="${MX}" y1="${lineY1}" x2="${MX}" y2="${lineY2}" stroke="${border.color}" stroke-width="${border.width}" stroke-linecap="round"/>`;
      }
      body += `\n  <text x="${textX}" y="${textY}" font-size="${tokens.headingSize}" fill="${c.title}" font-weight="600">${esc(item.text)}</text>`;
      y += tokens.headingTop + tokens.headingSize + 28;
    } else if (item.kind === "para") {
      const fill = item.strong ? tokens.strongColor : c.body;
      const weight = item.strong ? "600" : "400";
      for (const ln of wrap(item.text, PER)) {
        body += `\n  <text x="${MX}" y="${y}" font-size="${tokens.bodySize}" fill="${fill}" font-weight="${weight}">${esc(ln)}</text>`;
        y += LH;
      }
      y += tokens.paraGap;
    } else if (item.kind === "quote") {
      y += 30;
      body += `\n  <line x1="${MX}" y1="${y}" x2="${W - MX}" y2="${y}" stroke="${c.meta}" stroke-width="1"/>`;
      y += 40;
      for (const ln of wrap(item.text, 22)) {
        body += `\n  <text x="${MX}" y="${y}" font-size="${tokens.quoteSize}" fill="${c.heading}" font-weight="600">${esc(ln)}</text>`;
        y += LH;
      }
      y += 20;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FONT}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <text x="${W - MX}" y="120" font-size="22" fill="${c.meta}" letter-spacing="4" text-anchor="end" font-weight="500">${esc(seq)}</text>
  ${body}
  <line x1="${MX}" y1="1372" x2="${W - MX}" y2="1372" stroke="#D6DEE6" stroke-width="1"/>
  <text x="${MX}" y="1412" font-size="20" fill="${c.meta}" letter-spacing="1">@墨予镜</text>
  <text x="${W - MX}" y="1412" font-size="20" fill="${c.meta}" text-anchor="end" letter-spacing="1">企业 AI · 落地观察</text>
</svg>`;
}

function esc(s) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function toPng(svgFile, pngFile) {
  execSync(
    `"${CHROME}" --headless --disable-gpu --screenshot="${pngFile}" --window-size=${W},${H} --hide-scrollbars --force-device-scale-factor=1 "file://${svgFile}"`,
    { stdio: "ignore" }
  );
}

// ---------- 主流程 ----------

const LH = Math.round(VIEWPORT.bodySize * tokens.lineHeight);
const PER = Math.floor((W - 2 * MX) / VIEWPORT.bodySize);

const { title, body } = extractArticle(md);
const blocks = buildWechatArticleBlocks(body);
const flow = blocksToFlow(blocks);
const pages = paginate(flow, 320, 1330);

const firstStrong = flow.find((it) => it.kind === "para" && it.strong);
const subtitle = firstStrong ? firstStrong.text : "";

mkdirSync(OUT_DIR, { recursive: true });
rmSync(join(OUT_DIR, "xhs-*.svg"), { force: true });

// 封面
writeFileSync(join(OUT_DIR, "xhs-01.svg"), coverSVG(title, subtitle), "utf8");

// 正文
pages.forEach((items, i) => {
  const seq = `${String(i + 2).padStart(2, "0")}/${String(pages.length + 1).padStart(2, "0")}`;
  writeFileSync(join(OUT_DIR, `xhs-${String(i + 2).padStart(2, "0")}.svg`), flowPageSVG(items, seq), "utf8");
});

// 转 PNG 到 小红书出图/<subDir>/
const outDir = join(ACCOUNT_DIR, "小红书出图", subDir);
mkdirSync(outDir, { recursive: true });
for (const f of ["xhs-01.svg", ...Array.from({ length: pages.length }, (_, i) => `xhs-${String(i + 2).padStart(2, "0")}.svg`)]) {
  const base = f.replace(".svg", "");
  toPng(join(OUT_DIR, f), join(outDir, `${base.replace("xhs", "full")}.png`));
  console.log(`生成 ${outDir}/${base.replace("xhs", "full")}.png`);
}

console.log(`\n标题：${title}`);
console.log(`正文页数：${pages.length}（+封面）`);
console.log(`风格：${spec.name}（正文 ${VIEWPORT.bodySize}px / 行高 ${LH}px / 每行 ${PER} 字）`);

function extractArticle(md) {
  const lines = md.split("\n");
  let title = "";
  let bodyStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#\s+(.+)$/);
    if (m) {
      title = m[1].trim();
      bodyStart = i + 1;
      break;
    }
  }
  return { title, body: lines.slice(bodyStart).join("\n").trim() };
}
