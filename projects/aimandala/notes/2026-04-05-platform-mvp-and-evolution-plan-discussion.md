# 一镜一梳 MVP 与长期演进草案

> 状态：draft
> 版本：0.1.0
> owner：Product Spec Lead
> last_updated：2026-04-05
> source_of_truth：projects/aimandala/notes/2026-04-05-platform-mvp-and-evolution-plan-discussion.md
> 项目：aimandala
> 阶段：discussion
> depends_on：projects/aimandala/notes/2026-04-05-platform-positioning-and-boundaries-discussion.md, projects/aimandala/notes/2026-04-05-platform-architecture-blueprint-discussion.md
> reviewers：CEO / Orchestrator, Architect, Engineer, Test / QA

## 1. 文档目标

这份草案回答两个问题：

1. 如果平台愿景成立，当前 MVP 还应该做什么、不应该做什么
2. 平台应按什么顺序逐步长出来，而不是一次性做成大而全

## 2. 核心原则

重新设计后，默认遵守四条原则：

1. 先做平台骨架，再做渠道页面
2. 先做能力边界，再做功能堆叠
3. 先把当前 MVP 说清楚，再谈长期平台愿景
4. 任何当前默认流程都不应被误写成永久产品真理

## 3. 当前重新定义后的 MVP

当前建议把 MVP 重新命名为：

**Interpretation MVP**

它的意义不是“整个平台上线”，而是：

- 平台中的 `Interpretation` 能力域先正式上线
- 当前 `Pro` 报告内 AI 问答随之上线
- 为后续独立 `Conversation / Drawing / Planning` 预留能力边界

## 4. 当前 MVP 必须保留的内容

当前 MVP 仍应保留：

1. 作品上传
2. 三圈检测与确认
3. Lite 报告生成
4. Pro 报告升级或进入
5. Pro 报告内 AI 问答
6. 报告查看
7. 历史记录

这些能力构成当前最小可变现主线，也是当前最成熟的产品资产。

## 5. 当前 MVP 不应继续扩张的方向

在平台骨架没有重立之前，当前 MVP 不建议继续扩张：

1. 不继续在 `mobile-web` 页面层堆更多平台逻辑
2. 不把未来疗愈计划先做成报告页下的附属模块
3. 不把 `Pro` 报告内 AI 问答直接膨胀成完整独立陪伴平台
4. 不把“陪你画”直接塞成上传页增强版
5. 不让页面信息架构替代平台能力设计

## 6. 重新设计后的阶段规划

建议按四个阶段推进，而不是继续只围绕当前上传主路径打磨。

### 阶段 A：平台骨架确认

目标：

- 平台定义清晰
- 能力域边界清晰
- 共享内核方向清晰

交付物：

1. 平台定位文档
2. 平台架构文档
3. 能力域对象草图
4. 前端共享层重构口径

当前这三份草案属于这个阶段的起点。

### 阶段 B：Interpretation MVP 收口

目标：

- 当前解读主线路径稳定上线
- `Pro` 报告内 AI 问答可用且边界清晰
- UI 可以还原，但不继续污染平台层
- `mobile-web` 只做渠道皮肤

建议交付物：

1. Interpretation 领域模型草案
2. Pro 报告问答上下文模型草案
3. Journey 最小对象草案
4. shared/domain 与 shared/application 的最小重构
5. 渠道层页面收口方案

### 阶段 C：Conversation 能力引入

目标：

- 把当前 `Pro` 报告内 AI 问答从“报告附属能力”长成更独立的 `Conversation` 能力
- 报告不再是唯一对话入口
- 用户可围绕报告继续提问和被陪伴

建议交付物：

1. Conversation 能力 spec
2. HealingAgent 接入边界
3. 报告页与对话页关系设计
4. 安全与风险协议接入点

### 阶段 D：Planning / Drawing / Journey 扩展

目标：

- 从“看报告”走向“持续练习”
- 从“上传成品”走向“陪伴创作”

建议交付物：

1. Drawing Guidance spec
2. Healing Planning spec
3. Journey 首页信息架构
4. JourneyOrchestrator 原型方案

## 7. 当前与长期能力的矩阵

### 7.1 当前正式能力

1. Interpretation
   - 当前正式能力域
   - 最先上线
   - 当前最应优先稳定
   - 包含 `Pro` 报告内 AI 问答

### 7.2 第二阶段优先能力

1. Healing Conversation
   - 由当前 `Pro` 报告内 AI 问答自然长出
   - 也是旧多智能体设计中最先落地的一条线

### 7.3 第三阶段能力

1. Healing Planning
2. Drawing Guidance
3. Journey Orchestration

这三者应在平台骨架和 Conversation 稳定后再进入正式建设。

## 8. 前端重构建议顺序

前端不要从“重画页面”开始，而应按下面顺序重构：

1. 先抽 `Journey` 语义
2. 再抽 `Interpretation capability` 语义
3. 再把当前 `mobile-web` 中的产品逻辑逐步移出页面层
4. 最后再做 UI 还原或改版

建议最先整理的对象：

1. `JourneyState`
2. `CapabilityEntry`
3. `InterpretationSession`
4. `ReportVersion`
5. `NextRecommendedAction`

## 9. 后端演进建议顺序

后端建议按下面顺序演进：

1. 保持当前 `V2` 解读主链路稳定
2. 抽出 Interpretation 能力边界
3. 引入 Conversation 能力边界
4. 再逐步接入 Planning / Drawing / Journey 编排

多智能体建议也按同样顺序推进：

1. `Insight / Vision` 优先服务 Interpretation
2. `HealingAgent` 服务 Conversation
3. `PlanningAgent` 服务 Planning
4. `JourneyOrchestrator` 最后进入正式编排

## 10. 哪些沉没成本应该主动放弃

既然本轮按“归零设计”处理，就应主动放弃下面这些错误出发点：

1. 不再把 `mobile-web` 当前路由结构当成未来平台地图
2. 不再把 Landing / Upload / Report 当作平台唯一主骨架
3. 不再把 Lite / Pro 流程当成未来所有能力的父流程
4. 不再把页面交互顺序当成领域模型

## 11. 当前可接受的过渡状态

在平台骨架正式落地前，可以接受的过渡状态是：

1. 当前线上仍只有 Interpretation 主路径
2. 当前 `mobile-web` 仍然能跑完整 To C 闭环
3. UI 暂时仍以旧主线为参考
4. 但文档和后续实现不再把它解释为产品全貌

## 12. 下一轮建议任务

如果接受这份演进草案，下一轮任务建议顺序如下：

1. 产出 `Interpretation` 能力域对象草案
2. 产出 `Journey` 最小模型草案
3. 评估当前前端哪些逻辑必须迁出 `mobile-web`
4. 再决定当前 UI 还原是否继续，以及还原到什么层级

## 13. 成功判定

这次“归零重想”是否成功，不以是否立刻改代码衡量，而以以下结果衡量：

1. 团队以后不再把 `一镜一梳` 误称为单一解读工具
2. 当前 To C MVP 被明确重新命名为 `Interpretation MVP`
3. 多智能体被正确放回能力层 / 旅程层，而不是页面层
4. 后续 UI 工作不会再反向定义平台

## 14. 当前建议

建议从今天开始统一采用下面的表述：

- 平台定位：曼陀罗疗愈平台
- 当前上线主线：Interpretation MVP（包含 Pro 报告内 AI 问答）
- 当前渠道主入口：mobile-web
- 后续扩展方向：Conversation -> Planning / Drawing -> Journey

这能在不否定当前主链路资产的前提下，把未来平台方向重新钉住。
