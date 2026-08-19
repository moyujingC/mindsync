> 状态：historical-reference
> 版本：0.1.0
> source_of_truth：自动补齐

# case-001 A/B 对照

- 案例：case-001 【案例1】用五行感知法剖析个人成长（完整解读）
- 主题标签：个人成长, 五行感知
- 原图：`projects/aimandala/docs/疗愈体系知识库/70-评估与案例/10-完整解读案例11例/assets/case-001-mandala.jpg`
- 标记图：`projects/aimandala/docs/疗愈体系知识库/70-评估与案例/10-完整解读案例11例/assets/case-001-mandala-3q.jpg`

## A 方案

- 生产角色：default_production
- 可复用视觉基准：True
- 质量门：True
- 报告：a/final_report.md

## B 方案

- 生产角色：ab_experiment_only
- 可复用视觉基准：False
- 质量门：True
- 报告：b/final_report.md

## 人工评审建议

- 先看视觉一致性，再看财富主线，再看疗愈师带读感。
- 如果 B 更自然，优点只反哺 A，不直接替换生产默认。
