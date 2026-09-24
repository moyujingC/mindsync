// LLM 分块：成稿 md → cards.json（healing-card 渲染契约 · 暖愈疗愈风）
// 用法：node scripts/plan_cards.mjs <成稿.md> --out <任务目录/cards.json>
// 可选：--logo 一镜一梳 --series "..." --foot-l "..." --foot-r "..."
//       --max-cards 8（默认 8，含封面与收尾）
// LLM key 从排版工坊 engine/.env 读（OPENAI_* 变量），模型同引擎。
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > -1 ? process.argv[i + 1] : d; };
const [mdPath] = process.argv.slice(2).filter((a) => a.endsWith(".md"));
const outPath = arg("out");
if (!mdPath || !outPath) { console.error("用法：node scripts/plan_cards.mjs <成稿.md> --out <cards.json>"); process.exit(1); }

const THEME = "theme-warm"; // 暖愈单主题
const LOGO = arg("logo", "一镜一梳");
const SERIES = arg("series", "一镜一梳 · 自我疗愈手记");
const FOOT_L = arg("foot-l", "一镜一梳 · 曼陀罗自我疗愈");
const FOOT_R = arg("foot-r", "看见 · 接纳 · 照顾自己");
const MAX = Number(arg("max-cards", "8"));

// LLM env：复用排版工坊引擎的 .env
const ENGINE_ENV = "/Users/xinran/Downloads/dev/mindsync/projects/content-matrix/排版工坊/engine/.env";
if (existsSync(ENGINE_ENV)) {
  for (const line of readFileSync(ENGINE_ENV, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const { chat } = await import("/Users/xinran/Downloads/dev/mindsync/projects/content-matrix/排版工坊/engine/lib/llm.mjs");

const article = readFileSync(mdPath, "utf8");
const system = `你是小红书疗愈卡片的拆稿编辑。把给定文章拆成一组 3:4 疗愈卡片（暖愈风格：宋体温和标题 + 模块化内容块 + 陶土暖沙金句横幅）。语气温暖陪伴、清晰安定，不说教、不制造焦虑。

严格输出 JSON（不要代码围栏，不要任何解释），格式：
[{"name":"01-文件名slug","theme":"${THEME}","logo":"${LOGO}","series":"${SERIES}","page":"01 / 0N","index":"01","foot_l":"${FOOT_L}","foot_r":"${FOOT_R}","content":"<h1 class='title'>...</h1>..."}]

硬性规则：
1. 全套 ${MAX} 张以内：第 1 张封面宣言卡（大标题=文章核心命题 + 一句 lead + 3~4 条 blist 要点预览，不用 banner），中间每张一个温和问句标题或一个练习/论点，最后一张收尾卡（短标题 + 单 banner 温柔金句）。
2. 标题优先用温和问句或邀请式陈述；每张卡只承载一个核心问题/练习/论点。
3. content 只允许这些 class：title(h1 内容卡标题，超过 6 字必须用 <br> 按词组断行，每行不超过 7 字，禁止顶满版心左右边距)、title-xl(h1 封面宣言卡/收尾卡巨型标题，必须输出 <br> 手动断行，每行 3~5 字成词组，禁止顶满版心左右边距)、lead、lead-sm、kicker、kicker-text、num-item(内含 .t 和 .d)、group-label、blist(ul)、banner(div)。禁止 inline style，禁止其他 class/标签（strong/b 可用）。
4. 每张卡最多一个 banner，banner 至多两行；中间内容卡尽量每张带一个 banner（从原文温柔金句中选），封面和收尾除外。
5. 逐字保留原文关键句，不改写事实；可压缩过渡句。列表项从原文列表来。
6. 密度与预算（超了必溢出，宁可拆卡）：标题至多三行（title-xl 每行 3~5 字、title 每行不超过 7 字，用 <br> 断行），总字数约 18 字以内，超了精简；列表卡 blist 至多 6 条且每条一行；编号项至多 4 项且 .d 一行；lead 至多两行。一张卡总元素 ≈ 标题+1 说明+1 内容组+1 banner。
7. num-item 的编号用 ①②③④⑤ 字符放在 .t 开头；kicker 用中文小标签（如 练习 01 / 第 1 天 / 画后观察）。
8. page 和 index 用两位数字，与数组顺序一致；name 用 两位数字-中文短slug。
9. 原文没有的数据、案例、功效禁止编造。
10. 收尾卡标题 ≤12 字，禁止孤字换行（把长句拆成标题+banner）。
11. 疗愈表达禁忌：不用「治愈/治疗/诊断/疗效」等医疗承诺词；功效表述一律用「可能/有助于/邀请你试试」式；涉及情绪困境时先接住在邀请，不评判。

叙事线参考：封面邀请 → 逐问展开（是什么/为什么/怎么开始/怎么观察）→ 温柔收尾。`;

const user = `【文章】\n${article}\n\n请拆成卡片组 JSON。`;
console.log("LLM 拆稿中…");
const raw = await chat(system, user);

// 提取 JSON（容错：去围栏、截取首个 [ 到最后一个 ]）
let j = raw.trim().replace(/```(?:json)?\s*/g, "");
const s = j.indexOf("["), e = j.lastIndexOf("]");
if (s === -1 || e === -1) {
  writeFileSync(outPath + ".raw.txt", raw, "utf8");
  console.error("LLM 未返回 JSON 数组，原始响应已存 " + outPath + ".raw.txt");
  process.exit(2);
}
let cards;
try { cards = JSON.parse(j.slice(s, e + 1)); }
catch (err) {
  writeFileSync(outPath + ".raw.txt", raw, "utf8");
  console.error("JSON 解析失败：" + err.message + "，原始响应已存 " + outPath + ".raw.txt");
  process.exit(2);
}

// 结构校验
let bad = [];
cards.forEach((c, i) => {
  for (const k of ["name", "theme", "logo", "series", "page", "index", "foot_l", "foot_r", "content"])
    if (!(k in c)) bad.push(`卡${i + 1} 缺字段 ${k}`);
  const classes = [...(c.content || "").matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/));
  const okSet = new Set(["title", "lead", "lead-sm", "kicker", "kicker-text", "num-item", "t", "d", "group-label", "blist", "banner"]);
  for (const cls of classes) if (!okSet.has(cls)) bad.push(`卡${i + 1} 出现非法 class: ${cls}`);
  if (!/<h1 class=['"](title-xl|title)['"]>/.test(c.content || "")) bad.push(`卡${i + 1} 缺 title`);
});
if (bad.length) {
  console.error("结构校验失败：\n  " + bad.join("\n  "));
  writeFileSync(outPath + ".invalid.json", JSON.stringify(cards, null, 2), "utf8");
  process.exit(3);
}

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(cards, null, 2), "utf8");
console.log(`✓ cards.json → ${outPath}（${cards.length} 张）`);
