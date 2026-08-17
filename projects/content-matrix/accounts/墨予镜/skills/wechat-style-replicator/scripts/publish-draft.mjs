// 把成稿渲染成公众号草稿 HTML，并直发到公众号草稿箱。
// 用法：node scripts/publish-draft.mjs <成稿.md> <styles/风格名.json> [封面图.png]
// 封面图缺省时用 小红书出图/墨予镜-mdnice/full-01.png（竖版，建议后续换横版 900×383）。
// 凭证从同目录 .env 读（WECHAT_APP_ID / WECHAT_APP_SECRET），不入 git。

import { readFileSync, existsSync, statSync, rmSync } from "node:fs";
import { dirname, join, basename, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { renderArticleBody } from "./lib/render.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ACCOUNT_DIR = join(__dirname, "../../../");
const AUTHOR = "墨予镜";

const [mdPath, specPath, coverArg] = process.argv.slice(2);
if (!mdPath || !specPath) {
  console.error("用法：node scripts/publish-draft.mjs <成稿.md> <styles/风格名.json> [封面图.png]");
  process.exit(1);
}

const coverPath = coverArg
  ? (coverArg.startsWith("/") ? coverArg : join(process.cwd(), coverArg))
  : join(ACCOUNT_DIR, "小红书出图", "墨予镜-mdnice", "full-01.png");

// 读 .env（简单 key=value 解析）
function loadEnv() {
  const raw = readFileSync(join(__dirname, "..", ".env"), "utf8");
  return Object.fromEntries(
    raw.trim().split("\n").map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
  );
}

// 提取文章标题 + 正文（丢弃第一个 # 标题行之前的元数据引用块）
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

async function getAccessToken(env) {
  const r = await fetch(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${env.WECHAT_APP_ID}&secret=${env.WECHAT_APP_SECRET}`
  );
  const j = await r.json();
  if (!j.access_token) throw new Error(`获取 access_token 失败：${j.errcode} ${j.errmsg}`);
  return j.access_token;
}

// 上传封面图 → 永久素材 thumb_media_id
async function uploadCover(token, coverPath) {
  const buf = readFileSync(coverPath);
  const form = new FormData();
  form.append("media", new Blob([buf], { type: "image/png" }), "cover.png");
  const r = await fetch(
    `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`,
    { method: "POST", body: form }
  );
  const j = await r.json();
  if (!j.media_id) throw new Error(`上传封面失败：${j.errcode} ${j.errmsg}`);
  return j.media_id;
}

// 微信「图文消息内图片」上传接口限制：仅 jpg/png，< 1MB。超限图片先用 PIL 转 jpg 压到限内。
const UPLOADIMG_MAX_BYTES = 1024 * 1024;

// 若图片 ≥1MB，用 PIL 转 jpg（质量从 88 逐级降到 56，仍超限再缩宽度）压到限内。
// 返回可上传的文件路径（压缩产物在系统临时目录，调用方负责清理）。
function ensureUnderLimit(imagePath) {
  if (statSync(imagePath).size < UPLOADIMG_MAX_BYTES) return imagePath;

  const outPath = join(tmpdir(), basename(imagePath).replace(/\.png$/i, "") + ".upload.jpg");
  const py = [
    "import sys, os",
    "from PIL import Image",
    `src = ${JSON.stringify(imagePath)}`,
    `dst = ${JSON.stringify(outPath)}`,
    `maxb = ${UPLOADIMG_MAX_BYTES}`,
    "im = Image.open(src).convert('RGB')",
    "q = 88",
    "while q >= 56:",
    "    im.save(dst, 'JPEG', quality=q, optimize=True)",
    "    if os.path.getsize(dst) < maxb:",
    "        sys.exit(0)",
    "    q -= 8",
    "w = int(im.width * 0.8)",
    "im.resize((w, int(im.height * 0.8))).save(dst, 'JPEG', quality=70, optimize=True)",
  ].join("\n");
  const r = spawnSync("python3", ["-c", py], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`图片压缩失败：${imagePath}\n${r.stderr}`);
  if (!existsSync(outPath) || statSync(outPath).size >= UPLOADIMG_MAX_BYTES) {
    throw new Error(`压缩后仍超 1MB：${basename(imagePath)}，请手动压缩到 1MB 以下`);
  }
  return outPath;
}

// 上传正文配图 → 微信「图文消息内图片」URL（mmbiz.qpic.cn）。与封面的永久素材接口不同。
async function uploadImage(token, imagePath) {
  const buf = readFileSync(imagePath);
  const mime = extname(imagePath).toLowerCase() === ".png" ? "image/png" : "image/jpeg";
  const form = new FormData();
  form.append("media", new Blob([buf], { type: mime }), basename(imagePath));
  const r = await fetch(
    `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${token}`,
    { method: "POST", body: form }
  );
  const j = await r.json();
  if (!j.url) throw new Error(`上传正文配图失败：${j.errcode} ${j.errmsg}`);
  return j.url;
}

// 找出 HTML 里 src/data-src 指向本地文件的 <img>，逐个上传微信图床并替换为 mmbiz URL。
// baseDir = 成稿.md 所在目录，用于把相对图片路径解析成绝对路径。
async function uploadBodyImages(token, html, baseDir) {
  const tags = html.match(/<img\b[^>]*>/gi) || [];
  const attrRe = /\b(data-src|src)="([^"]+)"/i;
  let out = html;
  let count = 0;
  for (const tag of tags) {
    const m = attrRe.exec(tag);
    if (!m) continue;
    const rawPath = m[2];
    if (/^https?:\/\//i.test(rawPath)) continue; // 已是线上 URL，跳过
    const absPath = rawPath.startsWith("/") ? rawPath : join(baseDir, rawPath);
    if (!existsSync(absPath)) {
      console.warn(`  ⚠ 正文配图文件不存在，跳过：${rawPath}`);
      continue;
    }
    const uploadPath = ensureUnderLimit(absPath);
    const url = await uploadImage(token, uploadPath);
    out = out.replace(tag, tag.replace(m[2], url));
    if (uploadPath !== absPath) rmSync(uploadPath, { force: true }); // 清理临时压缩产物
    count += 1;
    console.log(`  ✓ 正文配图已上传（${count}）：${basename(absPath)}`);
  }
  return { html: out, count };
}

async function addDraft(token, article) {
  const r = await fetch(`https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ articles: [article] }),
  });
  const j = await r.json();
  if (j.errcode) throw new Error(`添加草稿失败：${j.errcode} ${j.errmsg}`);
  return j.media_id;
}

