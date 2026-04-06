# 研究中心项目工作区

> 状态：current
> 版本：0.2.0
> owner：Research & Knowledge Lead
> last_updated：2026-04-06
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/research-center/PROJECT.md
> 公司侧入口：[/Users/xinran/Downloads/dev/mindsync/company/projects/研究中心/PROJECT.md](/Users/xinran/Downloads/dev/mindsync/company/projects/研究中心/PROJECT.md)

这是 `研究中心` 在 Monorepo 中的正式项目工作区入口。

它用于承接 `研究中心` 的任务执行、阶段产物、知识入库动作和后续可能出现的自动化脚本。

## 1. 项目是什么

`研究中心` 是 `墨予镜` 的持续研究项目。

它负责把高价值研究议题稳定转成：

- 研究任务
- 拆解结论
- 结构化知识
- 对产品、架构、商业和内容的可执行启发

## 2. 固定必读

1. [本项目 PROJECT.md](/Users/xinran/Downloads/dev/mindsync/projects/research-center/PROJECT.md)
2. [公司侧项目入口](/Users/xinran/Downloads/dev/mindsync/company/projects/研究中心/PROJECT.md)
3. [研究方向与任务模型](/Users/xinran/Downloads/dev/mindsync/company/projects/研究中心/2026-04-04-研究方向与任务模型.md)
4. [Research & Knowledge Lead 角色说明](/Users/xinran/Downloads/dev/mindsync/agents/research-knowledge-lead/AGENTS.md)
5. [研究任务模板](/Users/xinran/Downloads/dev/mindsync/projects/research-center/templates/研究任务模板.md)
6. [内容选题研究模板](/Users/xinran/Downloads/dev/mindsync/projects/research-center/templates/内容选题研究模板.md)

## 3. 目录说明

- `research/`
  - 正式研究产物与拆解文档
- `specs/`
  - 研究流程、知识结构或自动化方案的正式定义
- `tasks/`
  - 研究计划、任务拆解与阶段行动
- `kb/`
  - 已确认需要进入长期知识库的结构化资产
- `delivery/`
  - 阶段总结、研究交付说明、复盘
- `notes/`
  - 临时笔记，不替代正式 artifact
- `templates/`
  - 研究任务模板、review 模板、入库前检查清单等

## 4. 默认工作流

`研究中心` 默认遵循：

1. `problem-framing`
2. `research`
3. `synthesis`
4. `review`
5. `knowledge-ingest`
6. `handoff`

对应最小产物：

- `problem-framing`
  - 研究对象与问题定义
- `research`
  - 事实材料与拆解记录
- `synthesis`
  - 摘要、模式和启发
- `review`
  - 创作者 / 用户 review 结论
- `knowledge-ingest`
  - 结构化知识条目
- `handoff`
  - 面向产品、架构、内容或商业的交接说明

对“研究中心生成内容准备进入知识库”的场景，默认还要在 `synthesis` 与 `review` 之间插入一层事实核查：

`research-draft` -> `fact-check` -> `review` -> `knowledge-ingest`

约束如下：

- 核查不通过：
  - 退回 `research-draft` 修改
- 核查通过：
  - 才允许进入创作者 / 用户 review
- review 未通过：
  - 不进入知识库

## 5. 当前下一步

1. 建立第一批研究任务清单。
2. 优先完成一份 AI 开源项目拆解样例。
3. 优先完成一份“人与 AI 协作最佳实践”样例。
4. 补出知识入库模板和研究任务模板。
