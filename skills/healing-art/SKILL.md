---
name: healing-art
description: Generate 疗愈风曼陀罗艺术图（文生图，gpt-image-2）for 一镜一梳 小红书内容 — 封面底图、角落生长配图、淡纹理底。预设暖愈色系配方（暖沙/雾蓝/苔绿/烟粉），低饱和、圆心结构、无文字。Use when the user asks for 疗愈配图, 曼陀罗图, 文生图, 封面底图, or 小红书配图 for the healing/一镜一梳 account.
---

# Healing Art · 一镜一梳疗愈文生图

为一镜一梳账号生成曼陀罗疗愈风艺术图。定位：**卡片的“吸睛层”**——文字排版归 healing-card，氛围画面归本 skill，两者叠加使用（文生图打底/角落点缀 + HTML 卡片压文字）。

## 产出契约

- 图里**永不放文字**（模型渲染中文不可靠；文字一律由 healing-card 模板后期叠加）。
- 默认 3:4（1080×1440，小红书竖图）；`--size 1:1 | 4:3 | 3:2` 可换。
- 草稿 `--quality low`（约 30s/张）；定稿 `--quality medium` 以上。
- 产物放用户指定任务目录，不在 skill 根目录留产物（examples/ 仅放样张）。

## 用法

```bash
# 配方速出（推荐）：recipe × mood 组合
node scripts/gen_art.mjs --recipe cover  --mood calm   --out <路径>   # 满幅主曼陀罗（首图/封面底）
node scripts/gen_art.mjs --recipe corner --mood warm   --out <路径>   # 角落生长+大留白（压字用）
node scripts/gen_art.mjs --recipe texture --mood calm  --out <路径>   # 极淡纹理底（整卡打底）

# 完全自定义
node scripts/gen_art.mjs --prompt "<英文提示词>" --out <路径> [--size 3:4] [--quality low]
```

- recipe：cover（满幅）/ corner（角落生长）/ texture（淡纹理底）
- mood（情绪色系）：calm 暖沙陶土（默认）/ sorrow 雾蓝灰紫 / anxiety 苔绿暖灰 / warm 烟粉杏棕
- 配方基底写死账号风格锚（低饱和水彩+彩铅、奶油纸纹、径向柔对称、无文字），只开放 mood 变量，保证成图风格跨批次统一。详见 references/style-recipes.md。

## 与卡片叠加的标准做法

1. 先生成 texture 或 corner 底图 → 2. 作为 healing-card 模板背景（`<body style="background-image">` 或截图合成）→ 3. Playwright 渲染压字。
   v1 手动合成即可；批次化时再固化脚本。

## 禁忌

- 禁止图内出现文字/字母/水印（prompt 已内建，自定义 prompt 也必须保留 no text 约束）。
- 禁止高饱和撞色、黑深底、复杂压迫构图（输入稿 4.2 明确排除）。
- 禁止医疗化意象：听诊器、药片、病床、白大褂等一律不出现。
- 禁止人脸/人物主体——疗愈画面用圆、花瓣、纹理、自然物（石、叶、水）表达。
- relay 过载时会报 `system cpu overloaded`，脚本自动重试 4 次（间隔 15s），仍失败就等几分钟再跑。
