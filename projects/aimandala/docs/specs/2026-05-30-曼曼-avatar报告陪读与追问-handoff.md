# Aimandala 曼曼 avatar 报告陪读与追问 Handoff

> 状态：working  
> 版本：0.1.0  
> owner：CEO / Orchestrator  
> last_updated：2026-05-30  
> source_of_truth：projects/aimandala/docs/specs/2026-05-30-曼曼-avatar报告陪读与追问-handoff.md  
> 项目：一镜一梳 / Aimandala  
> 阶段：spec / architecture handoff  
> reviewers：Product Spec Lead, Architect, Engineer, Test / QA

## 1. 背景

本轮讨论围绕 Aimandala 曼陀罗 Lite / Pro 解读报告是否应引入此前设计过的“曼曼”虚拟 avatar，并为后续“允许用户追问解读报告”功能建立产品与架构边界。

当前报告链路正在从“结构化报告生成”走向“报告阅读 + 报告追问”的体验闭环。用户提出：如果后续要让用户围绕报告继续追问，报告本身是否应更明确地由“曼曼——疗愈师 avatar”来解读。

本轮已通过 agent 集群从三类视角论证：

1. 资料检索：现有代码和文档中“曼曼”的出现位置、报告生成与追问边界。
2. 产品体验：曼曼 avatar 对用户信任、疗愈感、付费感和追问连续性的影响。
3. 技术架构：persona 对报告 agent、prompt pack、质量门、会话上下文和安全边界的影响。

## 2. 继承锚点

### 2.1 不变的项目锚点

- Aimandala 当前仍是 To C 曼陀罗三圈识别与解读产品。
- 当前财富解读对外默认以 Lite 为准，Pro 仍作为内部评测和预备入口。
- Lite / Pro 是解读产品的深度分流，不是产品架构主分层。
- 报告必须保留画面依据、三圈边界、五行 / 生克推导、现实议题连接和安全边界。
- 报告不是心理诊断、医疗建议、财务预测、投资建议或人生定论。
- 追问功能第一阶段只围绕“本次画作 + 本次报告”做解释、追问和温和延展，不进入长期陪伴聊天、心理咨询式深度会谈或完整疗愈计划。

### 2.2 本轮任务级别

本轮属于：**局部产品定义 + 架构 handoff**。

它不改写 Aimandala 全局项目定位，不改写疗愈体系知识库，不改写 Lite / Pro 版本关系；它只为“曼曼 avatar 如何进入报告阅读和后续追问”沉淀下一阶段可执行边界。

## 3. 本轮已确认结论

### 3.1 总结论

建议引入曼曼，但不建议把报告完全改成“曼曼这位疗愈师本人在给用户做判断”。

推荐定位：

> 曼曼是 Aimandala 的 AI 疗愈陪伴解读 avatar。她陪用户读懂本次曼陀罗报告，并在报告范围内回答追问。

不推荐定位：

> 曼曼是你的疗愈师。  
> 曼曼是虚拟心理咨询师。  
> 曼曼会长期陪伴你疗愈。  
> 曼曼替你判断人生、财务或关系选择。

### 3.2 产品表达结论

报告应保持正式结构，但由曼曼承担“陪读者 / 解读陪伴者 / 追问承接者”的体验角色。

推荐表达：

- “曼曼陪你一起读懂这幅画。”
- “对这份报告有疑问，可以问曼曼。”
- “曼曼会基于本次画作和报告内容，陪你把某一段看得更清楚。”

明确替换掉：

- “曼曼陪你慢一点看见这幅画。”

原因：

- “慢一点看见”表达不自然，略显刻意。
- “读懂”更贴合报告 / 解读 / 追问体验。
- “一起读懂”保留陪伴感，又不过度疗愈化。

### 3.3 正式推荐文案

#### 报告页品牌线

> 一镜一梳 · 曼曼陪你一起读懂这幅画

#### Lite 报告副标题 / 空态

> 曼曼已经帮你整理出这幅画里最核心的一条线索。

#### Pro 报告副标题 / 开场

> 曼曼会在 Lite 的基础上，继续陪你看这个卡点如何从内圈走到中圈，再来到外圈的表达和行动里。

#### 追问入口

> 对这份报告有疑问，可以问曼曼。

#### 追问说明

> 曼曼会基于本次画作和报告内容，陪你把某一段看得更清楚。

#### 追问输入提示

