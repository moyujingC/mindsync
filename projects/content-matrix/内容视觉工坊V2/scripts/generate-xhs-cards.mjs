// 墨予镜小红书图文卡生成器（蓝雾静读版）
// 数据驱动：生成「摘要版 + 原文版」两套 3:4 竖版 SVG，再用 Chrome 转 PNG。
// 用法：node scripts/generate-xhs-cards.mjs [summary|full|all]

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = "/tmp/xhs-cards";
mkdirSync(OUT_DIR, { recursive: true });

const W = 1024, H = 1536, MX = 88;
const FONT = "PingFang SC, Hiragino Sans GB, Source Han Sans SC, sans-serif";

// 蓝雾静读设计系统
const C = {
  bg: "#FFFFFF",
  title: "#303543",   // 深标题（一级标题 / 封面主标题）
  mist: "#6E7FA8",    // 蓝雾（二级标题 / 核心金句 / 强调）
  body: "#393D49",    // 正文
  strong: "#333333",  // 一般强调
  faint: "#A8B1C4",   // 浅灰辅助
};

const esc = (s) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

// 中文换行：perLine 字/行，标点规避（标点归前一行）
function wrap(text, perLine) {
  const avoid = "，。、；：！？」）…";
  const out = [];
  let i = 0;
  while (i < text.length) {
    let end = Math.min(i + perLine, text.length);
    if (end < text.length) {
      while (end > i && avoid.includes(text[end])) end--;
    }
    out.push(text.slice(i, end));
    i = end;
  }
  return out;
}

// 摘要版标题区（正文/列表页共用）：一级标题用深色，蓝雾竖条作品牌点缀
function sectionTitle(seq, title) {
  return `
  <text x="${W - MX}" y="120" font-size="22" fill="${C.faint}" letter-spacing="4" text-anchor="end" font-weight="500">${esc(seq)}</text>
  <rect x="${MX}" y="188" width="6" height="48" rx="3" fill="${C.mist}"/>
  <text x="${MX + 24}" y="224" font-size="46" fill="${C.title}" font-weight="600">${esc(title)}</text>`;
}

// 正文段落渲染：返回 <text> 序列 + 占用的行高
function renderParagraphs(paras, startY) {
  const LH = 60, GAP = 30, SIZE = 34, PER = 23;
  let y = startY;
  let svg = "";
  for (const p of paras) {
    const text = typeof p === "string" ? p : p.t;
    const style = typeof p === "string" ? "" : p.s;
    const color = style === "mist" ? C.mist : style === "strong" ? C.strong : C.body;
    const weight = style ? "600" : "400";
    const size = style === "mist" ? 36 : SIZE;
    const lines = wrap(text, PER);
    for (const ln of lines) {
      svg += `\n  <text x="${MX}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}">${esc(ln)}</text>`;
      y += LH;
    }
    y += GAP;
  }
  return { svg, endY: y };
}

