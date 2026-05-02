# 一镜一梳当前 MVP 执行口径

> 状态：draft
> 版本：0.1.0
> owner：Product / Architect
> last_updated：2026-04-05
> source_of_truth：projects/aimandala/notes/2026-04-05-current-mvp-execution-brief.md
> 项目：aimandala
> 阶段：discussion

## 1. 一句话结论

**当前上线目标 = Interpretation MVP，其中 Pro 版报告内置 AI 问答。**

这句话同时约束两件事：

1. 当前优先级是把解读主链路上线，而不是做全面平台化重构
2. 当前实现也不能把产品永久写死成“只有上传和出报告”

## 2. 当前必须交付什么

当前 MVP 以真实可上线主链路为准，至少包括：

1. 上传作品
2. 三圈检测与确认
3. Lite 报告
4. Pro 报告
5. Pro 报告内 AI 问答
6. 历史记录
7. 可上线的移动端 UI

其中第 5 项不是可选增强，而是当前 `Pro` 的组成部分。

## 3. Pro 报告内 AI 问答的当前定位

当前先把 AI 问答定义为：

1. `Interpretation` 能力域里的内置子能力
2. `Pro` 报告阅读与追问场景的延伸
3. 为后续独立 `Conversation` 能力预留接缝

当前不要把它定义成：

1. 独立聊天产品
2. 长期陪伴系统
3. 多智能体平台入口

## 4. AI 问答的最小边界

当前 MVP 内，AI 问答建议只支持以下范围：

1. 解释当前报告内容
2. 围绕本次作品与本次解读做追问
3. 给出与当前报告直接相关的温和建议或下一步理解方向

当前先不承诺：

1. 跨多次作品的长期记忆陪伴
2. 完整心理咨询式对话
3. 与计划、练习、绘画指导的自由切换

## 5. 当前不做什么

为了避免过度工程化，这一轮明确不做：

1. 不做完整平台重构
2. 不做插件系统
3. 不做 capability marketplace
4. 不做大一统事件总线
5. 不做 DSL 旅程编辑器
6. 不做大规模目录、数据库、基础设施先行重写

## 6. 实现时的架构约束

当前实现建议遵守四条约束：

1. 以 `Interpretation MVP` 为上线主线
2. `mobile-web` 当前是渠道入口，不应继续承担过多平台语义
3. `Pro` 报告内 AI 问答应挂在解读能力边界内，而不是页面缝合逻辑里
4. 长期平台对象可以先停留在 discussion 层，不急着全部落代码

## 7. 下一位最该做什么

如果下一位要继续推进，建议按这个顺序：

1. 先确认 `Pro` 报告内 AI 问答的产品边界和安全边界
2. 再确认它在当前前后端中分别挂在哪一层
3. 然后继续围绕 `Interpretation MVP` 收口实现
4. 最后再决定 UI 还原与平台抽象的切入点

## 8. 相关讨论稿入口

1. [2026-04-05-architecture-handoff.md](projects/aimandala/notes/2026-04-05-architecture-handoff.md)
2. [2026-04-05-platform-mvp-and-evolution-plan-discussion.md](projects/aimandala/notes/2026-04-05-platform-mvp-and-evolution-plan-discussion.md)
3. [2026-04-05-journey-engine-capability-registry-task-manager-discussion.md](projects/aimandala/notes/2026-04-05-journey-engine-capability-registry-task-manager-discussion.md)
