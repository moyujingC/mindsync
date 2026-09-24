---
name: healing-card
description: Generate 3:4 竖版疗愈知识卡片（一镜一梳「暖愈」风格）— 宋体温和标题、陶土暖沙金句横幅、生命之花曼陀罗纹样。发布渠道：小红书（一镜一梳账号）。Use when the user asks for 疗愈卡片, 小红书图文, 知识卡片, 暖愈卡片 for 一镜一梳 / 曼陀罗 / 疗愈内容.
---

# Healing Card · 一镜一梳「暖愈」卡片

从成稿/大纲生成 3:4 竖版疗愈卡片套图。风格名：**暖愈**——奶油暖底 + 宋体温润标题 + 陶土点缀 + 生命之花曼陀罗纹样（右上出血垫底）。视觉依据课程输入稿 4.2 节（低饱和、柔和、圆与中心）。

架构与 moyujing-card 同构（plan → preview gate → render 三段），模板与风格系统独立。

## 产出契约

- 任务文件夹制：每次生成在用户指定目录下进行，不在 skill 根目录留产物。
- 一套卡片 = 1 张封面邀请卡 + N 张内容卡（通常 4~9 张）+ 可选收尾金句卡，单主题（暖愈）。
- 每张输出 `NN-标题.png`（1080×1440，2x PNG）。

## 风格硬规则（详见 references/style-system.md）

- 页眉：左 logo「一镜一梳」宋体，右系列名 + 页码，下压发丝线。
- 标题：温和问句/邀请式陈述优先，宋体；每行 3~5（xl）/ ≤7（title）字按词组 `<br>` 断行，不顶满版心。
- 金句横幅：陶土暖沙底 + 圆角，禁止黑底白字。
- 右上生命之花纹样（外环+七圆+中心点）是品牌锚，不得删除。
- 页脚标语默认「看见 · 接纳 · 照顾自己」。

## 工作流（与 moyujing-card 相同三段）

1. **拆稿**：`node scripts/plan_cards.mjs <成稿.md> --out <cards.json>`（key 读排版工坊 engine/.env）
2. **文字稿 gate（必经）**：`node scripts/preview_cards.mjs <cards.json> <文字稿.md>` 导出 Markdown 文字稿，用户改并确认后才渲染
3. **渲染**：`node scripts/render_cards.mjs <cards.json> <out目录>`（溢出自动告警）

## 疗愈表达禁忌

- 不用「治愈/治疗/诊断/疗效」等医疗承诺词；功效用「可能/有助于/邀请你试试」式。
- 不编造来访者案例、功效数据。
- 情绪困境先接住再邀请，不评判、不制造焦虑。
- 其余同 moyujing-card：禁 inline style、禁超画布（删字不缩字号）、禁一卡多 banner。