function coverSVG(card) {
  const t1 = card.title1, t2 = card.title2;
  const s1 = 120, s2 = 120;
  // 封面纵向节奏：两行标题拉大行距（168px baseline 差 ≈ 1.4 倍字号）
  const t1y = 600;
  const t2y = t1y + 168;
  const lineY = t2y + 65;
  const subY = lineY + 85;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FONT}">
  <defs>
    <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.mist}" stop-opacity="0.16"/>
      <stop offset="0.55" stop-color="${C.mist}" stop-opacity="0.05"/>
      <stop offset="1" stop-color="${C.mist}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="mistBottom" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="${C.mist}" stop-opacity="0.10"/>
      <stop offset="1" stop-color="${C.mist}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  <rect width="${W}" height="640" fill="url(#mist)"/>
  <rect y="1136" width="${W}" height="400" fill="url(#mistBottom)"/>
  <text x="${W / 2}" y="240" font-size="24" fill="${C.faint}" text-anchor="middle" letter-spacing="8">${esc(card.tag || "墨予镜 · 企业 AI 落地观察")}</text>
  <text x="${W / 2}" y="${t1y}" font-size="${s1}" fill="${C.title}" text-anchor="middle" font-weight="700">${esc(t1)}</text>
  <text x="${W / 2}" y="${t2y}" font-size="${s2}" fill="${C.mist}" text-anchor="middle" font-weight="700">${esc(t2)}</text>
  <line x1="${W / 2 - 60}" y1="${lineY}" x2="${W / 2 + 60}" y2="${lineY}" stroke="${C.mist}" stroke-width="2" opacity="0.6"/>
  <text x="${W / 2}" y="${subY}" font-size="38" fill="${C.body}" text-anchor="middle" letter-spacing="2">${esc(card.subtitle || "")}</text>
  <text x="${W / 2}" y="1440" font-size="20" fill="${C.faint}" text-anchor="middle" letter-spacing="2">@墨予镜</text>
</svg>`;
}

function bodySVG(card) {
  const { svg: bodySvg } = renderParagraphs(card.paras, 360);
  let quote = "";
  if (card.quote) {
    const lines = wrap(card.quote, 20);
    let qy = 1180;
    quote = `\n  <line x1="${MX}" y1="${qy - 30}" x2="${W - MX}" y2="${qy - 30}" stroke="${C.faint}" stroke-width="1"/>`;
    for (const ln of lines) {
      quote += `\n  <text x="${MX}" y="${qy}" font-size="36" fill="${C.mist}" font-weight="600">${esc(ln)}</text>`;
      qy += 60;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FONT}">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${sectionTitle(card.seq, card.title)}
  ${bodySvg}${quote}
  <line x1="${MX}" y1="1440" x2="${W - MX}" y2="1440" stroke="#D6DEE6" stroke-width="1"/>
  <text x="${MX}" y="1480" font-size="20" fill="${C.faint}" letter-spacing="1">@墨予镜</text>
  <text x="${W - MX}" y="1480" font-size="20" fill="${C.faint}" text-anchor="end" letter-spacing="1">企业 AI · 落地观察</text>
</svg>`;
}

