// 墨予镜小红书拆卡出图脚本（一次性工具）
// 用途：把已确认的 4 张画图 prompt 通过 AITechFlux gpt-image-2 出图
// 用法：node scripts/generate-cards.mjs [1|2|3|4|all]   （默认 all）
// Key 从 内容视觉工坊V2/.env.local 读取，不打印到 stdout。

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const V2_DIR = join(__dirname, "..");
const OUT_DIR = join(
  V2_DIR,
  "..",
  "accounts",
  "墨予镜",
  "小红书出图"
);

function loadEnv(path) {
  const txt = readFileSync(path, "utf8");
  const env = {};
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const env = loadEnv(join(V2_DIR, ".env.local"));
const API_KEY = env.AITECHFLUX_API_KEY;
const BASE_URL = (env.AITECHFLUX_BASE_URL || "https://aitechflux.com/v1").replace(/\/$/, "");
const MODEL = env.AITECHFLUX_IMAGE_MODEL || "gpt-image-2";

if (!API_KEY) {
  console.error("缺少 AITECHFLUX_API_KEY，检查 内容视觉工坊V2/.env.local");
  process.exit(1);
}

const STYLE = `竖版（portrait）知识卡片，纸感科技信息卡风格：画面像"一个人在认真整理自己的判断"，克制、安静、留白充足、有编辑感。纸面纹理、轻微压痕、细胶带拼贴元素，蓝灰与米白配色（深蓝灰用于标题与主文字、中蓝灰用于强调与图标、浅灰用于分隔线），科技感克制、信息层级清楚。不做手绘涂鸦、不做低幼手账、不做赛博朋克霓虹。所有文字使用清晰可辨的中文编辑字体，笔画干净克制。`;

const cards = [
  {
    id: "01",
    file: "01-封面判断-冰山模型.png",
    prompt: `${STYLE}

构图：冰山模型——水面上下分层，水面上是表象、水面下是本质，画面中部一条横向波浪线表示水面。

必须在图中显示以下文字，原样呈现，不要增删改任何字、不要添加其他文字：
- 顶部横幅（占顶部15-20%）："企业上AI，先别急着选工具"
- 冰山水面以上（画面中上部，只露出尖角的小冰山）："「我们想做个智能体」"，下方一行小字"一个工具名"，旁边一个扳手与齿轮的简洁线性图标
- 冰山水面以下（画面下部，冰山庞大主体浸在水中）："真正该交给 AI 的，是藏在它后面的那条真实工作链"，旁边几个沿流程线站立的简洁小人线性图标
- 右上角小字标注："01/04"

冰山上散布少量中蓝灰细碎几何点，画面留白充足、不堆满。`,
  },
  {
    id: "02",
    file: "02-为什么工具名靠不住-5卡片堆叠.png",
    prompt: `${STYLE}

构图：竖版卡片堆叠——从上到下堆叠5张独立卡片，每张卡片一个要点，卡片间留白均匀。

必须在图中显示以下文字，原样呈现，不要增删改任何字、不要添加其他文字：
- 顶部横幅（占顶部15-20%）："一句「做个智能体」，盖住了5个决定死活的问题"
- 卡片1：左上角小标签"起点和终点"，中部"边界划不清，AI 只能处理孤立的片段"，旁边一个从中间断开的链条线性图标
- 卡片2：小标签"输入材料"，中部"材料不归拢，工具只能做演示"，旁边几张散落错位的文件纸线性图标
- 卡片3：小标签"产出给谁"，中部"没有接手人，产出就是悬浮的半成品"，旁边一个无人接住的纸飞机线性图标
- 卡片4：小标签"出错谁兜底"，中部"责任不划清，没人真敢用"，旁边一个大问号线性图标
- 卡片5：小标签"怎么算有用"，中部"验收标准不定，落进「好像有用又没用」"，旁边一段模糊的进度条线性图标
- 右上角小字标注："02/04"

每张卡片用浅灰细线框住，带轻微纸张边缘感。`,
  },
  {
    id: "03",
    file: "03-跑通的项目怎么做-中心发散.png",
    prompt: `${STYLE}

构图：中心发散——画面正中一个核心结论圆角方框，周围环绕三个做法，用中蓝灰细线连接到中心。

必须在图中显示以下文字，原样呈现，不要增删改任何字、不要添加其他文字：
- 顶部横幅（占顶部15-20%）："跑通的项目，第一步不是做功能，是问问题"
- 中心圆角方框（画面正中）："先看清一条真实的业务流程"，方框中心一个简洁的放大镜线性图标
- 做法1（中心方框右上方）：小标签"设一个「业务翻译」"，"把日常说法拆成 AI 能执行的流程语言"，旁边一个转译对话气泡线性图标
- 做法2（中心方框左上方）：小标签"先问「最近一次」"，"最近一次真实发生、让你觉得麻烦，是什么时候"，旁边一个日历翻页线性图标
- 做法3（中心方框下方）：小标签"一线操作者全程参与"，"隐性规则和踩过的坑，都在他们脑子里"，旁边两个并肩站立的人物线性图标
- 右上角小字标注："03/04"

四个区块分布均衡，画面留白充足。`,
  },
  {
    id: "04",
    file: "04-你的第一步-竖向递进.png",
    prompt: `${STYLE}

构图：竖向递进卡片——从上到下3张卡片，用中蓝灰细箭头连接表示递进，底部收在金句区，用一条浅灰横线与上方分隔。

必须在图中显示以下文字，原样呈现，不要增删改任何字、不要添加其他文字：
- 顶部横幅（占顶部15-20%）："先做一件「笨」事：记一条真实业务流程"
- 卡片1："挑一条每周至少发生一次的流程"，"等它真实发生时，完整记下来"，旁边一个记事本与笔线性图标
- 卡片2："这份记录回答三件事"，"值不值得上 AI / 卡点在哪 / 能不能做七天小试点"，旁边三个并排勾选框线性图标
- 卡片3："对接服务商一眼分高下"，"先问「流程最近一次怎么走」的，更靠谱"，旁边一个对话气泡对比线性图标
- 底部金句区（画面底部，视觉上略作强调）："下次再听到「我们想做个智能体」，先问一句——"，下一行"你最近一次被这件事卡住，是什么时候？"，旁边一个简洁问号线性图标
- 画面最底部小字标记："END"
- 右上角小字标注："04/04"`,
  },
];

const whichArg = process.argv[2] || "all";
const which = whichArg === "all" ? "all" : String(whichArg).padStart(2, "0");
const targets = which === "all" ? cards : cards.filter((c) => c.id === which);
if (targets.length === 0) {
  console.error(`未知卡片编号：${which}（可用 1|2|3|4|all）`);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

async function generateOne(card) {
  const url = `${BASE_URL}/images/generations`;
  const body = {
    model: MODEL,
    prompt: card.prompt,
    size: "1024x1536",
    quality: "high",
    n: 1,
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const raw = await resp.text();
  if (!resp.ok) {
    throw new Error(`第${card.id}张 HTTP ${resp.status}: ${raw.slice(0, 300)}`);
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error(`第${card.id}张返回非 JSON: ${raw.slice(0, 200)}`);
  }

  const item = payload?.data?.[0];
  if (!item) {
    throw new Error(`第${card.id}张响应无 data: ${raw.slice(0, 300)}`);
  }

  if (item.b64_json) {
    const buf = Buffer.from(item.b64_json, "base64");
    const out = join(OUT_DIR, card.file);
    writeFileSync(out, buf);
    return { out, bytes: buf.length, via: "b64_json" };
  }
  if (item.url) {
    const imgResp = await fetch(item.url);
    if (!imgResp.ok) throw new Error(`第${card.id}张下载图片失败 ${imgResp.status}`);
    const buf = Buffer.from(await imgResp.arrayBuffer());
    const out = join(OUT_DIR, card.file);
    writeFileSync(out, buf);
    return { out, bytes: buf.length, via: "url" };
  }
  throw new Error(`第${card.id}张无 b64_json 也无 url: ${raw.slice(0, 300)}`);
}

for (const card of targets) {
  try {
    const r = await generateOne(card);
    console.log(`✅ 第${card.id}张完成 (${r.via}, ${(r.bytes / 1024).toFixed(0)} KB) → ${r.out}`);
  } catch (e) {
    console.error(`❌ 第${card.id}张失败: ${e.message}`);
  }
}
