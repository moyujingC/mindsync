# Aimandala 曼曼 avatar 报告陪读与追问 Phase 1/2/3 实现 Handoff

> 状态：working  
> 版本：0.1.0  
> owner：Claude Code / Engineer  
> last_updated：2026-05-30  
> source_of_truth：projects/aimandala/docs/delivery/2026-05-30-曼曼-avatar报告陪读与追问-phase1-3-handoff.md  
> 项目：一镜一梳 / Aimandala  
> 阶段：implementation / verification / delivery handoff  
> 上游依据：projects/aimandala/docs/specs/2026-05-30-曼曼-avatar报告陪读与追问-handoff.md  
> reviewers：Product Spec Lead, Architect, Engineer, Test / QA

## 1. 背景

本轮根据 `2026-05-30-曼曼-avatar报告陪读与追问-handoff.md` 执行“曼曼 avatar 报告陪读与追问”落地。

上游结论是：

- 可以引入曼曼，但不要把报告改成“曼曼这位疗愈师本人在给用户做判断”。
- 曼曼定位为 Aimandala 的 AI 报告陪读 avatar，陪用户读懂本次曼陀罗报告，并在报告范围内回答追问。
- 追问功能第一阶段只围绕“本次画作 + 本次报告”，不进入长期陪伴、心理咨询式会谈、跨报告人格总结或完整疗愈计划。

本轮已经完成 Phase 1 / Phase 2 / Phase 3 的工程实现与验证，并分别提交。

## 2. 当前阶段

当前阶段为：

- `implementation`：已完成报告陪读层、追问闭环、追问稳定化基础实现。
- `verification`：已运行后端、前端测试与构建；真实模型 followup smoke 已完成 `--check-env`。
- `delivery handoff`：本文用于新窗口继续接手。

尚未进入：

- 多报告对比
- 用户授权后的长期观察
- 人工疗愈师转接
- 主题方案 / 21 天计划

这些方向仍需要 Product Spec / Architecture 重新确认。

## 3. 继承的项目锚点

继续继承 `projects/aimandala/PROJECT.md` 与上游 handoff 的约束：

- Aimandala 当前仍是 To C 曼陀罗三圈识别与解读产品。
- 当前财富解读对外默认以 Lite 为准，Pro 仍作为内部评测和预备入口。
- Lite / Pro 是解读产品的深度分流，不是产品架构主分层。
- 报告必须保留画面依据、三圈边界、五行 / 生克推导、现实议题连接和安全边界。
- 报告不是心理诊断、医疗建议、财务预测、投资建议或人生定论。
- 追问只围绕本次画作和本次报告做解释、追问和温和延展。
- Persona 只管表达，不管事实观察、知识推导和安全边界。
- Safety / Quality Gate 优先级高于 persona。

## 4. 已完成提交

### 4.1 Phase 1：报告陪读层

提交：

```text
e672404b feat(aimandala): add manman report companion layer
```

核心内容：

- 新增 `ReportPersona`。
- `MandalaAgentInput`、`final_report`、`run_summary` 携带 persona metadata。
- final report prompt 加入“曼曼报告陪读叙事边界”。
- Vision Pass 不注入曼曼 persona。
- Quality Gate 增加 persona 越界检查。
- 前端报告页文案统一为：
  - “一镜一梳 · 曼曼陪你一起读懂这幅画”
  - “曼曼已经帮你整理出这幅画里最核心的一条线索。”
  - “曼曼正在整理这幅画里的线索。”

关键文件：

- `projects/aimandala/toC/app/backend/app/core/mandala_interpretation_agent/contracts.py`
- `projects/aimandala/toC/app/backend/app/core/mandala_interpretation_agent/agent.py`
- `projects/aimandala/toC/app/backend/app/core/mandala_interpretation_agent/quality_gate.py`
- `projects/aimandala/toC/app/frontend/mobile-web/page-shells/report-page.tsx`
- `projects/aimandala/toC/app/frontend/shared/types/api.ts`
- `projects/aimandala/toC/app/frontend/shared/core/flow.ts`

### 4.2 Phase 2：ReportFollowupAgent 最小闭环

提交：

```text
2b547d87 feat(aimandala): add report followup agent
```

核心内容：

- 新增 `ReportFollowupAgent`。
- 新增 `ReportFollowupContext`、`ReportFollowupInput`、`ReportFollowupResult`。
- 新增 `POST /api/report-followups`。
- 新增 followup safety pre-check / post-check。
- 后端默认通过 `AIMANDALA_REPORT_FOLLOWUP_ENABLED=1` 开启追问 API。
- 前端新增 followup service、types 和 feature flag。
- 报告页新增 feature-flagged “问曼曼”入口，默认不展示。

