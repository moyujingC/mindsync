---
name: moyujing-cover
description: Generate WeChat official account cover images (900×383) for finished 墨予镜 articles. Use when the user asks for 公众号封面, 微信公众号封面, 头条封面, 封面候选, or a cover image for a completed 墨予镜 article.
---

# Moyujing WeChat Cover Generator

## Overview

为墨予镜成稿生成公众号头条封面。账号统一模板：**IP 水印 + 主标题 + 副标题 + 日期**，HTML 模板渲染 + Playwright 截图直出 900×383，不走文生图。

只出封面。不改正文，不出正文配图，不出知识卡片。

## Inputs

- 成稿 Markdown 路径（从首个 `# ` 行提取主标题）。
- 副标题与日期：优先从成稿/用户指定取；缺副标题时用「——」后的副题部分，再缺则问用户。

## Output Contract

1. 封面目录：`<成稿所在目录>/公众号封面/<文章名>-cover-assets/`
2. 三个候选：`wx-cover-01.png`（深青+金，默认）、`wx-cover-02.png`（深绿+暖金）、`wx-cover-03.png`（墨黑+金）
3. `wechat-cover-manifest.md`：文章标题、三个候选的绝对路径与配色说明

## Cover Specs

- 固定 900×383（2.35:1），在 900×383 画布上直接渲染，禁止先出方图再裁剪。
- 微信小图（分享缩略图）从中心 383×383 裁，构图已居中，无需单独出。
- 只渲染原标题，不额外加 logo、作者、水印以外的装饰文字。水印固定「墨予镜」。

## 模板结构（templates/cover-v1.html）

顶部金赭条纹 → 居中「墨予镜」低对比水印 → 黑体白色主标题 → 灰蓝底副标题块 → 底部金赭日期徽章。配色全部走 CSS 变量，候选差异仅配色不同。

- 字体：黑体系（PingFang SC / Hei SC），主标题 64px/字重 800，副标题 26px、日期 17px、水印 22px（PingFang SC）
- 中西文混排整齐化（渲染脚本自动处理）：拉丁/数字 run 包 `.lat` 补对称间隙；全角标点包 `.pq` 做标点挤压。标题里的中英文空格可写可不写，渲染层统一

## Workflow

1. 读成稿，提取主标题；确定副标题与日期（格式 YYYY.MM.DD）。
2. 渲染三个候选：

```bash
SKILL=/Users/xinran/Downloads/dev/mindsync/skills/moyujing-cover
OUT="<封面目录绝对路径>"
node $SKILL/scripts/render_cover.mjs --title "主标题" --subtitle "副标题" --date "2026.09.22" --out "$OUT" --name wx-cover-01
node $SKILL/scripts/render_cover.mjs ... --name wx-cover-02 --palette "bg=#1d3a2f,stripe=#c9a227,subtitle-bg=#8a9a8e,badge=#c9a227,watermark=#4d7a5f"
node $SKILL/scripts/render_cover.mjs ... --name wx-cover-03 --palette "bg=#22262a,stripe=#8a6d1f,subtitle-bg=#97a0b4,badge=#8a6d1f,watermark=#4a545c"
```

3. 用 view_image 逐张目检：标题完整、无截断、构图居中。
4. 写 manifest，报告候选路径，让用户选定一张。
5. 选定后如需直发/换封面，走 `wechat-style-replicator` skill 的 `publish-draft.mjs`（封面图作第三参数）。

## render_cover.mjs 参数

`--title --subtitle --date --out` 必填；`--watermark`（默认 墨予镜）、`--name`（默认 wx-cover-01）、`--template`（默认 cover-v1）、`--palette "k=#hex,..."` 覆盖配色变量（变量名：bg / stripe / watermark / subtitle-bg / badge / badge-text / title / subtitle）。依赖：skill 目录下 node_modules 里的 playwright（Chromium 用系统缓存）。

底图（可选，增强科技感）：
- `--art <图片路径>`：用已有图片做底图，模板内叠一层深青 veil（遮罩）统一色调
- `--gen-art "<英文提示词>"`：先用 gpt-image-2 生成底图（存 `<out>/cover-art.png`），再渲染；提示词要点名主色（如 dark teal #1e525d）+ 风格（fine glowing circuit lines, premium tech editorial, no text）
- `--veil 0.35`：遮罩不透明度，默认 0.35；数值越低底图越清晰
- 字体与底图均内联为 base64（Playwright setContent 页禁止 file:// 子资源），渲染结果跨机器一致

## Verification

- 产物存在且为 900×383（截图已按 clip 锁定）。
- 三张候选只差异配色，标题/日期一致。
- 用户选定后，把未选的两张保留在封面目录备查，不删除。
