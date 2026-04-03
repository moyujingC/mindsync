# Claude Code 源码研究综合结论与 Skill 启发

> 状态：current
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-04-04
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/research-center/research/claude-code/07-Claude-Code源码研究综合结论与Skill启发.md
> 项目：研究中心
> 研究对象：Claude Code 外部源码材料
> 服务对象：CEO / Product Spec Lead / Architect / Content Lead / Research & Knowledge Lead

这份文档不是再次逐项拆源码，而是把本轮 Claude Code 研究收束成一份可 handoff 的综合结论。

它重点回答：

1. 本机哪些 Claude Code 材料真正值得作为研究对象
2. Claude Code 最值得 `墨予镜` 学的结构是什么
3. 哪些做法适合转成 `墨予镜` 的 skill，而不是继续堆进角色 prompt
4. 研究中心下一步应该如何把这些结论推进成正式能力

## 1. 研究对象与材料判断

### 1.1 本轮主研究样本

- 主样本：
  - `/Users/xinran/Downloads/dev/mindsync/external/claude-code/source/claude-code-best`
- 辅助参考：
  - `/Users/xinran/Downloads/dev/mindsync/external/claude-code/source/jarmuine-claude-code`

### 1.2 为什么选择 `claude-code-best`

相较于其他本机材料，这份样本更适合首轮研究，因为它同时具备：

- `docs/`
  - 对架构、loop、skill、agent、多代理协作有系统解释
- `src/`
  - 可以核对文档描述与实现落点
- `tests/`
  - 能看出哪些能力被视为需要稳定验证
- `src/skills`
  - 可直接研究 skill 的加载与执行协议
- `src/coordinator`
  - 可直接研究多 Agent 编排入口

### 1.3 研究边界

需要明确的是，这不是 Anthropic 官方开源仓库，而是逆向/还原性质项目。

因此本轮研究更适合吸收：

- 架构思路
- 方法论表达
- 协作协议
- 技能系统设计

而不应把某些具体实现细节直接当成官方真相引用。

## 2. 关键观察

## 2.1 Claude Code 的真正核心不是单个 prompt

从以下材料综合判断：

- `/Users/xinran/Downloads/dev/mindsync/external/claude-code/source/claude-code-best/src/QueryEngine.ts`
- `/Users/xinran/Downloads/dev/mindsync/external/claude-code/source/claude-code-best/docs/conversation/the-loop.mdx`
- `/Users/xinran/Downloads/dev/mindsync/external/claude-code/source/claude-code-best/docs/conversation/multi-turn.mdx`

可以看出它的核心不是一个“更聪明的主 prompt”，而是三层结构：

1. 会话编排器
   - `QueryEngine` 负责跨轮状态、system prompt 拼装、技能/插件/agent 注入
2. Agentic Loop
   - `queryLoop()` 负责思考、工具执行、观察、继续或终止
3. 扩展层
   - skills、custom agents、coordinator、task tools 提供可复用方法和协作能力

这意味着 Claude Code 的能力来源不是“模型临场发挥”，而是“结构化上下文 + 工具循环 + 声明式能力单元”。

## 2.2 Skill 被设计成工作流单元，而不是小技巧集合

从以下材料看：

- `/Users/xinran/Downloads/dev/mindsync/external/claude-code/source/claude-code-best/docs/extensibility/skills.mdx`
- `/Users/xinran/Downloads/dev/mindsync/external/claude-code/source/claude-code-best/src/tools/SkillTool/SkillTool.ts`
- `/Users/xinran/Downloads/dev/mindsync/external/claude-code/source/claude-code-best/src/skills/loadSkillsDir.ts`

Skill 的本质不是：

- 一个额外命令
- 一小段技巧说明
- prompt 附录

而是：

- 一套完整工作流的声明式封装

它具备这些关键特征：

- 固定目录协议：
  - `skill-name/SKILL.md`
- 明确 frontmatter：
  - `when_to_use`
  - `allowed-tools`
  - `context`
  - `model`
  - `effort`
  - `paths`
  - `agent`
- 双执行路径：
  - `inline`
  - `fork`
- 可在运行时调整：
  - 工具白名单
  - 模型
  - 努力级别

也就是说，Claude Code 把“经验”做成了可加载、可约束、可调度的能力对象。

## 2.3 Agent 不是岗位描述，而是受限执行体

从以下材料看：

- `/Users/xinran/Downloads/dev/mindsync/external/claude-code/source/claude-code-best/docs/extensibility/custom-agents.mdx`
- `/Users/xinran/Downloads/dev/mindsync/external/claude-code/source/claude-code-best/src/tools/AgentTool/loadAgentsDir.ts`

自定义 Agent 的关键不是“写一段角色描述”，而是定义：

- agentType
- description
- tools
- disallowedTools
- model
- effort
- permissionMode
- maxTurns
- skills
- memory
- isolation

这说明 Claude Code 里的 Agent 更像：

- 一个拥有明确边界和执行参数的运行时角色对象

而不是：

- 一段长期膨胀的 system prompt

## 2.4 多 Agent 的关键不在“能开多少子 Agent”，而在协议

从以下材料看：

