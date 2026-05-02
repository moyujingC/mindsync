# MindSync 设计机制分析

> 状态：current
> 版本：0.1.0
> owner：CEO / Orchestrator
> last_updated：2026-04-15
> source_of_truth：company/knowledge-base/system/MindSync-设计机制分析.md

这份文档解释 `MindSync` 这套 Monorepo 为什么这样分层、当前在系统上承担什么角色，以及遇到信息找不到时应该先从哪里进入。

## 1. 一句话定义

`MindSync` 是 `墨予镜` 的公司内核 + 多项目工作区 Monorepo。

它不是单一应用仓库，而是同时承载：

- 公司治理
- 角色定义
- 项目入口
- 共享工具
- 长期知识库

## 2. 为什么需要这套结构

如果没有 `MindSync`，信息会被分散到：

- 聊天记录
- Paperclip 运行时
- 各个历史仓库
- 临时 shell 操作

结果就是：

- 规则找不到
- 项目入口不稳定
- 服务器信息和 runbook 漂移
- agent 每次都像第一次进入现场

## 3. 这套仓库的五层结构

### 3.1 `agents/`

- 放角色定义
- 回答“谁负责做什么”

### 3.2 `company/`

- 放公司治理规则、注册表、蓝图、公司级入口
- 回答“这家公司怎么运作”

### 3.3 `projects/`

- 放项目工作区、项目实现、项目级文档
- 回答“这个项目具体怎么做”

### 3.4 `shared/`

- 放共享脚本、模板和跨项目工具
- 回答“多个项目共用的工具链是什么”

### 3.5 `company/knowledge-base/`

- 放长期复用的知识沉淀
- 回答“这套系统为什么这么设计、应该怎么理解”

## 4. MindSync 与 Paperclip 的关系

两者的默认分工是：

- `MindSync`
  - 治理源
  - 文档源
  - 实现源
  - 知识源
- `Paperclip`
  - 运行时控制面
  - 任务派发与回写面
  - 执行状态面

也就是说：

- 正式规则、正式文档、正式 runbook 应优先落在 `MindSync`
- 任务运行、评论、状态流转、调度由 `Paperclip` 承担

## 5. 你现在最容易遇到的找信息问题

### 5.1 “我知道有这套东西，但不知道入口在哪”

这通常说明缺的是公司级总入口，而不是项目内容本身不存在。

建议先查：

- [AGENTS.md](AGENTS.md)
- [COMPANY.md](COMPANY.md)
- [company/knowledge-base/README.md](company/knowledge-base/README.md)

### 5.2 “我知道项目里做过，但不知道机制怎么运作”

这类信息更适合沉淀到公司知识库，而不是继续埋在单项目 delivery 或 runbook 中。

### 5.3 “我只知道服务器能登，但不知道系统全貌”

这时要先看机制总览，再看项目 runbook，不要直接跳进某台机器的命令细节。

## 6. 当前你提到的 CI/CD 困惑，应该怎么找

如果你想理解“现在的 CI/CD 系统到底是什么、包含哪些能力”，建议顺序：

1. 先看 [当前CI-CD系统机制总览.md](company/knowledge-base/system/当前CI-CD系统机制总览.md)
2. 再看 [company/CI-CD-角色分工说明.md](company/CI-CD-角色分工说明.md)
3. 再进入项目级 runbook：
   - [projects/aimandala/docs/tasks/2026-04-10-服务器部署与运维手册.md](projects/aimandala/docs/tasks/2026-04-10-服务器部署与运维手册.md)
   - [projects/aimandala/docs/delivery/2026-04-12-ci-cd-与自动修复交付记录.md](projects/aimandala/docs/delivery/2026-04-12-ci-cd-与自动修复交付记录.md)

## 7. 当前结构上的一个重要判断

你提到“MindSync 的设计机制分析要不要放进别的框架里”，目前更稳的做法是：

- 先放在公司知识库的 `system/` 下
- 作为公司级解释层存在
- 等以后机制文档增多，再考虑是否升级成独立一级入口

原因是现在它服务的是：

- 多角色理解系统
- 多项目共享认知
- 对 `Paperclip / CI/CD / Monorepo` 的统一解释

它已经超过单项目文档边界，但还没大到值得单独拆一套全新框架。