> 输入你想继续追问的报告问题

#### 追问空态欢迎语

> 嗨，我是曼曼。你可以问我这份解读里最在意的部分，我会陪你一起读清楚。

#### 生成 / 等待态

> 曼曼正在整理这幅画里的线索。

#### 追问边界提示

> 曼曼只能解释本次报告和画面线索，不能替代专业心理咨询、医疗建议、财务建议或重大现实决策。

## 4. 当前输入材料

### 4.1 已知现有实现线索

现有前端已经出现“曼曼”的产品雏形：

- [report-page.tsx](../toC/app/frontend/mobile-web/page-shells/report-page.tsx)：报告页已有 “一镜一梳 · 曼曼陪你慢一点看见这幅画” 和 “曼曼已经把这一轮 Lite 版解读整理好了。”
- [pro-report-page.tsx](../toC/app/frontend/mobile-web/page-shells/pro-report-page.tsx)：Pro 追问弹窗已有 “和曼曼聊聊”“关于你的曼陀罗解读”“嗨，我是曼曼……” 等文案。

这说明曼曼并非全新产品元素，而是已有“报告陪读 / 追问助手”雏形，需要系统化。

### 4.2 相关产品 / 知识库锚点

- [PROJECT.md](../../PROJECT.md)：Aimandala 当前项目入口、Lite / Pro 对外状态和开发约束。
- [04-Lite-Pro报告分流与交付口径.md](../疗愈体系知识库/30-应用适配/10-aimandala/04-Lite-Pro报告分流与交付口径.md)：Lite / Pro 关系和交付边界。
- [07-报告语言风格指南.md](../疗愈体系知识库/30-应用适配/10-aimandala/07-报告语言风格指南.md)：报告应像稳定、有经验的疗愈师陪用户看画，但不诊断、不承诺疗愈。
- [10-aimandala-解读报告生成最小包.md](../疗愈体系知识库/60-运行时知识包/10-aimandala-解读报告生成最小包.md)：报告生成运行时最小包。
- [2026-04-05-pro-report-chat-minimum-boundary.md](../../notes/2026-04-05-pro-report-chat-minimum-boundary.md)：Pro report chat 的最小边界，即围绕本次报告解释、追问和温和延展。

### 4.3 当前相关实现文件

- [agent.py](../toC/app/backend/app/core/mandala_interpretation_agent/agent.py)：当前报告生成 agent 主链路。
- [prompt_pack_builder.py](../toC/app/backend/app/core/mandala_interpretation_agent/prompt_pack_builder.py)：报告 prompt pack 构建。
- [quality_gate.py](../toC/app/backend/app/core/mandala_interpretation_agent/quality_gate.py)：当前报告质量门。
- [protocol.py](../toC/app/backend/app/core/safety/protocol.py)：当前 safety 协议入口。
- [routes.py](../toC/app/backend/app/api/routes.py)：当前 API 路由。
- [pro-report-prompt.md](../toC/app/backend/app/core/mandala_interpretation_agent/prompt_packs/topic-report-v1.0.0/pro-report-prompt.md)：Pro 报告输出 prompt。
- [lite-report-prompt.md](../toC/app/backend/app/core/mandala_interpretation_agent/prompt_packs/topic-report-v1.0.0/lite-report-prompt.md)：Lite 报告输出 prompt。

## 5. 下游任务定义

### 5.1 建议交给谁

下一阶段建议交给：

1. **Product Spec Lead**：产出曼曼 avatar 报告陪读与追问最小产品规格。
2. **Architect**：产出 persona 层、追问 agent、上下文和质量门架构方案。
3. **Engineer**：在 spec / architecture 批准后实现最小闭环。
4. **Test / QA**：建立 persona 越界、追问边界和真实模型回归用例。

### 5.2 Product Spec Lead 需要产出什么

产物：

- `曼曼 avatar 报告陪读与追问产品规格 v0.1`

最少包含：

1. 曼曼定位定义。
2. 曼曼允许说什么 / 禁止说什么。
3. Lite / Pro 报告页文案规范。
4. 追问入口、空态、建议问题、输入提示、边界提示。
5. 追问支持的问题类型和拒答 / 拉回策略。
6. 不同风险输入的产品行为。
7. 首版不做范围。

验收标准：

