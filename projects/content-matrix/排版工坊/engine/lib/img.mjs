// gpt-image-2 生图客户端（OpenAI 兼容 /images/generations，经 relay）
// 尺寸约束：边为 16 倍数、≤3840px、比例 ≤3:1、总像素 655,360~8,294,400
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ENV = join(dirname(fileURLToPath(import.meta.url)), "../.env");
if (existsSync(ENV)) {
  for (const line of readFileSync(ENV, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

// 选最接近目标宽高比的合法尺寸（宽×高均为 16 倍数）
export function fitSize(targetW, targetH, maxMP = 2.2) {
  const ratio = targetW / targetH;
  const snap = (n) => Math.max(16, Math.round(n / 16) * 16);
  // 从目标像素起步放大直到满足下限
  let w = snap(targetW), h = snap(targetH);
  while (w * h < 655360) { w = snap(w * 1.2); h = snap(h * 1.2); }
  while (w * h > maxMP * 1e6) { w = snap(w / 1.2); h = snap(h / 1.2); }
  // 逼近目标比例
  h = snap(w / ratio);
  if (h > w * 3) h = snap(w * 3);
  return { width: w, height: h };
}

// 文生图 → 存盘 → 返回绝对路径
export async function genImage({ prompt, size, quality = "low", out }) {
  const env = process.env;
  const r = await fetch(env.LLM_BASE_URL + "/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + env.LLM_API_KEY },
    body: JSON.stringify({ model: env.LLM_IMAGE_MODEL || "gpt-image-2", prompt, size: `${size.width}x${size.height}`, quality }),
  });
  const j = await r.json();
  const d = j.data?.[0];
  if (!d) throw new Error(`生图失败：${JSON.stringify(j).slice(0, 200)}`);
  const { writeFileSync } = await import("node:fs");
  if (d.b64_json) {
    writeFileSync(out, Buffer.from(d.b64_json, "base64"));
  } else if (d.url) {
    const img = await fetch(d.url);
    writeFileSync(out, Buffer.from(await img.arrayBuffer()));
  } else throw new Error("响应既无 b64_json 也无 url");
  return out;
}
