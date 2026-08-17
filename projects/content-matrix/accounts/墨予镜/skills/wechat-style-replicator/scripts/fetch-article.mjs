// 抓取公众号文章链接（UA 伪装免登录）→ 保存正文 HTML（含内联样式）+ 元信息。
// 用法：node scripts/fetch-article.mjs <mp.weixin.qq.com/s/xxx>
// 抓取失败（验证码/403/需登录）时打印兜底说明。

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ACCOUNT_DIR = join(__dirname, "../../../");

const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.34(0x16082222) NetType/WIFI Language/zh_CN";

const url = process.argv[2];
if (!url) {
  console.error("用法：node scripts/fetch-article.mjs <mp.weixin.qq.com/s/xxx>");
  process.exit(1);
}

function sanitize(name) {
  return (name || "untitled")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

async function main() {
  let html;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (err) {
    console.error(`抓取失败：${err.message}`);
    printFallback(url);
    process.exit(1);
  }

  const root = parse(html);
  const title = root.querySelector("#activity-name")?.text?.trim() || "";
  const author = root.querySelector("#js_name")?.text?.trim() || "";
  const publishTime = root.querySelector("#publish_time")?.text?.trim() || "";
  const contentNode = root.querySelector("#js_content");
  const content = contentNode ? contentNode.innerHTML : "";

  // 反爬特征检测
  const blocked = /环境异常|去验证|验证码|请完成|安全验证|访问过于频繁/i.test(html) || !content.trim();
  if (blocked) {
    console.error("疑似触发反爬（环境异常/验证码），未能拿到正文。");
    printFallback(url);
    process.exit(1);
  }

  const dir = join(ACCOUNT_DIR, "reference-samples", sanitize(title));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "content.html"), content, "utf8");
  writeFileSync(
    join(dir, "meta.json"),
    JSON.stringify({ url, title, author, publishTime }, null, 2),
    "utf8"
  );

  console.log(`标题：${title || "(未取到)"}`);
  console.log(`公众号：${author || "(未取到)"}`);
  console.log(`正文长度：${content.length} 字符`);
  console.log(`已保存：${dir}`);
}

function printFallback(url) {
  console.log("\n兜底方案（手动取正文 HTML）：");
  console.log("1. 浏览器打开文章，F12 打开开发者工具");
  console.log("2. Elements 面板里找到 <div id=\"js_content\">，右键 → Copy → Copy outerHTML");
  console.log("3. 粘到一个文件存成 reference-samples/<名>/content.html");
  console.log("4. 再跑：node scripts/extract-style.mjs <那个 content.html> <风格名>");
  console.log(`   来源链接：${url}`);
}

main();