function listSVG(card) {
  let items = "";
  let y = 360;
  for (let i = 0; i < card.items.length; i++) {
    const [head, desc] = card.items[i];
    const num = ["①", "②", "③", "④", "⑤"][i] || (i + 1 + "");
    items += `\n  <circle cx="${MX + 26}" cy="${y + 20}" r="20" fill="none" stroke="${C.mist}" stroke-width="1.5"/>
  <text x="${MX + 26}" y="${y + 28}" font-size="22" fill="${C.mist}" text-anchor="middle" font-weight="600">${num}</text>
  <text x="${MX + 64}" y="${y + 20}" font-size="34" fill="${C.title}" font-weight="600">${esc(head)}</text>
  <text x="${MX + 64}" y="${y + 66}" font-size="30" fill="${C.body}">${esc(desc)}</text>`;
    y += 128;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FONT}">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${sectionTitle(card.seq, card.title)}
  ${items}
  <line x1="${MX}" y1="1440" x2="${W - MX}" y2="1440" stroke="#D6DEE6" stroke-width="1"/>
  <text x="${MX}" y="1480" font-size="20" fill="${C.faint}" letter-spacing="1">@墨予镜</text>
  <text x="${W - MX}" y="1480" font-size="20" fill="${C.faint}" text-anchor="end" letter-spacing="1">企业 AI · 落地观察</text>
</svg>`;
}

function render(card) {
  if (card.type === "cover") return coverSVG(card);
  if (card.type === "list") return listSVG(card);
  return bodySVG(card);
}

// ============ 原文版流式分页 ============
// 把各小节标题 + 段落 + 引用串成连续内容流，撑满一页再换下一页（标题不再独占一页）。

const FLOW = { startY: 320, bottomY: 1330, LH: 60, GAP: 30, SIZE: 34, PER: 23 };

function buildFlow(cards) {
  const flow = [];
  for (const card of cards) {
    if (card.type === "cover") continue;
    flow.push({ kind: "title", text: card.title });
    for (const p of card.paras) flow.push({ kind: "para", text: p.t, style: p.s });
    if (card.quote) flow.push({ kind: "quote", text: card.quote });
  }
  return flow;
}

function itemHeight(item) {
  if (item.kind === "title") return 120; // 上留白 36 + 字 42 + 下留白 42
  if (item.kind === "para") return wrap(item.text, FLOW.PER).length * FLOW.LH + FLOW.GAP;
  if (item.kind === "quote") return 30 + 40 + wrap(item.text, 20).length * 60 + 20;
  return 0;
}

function paginate(flow) {
  const pages = [];
  let cur = [], y = FLOW.startY;
  for (let i = 0; i < flow.length; i++) {
    const item = flow[i];
    const h = itemHeight(item);
    if (cur.length && y + h > FLOW.bottomY) {
      pages.push(cur);
      cur = [];
      y = FLOW.startY;
    }
    // 标题孤行保护：标题放得下但后一项放不下时，标题也换到新页
    if (item.kind === "title" && i + 1 < flow.length) {
      const nextH = itemHeight(flow[i + 1]);
      if (y > FLOW.startY && y + h + nextH > FLOW.bottomY) {
        pages.push(cur);
        cur = [];
        y = FLOW.startY;
      }
    }
    cur.push(item);
    y += h;
  }
  if (cur.length) pages.push(cur);
  return pages;
}

function flowPageSVG(items, seq, total) {
  const { startY, LH, GAP, SIZE, PER } = FLOW;
  let y = startY;
  let body = "";
  for (const item of items) {
    if (item.kind === "title") {
      body += `\n  <text x="${MX}" y="${y + 86}" font-size="42" fill="${C.title}" font-weight="600">${esc(item.text)}</text>`;
      y += 120;
    } else if (item.kind === "para") {
      const style = item.style || "";
      const color = style === "mist" ? C.mist : style === "strong" ? C.strong : C.body;
      const weight = style ? "600" : "400";
      const size = style === "mist" ? 36 : SIZE;
      const lines = wrap(item.text, PER);
      for (const ln of lines) {
        body += `\n  <text x="${MX}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}">${esc(ln)}</text>`;
        y += LH;
      }
      y += GAP;
    } else if (item.kind === "quote") {
      y += 30;
      body += `\n  <line x1="${MX}" y1="${y}" x2="${W - MX}" y2="${y}" stroke="${C.faint}" stroke-width="1"/>`;
      y += 40;
      for (const ln of wrap(item.text, 20)) {
        body += `\n  <text x="${MX}" y="${y}" font-size="34" fill="${C.mist}" font-weight="600">${esc(ln)}</text>`;
        y += 60;
      }
      y += 20;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FONT}">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  <text x="${W - MX}" y="120" font-size="22" fill="${C.faint}" letter-spacing="4" text-anchor="end" font-weight="500">${esc(seq)}</text>
  ${body}
  <line x1="${MX}" y1="1440" x2="${W - MX}" y2="1440" stroke="#D6DEE6" stroke-width="1"/>
  <text x="${MX}" y="1480" font-size="20" fill="${C.faint}" letter-spacing="1">@墨予镜</text>
  <text x="${W - MX}" y="1480" font-size="20" fill="${C.faint}" text-anchor="end" letter-spacing="1">企业 AI · 落地观察</text>
</svg>`;
}

// ============ 数据 ============

