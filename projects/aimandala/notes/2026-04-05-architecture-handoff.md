# 一镜一梳架构讨论 Handoff

> 状态：draft
> 版本：0.1.0
> owner：Architect
> last_updated：2026-04-05
> source_of_truth：projects/aimandala/notes/2026-04-05-architecture-handoff.md
> 项目：aimandala
> 阶段：discussion
> reviewers：CEO / Orchestrator, Product Spec Lead, Engineer

## 1. 本次讨论的结论

当前已经形成的共识不是“全面平台化重构”，而是：

1. `一镜一梳` 的长期定位仍然是曼陀罗疗愈平台
2. 但当前执行目标必须回到 `MVP 上线`
3. 当前 MVP 的正式口径应调整为：
   - `Interpretation MVP`
   - 其中 `Pro` 报告必须包含 AI 问答
4. 当前不应为了长期平台愿景牺牲上线节奏
5. 当前也不能继续把平台语义无限写死在 `mobile-web` 页面层

一句话口径：

**当前上线目标 = Interpretation MVP，其中 Pro 版报告内置 AI 问答。**

## 2. 当前优先级

### P0：必须优先

1. 上传
2. 三圈检测
3. Lite 报告
4. Pro 报告
5. Pro 报告内 AI 问答
6. 历史记录
7. UI 恢复到可上线水平
8. 正式环境稳定性

### P1：最小防锁死

1. 文档上明确当前只是 `Interpretation MVP`
2. AI 问答当前先视为 `Pro` 报告内置能力，不直接升级为完整独立平台
3. 后续实现避免继续把平台级决策写死在渠道页面里

### P2：后续平台化

1. 独立 `Conversation` 能力域
2. `Planning`
3. `Drawing`
4. `JourneyEngine / CapabilityRegistry / TaskManager` 真正落代码
5. 多入口平台首页

## 3. 当前明确不做的事

当前讨论阶段明确不做：

1. 不做完整平台重构
2. 不做插件系统
3. 不做能力 marketplace
4. 不做大而全的多智能体编排框架
5. 不做为了未来而大规模改目录或改数据库模型
6. 不把 AI 问答直接升级成独立长期陪伴系统

## 4. 已产出的讨论稿

### 平台级讨论稿

1. [2026-04-05-platform-positioning-and-boundaries-discussion.md](./2026-04-05-platform-positioning-and-boundaries-discussion.md)
2. [2026-04-05-platform-architecture-blueprint-discussion.md](./2026-04-05-platform-architecture-blueprint-discussion.md)
3. [2026-04-05-platform-mvp-and-evolution-plan-discussion.md](./2026-04-05-platform-mvp-and-evolution-plan-discussion.md)
4. [2026-04-05-external-architecture-feedback-triage.md](./2026-04-05-external-architecture-feedback-triage.md)

### 最小内核讨论稿

5. [2026-04-05-journey-engine-capability-registry-task-manager-discussion.md](./2026-04-05-journey-engine-capability-registry-task-manager-discussion.md)

这些文档都是 `notes/` 讨论稿，不是当前正式执行约束。

另外，外部 AI 建议已做过一次取舍整理：

1. 已吸收：边界澄清、最小交互协议、Journey 最小对象、轻量埋点
2. 暂缓：新增更多 capability、并行工程线、商业化灰度
3. 当前不建议直接采纳：先上 V2/V3 版本化策略
4. Claude Code 启示当前只吸收 `Capability Registry` 思路，不做插件化 capability 平台

## 5. 这次特别新增的关键修正

最重要的新信息是：

- `Pro` 版报告必须包含 AI 问答

因此已经同步修正为：

1. 当前 MVP 不再只是“上传 -> 报告”
2. 当前 MVP 包含 `Pro report chat`
3. 当前 AI 问答先被定义为：
   - `Interpretation` 能力域中的内置子能力
   - 而不是当前就独立成完整 `Conversation` 平台能力

## 6. 对下一位继续工作的建议

如果下一位是偏产品/架构视角，建议继续做：

1. 产出一份更短的“当前 MVP 执行口径”
2. 定义 `Pro 报告内 AI 问答` 的最小边界：
   - 能问什么
   - 不能问什么
   - 上下文包含什么
   - 安全边界在哪里

如果下一位是偏实现视角，建议继续做：

1. 回到 `Interpretation MVP` 主链路
2. 优先保证 `Pro` 报告内 AI 问答的实现位置干净
3. 以最小对象方式落 `CapabilityRegistry`
4. 不要先做完整平台内核落地

## 7. 对下一位的禁区提醒

下一位继续工作时，尽量不要：

1. 把这些讨论稿升级成 `docs/specs/` 正式文档，除非用户明确要正式化
2. 因为长期平台愿景而打断当前 MVP 上线主线
3. 在页面层继续堆更多平台级语义
4. 把 `Pro` 报告内 AI 问答误当成“独立聊天产品已上线”

## 8. 当前最稳妥的下一步

最稳妥的下一步不是再抽象，而是：

1. 先确认 `Pro 报告内 AI 问答` 的产品边界
2. 再确认它在当前代码里应挂在哪一层
3. 最后继续围绕 `Interpretation MVP` 收口实现

## 9. 本次改动范围

本次只新增和修改了 `projects/aimandala/notes/` 下的讨论稿与 handoff：

- 没有修改正式 spec
- 没有修改代码实现
- 没有修改接口契约

## 10. 新增的下一步入口

本轮额外补了两份更可执行的讨论稿：

1. [2026-04-05-pro-report-chat-minimum-boundary.md](./2026-04-05-pro-report-chat-minimum-boundary.md)
2. [2026-04-05-capability-registry-minimum-draft.md](./2026-04-05-capability-registry-minimum-draft.md)
