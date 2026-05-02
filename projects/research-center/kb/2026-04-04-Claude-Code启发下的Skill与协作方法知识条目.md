# Claude Code 启发下的 Skill 与协作方法知识条目

> 状态：current
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-04-04
> source_of_truth：projects/research-center/kb/2026-04-04-Claude-Code启发下的Skill与协作方法知识条目.md
> 项目：研究中心
> 阶段：knowledge-ingest

这份条目把 Claude Code 研究中已经稳定、且对多个 Agent 具备复用价值的方法结论正式收进 `研究中心` 知识库。

## 1. 条目信息

- 标题：
  - Claude Code 启发下的 Skill 与协作方法知识条目
- 条目类型：
  - 方法条目
- 来源研究：
  - [Claude Code 源码研究综合结论与 Skill 启发](projects/research-center/research/claude-code/07-Claude-Code源码研究综合结论与Skill启发.md)
- 服务对象：
  - CEO / Orchestrator
  - Research & Knowledge Lead
  - Product Spec Lead
  - Architect
  - Content Lead
  - Test / QA

## 2. 核心内容

### 2.1 事实

- Claude Code 类样本的核心能力并不主要来自单个 prompt，而是来自：
  - 会话编排
  - agentic loop
  - skills / agent / task protocol 的组合
- skill 在这类系统里更像：
  - 可复用工作流单元
  而不是：
  - prompt 附录
  - 小技巧清单
- 多 Agent 协作是否稳定，关键依赖：
  - coordinator 综合
  - task 状态显式化
  - handoff 协议
  - worker 边界

### 2.2 模式

- 模式一：
  - 把“方法”从角色 prompt 中抽离，做成独立 skill 对象
- 模式二：
  - role prompt 只保留入口与边界，不承载全部方法细节
- 模式三：
  - 重要工作流要以 artifact 串联，而不是只靠聊天上下文
- 模式四：
  - coordinator 先综合，再把精确任务交给下游角色

### 2.3 判断

- 对 `墨予镜` 来说，最值得长期保留的不是某段代码实现，而是：
  - skill 作为方法层的设计判断
  - handoff 与阶段门的最小协议
  - 轻量接入、重试跑、逐步统一的落地策略
- 当前阶段不适合直接照搬重型 runtime，但适合持续沉淀：
  - skill 协议
  - 模板
  - 试跑案例
  - QA 闸门

## 3. 适用范围

- 适用场景：
  - 新增或修订角色方法时，判断是否应抽成 skill
  - 研究结果需要转入 spec、architecture、content 或 qa 时
  - CEO 需要决定是扩写 prompt 还是补方法层时
  - 设计统一接入或 QA 放行规则时
- 不适用场景：
  - 具体代码实现细节的逐项复刻
  - 与当前公司阶段不匹配的重型 runtime 设计
  - 纯一次性项目状态更新

## 4. 为什么值得长期保留

- 这组判断会被多个 Agent 反复遇到，不是一次性项目状态
- 它已经直接影响：
  - skill 协议
  - 角色接入
  - 试跑设计
  - QA 质量门
- 它具备跨任务、跨角色和跨阶段迁移价值

## 5. 回链

- 原始文档：
  - [Claude Code 源码研究综合结论与 Skill 启发](projects/research-center/research/claude-code/07-Claude-Code源码研究综合结论与Skill启发.md)
- 相关条目：
  - [墨予镜 Skill 协议草案](projects/research-center/specs/2026-04-04-墨予镜-Skill-协议草案.md)
  - [Skill 试跑案例索引](projects/research-center/delivery/2026-04-04-Skill试跑案例索引.md)

## 6. 一句话结论

对 `墨予镜` 来说，Claude Code 研究最值得入库的长期知识，不是某个具体实现，而是“skill 作为方法层对象”以及围绕它形成的 handoff、阶段门和轻量接入策略。