- 下游 engineer 能明确哪些文案要改。
- 下游 architect 能明确 persona 和安全边界如何拆分。
- 文案中不出现“曼曼是你的疗愈师 / 心理咨询师 / 会治愈你”等表达。
- 追问场景明确绑定本次报告，不暗示长期记忆。

### 5.3 Architect 需要产出什么

产物：

- `曼曼 persona 与 ReportFollowupAgent 技术方案 v0.1`

最少包含：

1. `persona_id / persona_version / persona_scope` 元数据设计。
2. PersonaPromptPack 或等价 persona segment 的加载方式。
3. 报告生成链路中 persona 的位置。
4. Vision Pass 不受 persona 影响的约束。
5. ReportFollowupAgent 的输入 / 输出 / 安全检查 / 质量门。
6. ReportFollowupContext 数据结构。
7. 追问会话保存策略和删除策略。
8. persona 越界 quality gate 规则。

验收标准：

- Persona 只管表达，不管事实观察、知识推导和安全边界。
- 追问不复用报告生成 agent 做自由聊天。
- 每轮追问可追溯到 report_id 和引用报告片段。
- 越界问题能温和拉回本次报告或触发安全回应。

### 5.4 Engineer 需要产出什么

产物：

- 曼曼报告陪读最小实现。
- ReportFollowupAgent 最小闭环实现。
- 对应单元测试、真实模型 smoke 或 golden cases。

建议分阶段实现：

#### Phase 1：曼曼报告陪读层

- 统一报告页曼曼文案。
- 在报告输出 prompt 中加入轻量曼曼 narration 规则。
- 报告 artifact 增加 persona metadata。
- 质量门增加 persona 越界检查。
- 跑真实模型回归，确认报告结构、画面依据和安全边界不下降。

#### Phase 2：报告追问最小闭环

- 新增 `ReportFollowupAgent`。
- 新增 followup API。
- 新增 `ReportFollowupContext`。
- 前端启用“问曼曼”入口。
- 每轮追问做 safety pre-check 和 post-check。
- 越界问题拉回报告或触发安全回应。

#### Phase 3：可选增强

仅在 Phase 1 / 2 稳定后再考虑：

- 多报告对比。
- 用户授权后的长期观察。
- 人工疗愈师转接。
- 主题方案 / 21 天计划。

## 6. 推荐架构原则

### 6.1 责任分层

```text
报告生成：
图片 + 三圈 + 用户输入
  -> Vision Pass：事实观察 visual_draft，无 persona
  -> Topic Reasoning Pass：议题报告生成
  -> Persona Narration Layer：曼曼口吻，只管表达
  -> Safety / Quality Gate：系统级拦截
  -> Report Artifact：带 persona metadata

报告追问：
report_id + followup_question
  -> Load ReportFollowupContext
  -> Safety Pre-check
  -> Report Followup Agent：只解释本次报告
  -> Safety / Quality Post-check
  -> Answer + cited sections + risk metadata
```

### 6.2 核心原则

- Persona 管表达。
- Prompt pack 管知识和报告组织。
- Safety 管不可越界。
- Quality gate 管可拦截。
- Memory / context 管本次报告上下文，不管长期人格关系。
- Vision Pass 只做事实观察，不进入曼曼口吻。

## 7. 范围约束

### 7.1 本轮允许变化

- 报告页和追问入口的曼曼文案。
- Lite / Pro 输出 prompt 中的轻量 persona narration 规则。
- 报告 artifact 中新增 persona metadata。
- 新增 persona 越界质量门。
- 新增 ReportFollowupAgent 和 report-bound followup API。
- 新增追问上下文摘要结构。
- 新增追问边界提示和建议问题。

### 7.2 本轮禁止改写

- 不把曼曼定义成真实疗愈师、心理咨询师、医疗服务提供者或财务顾问。
- 不把报告改成心理诊断、治疗方案或确定性人生判断。
- 不让曼曼进入 Vision Pass 的事实观察。
- 不为追问默认建立跨报告长期记忆。
- 不做心理咨询式深度会谈。
- 不做完整 21 天疗愈计划自动生成。
- 不让追问替用户做财务、职业、关系、医疗等重大现实决策。
- 不把用户每次追问沉淀成永久人格画像。
- 不让 persona 覆盖系统级 safety 和 quality gate。

## 8. 追问功能边界

### 8.1 允许的问题类型

