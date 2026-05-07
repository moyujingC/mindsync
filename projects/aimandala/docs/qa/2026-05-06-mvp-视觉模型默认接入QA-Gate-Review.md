# MVP 视觉模型默认接入 QA Gate Review

> 状态：passed
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-05-06
> source_of_truth：projects/aimandala/docs/qa/2026-05-06-mvp-视觉模型默认接入QA-Gate-Review.md
> 项目：aimandala
> 阶段：verification
> depends_on：projects/aimandala/docs/qa/2026-05-06-mvp-国产视觉模型最终候选人工细看记录.md
> depends_on：projects/aimandala/docs/qa/2026-05-06-mvp-视觉模型端到端-smoke-验证记录.md
> depends_on：projects/aimandala/docs/qa/2026-05-06-mvp-视觉模型前端-runtime-smoke-验证记录.md
> depends_on：projects/aimandala/docs/qa/2026-05-06-mvp-视觉接入后解读流派保真QA-Gate.md
> evidence：projects/aimandala/docs/qa/model-evals/2026-05-06-vision-mvp-final-smoke/

本记录把人工细看、后端端到端 smoke、前端 runtime smoke、解读流派保真和最终 3 图复测合并为一个质量门结论。

## 1. 评审对象

本次评审对象：

- 默认视觉模型：`qwen-vl-max-latest`
- 默认视觉 base URL：`https://dashscope.aliyuncs.com/compatible-mode/v1`
- fallback 视觉模型：`ep-20260316095322-94wf5`
- fallback base URL：`https://ark.cn-beijing.volces.com/api/v3`
- 配置范围：本地 / staging 口径
- 明确不包含：生产配置直接切换

## 2. 验收标准

必须全部满足：

- 人工细看结论支持 `qwen-vl` 进入最终默认候选。
- 后端真实 V2 API 主链能跑通 `upload-image -> detect-circles -> create -> status -> lite -> pro order/pay/reconcile -> pro`。
- 前端 mobile-web runtime 能消费同一条真实 API 主链，不停留在 preview。
- Lite `visual_basis` 保留为“画面依据区”，允许少量三圈 / 五行术语，但必须可读。
- Pro 报告必须产出 `evidence_digest`、`root_cause_chain`、`healing_plan` 等可审阅字段。
- 输出证据不能包含明文 API key、私有 env、runtime data 路径或完整 prompt preview。

## 3. 已验证证据

### 3.1 人工细看

来源：`projects/aimandala/docs/qa/2026-05-06-mvp-国产视觉模型最终候选人工细看记录.md`

结论摘要：

- `qwen-vl` 三圈结构更规整，输出更像可直接进入报告的 `visual_basis`。
- 豆包细节观察能力可用，适合作为 fallback。
- GLM 不进入最终默认候选。

### 3.2 后端端到端 smoke

来源：`projects/aimandala/docs/qa/2026-05-06-mvp-视觉模型端到端-smoke-验证记录.md`

结论摘要：

- 3 张代表图均未落入 `default` fallback。
- Lite 报告均产出可读 `visual_basis`。
- Pro stub 支付 / 对账路径能生成 Pro 报告。

### 3.3 前端 runtime smoke

来源：`projects/aimandala/docs/qa/2026-05-06-mvp-视觉模型前端-runtime-smoke-验证记录.md`

结论摘要：

- 页面显示 runtime，不是 preview。
- 浏览器请求覆盖 upload、detect、create、Lite report、miniapp order、paid notify、reconcile、Pro report。
- Pro 路径已补齐本地 stub 支付和 reconcile。

### 3.4 解读流派保真

来源：`projects/aimandala/docs/qa/2026-05-06-mvp-视觉接入后解读流派保真QA-Gate.md`

结论摘要：

- 报告仍走 knowledge-first 主链，视觉模型只负责图片观察和三圈识别。
- Lite `visual_basis` 已明确保留为“画面依据区”。
- Lite prompt 口径已从“不说三圈 / 五行”调整为“少术语”。

### 3.5 MVP 最终 3 图复测

来源：`projects/aimandala/docs/qa/model-evals/2026-05-06-vision-mvp-final-smoke/`

| fixture | detect method | confidence | Lite | Pro | 结论 |
| --- | --- | ---: | --- | --- | --- |
| `toc-mvp-fixture-003` | `llm_vision` | 0.90 | Pass | Pass | Pass |
| `toc-mvp-fixture-006` | `llm_vision` | 0.95 | Pass | Pass | Pass |
| `toc-mvp-fixture-008` | `llm_vision` | 0.90 | Pass | Pass | Pass |

关键检查：

- `summary.ok=true`
- `fixture_count=3`
- 3/3 `detect.method=llm_vision`
- 3/3 Lite `error=null`
- 3/3 Lite `prompt_schema_validation_issues=[]`
- 3/3 Pro `error=null`
- 3/3 Pro `style_review_fields` 包含 `evidence_digest`、`root_cause_chain`、`healing_plan`
- 3/3 `root_cause_chain` 包含 `surface / mechanism / core`
- 3/3 `healing_plan` 含 3 条建议

## 4. 失败降级策略确认

当前实际策略：

1. 首先使用 `AIMANDALA_LLM_VISION_*`，即 Qwen 视觉。
2. 如果 Qwen 请求失败、返回空结果或无法解析 JSON，统一 LLM client 会尝试 `AIMANDALA_LLM_VISION_FALLBACK_*`，即豆包视觉。
3. 如果 Qwen 与豆包都失败，`LLMCircleDetectionBackend` 返回 `method=llm_fallback`、`confidence=0.2`、默认三圈 `inner=0.33 / middle=0.66`。
4. 如果没有配置 detector backend、图片不存在或后端不可用，`CircleDetector` 返回 `method=default`、`confidence=0.2`。

产品处理口径：

- `method=llm_vision` 且 confidence 达标：自动进入报告。
- `method=llm_vision_estimated`：可以进入报告，但 UI / QA 应视为估计结果。
- `method=llm_fallback` 或 `default`：不应作为高可信自动识别；MVP 应引导用户使用手动三圈或提示重试。
- 图片不存在、上传失败、后端 5xx：提示用户重试，不生成报告。

## 5. 质量门结论

结论：通过。

可进入下一步：

- 允许将 `qwen-vl-max-latest` 作为 Aimandala MVP 本地 / staging 默认视觉模型。
- 允许将豆包 `ep-20260316095322-94wf5` 作为 fallback。
- 允许进入默认接入配置和 staging 验证。

不允许的动作：

- 不直接修改生产配置。
- 不把 API key、私有 env、用户图片或 runtime data 提交进仓库。
- 不把视觉模型评测结论扩大成完整心理诊断能力结论。

## 6. 上线前必须检查

- staging 环境必须确认 `AIMANDALA_LLM_VISION_API_KEY` 和 `AIMANDALA_LLM_VISION_FALLBACK_API_KEY` 均有效。
- staging 必须至少再跑 3 张代表图完整链路。
- 前端遇到 `llm_fallback/default` 时必须能明确引导用户手动三圈或重试。
- 生产配置切换前，需要单独生成 production change record，不复用本地 / staging 记录。
- 继续关注 Pro `root_cause_chain` 与 `healing_plan` 的表达质量，避免公式化重复。
