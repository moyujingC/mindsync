// 一镜一梳敦煌柔光风 · 文生图生成器（风格 prompt 单一源头）
// 走 AITechFlux 中继的 gpt-image-2（与 yijingyishu-watercolor-style 同通道）。
// key 默认读 <mindsync>/projects/content-matrix/内容视觉工坊V2/.env.local，
// 可用环境变量 ART_ENV_PATH 指定其他 .env（需含 AITECHFLUX_API_KEY/BASE_URL/IMAGE_MODEL）。
// 用法：node generate.mjs <prompt.md|纯文本prompt> <out.png> [portrait|landscape|square] [--bleed] [--comb]
//   --bleed：满版出血图（hero 卡配图）——画面延伸到四边、不留白边。
//   --comb：画面含梳子时必加——以 references/comb-logo.png 为形象锚走 /images/edits，
//           原样保留 logo 梳子的造型/材质/纹饰，只把它放进场景。不加此 flag 出梳子会造型漂移。
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { isAbsolute, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const positional = argv.filter(a => !a.startsWith("--"));
const [promptArg, outArg, orientArg] = positional;
const bleed = argv.includes("--bleed");
const comb = argv.includes("--comb");
if (!promptArg || !outArg) {
  console.error("用法: node generate.mjs <prompt|prompt.md> <out.png> [portrait|landscape|square] [--bleed] [--comb]");
  process.exit(1);
}

// ---- env ----
const DEFAULT_ENV = resolve(dirname(fileURLToPath(import.meta.url)),
  "../../../projects/content-matrix/内容视觉工坊V2/.env.local");
const envPath = process.env.ART_ENV_PATH || DEFAULT_ENV;
const env = {};
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
    if (m) env[m[1]] = m[2];
  }
}
const API_KEY = env.AITECHFLUX_API_KEY;
const BASE_URL = (env.AITECHFLUX_BASE_URL || "https://aitechflux.com/v1").replace(/\/$/, "");
const MODEL = env.AITECHFLUX_IMAGE_MODEL || "gpt-image-2";
if (!API_KEY) { console.error(`env 缺 AITECHFLUX_API_KEY（${envPath}）`); process.exit(1); }

const raw = existsSync(promptArg) ? readFileSync(promptArg, "utf8").trim() : promptArg;
const SIZES = { portrait: "1024x1536", landscape: "1536x1024", square: "1024x1024" };
const orient = orientArg && SIZES[orientArg] ? orientArg : "portrait";
const size = SIZES[orient];
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const COMB_LOGO = resolve(SCRIPT_DIR, "../references/comb-logo.png");

// 风格前缀 = 本风格唯一权威定义，改动需回归已有套图。
// 核心美学：温柔漫射光影 > 一切。极简构图、低饱和、大留白、少元素。
const STYLE = `Sacred serene stylized illustration, softly painterly modern digital painting — clean simplified forms with refined moderate detail and a soft luminous glow. Semi-flat rendering with delicate line work and gentle texture. NOT photorealistic, NOT dense filigree lace, NOT heavy sparkle storm, NOT busy background.

LIGHT STRUCTURE — the top priority: ONE single hero light source actually emits light. One dominant golden artifact (a mandala disc or an ancient round mirror) as one elegant round form with refined interior ornament — a graceful lotus-petal ring, thin gold line patterns and small gem-like dots, clearly drawn but airy, never lace-dense. It glows: a warm bright core, a soft bloom halo, several small four-point star sparkles, a light scattering of tiny floating gold dust motes. The gold has layered warmth — bright warm core, champagne mid-tones, deeper bronze at the outer rim. Soft volumetric glow, clean and airy.

Value structure: deep ultramarine and violet-indigo shadows (#10143A, #2A1F52 — clear hue, never gray); brilliant warm highlights approaching soft white (#FFF8E2) at the glowing core and moon; wide calm brightness range from quiet deep night to radiant glow.

Color: cool shadows, warm highlights, split along a diagonal or the horizon — ultramarine/violet night sky above, champagne-cream dunes below with soft warm light, roughly 4:6. Overall low-to-mid saturation with clear brightness contrast; the glow area carries the richest warm gold.

Apsara, when present: ONE serene celestial maiden, elegant stylized face with soft painterly shading, hair in an ornate but simple topknot with one or two small gold hairpins and a thin flowing ribbon, no heavy jewelry. Her dress is formed of several long translucent silk ribbon bands with gentle folds, fine gold edge lines and soft light streaks. Her ribbon palette is luminous multicolor kept airy: champagne, ivory, pale jade (#9FD8C8), soft peach, lotus pink — high-lightness band, low-to-mid saturation, unified by one warm glow, colors on lit sides only, like soft opal. No rainbow clutter, no dark saturated colors. A gentle warm rim light traces her silhouette.

Composition: vertical poster, calm and balanced. One glowing artifact as the single spiritual focal point; the apsara and one tiny distant camel caravan connected by one flowing line of golden light forming a quiet guiding loop; each element has refined detail but generous breathing room; a big clean empty area (near-flat sky, at most a few faint tiny stars) reserved for text; about 5-6 elements total; soft simple dune shapes with gentle light and shadow; nothing touching the frame edges.

Optional supporting elements (at most one or two besides the artifact, apsara and caravan): one soft white glowing crescent moon, one or two small luminous butterflies, a thin river of golden light, a few faint stars.

Absolutely no text, no letters, no numbers, no watermark, no logo anywhere in the image.`;

