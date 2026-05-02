# 一镜一梳平台架构总图草案

> 状态：draft
> 版本：0.1.0
> owner：Architect
> last_updated：2026-04-05
> source_of_truth：projects/aimandala/notes/2026-04-05-platform-architecture-blueprint-discussion.md
> 项目：aimandala
> 阶段：discussion
> depends_on：projects/aimandala/notes/2026-04-05-platform-positioning-and-boundaries-discussion.md
> reviewers：CEO / Orchestrator, Product Spec Lead, Engineer

## 1. 文档目标

这份草案回答一个核心问题：

如果 `一镜一梳` 被重新定义为“曼陀罗疗愈平台”，那么它的技术与产品结构应该如何分层，才能既承接当前 To C MVP，又不给未来能力扩展设死边界。

## 2. 总体分层

建议平台总图按四层理解：

1. 平台层
2. 旅程层
3. 能力层
4. 渠道层

四层关系如下：

```text
平台层
  定义产品对象、角色、长期目标和商业边界

旅程层
  组织用户从探索 -> 解读 -> 对话 -> 计划 -> 成长的连续体验

能力层
  以独立能力域承接具体业务功能和后端编排

渠道层
  以 web / miniapp / native 等不同终端承接呈现与平台适配
```

## 3. 平台层

平台层负责定义不会随着某个页面改版而轻易变化的上位结构。

平台层至少包括：

1. 核心对象模型
   - `User`
   - `MandalaWork`
   - `Interpretation`
   - `Conversation`
   - `HealingPlan`
   - `HealingJourney`
2. 用户角色
   - To C 用户
   - 疗愈师 / 陪伴者（未来）
   - 内部运营或研究角色（未来）
3. 服务边界
   - 当前正式能力
   - 实验能力
   - To B / Studio 边界
4. 商业边界
   - 单次购买
   - 升级购买
   - 订阅或长期陪伴服务（未来）

平台层不应由某个前端页面持有；它应在文档、共享类型和后端领域模型中显式存在。

## 4. 旅程层

旅程层是平台的真正骨架。

它回答的不是“当前在哪一页”，而是：

- 用户现在处于哪个阶段
- 平台推荐什么下一步
- 不同能力之间如何串联

建议先抽象出下面这些旅程阶段：

1. `exploration`
   - 初次进入平台，尚未开始本次体验
2. `creation`
   - 处于绘画、上传、准备表达阶段
3. `interpretation`
   - 已进入作品解读过程
4. `reflection`
   - 已获得报告并进行理解、追问与沉淀
5. `practice`
   - 已进入练习、计划与持续调整
6. `review`
   - 回顾阶段，总结变化并决定下一轮旅程

当前 To C MVP 实际只覆盖了 `creation -> interpretation -> reflection` 的一小段。

## 5. 能力层

能力层建议按独立能力域拆分，而不是按“几个页面”拆分。

### 5.1 Interpretation Domain

职责：

- 上传与作品接入
- 图像分析与三圈检测
- Lite / Pro 报告生成
- 报告读取与版本管理
- Pro 报告内 AI 问答
- 历史记录查看

后端落点建议：

- `capabilities/interpretation/`

前端共享落点建议：

- `shared/domain/interpretation/`
- `shared/application/interpretation/`

### 5.2 Healing Conversation Domain

职责：

- 报告追问
- 情绪陪伴
- 知识检索与解释
- 风险判断与安全提示

后端落点建议：

- `capabilities/conversation/`

这部分与旧仓库里的 `HealingAgent` 最接近。

### 5.3 Drawing Guidance Domain

职责：

- 陪你画
- 过程提示
- 视觉反馈
- 创作过程记录

后端落点建议：

- `capabilities/drawing/`

### 5.4 Healing Planning Domain

职责：

- 个性化计划生成
- 多日练习安排
- 进度记录
- 计划复盘

后端落点建议：

- `capabilities/planning/`

### 5.5 Journey Orchestration Domain

职责：

- 连接能力域
- 计算下一步推荐
- 形成统一旅程入口
- 管理旅程状态和跨能力跳转

后端落点建议：

