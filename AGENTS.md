# MindSync Workspace Instructions

本文件是 `mindsync` 根目录的统一协作入口，供 Codex、Claude Code 等 IDE 内代理读取。

## Workspace Purpose

`mindsync` 是 `知行工坊` 的公司系统内核与 Monorepo 工作空间。

这里有三个不同概念，默认不要混用：

- `知行工坊`：公司名称
- `MindSync` / `mindsync`：这套一人公司系统、仓库与运行时治理底座
- `墨予镜`：个人 IP（个人品牌）账号，仅用于个人表达与内容账号语境

这里保存：

- 公司级定义与入口文件
- Agent 角色说明
- 公司原则与治理文档
- Paperclip 运行时侧配置

它不是“只有单个应用”的源码仓库；不要默认把整个仓库当成某一个前端或后端项目直接启动。
这里采用的是：

- 公司内核 + 多项目工作区的 Monorepo 结构
- 公司级治理文档与项目级实现入口共存
- 文档、角色、项目目录各自有明确边界

## Primary Files

进入工作区后，优先读取这些文件：

1. `AGENTS.md`
2. `COMPANY.md`
3. `company/项目注册表.yaml`
4. `.paperclip.yaml`
5. `company/公司蓝图.md`
6. `company/内容矩阵.md`
7. `company/研发原则.md`
8. `company/任务审阅与状态流转规范.md`
9. `company/Paperclip任务系统优化方案.md`
10. `company/任务类型与标签规范.md`
11. `company/任务创建模板.md`
12. `company/顶层任务收束规则.md`
13. `company/标签与状态使用说明.md`
14. `MONOREPO.md`
15. `DOCS_GOVERNANCE.md`
16. `company/服务器与基础设施入口.md`
17. `company/Paperclip-Agent-模型配置总表.md`
18. `company/projects/Automation/PROJECT.md`
19. `agents/*/AGENTS.md`
20. `company/项目与仓库映射.md`
21. `company/knowledge-base/README.md`

如果任务与某个具体角色有关，应继续读取对应的 `agents/<role>/AGENTS.md`。

如果任务属于“系统机制理解、工具设计机制分析、使用说明整理”，应继续读取：

1. `company/knowledge-base/README.md`
2. `company/knowledge-base/system/README.md`
3. `company/projects/Automation/PROJECT.md`

如果任务明确属于某个具体项目，还应继续读取：

1. `company/projects/<项目名>/PROJECT.md`
2. `projects/<project-slug>/PROJECT.md`
3. 当前任务点名的项目文档

不要默认泛读整个 `company/` 或整个项目目录；应优先读取这两个层级已经明确列出的必读材料。

## Directory Meaning

- `agents/`: 各角色的 system prompt / role definition
- `company/`: 公司蓝图、对象注册表、内容矩阵、映射文档及其他治理文档
- `projects/`: Monorepo 中各项目的实现入口与项目级工作区
- `shared/`: 共享工具和辅助资源
- `external/`: 外部参考资料

`shared/tools/` 中可以包含 Paperclip 本地运维脚本，例如本地环境加载、key 清理等工具。
这类脚本仅用于排障、调试或低频运维操作，不属于日常协作主路径。
默认协作路径仍应是：在 Paperclip 中派活，然后直接在 `mindsync` 工作区治理文档、项目与文件系统。

## Working Rules

- 默认工作语言为中文
- 优先维护 `mindsync` 作为公司内核，而不是把信息散落到别处
- 优先把项目工作区收束到 `projects/`，而不是继续把长期实现分散到多个平级仓库
- 修改组织、角色、协作方式时，优先更新对应文档，再考虑运行时同步
- 不要把公司级文档、共享资源、项目实现混层存放
- 先以 `company/项目注册表.yaml` 判断对象类型，再决定进入公司侧入口或 `projects/` 工作区
- 若要让 Paperclip 使用这套内核，优先基于 `COMPANY.md`、`.paperclip.yaml` 与 `agents/` 对齐
- 只要当前会话产生了文件改动，默认动作就是在当前分支、当前 worktree 直接完成一次提交，而不是把自己的改动留在工作区里等待用户提醒
- 这条“改完即提交”规则适用于所有分支、所有 worktree；若工作区本来就有他人未提交改动，必须只暂存并提交自己负责的文件，不得把不属于本次任务的脏改一并卷入

## Monorepo 日常工作区约定

- 根工作区 [mindsync](.) 固定对应 `main`
- `main` 只承担公司主干、Automation、治理文档与最终收口
- 已明确长期独立开发的项目，默认应在各自正式 `git worktree` 中开发与验证
- 具体项目 worktree、分支和服务器/本地路径口径，统一看：
  - [company/Git仓库管理系统说明.md](company/Git仓库管理系统说明.md)
  - [company/项目与仓库映射.md](company/项目与仓库映射.md)

