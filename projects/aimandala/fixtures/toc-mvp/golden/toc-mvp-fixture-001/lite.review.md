---
fixture_id: toc-mvp-fixture-001
mode: lite
topic: general
result: pass_with_drift
deviation_count: 1
---

# Golden Review: toc-mvp-fixture-001 / lite

## 1. 审阅对象

- 报告快照：[`lite.report.json`](./lite.report.json)
- 人工摘录：[`lite.report.md`](./lite.report.md)
- Debug trace：[`lite.debug.json`](./lite.debug.json)
- 资产：`fixtures/toc-mvp/assets/IMG_5057.jpeg`

## 2. 教程算法轴

- 直断命中：`pass`
  - 报告先给出「金」为主、三圈为「火 -> 土 -> 金」的当前整体判断。
- 逐圈颜色 / 深浅 / 面积依据：`pass_with_drift`
  - 报告已给出五行比例、三圈主导元素和圈层主题。
  - 但用户可读报告没有把每圈深浅状态明确写出来，仍需要到 debug trace 才能确认。
- 形状分析：`pass`
  - 当前没有把形状分析越权写成主判断。
- 圈级生克：`pass`
  - 报告在基础元素状态之后再解释「火生土」。
- 教程来源链：`pass`
  - debug trace 已包含 `source:four_step_method`、`source:five_elements_excess_deficiency`、`source:triad_structure`。

## 3. 产品轴

- Lite 独立闭环：`pass`
- Pro 独立入口语义：`pass`
- `topic_context.orientation`：`pass`
- Lite 轻量疗愈：`pass`
- 旧升级 / 解锁 / 补全语义：`pass`
- raw dict 或占位泄漏：`pass`
- fallback 伪装：`pass`

## 4. 偏差项

```yaml
deviation_id: BATCH-F-001-LITE-DRIFT-001
fixture_id: toc-mvp-fixture-001
mode: lite
topic: general
tutorial_step: per_circle_color_analysis
symptom: 用户可读报告已写面积和圈层主导，但没有明确展开每圈深浅状态；深浅依据仍主要留在 debug。
suspected_layer: narrative_compression
severity: medium
next_owner: Batch G narrative compression fidelity
```

## 5. 总体结论

`pass_with_drift`。当前 Lite 报告已经可作为第一批人工 golden 基线，但下一批需要把逐圈深浅状态从 debug trace 更稳定地压缩进用户可读报告。
