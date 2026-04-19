# To C MVP Fixture Evidence

fixture_id: `toc-mvp-fixture-004`

- asset: `fixtures/toc-mvp/assets/IMG_5063.jpeg`
- theme: `general`
- version: `lite`
- target:
  - warning trace 可见
  - `fallback_summary.used = false`
  - Lite 新产品区块字段完整
- deterministic_override:
  - `override_imbalance_candidates = ["水多火灭"]`
  - 该值与当前 knowledge build 的高风险 warning path 对齐
- actual_excerpt:
  - 待本批 workbench / eval 重跑后补充
- golden_scope:
  - 本批只作为 warning trace 旁证，不纳入第一批人工 golden 主审阅
  - 后续若扩展 warning 内容审阅，再补 `fixtures/toc-mvp/golden/toc-mvp-fixture-004/`