const summary = [
  { type: "cover", title1: "企业上AI，", title2: "先别急着选工具", subtitle: "一个工具名，不是需求" },
  { type: "body", seq: "02/05", title: "先看清一条真实的工作链", paras: [
    { t: "客户开口就是一句——「我们想做个智能体」「能不能搭个知识库」。" },
    { t: "但真正跑通的项目，第一步几乎一样：先把工具名放一边，问清你要解决的，到底是哪条真实的工作链。" },
    { t: "一个工具名，不是需求。", s: "mist" },
    { t: "它是企业对自身痛点的一次模糊概括。" },
  ]},
  { type: "list", seq: "03/05", title: "一句「做个智能体」，盖住了 5 个问题", items: [
    ["起点和终点", "边界划不清，AI 只能处理孤立的片段"],
    ["输入材料", "材料不归拢，工具只能做演示"],
    ["产出给谁", "没有接手人，产出就是半成品"],
    ["出错谁兜底", "责任不划清，没人真敢用"],
    ["怎么算有用", "验收标准不定，落进「好像有用又没用」"],
  ]},
  { type: "body", seq: "04/05", title: "跑通的项目，第一步都在问问题", paras: [
    { t: "设一个「业务翻译」——把日常说法，拆成 AI 能执行的流程语言。" },
    { t: "先问「最近一次真实发生、让你觉得麻烦，是什么时候」。" },
    { t: "一线操作者全程参与——隐性规则和踩过的坑，都在他们脑子里。" },
    { t: "做法不同，都收敛到一句：", s: "strong" },
    { t: "先看清一条真实的业务流程。", s: "mist" },
  ]},
  { type: "body", seq: "05/05", title: "先做一件「笨」事", paras: [
    { t: "挑一条每周至少发生一次的流程，等它真实发生，完整记下来。" },
    { t: "这份记录回答三件事：值不值得上 AI、卡点在哪、能不能做七天小试点。" },
  ], quote: "下次再听到「我们想做个智能体」，先问一句——你最近一次被这件事卡住，是什么时候？" },
];