## IDE 默认开发纪律

当你直接在 `Claude Code`、`Codex` 等 IDE 代理中工作时，默认采用“双轨”：

1. 重要工作走 `Harness Engineering + SDD + TDD`
2. 轻量工作允许直接读取、直接修改、直接交付

这里的关键不是“任何事都先补完整 artifact（交付文档）”，而是根据任务重量选择合适约束。

### IDE 轻量直改模式

满足任一项时，默认可直接改，不必先补完整 `spec / task / qa basis / delivery`：

- 单文件或少量文件的局部修改
- 文案替换、错别字修正、格式整理、链接修复
- 已经明确指出目标文件和改法的编辑任务
- 不改变系统边界的微型代码修复
- 为了推进讨论而做的小范围草拟或示例改写

在这类任务里：

- 可以直接把用户消息当作本轮输入，不要求先转成正式 artifact
- 可以先改完，再用简短说明补充“改了什么、为什么这样改、如何验证”
- 若修改非常小，允许把 `qa` 简化为肉眼检查、diff 检查或最小命令验证

### IDE 结构化交付模式

当任务属于重要工作时，仍应默认遵守 `Harness Engineering + SDD + TDD`，并补齐最小 artifact 闭环。

同时默认遵守 Git 提交纪律：

1. 完成一个适合独立提交的最小闭环后，尽快 `git add` + `git commit`
2. 不等待用户额外提醒“记得提交”
3. 小型连续修改允许在同一轮内合并为一次提交，不强制每改一行就提交
4. 若提交说明未手写，允许使用仓库内的自动提交辅助机制生成最小 commit message
5. 提交纪律的正式说明统一看 [company/Git提交与自动提交规范.md](company/Git提交与自动提交规范.md)

### 什么属于重要工作

满足任一项时，默认视为重要工作：

- 新功能或新能力
- 主链路行为变化
- 架构、模块边界或目录结构变化
- 影响接口合同、数据结构或运行时语义的改动
- 大型 refactor
- 新增或重做调试台、workbench、评估脚本、fixture、运维链路

### 重要工作的默认阶段门

重要工作默认走下面这条最小闭环，而不是直接开始实现：

1. `spec` 或问题定义
2. `task` / `implementation plan`
3. `qa basis`
4. `implementation`
5. `verification`
6. `delivery`

这里的最小要求不是每次都写长文档，而是重要工作在进入下一阶段前，要有能交接的正式 artifact。

### 缺失 artifact 时的默认动作

如果任务已经进入重要实现、重构或正式交付阶段，但缺少关键 artifact：

- 不默认“边做边补”
- 不把零散聊天长期当成唯一依据
- 应先补最小 `spec`、`task` 或 `qa basis`
- 如当前角色不适合补齐，应显式回退给对应 owner

### TDD 的默认执行方式

进入重要实现前，至少先写清：

1. 目标行为
2. 验收标准
3. 边界情况
4. 验证方式

测试不一定都先表现为自动化测试文件，但不能没有验证口径。

### 完成实现后的默认要求

完成重要代码修改后，不应直接宣称任务完成。

至少还要补齐或同步：

- `qa` 或验证记录
- `delivery` 或交付说明
- 当前残留风险
- 下一阶段 handoff 对象

### 推荐 skill

遇到“需求讨论 -> 开发 -> 验证 -> 交付”的重要链路时，优先使用：

- `product-framing-spec`
- `ui-ux-console-design`
- `artifact-readiness-check`
- `qa-gate-review`
- `harness-sdd-tdd-guard`

其中 `harness-sdd-tdd-guard` 用于统一判断当前是否属于重要工作、处于哪一阶段、最小 artifact 是否齐全，以及是否允许直接进入实现或宣布完成。

如果任务明确属于控制台、后台、工作台、设置页、接入页或正式前端体验收口，应额外优先使用：

- `ui-ux-console-design`
  - 用于把页面主任务、信息层级、状态设计和一次性接入模板先收口清楚

## Paperclip Notes

- `COMPANY.md` 是公司包入口
- `company/项目注册表.yaml` 是公司对象清单的唯一权威来源
- `.paperclip.yaml` 保存 MindSync 的 Paperclip 侧映射信息
- 运行态数据可能已经导入到本机 Paperclip 实例，但仓库文档仍应视为可维护源之一
- 本地 agent 身份切换脚本只应被视为排障/调试辅助，不应被当成常规工作入口

## Collaboration Intent

当任务不明确时，优先判断它属于以下哪类：

- 公司内核整理
- Agent 配置调整
- Paperclip 接入或同步
- Monorepo 结构治理
- 项目映射与知识沉淀

并先判断任务对象属于：

- `product`
- `capability`
- `brand`

如果只是要更新 IDE 入口说明或协作规则，应优先改根目录 `AGENTS.md` / `CLAUDE.md`，而不是分散修改多份重复说明。
