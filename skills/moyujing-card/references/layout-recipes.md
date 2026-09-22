# 卡片版式配方（layout recipes）

每配方 = 标题类型 + 组件组合 + 最小密度要求。content 字段只拼这些组件。

## R1 问答-列表卡（最常用）
问句 title + `.lead`（一句论断）+ `ul.blist`（5~8 条）+ `.banner`。
适用：「企业需要配合什么」「数据会不会泄露」式 FAQ。
最小密度：内容 ≥75% 画布高；列表 ≥5 条。

## R2 问答-编号项卡
问句 title + `.lead-sm`（背景说明）+ 3~5 个 `.num-item`（① 加粗引导 + 灰说明）+ `.banner`。
适用：流程/时间线（Day 0 → Day 2）、步骤（①确认目标 ②观察现场）。
最小密度：num-item ≥3 或 lead-sm + banner 必存其一。

## R3 标签-段落卡
title + `.lead` + 2~4 组 `.kicker` + `.kicker-text`（RESULT 01 / DIRECTION A 式）。
适用：结果说明、方向对比、案例拆解。
最小密度：kicker 组 ≥2。

## R4 分组对比卡
title + `.lead` + `.group-label`（适合/不适合、你们是/你们不是）+ 两组 `ul.blist`。
适用：双向判断题。两组列表条数差 ≤2。

## R5 封面宣言卡
（模板外扩展：title 置顶 + 巨型断句 + 一句 lead；可用 theme 差异与内容卡区分。）
宣言句分行要有呼吸，禁止塞满；底部放账号身份行。

## 收尾金句卡
单 `.lead` 或单 `.banner` + 页脚；画布欠填时用字号和留白承担，不补装饰。