async function main() {
  const env = loadEnv();
  const md = readFileSync(mdPath, "utf8");
  const spec = JSON.parse(readFileSync(specPath, "utf8"));

  const { title, body } = extractArticle(md);
  const html = renderArticleBody(body, spec);

  const token = await getAccessToken(env);
  console.log(`✓ access_token 获取成功`);

  const thumbId = await uploadCover(token, coverPath);
  console.log(`✓ 封面已上传 → thumb_media_id=${thumbId}`);

  // 正文配图：本地图上传微信图床，替换 src 为 mmbiz URL（无配图时 count=0，不发请求）
  const mdDir = dirname(resolve(mdPath));
  const { html: finalHtml, count } = await uploadBodyImages(token, html, mdDir);
  if (count) console.log(`✓ 正文配图共上传 ${count} 张`);

  const draftId = await addDraft(token, {
    title,
    author: AUTHOR,
    content: finalHtml,
    thumb_media_id: thumbId,
    need_open_comment: 0,
    only_fans_can_comment: 0,
  });

  console.log(`✓ 已发到公众号草稿箱`);
  console.log(`  标题：${title}`);
  console.log(`  风格：${spec.name}`);
  console.log(`  草稿 media_id：${draftId}`);
}

main().catch((err) => {
  console.error(`✗ ${err.message}`);
  process.exit(1);
});