关键文件：

- `projects/aimandala/toC/app/backend/app/core/mandala_interpretation_agent/report_followup_agent.py`
- `projects/aimandala/toC/app/backend/app/api/routes.py`
- `projects/aimandala/toC/app/frontend/shared/api/services.ts`
- `projects/aimandala/toC/app/frontend/shared/api/config.ts`
- `projects/aimandala/toC/app/frontend/mobile-web/page-shells/report-page.tsx`

### 4.3 Phase 3：追问稳定化

提交：

```text
6b86a718 test(aimandala): stabilize report followups
```

核心内容：

- 扩展 ReportFollowupAgent golden / safety cases。
- 新增 `ReportSectionReference`。
- 新增报告 section map 抽取。
- 新增单报告 followup context store，不做跨报告长期记忆。
- 新增真实模型 followup smoke 脚本。
- 前端追问 UI 状态收口：空态、loading、success、error、边界回应、引用段落展示。
- 增加 report page followup 测试。

关键文件：

- `projects/aimandala/toC/app/backend/app/core/mandala_interpretation_agent/report_followup_context.py`
- `projects/aimandala/toC/app/backend/scripts/smoke_report_followup.py`
- `projects/aimandala/toC/app/backend/tests/unit/test_report_followup_agent.py`
- `projects/aimandala/toC/app/backend/tests/unit/test_report_followup_context.py`
- `projects/aimandala/toC/app/frontend/mobile-web/page-shells/report-page.test.tsx`
- `projects/aimandala/toC/app/frontend/vite.config.ts`

## 5. 已实现范围

### 5.1 Persona / 报告陪读层

已实现：

- `ReportPersona` 默认值：
  - `persona_id = manman`
  - `persona_version = manman-report-companion-v0.1`
  - `display_name = 曼曼`
  - `role_label = AI 报告陪读 avatar`
  - `scope = 陪用户读懂本次曼陀罗报告，并在报告范围内回答追问`
- 报告 artifact 中携带 persona metadata。
- 前端可读取 persona 并 fallback 到“曼曼”。
- Quality Gate 可拦截 persona 身份越界、治疗承诺、依赖诱导。

### 5.2 ReportFollowupAgent

已实现：

- 只围绕本次报告上下文回答。
- prompt 包含：
  - `report_id`
  - `report_mode`
  - `theme_label`
  - 绘画前意图 / 绘画时感受
  - 视觉草稿摘要
  - 报告可引用段落
  - 本次报告全文
  - 本轮 recent turns
  - 用户当前问题
- pre-check 拦截：
  - 空问题
  - 自伤 / 危机风险
  - 医疗或心理诊断请求
  - 财务预测 / 投资建议
  - 跨报告、长期记忆、替用户做决定等越界问题
- post-check 拦截：
  - persona 身份越界
  - 诊断 / 医疗 / 财务建议泄漏
- 越界时返回边界回应，不伪装成正常报告分析。

### 5.3 Followup API

已实现：

- `POST /api/report-followups`
- 默认关闭，需设置：

```text
AIMANDALA_REPORT_FOLLOWUP_ENABLED=1
```

请求仍要求绑定报告上下文：

- `report_id`
- `question`
- `report_mode`
- `final_report_md`
- `final_report`
- 可选 `visual_draft`
- 可选 `history`

如果 `final_report.report_id` 与请求 `report_id` 不一致，返回 422。

Pro followup 当前仍受内部限制：

```text
AIMANDALA_REPORT_FOLLOWUP_INTERNAL_ONLY=1
```

默认情况下 Pro followup 不对外。

### 5.4 ReportFollowupContext / 引用基础

已实现：

- `ReportSectionReference`
- `build_report_section_map(markdown)`
- `ReportFollowupContextStore`

当前 store 是文件型、单报告上下文基础设施：

- 默认 root：`data/report-followup-contexts`
- 只做单报告 context 读写。
- 不聚合多报告。
- 不创建长期人格画像。
- report_id 做路径清洗。

注意：当前 API 尚未切换为只传 `report_id` 自动加载 context。`ReportFollowupContextStore` 是 Phase 3 稳定化基础，供后续接入。

### 5.5 前端追问入口

已实现：

- feature flag 控制：
  - `VITE_AIMANDALA_REPORT_FOLLOWUP_ENABLED=1`
  - 或 `AIMANDALA_REPORT_FOLLOWUP_ENABLED=1`
  - 或 `NEXT_PUBLIC_AIMANDALA_REPORT_FOLLOWUP_ENABLED=1`
- 默认不展示追问入口。
- flag on 且报告存在时展示追问区。
- UI 文案包含：
  - 可问范围
  - 禁止范围
  - 输入提示
  - loading 状态
  - success 状态
  - error 状态
  - 边界回应标记
  - 参考报告段落

