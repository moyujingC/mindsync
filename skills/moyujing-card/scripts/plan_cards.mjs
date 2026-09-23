// LLM 分块：成稿 md → cards.json（moyujing-card 渲染契约）
// 用法：node scripts/plan_cards.mjs <成稿.md> --out <任务目录/cards.json>
// 可选：--theme theme-light|theme-dark（默认 theme-light）
//       --series "企业 AI 落地" --logo 墨予镜 --foot-l "..." --foot-r "..."
//       --max-cards 8（默认 8，含封面与收尾）
// LLM key 从排版工坊 engine/.env 读（OPENAI_* 变量），模型同引擎。
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > -1 ? process.argv[i + 1] : d; };
const [mdPath] = process.argv.slice(2).filter((a) => a.endsWith(".md"));
const outPath = arg("out");
if (!mdPath || !outPath) { console.error("用法：node scripts/plan_cards.mjs <成稿.md> --out <cards.json> [--theme theme-light]"); process.exit(1); }

const THEME = arg("theme", "theme-light");
const LOGO = arg("logo", "墨予镜");
const SERIES = arg("series", "墨予镜 · FIELD NOTES");
const FOOT_L = arg("foot-l", "墨予镜 · 企业 AI 落地");
const FOOT_R = arg("foot-r", "现场 / 工程 / 结果 / 沉淀");
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
const system = `你是小红书知识卡片的拆稿编辑。把给定文章拆成一组 3:4 知识卡片（Field Memo 风格：巨字问句标题 + 模块化内容块 + 金句横幅）。

严格输出 JSON（不要代码围栏，不要任何解释），格式：
[{"name":"01-文件名slug","theme":"${THEME}","logo":"${LOGO}","series":"${SERIES}","page":"01 / 0N","index":"01","foot_l":"${FOOT_L}","foot_r":"${FOOT_R}","content":"<h1 class='title'>...</h1>..."}]

硬性规则：
1. 全套 ${MAX} 张以内：第 1 张封面宣言卡（大标题=文章核心命题 + 一句 lead + 3~4 条 blist 要点预览，不用 banner），中间每张一个问句标题或一个论点，最后一张收尾金句卡（短标题 + 单 banner）。
2. 标题优先用问句；每张卡只承载一个核心问题/论点。
3. content 只允许这些 class：title(h1 内容卡标题)、title-xl(h1 封面宣言卡/收尾卡巨型标题，每行 3~5 字按词组自然断行)、lead、lead-sm、kicker、kicker-text、num-item(内含 .t 和 .d)、group-label、blist(ul)、banner(div)。禁止 inline style，禁止其他 class/标签（strong/b 可用）。
4. 每张卡最多一个 banner，banner 至多两行；中间内容卡尽量每张带一个 banner（从原文金句中选），封面和收尾除外。
5. 逐字保留原文关键句，不改写事实；可压缩过渡句。列表项从原文列表来。
6. 密度与预算（超了必溢出，宁可拆卡）：标题至多两行（约 20 字以内，超了精简）；列表卡 blist 至多 6 条且每条一行；编号项至多 4 项且 .d 一行；lead 至多两行。一张卡总元素 ≈ 标题+1 说明+1 内容组+1 banner。
7. num-item 的编号用 ①②③④⑤ 字符放在 .t 开头；kicker 用英文大写标签（如 RESULT 01 / DAY 1 MORNING）。
8. page 和 index 用两位数字，与数组顺序一致；name 用 两位数字-中文短slug。
9. 原文没有的数据、案例、数字禁止编造。
10. 收尾卡标题 ≤14 字，禁止孤字换行（把长句拆成标题+banner）。

叙事线参考：封面宣言 → 逐问逐答（是什么/为什么/怎么做/边界与风险）→ 收尾金句。`;

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
const ALLOWED = /class="(title-xl|title|lead|lead-sm|kicker|kicker-text|num-item|t|d|group-label|blist|banner)"/;
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
