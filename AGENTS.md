# MindSync Workspace Instructions

本文件是 `mindsync` 根目录的统一协作入口，供 Codex、Claude Code 等 IDE 内代理读取。

## Workspace Purpose

`mindsync` 是 `墨予镜` 的公司内核与工作空间。

这里保存：

- 公司级定义与入口文件
- Agent 角色说明
- 公司原则与治理文档
- Paperclip 运行时侧配置

它不是普通应用源码仓库；不要默认寻找 `package.json` 后直接启动前端或后端。

## Primary Files

进入工作区后，优先读取这些文件：

1. `AGENTS.md`
2. `COMPANY.md`
3. `.paperclip.yaml`
4. `agents/*/AGENTS.md`
5. `company/*.md`

如果任务与某个具体角色有关，应继续读取对应的 `agents/<role>/AGENTS.md`。

## Directory Meaning

- `agents/`: 各角色的 system prompt / role definition
- `company/`: 公司原则、内容矩阵、项目与仓库映射
- `shared/`: 共享工具和辅助资源
- `external/`: 外部参考资料

## Working Rules

- 默认工作语言为中文
- 优先维护 `mindsync` 作为公司内核，而不是把信息散落到别处
- 修改组织、角色、协作方式时，优先更新对应文档，再考虑运行时同步
- 不要把这里误当作业务应用仓库做大规模工程改造
- 若要让 Paperclip 使用这套内核，优先基于 `COMPANY.md`、`.paperclip.yaml` 与 `agents/` 对齐

## Paperclip Notes

- `COMPANY.md` 是公司包入口
- `.paperclip.yaml` 保存 MindSync 的 Paperclip 侧映射信息
- 运行态数据可能已经导入到本机 Paperclip 实例，但仓库文档仍应视为可维护源之一

## Collaboration Intent

当任务不明确时，优先判断它属于以下哪类：

- 公司内核整理
- Agent 配置调整
- Paperclip 接入或同步
- 项目映射与知识沉淀

如果只是要更新 IDE 入口说明或协作规则，应优先改根目录 `AGENTS.md` / `CLAUDE.md`，而不是分散修改多份重复说明。
