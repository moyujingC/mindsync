# MVP 视觉接入后解读流派保真 QA Gate

> 状态：conditional_pass
> 版本：0.1.0
> owner：Test / QA / Knowledge Lead
> last_updated：2026-05-06
> source_of_truth：projects/aimandala/docs/qa/2026-05-06-mvp-视觉接入后解读流派保真QA-Gate.md
> 项目：aimandala
> 阶段：verification
> depends_on：projects/aimandala/docs/疗愈体系知识库/README.md
> depends_on：projects/aimandala/docs/疗愈体系知识库/20-疗愈体系/20-流派层/10-曼陀罗/00-曼陀罗基础层解读流程.md
> depends_on：projects/aimandala/docs/qa/2026-05-06-mvp-视觉模型端到端-smoke-验证记录.md
> depends_on：projects/aimandala/docs/qa/2026-05-06-mvp-视觉模型前端-runtime-smoke-验证记录.md

本记录用于回答一个独立于模型可用性的质量问题：

视觉模型接入后，最终 Lite / Pro 解读报告是否仍然遵循最初构建知识库时模拟出的解读流派，而不是变成视觉模型或文字模型自由发挥的通用解读。

## 1. 评审对象

本次评审对象不是视觉模型横评，而是当前端到端链路里的报告生成保真度。

已检查证据：

- 后端 e2e smoke 输出目录：`projects/aimandala/docs/qa/model-evals/2026-05-06-vision-e2e-smoke/`
- 覆盖 fixture：`toc-mvp-fixture-003`、`toc-mvp-fixture-006`、`toc-mvp-fixture-008`
- 覆盖报告版本：Lite / Pro
- 视觉默认模型：`qwen-vl-max-latest`
- fallback：豆包 `ep-20260316095322-94wf5`

本轮没有重新调用模型，不产生新 API 费用。

## 2. 流派保真标准

### 2.1 知识来源保真

报告主判断必须来自正式知识库和运行时知识骨架，不允许由大模型重新发明主轴。

检查口径：

- 正式知识来源以 `当前正式依据与使用说明.md` 为入口。
- 运行时应保持 knowledge-first：视觉模型只提供图片观察 / 三圈识别，不直接生成整份报告。
- Lite / Pro prompt 明确要求只能润色知识骨架，不能重做分析、改写主判断或新增核心结论。

结论：Pass。

依据：

- 当前后端 e2e smoke 记录明确说明：Lite / Pro 报告正文走本地 deterministic / knowledge 主链，不由视觉模型直接生成整份报告。
- 当前正式依据已收口到三圈五行 stage 00-16，不再引用 Batch E / Batch H 旧链路作为放行依据。

### 2.2 Lite 流派保真

Lite 应保持“第一份理解报告”的定位：温柔、稳定、清楚、有共鸣感，先让用户被看见，再解释模糊感，最后给低压下一步。

检查口径：

- 开头 1-2 句是否直接命中状态，而不是只描述图片。
- 是否给出画面依据到状态判断的解释链。
- 是否把主题、意图、感受纳入判断。
- 是否少术语、少空话、少堆砌比喻。
- 是否避免诊断化和强判断。

结论：Conditional。

已通过部分：

- 3 个 fixture 的 Lite `overall_impression` 都不是纯图片描述，而是先进入“把自己重新收回来 / 先安顿再向外”的状态判断。
- 3 个 fixture 的 `visual_basis` 都保留了三层画面依据、填充状态、面积约值和现实主题连接。
- 报告没有出现医疗诊断口吻，也没有把用户说死。

条件项：

- 产品口径已确认：保留 Lite 中的 `visual_basis` 作为“画面依据区”，允许在该区域少量使用“内圈 / 中圈 / 外圈”和「木 / 火 / 土 / 金」等术语。
- Lite prompt 已同步从“少术语、不说内圈/中圈/外圈、五行”调整为“少术语”：允许必要术语，但必须简短、可读、服务于画面依据，不能堆术语。
- 因此，术语本身不再构成阻塞；后续只检查是否“术语过密、解释不清、影响普通用户理解”。

### 2.3 Pro 流派保真

Pro 应保持“深度理解报告”的定位：机制拆解、现实连接、根因递进、行动方向，而不是 Lite 扩写版。

