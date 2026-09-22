---
name: moyujing-card
description: Generate Xiaohongshu/Rednote 3:4 knowledge card sets (cover + content pages) in the 墨予镜 Field Memo style — giant question titles, numbered/bullet content blocks, black banner quotes, light & dark dual themes. Use when the user asks for 小红书图文, 知识卡片, 卡片套图, 3:4 卡片, carousel cards, or 墨予镜-style social cards from an article or outline.
---

# Moyujing Card · 墨予镜 Field Memo 卡片

从成稿/大纲生成小红书 3:4 知识卡片套图。风格：企业问答备忘录范式（HA7CH 式）——巨字问句标题 + 模块化内容块 + 金句横幅，浅/深双主题同构反色。

架构参考 guizang-social-card（SKILL.md + references + assets 模板 + scripts 渲染），风格系统独立自研。不得复制 guizang 模板与素材。

## 产出契约

- 任务文件夹制：每次生成在 `<用户指定目录>/cards-<slug>/` 下进行，不在 skill 根目录留产物。
- 一套卡片 = 1 张封面宣言卡 + N 张内容卡（通常 4~9 张）+ 可选收尾金句卡。
- 每张输出 `NN-标题.png`（1080×1440，2x PNG），数字编号与页眉页码一致。
- 完成后输出清单：每张的文件路径 + 一句话内容摘要，供用户逐张过目。

## 风格硬规则（详见 references/style-system.md）

- 页眉：左 logo（墨予镜），右系列名 + 页码 `NN / N`，下压发丝线。
- 标题：问句优先，84px/800 字重，一屏只一个标题。
- 内容块只许用模板定义的 6 类组件：`.lead` / `.kicker`+`.kicker-text` / `.num-item` / `.group-label`+`ul.blist` / `.banner` / `.lead-sm`。
- 每张最多一个 `.banner`（黑底白字金句，浅色主题）或反色横幅（深色主题）。
- 右侧巨型水印页码（420px，同色系极浅）是必须项，不得删除。
- 深色主题用于 Builder/从业者向内容，浅色用于企业/决策者向；一套卡组统一一个主题，封面可例外。

## 工作流

1. ** intake**：拿到成稿/大纲，先定卡组叙事线：封面宣言 → 逐问逐答（每张一个问题）→ 收尾金句。
2. **分块**：把内容映射成卡片。每张卡一个核心问题或一个论点；超出的内容移到下一张，禁止塞满。
3. **写 cards.json**：按 `scripts/render_cards.mjs` 的 JSON 契约逐张填写（字段见脚本头注释）。content 字段只用模板定义的组件 class。
4. **渲染**：`node scripts/render_cards.mjs cards.json <out目录>`（依赖 skill 内 node_modules 的 playwright，Chromium 用系统缓存）。
5. **QA**：逐张跑 references/qa-checklist.md，不合格改 JSON 重渲。
6. **交付**：路径清单 + 缩略拼图（可选）。

## 禁忌

- 禁止在卡片上编造数据、案例数字、客户名称。
- 禁止一张卡超过一个 banner；禁止 banner 超过两行。
- 禁止组件外的自定义样式（不加 inline style）；版式自由度走「选组件组合」，不走「改 CSS」。
- 禁止正文超过画布：内容溢出时先删字，不缩字号（字号是风格的一部分）。
- 禁止挪用 HA7CH/guizang 的原文案、标语、logo 字形。页脚标语用墨予镜自己的（缺省时问用户）。
