---
name: wechat-style-replicator
description: 复刻公众号排版风格并生成多尺寸内容。给一个公众号文章链接，自动抓取并抽取其排版风格（存成 JSON 规格），再用这套风格把成稿排版成公众号草稿 HTML 和小红书 3:4 分页卡片（视口自适应）。触发词：「复刻公众号排版」「给公众号链接」「生成公众号草稿」「小红书自适应排版」「把成稿排版成小红书」。
---

# 公众号排版复刻器

## 目标

把任意一篇公众号文章的排版风格抽成可复用的 JSON 规格，并一键生成两种形态：

1. **公众号草稿 HTML** —— 带内联样式，复制粘贴到公众号编辑器即成为草稿
2. **小红书 3:4 分页卡片** —— 同一套风格，切视口尺寸后自动适配

## 适用场景

- 用户给一个公众号链接，想复刻它的排版风格
- 用已保存的风格给新的成稿排版
- 把成稿一键转成小红书图文卡

## 不适用场景

- 需要 AI 绘图的插画/知识卡（那是另一条「出图」链路）
- 付费或需登录才能看的公众号文章

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

输出 `<成稿名>-公众号成品.html`。文章标题会打印到 stdout，需单独填到公众号标题栏；HTML 里是正文（小节标题/段落/引用/强调）。

### 3. 生成小红书卡片

```bash
node scripts/render-xhs.mjs <成稿.md> <styles/<风格名>.json>
```

输出 `小红书出图/原文版/full-*.png`（封面 + 流式分页正文，撑满一页再换页）。

## 视口自适应（核心）

同一份风格 JSON 存「比例化 token」——字号用相对正文字号的比例，颜色用绝对值：

- **公众号视口**：正文字号 = 规格里的 `body.size`（约 16px），流式长文 HTML
- **小红书视口**：正文字号 = 34px，所有 `sizeRatio` 等比放大，3:4 画布自动分页

切视口 = 改正文字号基准 + 画布尺寸，风格比例不变。详见 [references/风格规格说明.md](references/风格规格说明.md)。

## 输出

- `styles/<风格名>.json` —— 可复用的风格规格
- `<成稿名>-公众号成品.html` —— 公众号草稿
- `小红书出图/原文版/full-*.png` —— 小红书卡片（图片不进 git）

## 首次运行

```bash
cd 到本目录 && npm i   # 安装 node-html-parser
```
