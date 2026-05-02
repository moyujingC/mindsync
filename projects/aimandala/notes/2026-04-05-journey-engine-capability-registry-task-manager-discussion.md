# 一镜一梳内核三件套草案

> 状态：draft
> 版本：0.1.0
> owner：Architect
> last_updated：2026-04-05
> source_of_truth：projects/aimandala/notes/2026-04-05-journey-engine-capability-registry-task-manager-discussion.md
> 项目：aimandala
> 阶段：discussion
> depends_on：projects/aimandala/notes/2026-04-05-platform-architecture-blueprint-discussion.md
> reviewers：CEO / Orchestrator, Product Spec Lead, Engineer

## 1. 目标

这份讨论稿尝试把平台内核收束成三个最小核心对象：

1. `JourneyEngine`
2. `CapabilityRegistry`
3. `TaskManager`

它们的目的不是把 `一镜一梳` 做成一个复杂框架，而是避免继续把平台能力写散在页面和渠道层里。

## 2. 先说结论

当前建议只建设一个**最小可用内核**：

- `JourneyEngine`
  - 负责“用户现在处于哪一段旅程”和“下一步推荐什么”
- `CapabilityRegistry`
  - 负责“平台当前有哪些能力域”以及“每个能力域在什么条件下可进入”
- `TaskManager`
  - 负责“哪些动作是异步任务，它们的状态如何追踪”

除此之外，当前不建议再引入更多基础设施层。

## 3. 反过度工程化约束

这一轮明确不做：

1. 不做通用插件平台
2. 不做能力 marketplace
3. 不做事件总线大一统框架
4. 不做可配置 DSL 旅程编辑器
5. 不做多端统一 UI 抽象层
6. 不为未来 10 个能力预埋过多空接口
7. 不把所有对象提前实体化进数据库

这一轮只做：

1. 为当前 `Interpretation MVP` 找到一个稳定的平台骨架
2. 承接当前 `Pro` 报告内 AI 问答，并为第二阶段 `Conversation` 留出明确接缝
3. 让未来 `Planning / Drawing` 能接进来而不用推翻现有结构

## 4. 三件套为什么足够

如果平台还在早期，真正需要稳定的不是“很多模块”，而是三个问题：

1. 用户当前在旅程的哪个阶段
2. 当前可以进入哪些能力
3. 当前哪些操作是异步长任务

这三个问题分别由：

- `JourneyEngine`
- `CapabilityRegistry`
- `TaskManager`

来回答，就已经足够把平台和页面分开。

## 5. JourneyEngine

### 5.1 职责

`JourneyEngine` 只负责三件事：

1. 根据当前用户状态判断旅程阶段
2. 给出下一步推荐动作
3. 在能力域之间做最小跳转决策

### 5.2 它不负责什么

`JourneyEngine` 不负责：

1. 渲染页面
2. 调用具体 API
3. 生成报告内容
4. 执行对话或计划本身
5. 处理复杂工作流编排

### 5.3 最小输入

建议最小输入只有：

- `userProfileSummary`
- `latestWorkSummary`
- `latestInterpretationSummary`
- `latestReportConversationSummary`
- `latestPlanSummary`
- `currentEntry`

这些都可以是轻量摘要，而不是完整对象。

### 5.4 最小输出

建议最小输出只有：

- `journeyStage`
- `recommendedNextAction`
- `recommendedCapability`
- `contextHints`

### 5.5 当前最小阶段模型

当前先不要做太细，建议先保留 5 个：

1. `exploration`
2. `creation`
3. `interpretation`
4. `reflection`
5. `practice`

这已经够覆盖当前 MVP 和后续两阶段扩展。

### 5.6 当前最小接口示意

```ts
export type JourneyStage =
  | "exploration"
  | "creation"
  | "interpretation"
  | "reflection"
  | "practice";

export type JourneyRecommendation = {
  stage: JourneyStage;
  nextAction:
    | "start_interpretation"
    | "continue_interpretation"
    | "open_report_chat"
    | "open_conversation"
    | "start_plan"
    | "resume_practice";
  capability: "interpretation" | "conversation" | "planning";
  hints: string[];
};

export interface JourneyEngine {
  evaluate(input: JourneySnapshot): JourneyRecommendation;
}
```

## 6. CapabilityRegistry

### 6.1 职责

`CapabilityRegistry` 负责：

1. 定义平台当前有哪些能力域
2. 为每个能力域声明进入条件
3. 为渠道层提供“当前可以展示哪些入口”的依据

### 6.2 它不负责什么

它不负责：

1. 执行能力本身
2. 承担 UI 菜单逻辑
3. 承担权限系统全量设计
4. 做动态插件发现

### 6.3 当前建议只注册 4 个能力

当前只需要：

1. `interpretation`
2. `conversation`
3. `planning`
4. `drawing`

其中只有 `interpretation` 先正式启用；当前 `Pro` 报告内 AI 问答先视为 `interpretation` 的内置子能力，而不是独立 capability。

### 6.4 最小能力定义

每个能力当前只需要这些字段：

- `id`
- `status`
- `entryPolicy`
- `channelAvailability`
- `requires`

### 6.5 最小接口示意