## 6. 验证记录

### Phase 1 验证

```bash
python3 -m pytest projects/aimandala/toC/app/backend/tests/unit/test_mandala_e2e_agent.py projects/aimandala/toC/app/backend/tests/unit/test_api_routes_e2e.py -q
# 21 passed
```

```bash
python3 -m pytest projects/aimandala/toC/app/backend/tests/unit -q
# 63 passed
```

```bash
npm --prefix projects/aimandala/toC/app/frontend run typecheck
# passed
```

```bash
npm --prefix projects/aimandala/toC/app/frontend run test
# 12 files, 43 tests passed
```

```bash
npm --prefix projects/aimandala/toC/app/frontend run build:mobile-web
# built successfully
```

### Phase 2 验证

```bash
python3 -m pytest projects/aimandala/toC/app/backend/tests/unit/test_report_followup_agent.py projects/aimandala/toC/app/backend/tests/unit/test_api_routes_e2e.py -q
# 10 passed
```

```bash
python3 -m pytest projects/aimandala/toC/app/backend/tests/unit -q
# 70 passed
```

```bash
npm --prefix projects/aimandala/toC/app/frontend run typecheck
# passed
```

```bash
npm --prefix projects/aimandala/toC/app/frontend run test
# 12 files, 45 tests passed
```

```bash
npm --prefix projects/aimandala/toC/app/frontend run build:mobile-web
# built successfully
```

### Phase 3 验证

```bash
python3 -m pytest projects/aimandala/toC/app/backend/tests/unit/test_report_followup_agent.py projects/aimandala/toC/app/backend/tests/unit/test_report_followup_context.py projects/aimandala/toC/app/backend/tests/unit/test_api_routes_e2e.py -q
# 16 passed
```

```bash
PYTHONPATH=projects/aimandala/toC/app/backend python3 projects/aimandala/toC/app/backend/scripts/smoke_report_followup.py --check-env
# passed: true
# chat_model: deepseek-v4-pro
```

```bash
npm --prefix projects/aimandala/toC/app/frontend run typecheck
# passed
```

```bash
npm --prefix projects/aimandala/toC/app/frontend run test -- mobile-web/page-shells/report-page.test.tsx mobile-web/app.test.tsx shared/api/services.test.ts
# 3 files, 12 tests passed
```

```bash
python3 -m pytest projects/aimandala/toC/app/backend/tests/unit -q
# 76 passed
```

```bash
npm --prefix projects/aimandala/toC/app/frontend run test
# 13 files, 47 tests passed
```

```bash
npm --prefix projects/aimandala/toC/app/frontend run build:mobile-web
# built successfully
```

## 7. 明确产物

### 工程产物

- `ReportPersona`
- `ReportFollowupAgent`
- `ReportFollowupContext`
- `ReportSectionReference`
- `ReportFollowupContextStore`
- `build_report_section_map()`
- `/api/report-followups`
- `smoke_report_followup.py`
- feature-flagged report followup UI
- followup golden / safety tests
- followup context store tests
- frontend followup UI tests

### 可交给 QA 的产物

- 后端追问安全矩阵测试
- API followup 合同测试
- 前端 flag on/off 测试
- 真实模型 smoke 脚本
- 手动 smoke 输出目录机制

## 8. 验收标准

下游 Test / QA 可按以下标准验收：

1. Lite 报告生成仍正常。
2. `final_report.persona` 存在且是 `manman`。
3. Vision Pass 不包含曼曼 persona 文案。
4. 追问 API 默认关闭。
5. 开启 `AIMANDALA_REPORT_FOLLOWUP_ENABLED=1` 后，追问必须绑定本次报告上下文。
6. report_id mismatch 返回 422。
7. 心理诊断、财务建议、自伤风险、长期记忆请求不会进入普通 LLM 回答。
8. post-check 能拦截模型生成的 persona 越界回答。
9. 前端 flag off 不展示入口。
10. 前端 flag on 展示可问范围、输入提示、边界说明和引用段落。
11. `smoke_report_followup.py --check-env` 能检查真实模型配置。
12. `ReportFollowupContextStore` 不做跨报告聚合或长期记忆。

## 9. 仍未解决的问题

