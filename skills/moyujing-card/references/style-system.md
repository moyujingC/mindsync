# 墨予镜简报风格系统（浅色简报 / 深色简报）

设计源型：企业问答备忘录卡片（HA7CH FDE Sprint 范式）。视觉锚点：像一份现场工作备忘录被放大成海报——大问句、硬分隔、低装饰。

## 画布

- 1080×1440（3:4），XHS 直传。渲染 2x（2160×2880 PNG）。
- 页边距：左右 88px，上 64px，下 120px（页脚占位）。

## 双主题

| token | theme-light | theme-dark |
| --- | --- | --- |
| --bg | #f7f6f2（暖纸白） | #0b0b0b（近黑） |
| --ink | #141414 | #f2f1ec |
| --ink-soft | #6f6f6a | #9a9a94 |
| --label | #8a8a84 | #7c7c76 |
| --hairline | #e3e1da | #262624 |
| --banner-bg/--banner-ink | 黑底白字 | 白底黑字 |
| --watermark | #efeee9 | #161615 |

主题选择按受众：企业/决策者 → light；从业者/Builder → dark。一套卡统一主题。

## 字体

- 全部苹方（PingFang SC）：标题 800、正文 400/600、标签 600 加字距。
- 字号阶梯：title-xl 150（巨型标题，仅封面宣言卡/收尾卡）/ title 104（内容卡）/ banner 40 / lead 36 / num-item t 34 / kicker-text 30 / lead-sm 30 / blist 30 / num-item d 27 / group-label 24 / kicker 22 / foot 19 / logo 34。对比原则：巨型标题与正文级差 4 倍以上，次级一律收缩，标签最小。
- 数字与英文用同一字族，letter-spacing 2~4px 制造「标签感」。

## 组件（assets/template-field-card.html 已实现）

1. `.head` 页眉：logo 34px 800 italic + meta 右对齐（系列名 / 页码两行）+ 发丝线
2. `.wm` 巨型水印页码：420px 800，右侧出血 -40px，z-index 0 垫底
3. `h1.title`：104px/1.2/800，问句优先（内容卡）；超过 7 字用 <br> 按词组断行，每行不超过 8 字，不顶满版心
3b. `h1.title-xl`：150px/1.18/800（6 字/行是 88px 版心内的物理上限，字号不再加），仅封面宣言卡与收尾卡；必须输出 <br> 手动断行，每行 3~5 字成词组，不顶满版心
4. `.lead`：36px/700 关键论断
5. `.lead-sm`：33px 说明段
6. `.kicker` + `.kicker-text`：英文/编号小标签 + 正文（RESULT 01 / DIRECTION A 式）
7. `.num-item`：① 式加粗引导 + 灰色说明（时间线卡用）
8. `.group-label` + `ul.blist`：分组标题 + ‣ 子弹列表（项间发丝线）
9. `.banner`：金句横幅，38px/800，padding 34×38，上边距 48
10. `.foot`：页脚标语左右分列，19px/字距 3

## 叙事节奏

封面宣言卡（大标题 + 一句主张）→ 内容卡每张一个问题 → 收尾金句卡（单 banner 或单 lead）。
