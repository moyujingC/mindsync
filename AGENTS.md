# MindSync Workspace Instructions

本文件是 `mindsync` 根目录的统一协作入口，供 Codex、Claude Code 等 IDE 内代理读取。

## Workspace Purpose

`mindsync` 是 `墨予镜` 的公司内核与 Monorepo 工作空间。

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
16. `agents/*/AGENTS.md`
17. `company/项目与仓库映射.md`

如果任务与某个具体角色有关，应继续读取对应的 `agents/<role>/AGENTS.md`。

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
