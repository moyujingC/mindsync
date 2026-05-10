# 从 Workflow 到 Agent 架构

## 定义

这页记录一镜一梳从“传统程序里嵌入大模型调用”走向 Agent 架构时的判断框架。

这里的核心问题不是“要不要显得更像智能体”，而是：当一个 AI 应用开始出现上下文丢失、来源串联、阶段顺序混乱、输出质量不稳定时，应该继续修 prompt，还是应该调整程序架构。

## 背景

一镜一梳最初不是从 Agent 出发，而是先有传统程序 workflow：

- 用户上传并校准曼陀罗画作
- 程序确定三圈边界
- 大模型观察画面
- 知识库做颜色、形状、三圈、五行、主题映射
- 大模型整合 Lite / Pro 解读报告

这种设计在早期是合理的。它把不确定性控制在少数大模型调用点，其他部分仍由确定性程序负责。

问题在于，当报告生成逐渐变成一个多阶段认知任务后，单纯把某几个函数替换成 LLM call（大模型调用）会开始暴露结构问题：

- prompt 越来越长，但上下文仍然容易丢
- stage 顺序在文档里很清楚，运行时却不一定被严格执行
- 知识库来源、视觉证据和最终文案之间容易脱节
- debug、review、中间交付物和用户报告混在一起
- 每次修文案都像在修局部症状，而不是修整体生成机制

这时要问的不是“要不要用 Agent”，而是“当前任务是否已经需要一个显式的状态、工具、trace 和质检边界”。

## 三种架构

### 1. Workflow + LLM Call

这是最小形态。程序仍然是主控，大模型只是某些步骤里的工具。

适合：

- 步骤固定
- 输入输出简单
- LLM 只做局部转换
- 失败后可以直接重试或回退

优点：

- 成本低
- 延迟可控
- 工程实现简单
- 调试路径短

风险：

- 如果任务本身需要跨阶段理解，LLM call 之间容易丢上下文
- 如果知识来源复杂，prompt 很容易变成临时拼接
- 如果最终质量依赖多步一致性，单点 prompt 优化收益会下降

一镜一梳早期可以采用这种结构，但当三圈五行解读流程被明确为 stage 00-16 后，单纯 LLM call 已经不足以承载完整报告生成。

### 2. Single Agent

Single Agent（单智能体）不是“一个更大的 prompt”，而是把一个清楚任务封装成有目标、工具、状态、trace、eval 和 guardrails 的执行主体。

适合：

- 有一个明确的主任务
- 需要跨多个步骤保持上下文
- 需要记录中间产物和引用来源
- 需要失败重试、降级和质检
- 还没有充分理由拆成多个 Agent

优点：

- 比散落的 LLM call 更容易保证阶段顺序
- 比多 Agent 更容易定位责任
- trace（追踪记录）可以围绕一个任务闭环
- eval（评测）可以先围绕一个主链路建立

风险：

- 如果边界没有收窄，单 Agent 会变成“什么都管”的大黑箱
- 如果工具过多，Agent 会在工具选择上产生漂移
- 如果没有固定状态机，仍然会退化成一个大 prompt

对一镜一梳来说，第一版最适合落的是 `MandalaReportAgent`。它的目标不是完成全部洞察体验，而是稳定生成 Lite / Pro 报告。

### 3. Multi Agent

Multi Agent（多智能体）是把系统拆成多个有不同职责、工具、模型能力或权限的 Agent。

适合：

- 不同任务确实需要不同能力
- 某些步骤可以并行
- 不同 Agent 的输出可以清楚交接
- 失败责任可以被明确归属
- 整体 eval 能覆盖 handoff 质量

优点：

- 职责边界更清楚
- 可以为不同任务选择不同模型
- 可以隔离风险能力
- 长期更容易扩展复杂体验

风险：

- handoff（交接）成本变高
- 延迟和 token 成本上升
- 多个 Agent 的判断可能互相冲突
- debug 复杂度明显增加
- 如果过早拆分，会把原本不清楚的问题扩散到多个模块

对一镜一梳来说，多 Agent 不应该是第一步。只有当 `MandalaReportAgent` 的输入、输出、trace 和 eval 稳定后，才适合继续拆出 `MandalaInterpreterAgent`、`VisionAgent` 或更上层的 `InsightAgent`。

## 一镜一梳的长期架构

长期看，`InsightAgent` 更适合作为洞察体验总控，而不是当前报告生成类的名字。

推荐层级是：

