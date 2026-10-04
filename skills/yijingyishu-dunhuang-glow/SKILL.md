---
name: yijingyishu-dunhuang-glow
description: Generate 一镜一梳敦煌柔光风插画（Dunhuang soft-glow illustration）——深夜蓝渐变夜空、月光漫射柔光、低饱和鎏金点缀、极简构图大留白的治愈系文生图风格，关键母题为玉梳/月牙/星河/沙漠驼队/飞天/金蝶。Use when the user asks for 敦煌风插画, 一镜一梳配图, 公众号/小绿书/小红书卡片底图, 网站 hero/空状态/封面插画, 或任何需要本风格 DNA 的 AI 生图。
---

# 一镜一梳敦煌柔光风 · 文生图风格 skill

只负责**生图**这一层：给定画面内容描述，产出本风格的柔光插画 PNG。
不负责卡片排版（标题/正文/徽章由排版层后期渲染）——**图中永远不出文字**。

与 `yijingyishu-watercolor-style`（水彩拼贴风）是同一产品的两条视觉线：
水彩拼贴 = 纸感手绘日景；敦煌柔光 = 月光厚涂夜景。一次任务只选一条线。

## 快速上手

```bash
node scripts/generate.mjs <prompt.txt|纯文本> <out.png> [portrait|landscape|square] [--bleed] [--comb]
```

- 风格前缀（配色/质感/禁文字）内置在 `scripts/generate.mjs` 的 `STYLE` 常量，是**单一源头**；prompt 只写画面内容。
- `portrait` = 1024×1536（3:4 卡用图）；`landscape` = 1536×1024（横版配图）；`square` = 1024×1024。默认 portrait。
- `--bleed`：满版出血图——画面延伸到四边、不留白边（hero 满版布局必加）。
- `--comb`：**画面出现梳子时必加**。以 `references/comb-logo.png`（品牌 logo 锚图）走 `/images/edits` 图生图，梳子的造型/材质/纹饰原样锁定，只放进场景。不加 flag 时模型自绘梳子会造型漂移，违反品牌一致性。
- 通道：AITechFlux 中继 gpt-image-2，key 读 `projects/content-matrix/内容视觉工坊V2/.env.local`（可用 `ART_ENV_PATH` 指向其他 env）。

## 何时读哪个参考

| 场景 | 文件 |
| --- | --- |
| 了解/复用风格 DNA（色板、光影哲学、构图铁律、母题库） | `references/style-dna.md` |
| 写 prompt（场景模板、翻车模式与修法、密排卡变体） | `references/prompt-playbook.md` |
| 看成品长什么样 | `examples/hero-02.png`（本风格基准图） |
| 对照"喜欢的感觉" | `references/` 内 8 张参考图（6 张干净版海报 + 2 张 aimandala 在用图） |
| 梳子形象锚（`--comb` 模式输入图） | `references/comb-logo.png`（= aimandala logo-niwu-hero.png 的副本，勿改） |

## 风格一句话

深夜蓝（#1E2D4D）平滑渐变夜空 + 月光漫射柔光，单一主体悬于大留白中央（主体是玉梳时，形象必须锁定为品牌 logo 那把，用 `--comb`），低饱和鎏金只作微光点缀，至多两个辅助母题（金蝶/驼队/月牙/单条飘带），画面像一次安静的呼吸。**禁文字、禁水印、禁高饱和、禁元素堆叠**。

## 产出约定

- 一套图的 prompt 文本与成品 PNG 存同一任务文件夹，可复现。
- 交付前逐张检查：无文字残留；单主体不被裁切；同套图色调同族；暗部偏蓝不偏青黑；亮部淡黄不橙红。
- 密排文字卡出图后，用排版层在留白区加字（本 skill 不出字）。
- 含梳子的图必须 `--comb` 出图；验收时对照 `references/comb-logo.png` 检查梳子造型、玉色、金饰、镜面、蓝珐琅云纹、朱红花心是否走样，走样即重出。
