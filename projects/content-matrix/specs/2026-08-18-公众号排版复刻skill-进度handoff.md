> 状态：current
> 日期：2026-08-18
> 项目：内容矩阵（项目 A）· 墨予镜起号
> 用途：换窗口交接，接续当前进度

# 进度 Handoff：公众号排版复刻（骨架方案已落地，剩封面 + 配图）

## 一句话定位

公众号排版复刻 skill 的「留骨架」重构已完成并端到端跑通（三套风格库 + 公众号 HTML + 小红书卡片全通）。**公众号这条线的两个交付件已收尾：① 横版封面已就位（900×383）② 正文配图上传功能已实现（含 1MB 自动压缩）**。剩最后一步：跑 `publish-draft.mjs` 真实发一篇配图版草稿，在草稿箱验证 3 张配图可见、封面正确。

## 已完成（本窗口）

1. **骨架方案取代旧 token 方案**（核心重构，已提交）：
   - 新增 [skeleton.mjs](../accounts/墨予镜/skills/wechat-style-replicator/scripts/lib/skeleton.mjs)（留骨架无损抽取）、[render.mjs](../accounts/墨予镜/skills/wechat-style-replicator/scripts/lib/render.mjs)（共享渲染）、[style-tokens.mjs](../accounts/墨予镜/skills/wechat-style-replicator/scripts/lib/style-tokens.mjs)（骨架反推小红书 token）
   - 删除旧 `style-spec.mjs` / `wechat-html.mjs`
   - 思路从「预设字段抽取（有损）」改为「原文 HTML 骨架原样保留，只换文字/图片（无损 1:1）」

2. **三套骨架库已生成**（[styles/](../accounts/墨予镜/styles/)）：`墨予镜-骨架.json` / `增长女黑客-骨架.json` / `卡兹克-骨架.json`

3. **端到端验证通过**：三篇样本各出一版公众号 HTML + 小红书卡片；墨予镜 paragraph/heading/quote/image 四角色 1:1（blockquote 边框、h1 内 span、外层 section padding 全保留）；列表符号保留（• / 1. 2. 3.）；小红书从骨架反推 token 放大（正文 34px + rgb(51,51,51)）正确。

4. **配图版成品已生成但未发布**：`2026-06-06-作为一个重度AI使用者你有没有更累了-成稿-配图版-公众号成品-墨予镜-骨架.html`（已渲染，但 img src 是失效的 worktree 旧路径，见下）。

## 已完成 1：公众号封面（横版 900×383）

- 封面素材其实此前已在 `2026-06-06-...-成稿-cover-assets/` 生成好：`wx-cover-01/02/03.png` 均为 900×383（gpt-image-2 直出，非竖版）。
- 已把推荐候选 `wx-cover-02.png`（白板地图 + 企业 AI 图标环绕）复制到 [covers/2026-06-06-作为一个重度AI使用者你有没有更累了-公众号封面.png](../accounts/墨予镜/covers/2026-06-06-作为一个重度AI使用者你有没有更累了-公众号封面.png)（900×383）。
- 发布时显式传封面参数，别走竖版默认值：`node scripts/publish-draft.mjs <成稿.md> <风格.json> ../../covers/<...>-公众号封面.png`。

## 已完成 2：正文配图上传微信图床（代码层面）

- **修引用路径**：把 [2026-06-06-...-成稿-配图版.md](../accounts/墨予镜/2026-06-06-作为一个重度AI使用者你有没有更累了-成稿-配图版.md) 里 3 处失效 worktree 绝对路径 → 相对路径（`xxx-成稿-assets/wx-visual-0N.png`）。
- **[publish-draft.mjs](../accounts/墨予镜/skills/wechat-style-replicator/scripts/publish-draft.mjs) 新增正文配图上传**：
  - `uploadBodyImages(html, baseDir)`：找出 HTML 里 `src/data-src` 指向本地文件的 `<img>`，逐个走 `cgi-bin/media/uploadimg`（multipart 字段 `media`）上传，替换为返回的 `mmbiz.qpic.cn` URL；已是 `http(s)` 的线上 URL 跳过。
  - `ensureUnderLimit(path)`：`uploadimg` 限制 jpg/png **< 1MB**，超限 PNG 用 PIL 转 jpg 压到限内（q88 起逐级降到 56，仍超限再缩 0.8×）。
  - 封面走永久素材 `material/add_material`，正文图走 `uploadimg`，两个接口分开。
- **已静态验证**：语法通过；路径修复后 `data-src` 变相对路径；PIL 把 1.2MB 压到 ~180KB；`join(baseDir, 相对路径)` 指向存在的文件。

**下一步（待人工验证，需 `.env` 凭证 + 真实发草稿箱）**：
```bash
cd projects/content-matrix/accounts/墨予镜/skills/wechat-style-replicator
node scripts/publish-draft.mjs ../../2026-06-06-作为一个重度AI使用者你有没有更累了-成稿-配图版.md ../../styles/墨予镜-骨架.json ../../covers/2026-06-06-作为一个重度AI使用者你有没有更累了-公众号封面.png
```
发布后在公众号草稿箱确认：3 张正文配图可见、封面是横版、正文排版 1:1。

## 关键规范（沿用）

- **图片不进 git**：`小红书出图/`、`reference-samples/*/content.html`、配图 PNG 均 ignore；脚本 / JSON / HTML 可提交。
- **草稿/成稿分离**（账号写作规则）：草稿定内容、成稿定表达。
- **凭证**：`.env`（`WECHAT_APP_ID` / `WECHAT_APP_SECRET`）在 skill 目录，不入 git。
- **占位符约定**（骨架库）：`{{text}}` 文字 / `{{img}}` 图片 URL / `{{items}}` 列表项容器 / `{{content}}` 外层容器内容。

## 主要命令

```bash
cd projects/content-matrix/accounts/墨予镜/skills/wechat-style-replicator
node scripts/render-wechat.mjs <成稿.md> <styles/风格名.json>          # 生成公众号 HTML
node scripts/render-xhs.mjs <成稿.md> <styles/风格名.json>            # 生成小红书卡片
node scripts/publish-draft.mjs <成稿.md> <风格.json> [封面图.png]      # 直发草稿箱（含封面 + 正文配图上传）
```

## 后续队列

- 首篇公众号手动发布（对照 FDE 定位 spec 质量门）+ 填回流表。
- 复刻更多欣赏的公众号风格（skill 已跨账号通用）。