const full = [
  { type: "cover", title1: "企业上AI，", title2: "先别急着选工具", subtitle: "一个工具名，不是需求" },
  { type: "body", seq: "02/10", title: "同一个开场", paras: [
    { t: "接触企业 AI 服务有一阵子，会反复撞见同一个开场：客户坐下来，开口就是一句——" },
    { t: "「我们想做个智能体」「能不能搭个知识库」「这条流程能不能自动化」。" },
    { t: "听着需求明确，下一步似乎就该聊选型、报方案。但看过的企业 AI 落地案例里，真正跑通、一直在用的，几乎没有一个是顺着这句话往下做的。" },
    { t: "它们的第一步几乎一样：先把工具名放到一边，回头问清一件事——" },
    { t: "你想解决的，到底是哪条真实的工作链？", s: "mist" },
  ]},
  { type: "body", seq: "03/10", title: "工具名，不是需求", paras: [
    { t: "一个工具名，不是需求。", s: "mist" },
    { t: "它是企业对自身痛点的一次模糊概括——真正该交给 AI 的，是藏在它后面的那条真实链路：" },
    { t: "每天都在重复、处处有卡点、谁都嫌麻烦，但谁也说不明白。" },
  ]},
  { type: "body", seq: "04/10", title: "为什么「工具名」靠不住？", paras: [
    { t: "一句「做个智能体」，背后至少盖住了五个决定项目死活的问题，而这五个，没有一个是「换款工具」能解决的。" },
    { t: "先说起点和终点。「自动化报价」听上去目标清晰，但报价从哪一步算开始、到哪一步算结束？中间经过几个岗位、哪个环节最容易出错，很多企业自己都答不上来。" },
    { t: "边界划不清，AI 就只能处理一个孤立的片段，接不上真实的业务流。" },
  ]},
  { type: "body", seq: "05/10", title: "材料不归拢，只能做演示", paras: [
    { t: "再看输入材料。价目表在销售电脑里，历史报价躺在工作邮箱，优惠政策装在负责人脑子里，客户的特殊约定只留在老员工的聊天记录里。" },
    { t: "材料不归拢，再先进的工具也只能做演示，接不了真实的单子。" },
    { t: "然后是产出给谁。AI 写的会议纪要，是给全员存档，还是拆成动项发给对应负责人？没有接手人，产出就永远是悬浮的半成品。" },
  ]},
  { type: "body", seq: "06/10", title: "谁来兜底，怎么算有用", paras: [
    { t: "还有出错谁兜底。对外报价错一个小数点，客户流失的损失算谁的？这条不划清，负责人不敢批，一线员工不敢用。" },
    { t: "最后是「怎么算有用」。上线三个月，凭什么说这件事做成了？" },
    { t: "验收标准不提前定，做完只会落进「好像有用又好像没用」的模糊里，没法往下推。" },
  ]},
  { type: "body", seq: "07/10", title: "跑通的项目，第一步都在问问题", paras: [
    { t: "那些真正在业务里跑起来的项目，几乎都不是从「做功能」开始的，而是从「问问题」开始的。" },
    { t: "有的服务商专门设一个「业务翻译」的角色，第一件事不是写代码、搭框架，而是把客户嘴里的日常说法，拆成 AI 能执行的流程语言。" },
  ]},
  { type: "body", seq: "08/10", title: "两个必问的问题", paras: [
    { t: "有的服务方把「最近一次这件事真实发生、并且让你觉得麻烦，是什么时候」当成第一个必问的问题。没有这个「最近事件」做锚点，他们不定义任何功能，只做访谈。" },
    { t: "还有一条被反复验证：最懂流程细节的人——一线负责人、实际操作的员工——必须全程参与。隐性规则、例外、踩过的坑，全在他们脑子里，不在需求文档里。" },
  ]},
  { type: "body", seq: "09/10", title: "先做一件「笨」事", paras: [
    { t: "挑一条每周至少发生一次的业务流程，等它下一次真实发生的时候，完完整整记下来：经手人实际做了哪几步、打开哪些文件、在哪一步卡最久、出错通常谁来补。" },
    { t: "不用画流程图，记在备忘录里就行。这份记录不需要好看，唯一的要求是真实。" },
  ]},
  { type: "body", seq: "10/10", title: "先问那一句", paras: [
    { t: "就这么一份记录，能帮你回答三件事：值不值得上 AI、卡点在哪、能不能做七天就能验证的小试点。" },
    { t: "而对接服务商时，你也能一眼分出高下：先问「流程最近一次怎么走」的，比报功能的靠谱。" },
  ], quote: "下次再听到「我们想做个智能体」，先问一句——你最近一次被这件事卡住，是什么时候？" },
];

// ============ 生成 ============

const which = process.argv[2] || "all";

if (which === "summary" || which === "all") {
  summary.forEach((card, i) => {
    const idx = String(i + 1).padStart(2, "0");
    const file = join(OUT_DIR, `summary-${idx}.svg`);
    writeFileSync(file, render(card), "utf8");
    console.log(`生成 ${file}`);
  });
}

if (which === "full" || which === "all") {
  // 封面
  const coverFile = join(OUT_DIR, "full-01.svg");
  writeFileSync(coverFile, render(full[0]), "utf8");
  console.log(`生成 ${coverFile}`);
  // 正文流式分页
  const flow = buildFlow(full);
  const pages = paginate(flow);
  pages.forEach((items, i) => {
    const seq = `${String(i + 2).padStart(2, "0")}/${String(pages.length + 1).padStart(2, "0")}`;
    const file = join(OUT_DIR, `full-${String(i + 2).padStart(2, "0")}.svg`);
    writeFileSync(file, flowPageSVG(items, seq, pages.length + 1), "utf8");
    console.log(`生成 ${file}（${items.length} 项）`);
  });
  console.log(`原文版：封面 + ${pages.length} 页正文`);
}