- “这段报告是什么意思？”
- “为什么这里说我会先确认安全？”
- “外圈留白和我的财富关系有什么关系？”
- “这条 7 天练习我应该从哪里开始？”
- “报告里最重要的一句话是什么？”
- “这个颜色 / 形状在报告里是怎么被理解的？”

### 8.2 应温和拉回的问题类型

- 与本次报告无关的开放式百科问答。
- 要求曼曼预测未来结果。
- 要求曼曼替用户做财务、职业、关系决定。
- 要求曼曼跨多次作品总结长期人格。
- 要求曼曼进行心理诊断或病名判断。

### 8.3 应触发安全回应的问题类型

- 自伤、自杀、伤害他人或被伤害风险。
- 严重危机、现实安全威胁。
- 明确医疗或精神健康诊断请求。
- 要求停止现实支持、只依赖曼曼。

## 9. 质量门新增建议

### 9.1 Persona 身份越界 forbidden examples

应拦截：

- “我是你的疗愈师”
- “我是你的心理咨询师”
- “我会一直陪着你”
- “我比你更了解你”
- “你只要相信曼曼”
- “只有曼曼懂你”
- “你离不开我”
- “不要告诉别人，只和我说”

允许：

- “我是曼曼，会陪你看这份报告里的线索。”
- “我们先回到本次画作和报告内容。”
- “这份解读只能作为自我观察。”

### 9.2 治疗承诺 forbidden examples

应拦截：

- “我会治愈你”
- “保证改善”
- “根治”
- “疗愈成功”
- “这个练习会让你彻底好起来”

### 9.3 诊断 forbidden examples

应拦截：

- “你有创伤”
- “你是焦虑症 / 抑郁症 / 人格障碍”
- “这是你的病”
- “这说明你心理有问题”
- “你患有……”

### 9.4 依赖诱导 forbidden examples

应拦截：

- “以后任何事都来问曼曼”
- “只需要问我就好”
- “我会一直记得你的故事”
- “不用找别人”
- “不要告诉你的朋友 / 家人 / 专业人士”

## 10. ReportFollowupContext 建议字段

第一阶段建议保存本次报告级上下文，不做长期人格记忆。

可保存：

```text
report_id
report_mode
theme
theme_label
agent_version
prompt_pack_id
persona_id
persona_version
created_at
painting_intention
painting_feeling
visual_evidence_summary
uncertainty_summary
interpretation_summary
main_axis
key_tensions
suggested_small_steps
report_sections
conversation_constraints
allowed_question_types
disallowed_question_types
risk_policy_version
disclaimer_variant
recent_followup_turns
risk_level
safety_action
referenced_report_sections
out_of_scope
```

不保存：

```text
长期人格画像
心理病史推断
跨报告总结
“用户依赖曼曼”的关系状态
模型对用户的永久标签
未确认的敏感推断
完整 chain-of-thought
未经摘要和脱敏的完整 visual_draft
```

## 11. 未解决问题

1. 曼曼 persona spec 应单独放在 specs、architecture，还是应用适配文档中，需要下一阶段确定唯一权威位置。
2. 报告正文中“我 / 曼曼”的出现频率尚未定稿，需要真实模型样例对比。
3. 是否 Lite 和 Pro 都显式使用曼曼，还是 Lite 页面层使用、Pro 正文更明显使用，需要产品样例验证。
4. 追问功能是否仅 Pro 开放，还是 Lite 也允许有限追问，需要结合付费策略确认。
5. 追问上下文保存位置和生命周期尚未定稿。
6. persona 越界质量门第一版使用字符串规则还是 LLM evaluator，需要 Architect / Engineer 评估。
7. 现有报告页是否继续默认展示 visual_draft、prompt_pack_manifest、quality_gate、run_summary 等 debug 内容，需要单独收口。

## 12. 下一步建议

建议立即进入两个并行小任务：

1. Product Spec Lead：基于本文产出 `曼曼 avatar 报告陪读与追问产品规格 v0.1`。
2. Architect：基于本文产出 `曼曼 persona 与 ReportFollowupAgent 技术方案 v0.1`。

在这两个 artifact 审核前，不建议直接进入完整追问实现。

如果需要先做最小改动，可以只做文案替换：

- 将 “一镜一梳 · 曼曼陪你慢一点看见这幅画” 改为：
  - “一镜一梳 · 曼曼陪你一起读懂这幅画”

该文案替换属于安全的局部 UI copy 修正，不等同于完整 persona 架构落地。
