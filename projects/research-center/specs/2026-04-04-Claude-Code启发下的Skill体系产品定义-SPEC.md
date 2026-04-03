# Claude Code 启发下的 Skill 体系产品定义 / SPEC

> 状态：draft
> 版本：0.1.0
> owner：Product Spec Lead
> last_updated：2026-04-04
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/research-center/specs/2026-04-04-Claude-Code启发下的Skill体系产品定义-SPEC.md
> 项目：研究中心
> 阶段：spec
> depends_on：
> - /Users/xinran/Downloads/dev/mindsync/projects/research-center/research/claude-code/07-Claude-Code源码研究综合结论与Skill启发.md
> - /Users/xinran/Downloads/dev/mindsync/projects/research-center/specs/2026-04-04-墨予镜-Skill-协议草案.md

这份文档用于把 Claude Code 研究结论进一步收束成 `墨予镜` 第一阶段 skill 体系的产品定义。

它回答的不是“skill 是什么”，而是：

- 当前 `墨予镜` 为什么要先补 skill
- 第一阶段 skill 体系到底要解决什么问题
- 第一阶段范围应该收在什么边界内
- 哪些产物具备继续 handoff 给 `Architect` 的条件

## 1. 背景

- 项目：
  - `研究中心`
- 当前阶段：
  - `spec`
- 上游输入：
  - [Claude Code 源码研究综合结论与 Skill 启发](/Users/xinran/Downloads/dev/mindsync/projects/research-center/research/claude-code/07-Claude-Code源码研究综合结论与Skill启发.md)
  - [墨予镜 Skill 协议草案](/Users/xinran/Downloads/dev/mindsync/projects/research-center/specs/2026-04-04-墨予镜-Skill-协议草案.md)
- 继承的项目锚点：
  - `研究中心` 是公司的共享能力底座，负责把高价值研究议题沉淀成长期可复用能力
  - `墨予镜` 当前已有公司原则、角色边界和 artifact 目录，但各 Agent 仍缺少系统化方法 skill
- 本轮任务级别：
  - `执行落地`

## 2. 问题定义

- 直接用户是谁：
  - `墨予镜` 内部各角色 Agent，尤其是 `Research & Knowledge Lead`、`Product Spec Lead`、`Architect`、`Content Lead`、`Test / QA`
- 间接用户是谁：
  - CEO / 人类创作者。她需要一套稳定、可追溯、可迭代的多 Agent 协作方法层
- 当前卡点是什么：
  - 角色定义已经存在，但很多任务仍靠角色临场组织方法
  - 同类型任务在不同回合之间缺少稳定步骤、输出模板和 handoff 规范
  - 研究、产品、架构、内容之间虽然有边界，但缺少稳定转换器
- 为什么值得现在解决：
  - 如果继续只补角色 prompt，质量波动会继续存在
  - skill 已有协议、目录、首批样例和第一轮试跑基础，当前已具备最小产品化条件
  - 现在进入 skill 产品定义，能把后续补 skill、统一接入、真实试跑三件事拉到同一条路径上

## 3. 本轮目标

- 本轮要做什么：
  - 定义 `墨予镜` 第一阶段 skill 体系的服务对象、能力边界、最小功能面和交付标准
  - 明确第一阶段优先支撑哪几条真实协作链，而不是平均补全所有角色
  - 明确 skill 作为“方法层产物”的产品边界，供后续架构设计与统一接入
- 本轮不做什么：
  - 不设计完整 runtime marketplace
  - 不补远程 skill loader、权限系统和复杂编排器
  - 不把所有角色 prompt 重写成依赖 skill 的重型运行时
  - 不在本轮重定义 `研究中心` 或公司蓝图

## 4. 方案比较

### 方案 A：继续扩写角色 prompt

- 做法：
  - 在各角色 `AGENTS.md` 中继续补更多方法描述和阶段说明
- 优点：
  - 改动快
  - 表面上最省结构设计