- `orchestration/journey/`

## 6. 多智能体应落在哪一层

多智能体不应该直接附着在页面层，也不应该成为前端状态流的核心。

建议多智能体定位为：

- 能力层与旅程层中的后端编排能力

建议对应关系如下：

1. `VisionAgent`
   - 落在 `Interpretation Domain`
   - 负责图像分析、结构提取、视觉相关判断
2. `InsightAgent`
   - 落在 `Interpretation Domain`
   - 负责解读内容组织、报告生成与报告问答上下文组织
3. `HealingAgent`
   - 落在 `Healing Conversation Domain`
   - 负责长期对话与情绪支持
4. `PlanningAgent`
   - 落在 `Healing Planning Domain`
   - 负责练习计划生成与调整
5. `JourneyOrchestrator`
   - 落在 `Journey Orchestration Domain`
   - 负责跨能力协作与推荐路径

这样做的好处：

- 智能体成为能力底座，而不是某个 UI 的实现细节
- 可以在不改页面总结构的前提下扩展平台能力
- 不会把“当前上传主路径”硬编码成未来所有能力的入口

## 7. 前端架构建议

前端仍然保持“共享内核 + 渠道实现”，但共享内核需要重新升级语义。

建议前端按三层组织：

### 7.1 `shared/domain`

只放平台稳定对象与纯业务规则：

- 核心实体类型
- 旅程状态模型
- 能力状态模型
- 业务约束与纯函数

### 7.2 `shared/application`

只放用例和编排：

- interpretation use cases
- conversation use cases
- planning use cases
- journey coordinators
- API orchestration

### 7.3 `shared/infrastructure`

只放实现适配：

- API clients
- DTO mappers
- storage adapters
- analytics adapters

### 7.4 `mobile-web / miniapp / native-app`

每个渠道只负责：

- 页面布局
- 路由
- 展示组件
- 平台能力适配
- 上传、支付、分享、登录等平台 API

禁止渠道层承担：

- 平台对象定义
- 旅程规则定义
- 能力域之间的主编排逻辑

## 8. 当前代码结构的主要问题

如果按新总图反看当前实现，问题主要不在“页面不好看”，而在：

1. 渠道层承担了过多产品流程判断
2. `mobile-web` 对当前主路径理解过深
3. `shared` 更像 API/类型辅助，而不是平台共享内核
4. 旅程对象尚未显式存在
5. 能力域边界尚未形成

这意味着后续如果继续只在 `mobile-web` 里修页面，会越来越难承接平台化。

## 9. 推荐目录方向

建议未来目录按下面语义演进：

```text
projects/aimandala/toC/
  app/
    backend/
      capabilities/
        interpretation/
        conversation/
        drawing/
        planning/
      orchestration/
        journey/
      platform/
        safety/
        identity/
        billing/
    frontend/
      shared/
        domain/
        application/
        infrastructure/
      mobile-web/
      miniapp/
      native-app/
```

当前不要求一次迁完，但后续任何较大改动都应朝这个结构收束，而不是继续在 `mobile-web` 内增加平台语义。

## 10. 架构阶段门建议

如果接受这套平台架构方向，后续建议按下面顺序推进：

1. 先确认平台对象与能力域
2. 再确认前端共享层重构口径
3. 再确认后端能力域与智能体落点
4. 最后才决定页面信息架构与 UI 还原策略

这样可以避免 UI 设计反过来定义平台。

## 11. 当前建议

当前最稳妥的做法不是继续“边改页面边想平台”，而是：

1. 先把当前 To C MVP 明确标注为 `Interpretation MVP`，并把 `Pro 报告内 AI 问答` 视为其内置能力
2. 先在共享层显式引入 `Journey` 与 `Capability` 语义
3. 后续页面改版只视为渠道层工作，不再当作平台重定义

## 12. 这份草案不拍板什么

这份文档不拍板：

- 多智能体具体采用哪种 runtime
- 前端是否采用某个特定框架状态库
- 当前目录是否立即重命名
- 哪一阶段上线 `Conversation` 或 `Planning`

它只负责先把平台层级、能力边界和多智能体落点定清楚。
