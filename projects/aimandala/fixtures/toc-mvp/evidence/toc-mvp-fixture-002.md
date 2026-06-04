# To C MVP Fixture Evidence: toc-mvp-fixture-002

## 1. 基本信息

- fixture_id: `toc-mvp-fixture-002`
- asset: `fixtures/toc-mvp/assets/IMG_5060.jpeg`
- theme: `wealth_career`
- default_version: `pro`
- target: 默认返回 Pro，显式请求 Lite 时仍可读 Lite 新合同，Pro 新产品区块字段完整

## 2. Golden 资产

- Pro 报告快照：[`../golden/toc-mvp-fixture-002/pro.report.json`](../golden/toc-mvp-fixture-002/pro.report.json)
- Pro 人工摘录：[`../golden/toc-mvp-fixture-002/pro.report.md`](../golden/toc-mvp-fixture-002/pro.report.md)
- Pro Debug trace：[`../golden/toc-mvp-fixture-002/pro.debug.json`](../golden/toc-mvp-fixture-002/pro.debug.json)
- Pro 审阅记录：[`../golden/toc-mvp-fixture-002/pro.review.md`](../golden/toc-mvp-fixture-002/pro.review.md)
- Lite 对照快照：[`../golden/toc-mvp-fixture-002/lite.report.json`](../golden/toc-mvp-fixture-002/lite.report.json)
- Lite 对照摘录：[`../golden/toc-mvp-fixture-002/lite.report.md`](../golden/toc-mvp-fixture-002/lite.report.md)
- Lite 对照 Debug：[`../golden/toc-mvp-fixture-002/lite.debug.json`](../golden/toc-mvp-fixture-002/lite.debug.json)
- Lite 对照审阅：[`../golden/toc-mvp-fixture-002/lite.review.md`](../golden/toc-mvp-fixture-002/lite.review.md)

## 3. 教程依据

- `docs/疗愈体系知识库/10-参考来源索引/00-原始来源存档/知识库构建/当前正式依据与使用说明.md`
- `docs/疗愈体系知识库/10-参考来源索引/00-原始来源存档/知识库构建/原始镜像/00_kb_md/06_interpretation_methods.md`
- `docs/疗愈体系知识库/10-参考来源索引/00-原始来源存档/知识库构建/原始镜像/06_四步法重构知识库/06_五行元素太过与不足解读.md`
- `docs/疗愈体系知识库/10-参考来源索引/00-原始来源存档/知识库构建/原始镜像/06_四步法重构知识库/06_主题解读三元论结构.md`

## 4. 本次审阅结论

- Pro 结论：`fail`
- Lite 对照结论：`fail`
- 主要原因：Pro `healing_plan` 存在 raw payload 泄漏；Lite 对照正文可读，但 debug fidelity 被同一 interpretation 的 Pro raw payload 污染。
- fallback：`false`
- warning：无

## 5. 已知偏差

- `BATCH-F-002-PRO-FAIL-001`
  - Pro `healing_plan` 泄漏内部颜色 dict 片段。
- `BATCH-F-002-PRO-FAIL-002`
  - Pro 用户可读报告未稳定展开逐圈深浅状态。
- `BATCH-F-002-LITE-FAIL-001`
  - Lite 对照 debug fidelity 被同一 interpretation 的 Pro raw payload 污染。
- `BATCH-F-002-LITE-FAIL-002`
  - Lite 用户可读报告未稳定展开逐圈深浅状态。

## 6. 下一批回灌入口

- Batch G report contract sanitization
- Batch G debug trace scoping
- Batch G narrative compression fidelity
