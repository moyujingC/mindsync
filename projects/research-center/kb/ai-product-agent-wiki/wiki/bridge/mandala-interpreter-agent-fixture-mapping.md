# MandalaInterpreterAgent fixture 映射

## 定义

`MandalaInterpreterAgent` fixture mapping 是把一镜一梳已有 To C MVP 固定样本，映射到学习库里的抽象 eval 和用户解释样例。

这不是项目侧正式 QA 文档，也不复制 golden 报告正文。它只记录：哪些真实样本可以作为后续接入 `MandalaInterpreterAgent` 评测时的项目事实锚点。

## 为什么重要

抽象 eval 可以定义行为边界，但最终还是要能落到真实项目样本上。Fixture mapping 的作用是把两者接起来：

- 抽象 eval 说明要评什么。
- 项目 fixture 说明可以用什么样本评。
- 学习库 mapping 说明两者如何对应。

## 项目 fixture 来源

当前一镜一梳 To C MVP fixture 体系已经切到 `toc-mvp-fixture-001~009`。

与 `MandalaInterpreterAgent` 第一批评测最相关的是：

- `toc-mvp-fixture-001`
  - 已有 Lite golden 报告、debug trace 和人工 review。
  - 适合作为 Lite 正常解释样本锚点。
- `toc-mvp-fixture-002`
  - 已有 Pro golden 报告、Lite 对照报告、debug trace 和人工 review。
  - 适合作为 Pro 正常解释样本锚点，也适合作为 Lite / Pro 差异解释样本锚点。

本页只引用样本 ID 和资产类型，不复制报告内容。

## 映射表

| 抽象 eval | 真实 fixture 锚点 | 为什么适合 | 备注 |
| --- | --- | --- | --- |
| 典型 Lite 报告解释 | `toc-mvp-fixture-001` Lite golden | 有 Lite 报告、debug trace 和人工 review，可验证“简洁、温和、回到画面依据” | 后续可补用户问题：“为什么报告建议先做小调整？” |
| 典型 Pro 报告解释 | `toc-mvp-fixture-002` Pro golden | 有 Pro 报告、debug trace 和人工 review，可验证逐圈证据、机制链和疗愈路径解释 | 适合检查是否把 Pro 解释成 Lite 加长版 |
| Lite / Pro 差异解释 | `toc-mvp-fixture-002` Lite + Pro golden | 同一 fixture 同时有 Lite 和 Pro，可观察两个层级如何不同 | 可作为新增 eval 样本候选 |
| 证据不足或引用缺失 | 暂无直接正式锚点 | 需要构造缺失 stage refs 或缺失 chain 字段的派生样本 | 不应直接篡改 golden，可在未来另建 negative fixture |
| 边界风险或诊断诉求 | 任一 Lite / Pro fixture + 边界问题输入 | 风险来自用户问题，不一定来自报告内容 | 适合用固定报告加诊断诉求问题构造对话样本 |

## 如何使用

后续接入真实样本时，建议按三步走：

1. 先用 `toc-mvp-fixture-001` 跑 Lite 正常解释。
2. 再用 `toc-mvp-fixture-002` 跑 Pro 正常解释和 Lite / Pro 差异解释。
3. 最后基于固定报告构造证据不足和边界风险输入，验证 `degraded` 与 `needs_manual_review` 路径。

## 不要做什么

- 不把 golden 报告正文复制进学习库。
- 不把单个 fixture 的表现当成全部产品规则。
- 不在学习库里修改 fixture、debug 或 review。
- 不把抽象 eval 的失败样本直接写入项目 golden。

## 可补充的 eval 候选

### Lite / Pro 差异解释

用户问题：

“为什么同一幅画 Lite 和 Pro 解释深度不一样？”

期望行为：

- 说明 Lite 更偏轻量照见。
- 说明 Pro 更偏机制、证据链和调节路径。
- 不把 Pro 描述成 Lite 的简单加长版。
- 能回指同一 fixture 的 Lite / Pro 对照。

### 人工 review 影响解释

用户问题：

“人工 review 对这份报告有什么影响？”

期望行为：

- 只说明 review 是质量确认或人工摘录证据，不把 review 当成新的解读来源。
- 区分 debug trace、report 和 review 的角色。
- 不替代正式项目 QA 结论。

## 相关原子

- [[../../atoms/bridge/real-fixtures-should-map-to-abstract-evals]]
- [[../../atoms/bridge/mandala-agent-evals-check-traceability]]
- [[../../atoms/bridge/stage-refs-anchor-agent-trace]]

## 相关概念

- [[./mandala-interpreter-agent-evals]]
- [[./mandala-interpreter-agent-examples]]
- [[./mandala-interpreter-agent-design]]
- [[./aimandala-agent-mapping]]

## 待解问题

- 是否需要在学习库里单独建立 `fixture-derived-evals` 页面，还是继续把真实 fixture 映射保留在 bridge 层。
- negative fixture 应该在项目侧正式创建，还是先用学习库里的抽象样本描述。
