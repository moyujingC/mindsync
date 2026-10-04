---
name: yijinyishu-card
description: Generate 一镜一梳知识卡片，双风格——①疗愈书院风（3:4 竖版 1080×1440，米白纸底+深墨绿宋体标题+金赭编号，纯排版，步骤卡/总览卡）；②插画拼贴风（竖版 3:4 或横版 16:9 1080×608，水彩插画+拼贴卡纸+赭石徽章，文生图配图，少字多图）。发布渠道：小红书 + 公众号图文/配图。Use when the user asks for 一镜一梳卡片, 知识卡片, 卡片套图, 3:4 卡片, 16:9 配图, 插画卡片, or 疗愈/课程类小红书图文。
---

# 一镜一梳 Card · 知识卡片（双风格）

从成稿/大纲生成一镜一梳知识卡片。内置两个独立风格：

| 风格 | 画幅 | 模板/脚本 | 特征 |
| --- | --- | --- | --- |
| **疗愈书院风** | 竖版 3:4（1080×1440） | `assets/template-book-card.html` + `scripts/render_cards.mjs` | 纯排版：米白纸底、深墨绿宋体巨字、金赭编号、发丝线、金句条；步骤卡/总览卡 |
| **插画拼贴风** | 竖版 3:4 或横版 16:9（1080×608） | `assets/template-art-card.html` + `scripts/render_art_cards.mjs` + `scripts/generate_art.mjs` | 文生图水彩插画 + 拼贴卡纸（撕纸边/拱形/圆形遮罩）、赭石笔触下划线、枝叶点缀、彩色徽章；少字多图 |

架构参考 guizang-social-card（SKILL.md + references + assets 模板 + scripts 渲染），风格系统独立自研。不得复制 guizang 模板与素材。

## 插画拼贴风 · 快速上手

1. **生图**：每卡先出配图 `node scripts/generate_art.mjs <prompt.txt> <out.png> [portrait|landscape] [--bleed]`（薄封装，转发到 `yijinyishu-watercolor-style` 风格 skill——风格 prompt 单一源头在那边；prompt 写法与翻车修法见其 `references/prompt-playbook.md`；hero 满版配图必须加 `--bleed`）。
2. **写 cards.json**（字段契约见 references/art-style-system.md）：`canvas`（portrait/landscape）、`layout`（hero 满版出血 / collage 拼贴，少字多图推荐 hero）、`title`/`sub`/`para`/`badge` 及装饰件（`sun`/`title_sprigs`/`underline`/`para_layout`）、`badge_class`（badge-blue|badge-clay|badge-green）、`images.main` 必填 + `m1~m3` 小圆图（collage）可缺省、`img_focus` 调取景。
3. **渲染**：`node scripts/render_art_cards.mjs cards.json <out目录>`。
4. **QA**：`references/qa-art-checklist.md`。

画幅选用：小红书/公众号图文 → portrait 3:4；公众号正文配图 → landscape 16:9。

## 产出契约

- 任务文件夹制：每次生成在 `<用户指定目录>/cards-<slug>/` 下进行，不在 skill 根目录留产物；skill 内自测只允许在 `local-tests/<slug>/`。插画拼贴风的生图 prompt 与中间图也存任务文件夹。
- 一套卡片 = 1 张总览卡（可选）+ N 张步骤卡（通常 4~8 张）+ 可选金句收尾卡。
- 每张输出 `NN-标题.png`（1080×1440，2x PNG），数字编号与页眉页码一致。
- 完成后输出清单：每张的文件路径 + 一句话内容摘要，供用户逐张过目。
- 页脚默认：左系列名 + 右 `轻疗愈`（已定稿，不改动）。

## 风格硬规则（详见 references/style-system.md）

- 页眉：左品牌行（一镜一梳 · 疗愈学院〔/ 系列名〕），右页码 `NN / NN`，下压发丝线。
- 标题：`h1.title` 宋体粗体墨绿 104px，一屏只一个标题；总览卡标题下接 `.title-ul` 短墨绿下划线。
- 内容块只许用模板定义的组件：`.head-q` / `.big-num` / `.sub`(`.green`) / `.kicker` / `.item`(`.h`=`.num`+`.t`, `.d`(`.soft`)) / `.note` / `.title-ul`。
- 左缘竖条（14px）整套卡组绿/金交替或按封面定：`stripe-green` / `stripe-gold`。
- 每张最多一个 `.note`（金竖线金句条，靠页面底部）；步骤卡必须有且只有一个。
- 总览卡用 `spread: true` 均布条目；步骤卡条目顺序流式排。

## 工作流

1. **intake**：拿到成稿/大纲，先定卡组叙事线：总览地图卡（可选）→ 步骤卡（每张一个步骤/问题，巨字标题 + 3 个编号条目 + 金句条）。
2. **分块**：每张卡一个核心步骤；超出的内容移到下一张，禁止塞满。
3. **生成 cards.json**：手写 JSON（契约见 render_cards.mjs 头注释），content 字段只用模板定义的组件 class。
4. **渲染**：`node scripts/render_cards.mjs cards.json <out目录>`（依赖 skill 内 node_modules 的 playwright，Chromium 用系统缓存）。
5. **QA**：逐张跑 references/qa-checklist.md；渲染脚本自带溢出告警（内容底边距页脚 <12px 即告警），告警=删内容重渲。
6. **交付**：路径清单 + 缩略拼图（可选）。

## 禁忌

- 禁止在卡片上编造数据、案例数字、客户名称。
- 禁止一张卡超过一个 note；note 超过两行先删字。
- 禁止组件外的自定义样式（不加 inline style）；版式自由度走「选组件组合」，不走「改 CSS」。
- 禁止正文超过画布：溢出时先删字，不缩字号（字号是风格的一部分）。
- 禁止挪用参考稿（俞心行疗愈学院等）的原文案、标语、品牌名；页脚标语用一镜一梳自己的。
