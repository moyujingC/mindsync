---
fixture_id: toc-mvp-fixture-002
mode: pro
topic: wealth_career
result: fail
deviation_count: 2
---

# Golden Review: toc-mvp-fixture-002 / pro

## 1. 审阅对象

- 报告快照：[`pro.report.json`](./pro.report.json)
- 人工摘录：[`pro.report.md`](./pro.report.md)
- Debug trace：[`pro.debug.json`](./pro.debug.json)
- 资产：`fixtures/toc-mvp/assets/IMG_5060.jpeg`

## 2. 教程算法轴

- 直断命中：`pass`
  - Pro 先给出「金」和「土」撑起骨架、三圈为「火 -> 金 -> 金」的深度第一印象。
- 逐圈颜色 / 深浅 / 面积依据：`pass_with_drift`
  - 报告已展开三圈、主导元素和代表性色彩。
  - 深浅状态仍未以稳定字段进入用户可读报告。
- 形状分析：`pass`
  - 当前没有把形状代理信号越权成主判断。
- 圈级生克：`pass`
  - 报告在基础三圈状态之后再进入「火克金」「金与金无明显生克」。
- 教程来源链：`pass`
  - debug trace 已包含四步法和三元结构来源 refs。

## 3. 产品轴

- Pro 独立闭环：`pass`
- Pro 不引用 Lite：`pass`
- `topic_context.orientation`：`pass`
- Pro 疗愈深度：`fail`
  - `healing_plan` 第二条 `focus` 泄漏了类似 Python dict 的片段：`: '金色', 'middle': '红色', 'outer': '土色'}`。
  - 该条疗愈没有稳定绑定到失衡 / 根因链，而是把内部颜色 payload 当成正文。
- 旧升级 / 解锁 / 补全语义：`pass`
- raw dict 或占位泄漏：`fail`
- fallback 伪装：`pass`

## 4. 偏差项

```yaml
deviation_id: BATCH-F-002-PRO-FAIL-001
fixture_id: toc-mvp-fixture-002
mode: pro
topic: wealth_career
tutorial_step: final_algorithm_basis
symptom: Pro healing_plan 第二条 focus 泄漏内部颜色 dict 片段，破坏正式报告可读性。
suspected_layer: report_contract_assembly
severity: high
next_owner: Batch G report contract sanitization
```

```yaml
deviation_id: BATCH-F-002-PRO-FAIL-002
fixture_id: toc-mvp-fixture-002
mode: pro
topic: wealth_career
tutorial_step: per_circle_color_analysis
symptom: Pro 已给三圈颜色和代表性色彩，但深浅状态仍没有在用户可读报告中稳定展开。
suspected_layer: narrative_compression
severity: medium
next_owner: Batch G narrative compression fidelity
```

## 5. 总体结论

`fail`。这份 Pro 报告不能作为合格 golden 内容基线。它保留为偏差样本，用于下一批修复 raw payload 泄漏和逐圈深浅压缩问题。