- `/Users/xinran/Downloads/dev/mindsync/external/claude-code/source/claude-code-best/docs/agent/coordinator-and-swarm.mdx`
- `/Users/xinran/Downloads/dev/mindsync/external/claude-code/source/claude-code-best/src/coordinator/coordinatorMode.ts`
- `/Users/xinran/Downloads/dev/mindsync/external/claude-code/source/claude-code-best/src/tools/TaskListTool/TaskListTool.ts`
- `/Users/xinran/Downloads/dev/mindsync/external/claude-code/source/claude-code-best/src/tools/TaskUpdateTool/TaskUpdateTool.ts`

它的多 Agent 协作真正依赖的是：

- coordinator 的职责边界
- worker 的工具边界
- task list 的显式状态
- mailbox / message 的通信协议
- 任务完成后的下一步提示

其中最值得 `墨予镜` 学的一点是：

- coordinator 必须先做 synthesis，再下发精确任务

也就是：

- 不能把“理解问题”的责任懒惰地下放给 worker

## 3. 对 `墨予镜` 的判断

## 3.1 当前短板不在公司原则，而在执行型能力单元

结合现有公司文件：

- `/Users/xinran/Downloads/dev/mindsync/COMPANY.md`
- `/Users/xinran/Downloads/dev/mindsync/company/公司蓝图.md`
- `/Users/xinran/Downloads/dev/mindsync/DOCS_GOVERNANCE.md`
- `/Users/xinran/Downloads/dev/mindsync/company/projects/研究中心/PROJECT.md`

可以判断：

- `墨予镜` 已经有比较清楚的组织原则
- 已经有比较清楚的角色边界
- 已经有比较清楚的 artifact 目录

当前更缺的是：

- 可重复执行的方法 skill
- 标准化 handoff 打包
- 从研究到 spec 再到内容/架构的稳定转换动作

所以问题不再是：

- “角色还不够多”

而是：

- “角色手里还没有系统化 skill”

## 3.2 `墨予镜` 不适合照搬 Claude Code 的重型实现

当前阶段不适合直接照搬：

- 重型 CLI/TUI 架构
- 复杂远程模式
- 过多 feature flags
- 大量运行时 gating
- 完整 mailbox/team/task runtime

但非常适合借鉴：

- skill 目录协议
- agent 定义协议
- handoff 最小字段
- coordinator 先综合、后派发
- 任务的显式状态与 owner

## 4. 适合转成 Skill 的能力模块

下面这些能力，优先应抽成 skill，而不是继续堆进角色 prompt。

### 4.1 通用 skill

- `task-routing`
  - 判断任务属于 business / product / research / architecture / implementation / qa / content 哪条流
- `handoff-packaging`
  - 统一输出背景、目标、项目锚点、当前阶段、输入材料、期望产物、验收标准
- `artifact-readiness-check`
  - 判断当前是否具备进入下一阶段的最小 artifact

### 4.2 研究中心 skill

- `research-brief`
  - 把研究对象、问题、范围、服务对象写清
- `research-synthesis`
  - 把事实、判断、启发、建议拆开
- `knowledge-ingest`
  - 把结论收束成长期知识条目
- `insight-handoff`
  - 把研究结论转译给 Product / Architect / Content

### 4.3 角色专属 skill

- `business-diagnosis`
  - 给 `Business Lead`
- `product-framing-spec`
  - 给 `Product Spec Lead`
- `architecture-boundary-plan`
  - 给 `Architect`
- `qa-gate-review`
  - 给 `Test / QA`
- `content-grounded-transform`
  - 给 `Content Lead`

## 5. 第一批建议

### 5.1 P0

- `task-routing`
- `handoff-packaging`
- `research-brief`
- `research-synthesis`
- `knowledge-ingest`
- `product-framing-spec`
- `qa-gate-review`

### 5.2 P1

- `business-diagnosis`
- `architecture-boundary-plan`
- `insight-handoff`
- `content-grounded-transform`

### 5.3 P2

- `agent-definition-spec`
- `skill-loader-spec`
- `task-protocol`

## 6. 对研究中心的直接行动建议

### 6.1 先做协议，再做批量 skill

不要先零散写多个 skill，再回头统一格式。

更合理的顺序是：

1. 先定义 `SKILL.md` 协议
2. 先明确通用 frontmatter 字段
3. 先明确哪些 skill 允许 `fork`
4. 再开始补第一批 P0 skill

### 6.2 研究中心应承担协议 owner 角色

这件事不应只挂在某个单角色 prompt 上，而应由 `研究中心` 作为能力项目承接：

- 协议定义
- 模板演化
- 首批 skill 样例
- 复盘与迭代

## 7. Handoff 建议

- 建议交给谁：
  - `Research & Knowledge Lead`
  - `CEO / Orchestrator`
  - `Product Spec Lead`
- 交付目的：
  - 形成 `墨予镜` 第一版 skill 设计共识
- 下一步动作：
  - 在 `specs/` 下起草正式的 `SKILL.md` 协议
  - 从 P0 skill 中挑 3 个做首批样例

## 8. 一句话结论

Claude Code 对 `墨予镜` 最有价值的启发，不是“再写更强的角色 prompt”，而是把复杂方法做成可加载、可约束、可 handoff 的 skill 和 agent 协议。