// 风格版本注记：v4.2（2026-10-03）= 扁平圣光 + 适度细节。
// v4 太杂（CG 写实/镂空蕾丝/粒子雨）→ v4.1 太简（纯剪影/细节过少）→ v4.2 折中：
// 法器=精致一层纹样（莲瓣环+细金线+小宝石点）；星芒与金尘适量；飘带带褶皱/金边/流光；
// 沙丘带柔和明暗；飞天可有小金簪。保留：单一发光核心/冷暖分区/高明度多色飘带/闭环光带/大留白。

// 风格版本注记：v4.1（2026-10-03）= 扁平圣光插画。
// v4 试验（test-recreate/test-light）被评"杂乱"：CG 写实细节过多（镂空金丝/珠宝/粒子雨/复杂云）。
// v4.1 修正：半扁平图形化渲染；法器=简洁剪影+少量金线+微光；粒子极稀疏；
// 飞天极简（无头饰珠宝）；色块平整；全画面元素 ≤4-5 个；保留 v4 的发光核心/冷暖分区/高明度飘带。
// 与 v3.1 的差异：v3.1 是暗色柔光极简且无发光体；v4.1 必须有真实发光体+多色飘带+闭环引导线。

// 风格版本注记：v4（2026-10-03）= 参考图复刻方向——CG 圣光电影语言。
// 与 v3.1 的关键差异：①必须有真实发光体（金色法器=bloom+星芒+白金高光点）；
// ②暗部=群青/靛紫有色相，禁灰；③金=白金高光+饱和金中间调+深金暗部三层；
// ④飘带高明度带多色（蛋白石/极光感），禁暗色彩虹、禁单一壁画黄；⑤竖构图闭环引导线。
// v3.1 的暖单色/平面壁画规则已被本版取代，勿回退。

// 梳子形象锁：以 logo 为锚，原样保留
const COMB_LOCK = `The attached image is the brand's sacred jade comb logo. Reproduce THIS EXACT COMB in the scene with its appearance completely unchanged: same gourd-shaped pale jade body, same round mirror with golden ornate engraved frame on top, same red-orange flower with green center on the belly, same pair of blue enamel cloud scrolls on both sides, same golden line patterns, same jade comb teeth. Do not redesign, simplify, recolor or add patterns to the comb. Only place it into the scene with a soft gentle glow, keeping its proportions, colors and all decorative details exactly as in the attached image.`;

const bleedNote = bleed
  ? `\n满版出血要求：画面内容从头到脚延伸到四边画布边缘，不留白边、不画边框，背景元素铺满四角（仍保持极简与柔光）。`
  : "";
const sceneNote = comb
  ? `${COMB_LOCK}\n\nScene around the comb: ${raw}`
  : `Scene: ${raw}`;
const prompt = `${STYLE}\n\n${sceneNote}\n画幅：${orient}，构图适配 ${size}。${bleedNote}`;

console.log(`生成中：${MODEL} ${size}${bleed ? " bleed" : ""}${comb ? " comb-locked" : ""} ...`);

let resp;
if (comb) {
  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", prompt);
  form.append("size", size);
  form.append("quality", "high");
  form.append("image", new Blob([readFileSync(COMB_LOGO)], { type: "image/png" }), "comb.png");
  resp = await fetch(`${BASE_URL}/images/edits`, { method: "POST", headers: { Authorization: `Bearer ${API_KEY}` }, body: form });
} else {
  resp = await fetch(`${BASE_URL}/images/generations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: MODEL, prompt, size, quality: "high", n: 1 }),
  });
}
const text = await resp.text();
if (!resp.ok) { console.error(`HTTP ${resp.status}: ${text.slice(0, 300)}`); process.exit(1); }
const item = JSON.parse(text)?.data?.[0];
if (!item) { console.error(`响应无 data: ${text.slice(0, 300)}`); process.exit(1); }

const out = isAbsolute(outArg) ? outArg : resolve(process.cwd(), outArg);
if (item.b64_json) writeFileSync(out, Buffer.from(item.b64_json, "base64"));
else if (item.url) writeFileSync(out, Buffer.from(await (await fetch(item.url)).arrayBuffer()));
else { console.error("响应既无 b64_json 也无 url"); process.exit(1); }
console.log(out);