检查口径：

- `first_impression / overall_impression` 是否先完成“被看见”。
- 是否有独立的深度结构字段。
- 是否能检查根因链、失衡说明、疗愈建议是否递进。
- 是否避免 21 天方案、诊断化、玄学标签堆叠和空泛建议。

结论：Conditional。

已通过部分：

- 3 个 fixture 的 Pro 都返回 `version=pro`，且 `structured_keys` 包含 `deep_impression`、`deep_structure_interpretation`、`evidence_digest`、`imbalance_diagnosis`、`root_cause_chain`、`healing_plan`、`topic_context`。
- Pro `overall_impression` 明显比 Lite 更强调“底层承载感、行动与边界、失控消耗”等机制层判断。

条件项：

- 当前 e2e smoke 的已提交证据只保存 Pro `overall_impression` 和 `structured_keys`，没有保存 `root_cause_chain`、`healing_plan`、`evidence_digest` 等字段内容，因此不能完整人工确认 Pro 是否真正达到“根因递进 + 行动落地”的流派要求。
- 已补强 smoke 脚本：后续输出会保存可审阅的 Lite / Pro `style_review_fields`，但仍不保存完整 report 正文、prompt preview、支付 payload 或本地 runtime path。

## 3. 逐样本人工判断

| fixture | Lite 判断 | Pro 判断 | 结论 |
| --- | --- | --- | --- |
| `toc-mvp-fixture-003` | 开头能进入自我价值 / 重新收回自己的状态判断；画面依据完整，术语集中在 `visual_basis` 依据区，符合“少术语”口径。 | Pro 开头能进入“想往前但不放心交出去”的机制判断；完整结构字段存在，但缺少字段内容证据。 | Conditional |
| `toc-mvp-fixture-006` | 能把几何 / 星月结构识别后的三层结果转成成长与边界主题；五行术语用于画面依据区，符合当前产品口径。 | Pro 对“生命力成长与边界清晰”的机制判断成立；根因与建议内容需下轮证据确认。 | Conditional |
| `toc-mvp-fixture-008` | 能处理非纯圆层次，进入安全感 / 根基主题；术语集中在依据说明，不再视为阻塞。 | Pro 能围绕安全感、边界和承载感展开；但当前证据不足以完整审阅深度字段。 | Conditional |

## 4. 质量门结论

结论：有条件通过。

允许进入下一步：

- 可以继续把 `qwen-vl-max-latest` 作为 MVP 默认视觉模型候选。
- 可以继续使用豆包 `ep-20260316095322-94wf5` 作为 fallback。
- 可以进入“默认模型接入配置”的准备工作。

不得跳过的条件：

- 默认接入前必须再跑一次端到端 smoke，使用补强后的证据输出，确认 Pro `root_cause_chain`、`healing_plan`、`evidence_digest` 符合流派。
- Lite `visual_basis` 已确认保留为“画面依据区”；后续只检查术语是否少量、可读、服务于依据说明。
- 如果下轮发现 Pro 只是重复 Lite，或疗愈建议空泛，则退回 Report Pipeline / Knowledge Lead 修正，不应直接上线。

## 5. 退回条件

出现以下任一情况，应退回实现或知识链路，不进入默认接入：

- 报告主判断明显来自大模型自由发挥，而不是 stage 00-12 的知识引用与中间交付物。
- Lite 开头变成泛安慰文，不能在前两句命中用户状态。
- Lite / Pro 混用定位，Pro 只是 Lite 的扩写版。
- Pro 根因链三层没有递进，只是同义重复。
- 疗愈建议不可执行，只剩“多觉察自己”等空泛话。
- `risk_flags`、raw JSON、API key、prompt preview 或 runtime path 进入用户可见报告或 QA 公共证据。

## 6. 下一步

1. 用补强后的 `run_vision_e2e_smoke.py` 重新跑 3 张代表图。
2. 基于新输出的 `style_review_fields` 人工确认 Lite / Pro 流派保真。
3. 若通过，再把默认视觉模型配置推进到本地 / staging 接入口径。
4. 按“少术语”口径检查 Lite `visual_basis`，不再要求完全隐藏三圈或五行词汇。