1. `/api/report-followups` 当前仍要求请求携带 `final_report_md`，尚未改为只通过 `report_id` 从 store 恢复上下文。
2. `ReportFollowupContextStore` 已实现，但尚未接入生产 API 主路径。
3. 真实模型 followup smoke 已支持脚本和 env check，但尚未实际运行完整真实模型问题集并保存 model-evals artifact。
4. 前端追问 UI 仍使用报告页 inline banner 结构，尚未做正式聊天弹层 / 组件化设计。
5. 引用段落目前基于 markdown heading / section map，尚未实现模型必须显式返回 section_id 的结构化输出。
6. 追问历史只在前端 state 和 request 中传递，尚未持久化。
7. 高风险安全回应仍是规则版，尚未接入完整 `app/core/safety/protocol.py`。
8. Pro 对外仍未开放；Pro report page 现有 chat modal 未接入主 route。
9. 多报告对比、长期观察、人工转接、21 天计划均未实现。
10. 当前工作区仍有本轮之外的文档改动 / 未跟踪文档，未纳入上述提交。

## 10. 当前工作区剩余未提交内容

截至本 handoff 创建时，代码实现已提交。工作区仍有既有文档改动 / 未跟踪文档，未卷入实现提交：

- `projects/aimandala/docs/疗愈体系知识库/.../20-觉察问题库.md`
- `projects/aimandala/docs/疗愈体系知识库/.../信号→议题条款翻译映射表.md`
- `projects/aimandala/docs/疗愈体系知识库/30-应用适配/10-aimandala/04-Lite-Pro报告分流与交付口径.md`
- `projects/aimandala/docs/decisions/2026-05-29-Lite-Pro版本关系与内容边界决策.md`
- `projects/aimandala/docs/specs/2026-05-30-曼曼-avatar报告陪读与追问-handoff.md`

新窗口接手时应先运行：

```bash
git status --short
```

不要把这些文档改动误认为 Phase 1/2/3 代码实现的一部分。

## 11. 下一步建议

### 11.1 交给 Test / QA

产物：

- `曼曼追问真实模型 smoke 记录 v0.1`
- `曼曼 persona / followup safety QA matrix v0.1`

建议动作：

1. 运行完整真实模型 smoke：

```bash
PYTHONPATH=projects/aimandala/toC/app/backend \
python3 projects/aimandala/toC/app/backend/scripts/smoke_report_followup.py \
  --env-file <local-env> \
  --save-dir projects/aimandala/docs/qa/model-evals/2026-05-30-report-followup-smoke
```

2. 人工复核 `responses.json` 和 `README.md`。
3. 检查边界问题是否温和拒答并拉回报告。
4. 检查报告内问题是否引用具体报告段落。

### 11.2 交给 Engineer

产物：

- `ReportFollowupContextStore API 接入实现`

建议动作：

1. 报告生成后写入 `ReportFollowupContextStore`。
2. `/api/report-followups` 支持只传 `report_id + question`。
3. 找不到 context 时 fallback 到当前 full context request。
4. 增加 context 过期 / 删除接口草案，但不默认开放长期记忆。

### 11.3 交给 Product Spec Lead

产物：

- `曼曼 Phase 4 产品增强规格 v0.1`

需要明确：

- 是否做多报告对比。
- 是否允许用户授权长期观察。
- 是否做人工疗愈师转接。
- 是否做 7 天 / 21 天主题计划。
- 这些能力各自的付费、入口、授权、撤回、边界文案。

### 11.4 交给 Architect

产物：

- `曼曼追问上下文与长期能力边界架构 v0.1`

需要明确：

- 单报告 context store 与长期记忆的边界。
- report section id 标准。
- 引用输出结构。
- safety protocol 接入方式。
- 多报告对比和长期观察是否独立于 `ReportFollowupAgent`。

## 12. 禁止改写范围

后续新窗口继续时，除非有新的批准 spec，不得：

- 把曼曼定义成真实疗愈师、心理咨询师、治疗师或长期陪伴者。
- 让曼曼承诺治愈、改善、诊断、预测或替用户做重大决策。
- 让 persona 进入 Vision Pass。
- 让追问功能变成通用聊天。
- 默认开启跨报告长期记忆。
- 默认沉淀用户长期人格画像。
- 默认开放 Pro 对外入口。
- 把 `ReportFollowupContextStore` 扩展成多报告长期观察系统。
- 把人工转接、21 天计划、多报告对比当作已批准能力直接实现。

## 13. 新窗口最小启动指令

建议新窗口开头执行：

```bash
git status --short
python3 -m pytest projects/aimandala/toC/app/backend/tests/unit/test_report_followup_agent.py projects/aimandala/toC/app/backend/tests/unit/test_report_followup_context.py -q
npm --prefix projects/aimandala/toC/app/frontend run test -- mobile-web/page-shells/report-page.test.tsx
```

然后根据下一个目标选择：

- QA：跑真实模型 smoke 并写 QA 记录。
- Engineer：把 context store 接入 API 主路径。
- Product：补 Phase 4 产品增强规格。
- Architect：设计长期能力边界。
