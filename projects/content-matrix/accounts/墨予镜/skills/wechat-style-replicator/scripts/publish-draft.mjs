// 把成稿渲染成公众号草稿 HTML，并直发到公众号草稿箱。
// 用法：node scripts/publish-draft.mjs <成稿.md> <styles/风格名.json> [封面图.png]
// 封面图缺省时用 小红书出图/墨予镜-mdnice/full-01.png（竖版，建议后续换横版 900×383）。
// 凭证从同目录 .env 读（WECHAT_APP_ID / WECHAT_APP_SECRET），不入 git。

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildWechatArticleBlocks } from "./lib/wechat-blocks.mjs";
import { buildWechatArticleHtml } from "./lib/wechat-html.mjs";
import { resolveWechatTemplate } from "./lib/style-spec.mjs";

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
  const blocks = buildWechatArticleBlocks(body);
  const template = resolveWechatTemplate(spec);
  const html = buildWechatArticleHtml(template, null, blocks, null, null);

  const token = await getAccessToken(env);
  console.log(`✓ access_token 获取成功`);

  const thumbId = await uploadCover(token, coverPath);
  console.log(`✓ 封面已上传 → thumb_media_id=${thumbId}`);

  const draftId = await addDraft(token, {
    title,
    author: AUTHOR,
    content: html,
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
