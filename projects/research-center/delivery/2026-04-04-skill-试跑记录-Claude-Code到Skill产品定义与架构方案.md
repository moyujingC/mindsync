# Skill 试跑记录：Claude Code 研究到 Skill 产品定义与架构方案

> 状态：current
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-04-04
> source_of_truth：projects/research-center/delivery/2026-04-04-skill-试跑记录-Claude-Code到Skill产品定义与架构方案.md
> 项目：研究中心
> 阶段：delivery

这份文档记录第二轮 skill 试跑。

本轮目标是验证另一条主链是否成立：

`research -> product-framing-spec -> architecture-boundary-plan`

## 1. 试跑任务

- 任务：
  - 基于 Claude Code 研究结论和已有 skill 协议草案，产出一份正式的 skill 产品定义 / spec，以及一份对应的架构边界方案
- 来源项目：
  - `研究中心`
- 输出位置：
  - [Claude Code 启发下的 Skill 体系产品定义 / SPEC](projects/research-center/specs/2026-04-04-Claude-Code启发下的Skill体系产品定义-SPEC.md)
  - [Skill 体系架构边界与接入方案](projects/research-center/decisions/2026-04-04-Skill体系架构边界与接入方案.md)

## 2. 试跑前上下文

本轮读取了以下材料：

- [Claude Code 源码研究综合结论与 Skill 启发](../../../projects/research-center/research/claude-code/07-Claude-Code源码研究综合结论与Skill启发.md)
- [墨予镜 Skill 协议草案](projects/research-center/specs/2026-04-04-墨予镜-Skill-协议草案.md)
- [DOCS_GOVERNANCE.md](DOCS_GOVERNANCE.md)
- [研究中心项目入口](../../../company/projects/研究中心/PROJECT.md)
- [研究中心项目工作区](../../../projects/research-center/PROJECT.md)
- [Product Spec Lead 角色说明](agents/product-spec-lead/AGENTS.md)
- [Architect 角色说明](agents/architect/AGENTS.md)

## 3. 按 Skill 走的过程

### 3.1 `insight-handoff`

转译结果：

- 从研究结论中提取的关键输入不是“Claude Code 有哪些文件”
- 而是：
  - `墨予镜` 当前短板是方法层
  - 第一阶段应优先验证真实协作链
  - 不适合直接照搬重型 runtime

### 3.2 `product-framing-spec`

收束结果：

- 明确了第一阶段 skill 体系的直接用户和间接用户
- 明确了本轮要解决的问题：
  - 多角色存在，但方法不稳定
- 明确了推荐方案：
  - 轻量 skill 体系优先于继续扩写角色 prompt
- 明确了验收标准：
  - 至少支撑两条真实协作链，并形成正式 artifact

### 3.3 `artifact-readiness-check`

判断结果：

- 这份 spec 已具备交给 `Architect` 的最低完整度
- 原因：
  - 已明确项目锚点
  - 已明确本轮做什么 / 不做什么
  - 已明确下一阶段产物和禁止改写范围

### 3.4 `architecture-boundary-plan`

收束结果：

- 技术边界被压缩在五层：
  - skill 定义层
  - skill 治理层
  - 角色引用层
  - 试跑与验证层
  - 后续统一接入层
- 明确当前阶段的关键架构判断：
  - 先把 skill 当成治理对象，而不是运行时对象
- 明确了给 `Engineer` 和 `Test / QA` 的下一步输入

## 4. 试跑结果

### 4.1 成立的部分

- `research -> spec -> architecture` 这条链已经可以真实落 artifact
- `product-framing-spec` 和 `architecture-boundary-plan` 不再只是纸面 skill 名称
- skill 体系的下一步已经能从“继续补什么”推进到“如何统一接入”

### 4.2 暴露的问题

- `insight-handoff` 目前更多是隐式使用，后续还需要补更明确的面向不同下游角色的示例
- `artifact-readiness-check` 还没有统一的书面 checklist 模板，当前更多依赖 skill 文本本身
- 第一阶段虽然明确“不做 runtime”，但后续统一接入的最小实现目标还需要专门拆成执行任务

### 4.3 当前结论

第二轮试跑证明：

- 现有 skill 体系已经可以支撑从研究结论一路推进到产品定义和架构边界
- 下一步最值钱的动作不是再抽象概念，而是继续把统一接入和 QA 验证链也跑实

## 5. 对 Skill 体系的修正建议

### 5.1 近期建议

- 给 `product-framing-spec` 和 `architecture-boundary-plan` 各补一个更短的 checklist 版模板
- 为 `artifact-readiness-check` 增加独立模板，减少不同角色自由发挥
- 把“统一接入最小实现”单独拆成任务文档

### 5.2 中期建议

- 再试跑一条：
  - `architecture -> qa-gate-review -> delivery`
- 这样就能验证 skill 体系是否已经覆盖实现前后最关键的质量闸门

## 6. 一句话结论

这轮试跑说明，`墨予镜` 的 skill 已经能把研究结论继续推进成产品定义和架构方案；接下来该补的是统一接入与 QA 验证，而不是重新讨论 skill 是否值得做。
