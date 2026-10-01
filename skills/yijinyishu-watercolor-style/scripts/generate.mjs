// 一镜一梳水彩拼贴风 · 文生图生成器（风格 prompt 单一源头）
// 走 AITechFlux 中继的 gpt-image-2（与 内容视觉工坊V2/generate-cards.mjs 同通道）。
// key 默认读 <mindsync>/projects/content-matrix/内容视觉工坊V2/.env.local，
// 可用环境变量 ART_ENV_PATH 指定其他 .env（需含 AITECHFLUX_API_KEY/BASE_URL/IMAGE_MODEL）。
// 用法：node generate.mjs <prompt.md|纯文本prompt> <out.png> [portrait|landscape] [--bleed]
//   --bleed：满版出血图（hero 卡配图）——要求画面延伸到四边、不留白边。
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { isAbsolute, resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const positional = argv.filter(a => !a.startsWith("--"));
const [promptArg, outArg, orientArg] = positional;
const bleed = argv.includes("--bleed");
if (!promptArg || !outArg) {
  console.error("用法：node generate.mjs <prompt.md|纯文本> <out.png> [portrait|landscape] [--bleed]");
  process.exit(1);
}
const skillDir = dirname(fileURLToPath(import.meta.url));
const envPath = process.env.ART_ENV_PATH
  || join(skillDir, "../../../projects/content-matrix/内容视觉工坊V2/.env.local");
if (!existsSync(envPath)) { console.error(`找不到 env：${envPath}`); process.exit(1); }

const env = {};
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
  if (m) env[m[1]] = m[2];
}
const API_KEY = env.AITECHFLUX_API_KEY;
const BASE_URL = (env.AITECHFLUX_BASE_URL || "https://aitechflux.com/v1").replace(/\/$/, "");
const MODEL = env.AITECHFLUX_IMAGE_MODEL || "gpt-image-2";
if (!API_KEY) { console.error("env 缺 AITECHFLUX_API_KEY"); process.exit(1); }

const raw = existsSync(promptArg)
  ? readFileSync(promptArg, "utf8").trim()
  : promptArg;
const orient = orientArg === "landscape" ? "landscape" : "portrait";
const size = orient === "landscape" ? "1536x1024" : "1024x1536";

// 风格前缀 = 本风格唯一权威定义，改动需回归已有套图。
const STYLE = `手绘水彩拼贴插画（watercolor collage illustration），温暖纸感：主色深蓝 #1f3d6b、赭石 #b8623c、灰绿 #6c7f5c，米色纸底 #f7f2e7；柔和水彩晕染、撕纸拼贴边缘、少量植物枝叶点缀；画面干净、留白充足、治愈系编辑风格。图中不要出现任何文字、字母、数字、水印、logo。`;

const bleedNote = bleed
  ? `\n满版出血要求：画面内容从头到脚延伸到四边画布边缘，不留白边、不画边框，背景元素铺满四角。`
  : "";
const prompt = `${STYLE}\n\n画面内容：${raw}\n${bleedNote}\n画幅：${orient === "landscape" ? "横版" : "竖版"}，主体居中偏${orient === "landscape" ? "右" : "中"}，构图适配 ${size}。`;

console.log(`生成中：${MODEL} ${size}${bleed ? " bleed" : ""} ...`);
const resp = await fetch(`${BASE_URL}/images/generations`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
  body: JSON.stringify({ model: MODEL, prompt, size, quality: "high", n: 1 }),
});
const text = await resp.text();
if (!resp.ok) { console.error(`HTTP ${resp.status}: ${text.slice(0, 300)}`); process.exit(1); }
const payload = JSON.parse(text);
const item = payload?.data?.[0];
if (!item) { console.error(`响应无 data: ${text.slice(0, 300)}`); process.exit(1); }

const out = isAbsolute(outArg) ? outArg : resolve(process.cwd(), outArg);
if (item.b64_json) {
  writeFileSync(out, Buffer.from(item.b64_json, "base64"));
} else if (item.url) {
  const img = await fetch(item.url);
  writeFileSync(out, Buffer.from(await img.arrayBuffer()));
} else {
  console.error("响应既无 b64_json 也无 url"); process.exit(1);
}
console.log(out);
