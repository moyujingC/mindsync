---
fixture_id: toc-mvp-fixture-002
mode: lite
topic: wealth_career
result: pass
deviation_count: 0
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
- 逐圈颜色 / 深浅 / 面积依据：`pass`
  - `visual_basis` 已稳定写出三圈主导色 / 元素、深浅状态、填充状态和面积约值。
- 形状分析：`pass`
  - 当前没有把形状代理信号越权成主判断。
- 圈级生克：`pass`
  - 报告在基础圈层状态之后再解释圈级关系。
- 教程来源链：`pass`
  - debug trace 已包含四步法来源 refs。

## 3. 产品轴

- Lite 独立闭环：`pass`
- Pro 独立入口语义：`pass`
- `topic_context.orientation`：`pass`
- Lite 轻量疗愈：`pass`
- 旧升级 / 解锁 / 补全语义：`pass`
- raw dict 或占位泄漏：`pass`
  - debug trace 使用 `scope=lite`，不再被同一 interpretation 的 Pro draft 污染。
- fallback 伪装：`pass`

## 4. 偏差项

无开放偏差。

已关闭：

- `BATCH-F-002-LITE-FAIL-001`：显式 Lite debug fidelity 已按 `scope=lite` 计算，不再被 Pro draft 污染。
- `BATCH-F-002-LITE-FAIL-002`：Lite 逐圈深浅状态已稳定进入 `visual_basis`。

## 5. 总体结论

`pass`。当前主题 Lite 报告可作为 Batch G 后的合格 golden 基线。