```ts
export type CapabilityId =
  | "interpretation"
  | "conversation"
  | "planning"
  | "drawing";

export type CapabilityStatus = "enabled" | "hidden" | "planned";

export type CapabilityDefinition = {
  id: CapabilityId;
  status: CapabilityStatus;
  requires?: CapabilityId[];
  availableChannels: Array<"mobile-web" | "miniapp" | "native-app">;
  canEnter(snapshot: JourneySnapshot): boolean;
};

export interface CapabilityRegistry {
  list(): CapabilityDefinition[];
  get(id: CapabilityId): CapabilityDefinition | undefined;
  getAvailable(snapshot: JourneySnapshot): CapabilityDefinition[];
}
```

### 6.6 为什么现在不要做成插件系统

因为当前真正的问题不是“能力会不会太多”，而是“平台语义还没定清”。

如果现在就上插件系统，会带来三层额外复杂度：

1. 生命周期管理
2. 版本兼容
3. 安全与配置治理

这些都不是当前 `aimandala` 最紧迫的问题。

## 7. TaskManager

### 7.1 职责

`TaskManager` 只负责：

1. 注册异步任务
2. 跟踪任务状态
3. 让不同渠道读取统一任务进展

### 7.2 它不负责什么

它不负责：

1. 完整队列系统
2. 分布式调度
3. worker 编排平台
4. 替代后端业务服务

### 7.3 为什么当前需要它

因为 `aimandala` 已经天然存在多种长任务：

1. Lite 生成
2. Pro 生成
3. Pro 报告问答上下文准备
4. 未来计划生成
5. 未来报告总结或回访任务

如果继续把这些都做成页面局部 loading 状态，平台层永远长不出来。

### 7.4 当前最小任务类型

现在建议只保留：

- `detect`
- `generate_lite`
- `generate_pro`
- `prepare_report_chat`
- `generate_plan`

### 7.5 最小接口示意

```ts
export type JourneyTaskType =
  | "detect"
  | "generate_lite"
  | "generate_pro"
  | "generate_plan";

export type JourneyTaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export type JourneyTask = {
  id: string;
  type: JourneyTaskType;
  status: JourneyTaskStatus;
  interpretationId?: string;
  workId?: string;
  startedAt: string;
  finishedAt?: string;
  errorMessage?: string;
};

export interface TaskManager {
  create(task: Omit<JourneyTask, "id">): JourneyTask;
  update(id: string, patch: Partial<JourneyTask>): JourneyTask | null;
  get(id: string): JourneyTask | null;
  listByInterpretation(interpretationId: string): JourneyTask[];
}
```

## 8. 三件套之间如何协作

建议关系非常简单：

1. `CapabilityRegistry`
   - 先告诉平台“现在有哪些能力可进入”
2. `JourneyEngine`
   - 根据当前快照判断“推荐进入哪个能力”
3. `TaskManager`
   - 跟踪进入能力后的异步执行过程

关系图：

```text
JourneySnapshot
  -> CapabilityRegistry.getAvailable()
  -> JourneyEngine.evaluate()
  -> UI / API choose next action
  -> TaskManager tracks async execution
```

## 9. 当前对前端的直接启示

如果采用这三件套，前端可以这样收口：

### 9.1 shared/domain

放：

- `JourneySnapshot`
- `JourneyRecommendation`
- `CapabilityDefinition`
- `JourneyTask`

### 9.2 shared/application

放：

- `JourneyEngine`
- `CapabilityRegistry`
- `TaskManager`
- `Interpretation entry use case`

### 9.3 渠道层

只负责：

- 页面展示
- 把页面动作映射到 use case
- 读取 recommendation / available capabilities / task status

## 10. 当前对后端的直接启示

后端当前不需要一次性改成大平台，但可以开始先对齐这三件套语义：

1. `interpretation` 仍然是当前第一能力域
2. `detect / create / upgrade / report / report-chat` 应逐步挂到 `Interpretation capability` 语义下
3. 未来 `conversation / planning` 接入时，优先复用 `JourneySnapshot` 与 `JourneyTask` 语义

## 11. 当前最小落地顺序

建议顺序如下：

1. 先定义 `JourneySnapshot` 与 `CapabilityDefinition` 类型
2. 再实现最小 `CapabilityRegistry`
3. 再实现最小 `JourneyEngine`
4. 最后把当前 `loading / report` 路径抽成 `JourneyTask` 语义

不要反过来先做一整套通用基础设施。

## 12. 什么时候再加复杂度

只有当下面情况真的出现时，才建议继续加层：

1. `Conversation` 正式上线并需要独立编排
2. `Planning` 进入正式主线并需要更多任务类型
3. 多渠道都开始依赖同一套 journey recommendation
4. 后端异步任务数量明显增长，当前轻量 TaskManager 不够用

在这之前，三件套就保持最小版本。

## 13. 当前建议

当前最适合 `aimandala` 的不是“大平台框架”，而是：

- 一个足够小但足够稳的平台骨架
- 让 `Interpretation MVP` 不再绑死整个产品
- 让 `Pro` 报告内 AI 问答先可用
- 为 `Conversation` 留出干净接缝

所以这三件套的设计目标应该始终是：

**刚好够用，而不是一步到位。**
