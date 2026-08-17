---
name: wechat-style-replicator
description: 复刻公众号排版风格并生成多尺寸内容。给一个公众号文章链接，自动抓取并抽取其排版「HTML 骨架」（100% 无损复刻），存成 JSON 骨架库，再用这套骨架把成稿排版成公众号草稿 HTML 和小红书 3:4 分页卡片。触发词：「复刻公众号排版」「给公众号链接」「生成公众号草稿」「小红书自适应排版」「把成稿排版成小红书」。
---

# 公众号排版复刻器

## 目标

把任意一篇公众号文章的排版抽成可复用的 **HTML 骨架库**，并一键生成两种形态：

1. **公众号草稿 HTML** —— 完整 HTML 骨架填字，1:1 无损复刻原文排版，粘贴到公众号编辑器即成为草稿
2. **小红书 3:4 分页卡片** —— 从骨架反推风格 token（颜色/字号/间距），切视口放大后自动分页

## 核心：留骨架，而非抽字段

旧方案预设字段（字号/颜色/间距），抽取数值后重拼「干净」HTML——有损，换一篇结构不同的文章就失效。

本方案**不预设字段**：把原文每个块级元素的「标签 + 完整 style + 嵌套关系」原样保留，只把文字/图片 URL 换成占位符。复刻时把新文字填回占位符，排版 100% 一致。

```
原文：<blockquote style="...border-left:3px solid rgb(191,191,191);padding-left:20px...">
        <p style="color:rgb(102,102,102)">引用文字</p>
      </blockquote>
骨架：<blockquote style="...border-left:3px solid rgb(191,191,191);padding-left:20px...">
        <p style="color:rgb(102,102,102)">{{text}}</p>
      </blockquote>
```

## 执行流程

### 1. 复刻风格

```bash
node scripts/fetch-article.mjs <mp.weixin.qq.com/s/xxx>   # 抓正文 HTML（含内联样式）
node scripts/extract-style.mjs <content.html> <风格名>     # 抽取 → styles/<风格名>.json
```

抓取失败（反爬/验证码）时，按 fetch 脚本打印的提示手动取 `#js_content` 的 outerHTML 兜底，再跑 extract。

### 2. 生成公众号草稿

```bash
node scripts/render-wechat.mjs <成稿.md> <styles/<风格名>.json>
```

输出 `<成稿名>-公众号成品.html`。文章标题打印到 stdout，需单独填到公众号标题栏；HTML 是正文（小节标题/段落/引用/列表/图片/强调）。

### 3. 直发公众号草稿箱

```bash
node scripts/publish-draft.mjs <成稿.md> <styles/<风格名>.json> [封面图.png]
```

渲染 + 上传封面 + 上传正文配图 + 发草稿箱（凭证从 `.env` 读，不入 git）。

- **封面**：走永久素材接口（`material/add_material`），建议横版 **900×383**，否则微信会裁切。
- **正文配图**：走「图文消息内图片」接口（`media/uploadimg`），HTML 里 `src/data-src` 指向本地文件的 `<img>` 会自动上传并替换为 `mmbiz.qpic.cn` URL；已是 `http(s)` 的线上 URL 跳过。
- **配图限制**：`uploadimg` 仅收 jpg/png 且 **< 1MB**，超限图片自动用 PIL 转 jpg 压到限内（需本机装 `python3` + `Pillow`）。
- **图片引用约定**：成稿里的图片用相对路径（相对成稿 `.md` 所在目录），如 `xxx-成稿-assets/wx-visual-01.png`，不要写绝对路径。

### 4. 生成小红书卡片

```bash
node scripts/render-xhs.mjs <成稿.md> <styles/<风格名>.json>
```

输出 `小红书出图/原文版/full-*.png`（封面 + 流式分页正文，撑满一页再换页）。

## 骨架库结构（styles/<风格名>.json）

```json
{
  "name": "风格名",
  "source": "复刻来源链接",
  "blocks": [
    { "role": "paragraph", "count": 89, "skeleton": "<p style=\"...\">{{text}}</p>" },
    { "role": "heading",   "count": 6,  "skeleton": "<h1 style=\"...\">{{text}}</h1>" },
    { "role": "list", "count": 5, "skeleton": "<section style=\"...\">{{items}}</section>",
      "listItem": "<span style=\"...\">•{{text}}</span>" }
  ],
  "inline": { "strong": { "color": "rgb(51,51,51)", "weight": "bold" } },
  "container": "<section style=\"...padding-left:10px...\">{{content}}</section>"
}
```

- `blocks`：每种块级排版变体的完整 HTML 骨架（按出现次数排序，取 count 最多的）
- `inline`：内联强调（strong/b/em…）的颜色/字重，供 `**加粗**` 渲染
- `container`：全文外层容器（mdnice 的 section 带 padding/字体），无则缺省

## 两种形态的实现差异

- **公众号**：直接用 HTML 骨架填字（`{{text}}`/`{{img}}`/`{{items}}`），100% 复刻
- **小红书**：SVG 卡片无法用 HTML 骨架，从骨架反推 token（正文色/字号/行高、标题色/字号/左边框、强调色、引用色），再按 `bodySize=34` 整体放大

详见 [references/风格规格说明.md](references/风格规格说明.md)。

## 输出

- `styles/<风格名>.json` —— 可复用的骨架库
- `<成稿名>-公众号成品.html` —— 公众号草稿
- `小红书出图/原文版/full-*.png` —— 小红书卡片（图片不进 git）

## 首次运行

```bash
cd 到本目录 && npm i   # 安装 node-html-parser
```