```text
Insight Domain
= 一镜一梳的洞察解读业务域

InsightAgent
= 洞察体验总控，负责状态、路由、追问、解释、练习和安全边界编排

MandalaReportAgent
= 报告生成 Agent，负责按三圈五行 stage package 生成 Lite / Pro 报告

MandalaInterpreterAgent
= 报告解释 Agent，负责解释已有报告、回答追问、回指证据链

VisionAgent
= 视觉观察 Agent，负责画作观察、三圈视觉证据和直断命中检查

PracticePlanner
= 后续行动建议和练习计划模块，不一定第一版就是 Agent
```

在这个结构里，`InsightAgent` 不应该直接产生核心解读结论。它调度产生结论的专业模块，并负责用户体验连续性。

## 当前整改路线

### 阶段 0：保留 Workflow，但补齐 Stage Package

目标是让三圈五行流程的每一步都有明确输入、输出和引用来源。

关键产物：

- stage 00-16 的中间交付物
- 知识库引用 refs
- 视觉证据 JSON
- Lite / Pro 报告合同
- trace 记录

这一阶段仍然可以由传统程序主控，但不能再把 prompt 当成唯一流程载体。

### 阶段 1：落 `MandalaReportAgent`

目标是把报告生成主链路收束成单 Agent。

它应该负责：

- 读取 stage package
- 检查必要输入是否齐全
- 调用报告生成工具
- 生成 Lite / Pro 草稿
- 做报告字段、引用、风险和可读性质检
- 输出最终报告和 trace

它不应该负责：

- 重新识别图片
- 临时发明知识库内容
- 自由回答用户追问
- 生成长期练习计划
- 替代 `InsightAgent` 做全体验总控

这是当前最合适的架构整改起点。

### 阶段 2：落 `MandalaInterpreterAgent`

当报告生成稳定后，再做报告解释 Agent。

它应该只解释已有报告和证据链：

- 帮用户理解某段报告
- 回指对应 stage refs
- 解释不确定性
- 在风险问题上拒绝或降级

它不应该重新生成报告，也不应该重算三圈。

### 阶段 3：落 `InsightAgent`

当报告生成、报告解释、用户追问和练习建议都开始存在时，再做总控 Agent。

`InsightAgent` 负责：

- 判断用户当前所处阶段
- 选择调用哪个能力
- 判断是否需要追问确认
- 组织用户可见体验
- 处理失败、重试、降级和安全边界

这时 `InsightAgent` 才有足够存在价值。它不是“更大的报告 Agent”，而是用户洞察体验的编排层。

## 单 Agent 与多 Agent 的决策标准

不要用“系统复杂不复杂”来决定是否多 Agent。应该问：

- 是否存在不同目标？
- 是否需要不同工具权限？
- 是否需要不同模型能力？
- 是否能并行而不互相依赖？
- handoff 格式是否稳定？
- 谁负责最终判断？
- 失败时谁负责降级？
- eval 是否能覆盖整体链路？

如果这些问题答不清，应先做单 Agent。

## 命名结论

当前报告生成层不应命名为 `InsightAgent`。

更合理的命名是：

```text
MandalaReportAgent
```

原因是当前第一阶段要解决的是报告生成质量，而不是完整洞察体验总控。

`InsightAgent` 应保留给未来更高层：

```text
InsightAgent = 洞察体验总控
MandalaReportAgent = 报告生成执行者
MandalaInterpreterAgent = 报告解释执行者
```

这样做可以避免当前执行类占用未来总控层命名，也能让后续多 Agent 演进更自然。

## 对一镜一梳的判断

一镜一梳现在的问题不是“缺一个会聊天的 Agent”，而是“报告生成 workflow 缺一个受控执行边界”。

因此当前最优路径是：

```text
Workflow + LLM Call
-> Stage Package + Trace
-> MandalaReportAgent
-> MandalaInterpreterAgent
-> InsightAgent
-> 必要时再多 Agent 化
```

这条路线的好处是：先稳定最关键的付费报告质量，再扩展解释、追问、练习和长期陪伴体验。

## 相关页面

- [[./aimandala-agent-mapping]]
- [[./mandala-report-agent-path]]
- [[./mandala-interpreter-agent-design]]
- [[../dev/single-agent-design]]
- [[../dev/multi-agent-design]]
- [[../dev/agent-loop]]
- [[../dev/state-machine]]
- [[../dev/tracing]]
- [[../dev/evals]]
- [[../dev/guardrails]]