- 缺点：
  - 方法无法独立版本化
  - 不同角色难以共享同一套工作流
  - 无法形成模板、示例产物和独立评审对象

### 方案 B：先做轻量 skill 体系，再逐步统一接入

- 做法：
  - 保留现有角色 prompt 主体
  - 把高频方法抽成 skill
  - 通过模板、元数据、示例产物和真实试跑验证 skill 是否成立
- 优点：
  - 能把“方法”从角色描述里拆出来，变成可维护对象
  - 更适合 `研究中心` 持续迭代和沉淀
  - 能与现有 artifact 目录、handoff 规范直接对齐
- 缺点：
  - 需要补充目录规范、接入方式和试跑机制
  - 短期内会出现 prompt 和 skill 并存

### 当前推荐方案

- 推荐：
  - 方案 B
- 推荐原因：
  - 它最符合 Claude Code 研究带来的关键判断：当前短板是方法层，而不是岗位层
  - 它与 `墨予镜` 现有文档治理方式兼容，不需要先引入重型运行时
  - 它允许沿真实任务逐步修 skill，而不是一次性做大而全设计

## 5. 范围说明

### 5.1 第一阶段主路径

- 主路径一：
  - `research -> content upstream input`
- 主路径二：
  - `research -> product-framing-spec -> architecture-boundary-plan`
- 主路径三：
  - `spec / architecture -> qa-gate-review -> delivery`

### 5.2 第一阶段最小能力包

- 通用 skill：
  - `task-routing`
  - `artifact-readiness-check`
  - `handoff-packaging`
- 研究与交接 skill：
  - `research-brief`
  - `research-synthesis`
  - `knowledge-ingest`
  - `insight-handoff`
- 角色专属 skill：
  - `product-framing-spec`
  - `architecture-boundary-plan`
  - `qa-gate-review`
  - `content-grounded-transform`

### 5.3 边界情况

- 如果任务仍没有项目锚点、阶段输入或上游材料：
  - 不能直接套 skill 进入正式 spec/architecture
- 如果某个 skill 只能给出原则，无法产出 artifact：
  - 该 skill 视为未达到第一阶段可用标准
- 如果某个任务需要重定义公司蓝图或产品定位：
  - 不属于 skill 常规执行，需回退给 CEO 发起新的全局任务

### 5.4 禁止扩大的范围

- 不把第一阶段 skill 体系误做成通用插件市场
- 不把所有角色都强制改造成运行时受限 agent 协议
- 不要求一开始就支持自动发现、自动路由、自动权限
- 不把研究中心的局部能力实验升级为整家公司操作系统重写

## 6. 验收标准

- 至少能支撑两条真实协作链跑通，并产出正式 artifact
- 每个第一阶段 skill 至少满足：
  - 有 `SKILL.md`
  - 有输入输出约束
  - 有模板或 checklist
  - 有一个真实试跑案例或示例产物
- 角色 prompt 接入采用最小改动策略：
  - 能引用 skill，但不依赖重型运行时
- `Product Spec Lead` 能基于当前 spec 直接 handoff 给 `Architect`

## 7. 下一步 handoff

- 建议交给谁：
  - `Architect`
- 需要产出什么：
  - 一份第一阶段 skill 体系的架构边界与实现前提说明
  - 重点明确目录边界、引用边界、统一索引、评审机制和后续实现切入点

## 8. 允许变化与禁止改写

- 本轮允许变化：
  - skill 分组方式
  - 第一阶段接入顺序
  - 首批试跑链路优先级
  - 目录下的辅助模板和评审机制
- 本轮禁止改写：
  - `研究中心` 作为能力项目的定位
  - “优先补方法 skill，而不是继续扩写角色 prompt”的核心判断
  - 当前公司三类对象模型：`product` / `capability` / `brand`

## 9. 一句话结论

`墨予镜` 第一阶段 skill 体系的产品目标，不是做一个更复杂的 Agent runtime，而是先为现有多角色协作补上一层稳定、可 handoff、可迭代的方法系统。
