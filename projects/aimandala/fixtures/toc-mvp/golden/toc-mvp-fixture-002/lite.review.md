---
fixture_id: toc-mvp-fixture-002
mode: lite
topic: wealth_career
result: fail
deviation_count: 2
---

# Golden Review: toc-mvp-fixture-002 / lite

## 1. 审阅对象

- 报告快照：[`lite.report.json`](./lite.report.json)
- 人工摘录：[`lite.report.md`](./lite.report.md)
- Debug trace：[`lite.debug.json`](./lite.debug.json)
- 资产：`fixtures/toc-mvp/assets/IMG_5060.jpeg`

## 2. 教程算法轴

- 直断命中：`pass`
  - Lite 先给出「金」为主、三圈为「火 -> 金 -> 金」的当前判断。
- 逐圈颜色 / 深浅 / 面积依据：`pass_with_drift`
  - 报告已写出五行比例、三圈主导元素和圈层主题。
  - 深浅状态仍没有稳定出现在用户可读报告中。
- 形状分析：`pass`
  - 当前没有把形状代理信号越权成主判断。
- 圈级生克：`pass`
  - 报告在基础圈层状态之后再解释「火克金」。
- 教程来源链：`pass`
  - debug trace 已包含四步法来源 refs。

## 3. 产品轴

- Lite 独立闭环：`pass`
- Pro 独立入口语义：`pass`
- `topic_context.orientation`：`pass`
- Lite 轻量疗愈：`pass`
- 旧升级 / 解锁 / 补全语义：`pass`
- raw dict 或占位泄漏：`fail`
  - debug trace 对该记录标记 `raw_payload_leak_found=true`。
  - 当前 `report.json` 内部仍包含 Pro 派生层的 raw payload 泄漏，说明同一 interpretation 的兼容层会污染 debug fidelity 结果。
- fallback 伪装：`pass`

## 4. 偏差项

```yaml
deviation_id: BATCH-F-002-LITE-FAIL-001
fixture_id: toc-mvp-fixture-002
mode: lite
topic: wealth_career
tutorial_step: final_algorithm_basis
symptom: 显式 Lite 报告正文可读，但同一 interpretation 的 debug fidelity 标记 raw_payload_leak_found=true，说明兼容层仍可能把 Pro raw payload 纳入整体算法保真判断。
suspected_layer: debug_trace_scope
severity: high
next_owner: Batch G debug trace scoping
```

```yaml
deviation_id: BATCH-F-002-LITE-FAIL-002
fixture_id: toc-mvp-fixture-002
mode: lite
topic: wealth_career
tutorial_step: per_circle_color_analysis
symptom: Lite 已给三圈主导和面积比例，但深浅状态仍没有在用户可读报告中稳定展开。
suspected_layer: narrative_compression
severity: medium
next_owner: Batch G narrative compression fidelity
```

## 5. 总体结论

`fail`。显式 Lite 正文已经可读，但 debug fidelity 仍被同一 interpretation 的 Pro raw payload 污染；该问题必须作为下一批 debug scope 与 contract sanitization 的输入。
