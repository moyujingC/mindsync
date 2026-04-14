# Paperclip 设计机制与使用说明

> 状态：current
> 版本：0.1.0
> owner：CEO / Orchestrator
> last_updated：2026-04-15
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/company/knowledge-base/system/Paperclip-设计机制与使用说明.md

这份文档解释 `Paperclip` 在 `墨予镜` 中的设计角色、运行边界与默认使用方式。

它不是 Paperclip 开源项目的完整产品手册，而是 `MindSync / 墨予镜` 当前阶段的本地解释层。

## 1. 一句话定义

在 `墨予镜` 里，`Paperclip` 不是代码仓库，也不是项目文档库。

它更像：

- 公司控制面
- 任务与协作总线
- 运行时任务状态面板
- Agent 执行与回写入口

## 2. 它解决什么问题

`Paperclip` 主要解决四类问题：

1. 让任务、评论、父子关系、review 和状态流转有统一运行面
2. 让 agent 可以围绕 `company / project / goal / issue` 协作，而不是只靠临时 prompt
3. 让运行中的任务能持续回写当前判断、动作、阻塞与结果
4. 让 CEO / 各角色可以在同一控制面中看到组织、目标、项目与执行状态

## 3. 它不解决什么问题

在 `墨予镜` 中，下面这些不应只留在 `Paperclip`：

- 公司治理规则
- 项目正式 spec / plan / qa / delivery
- 长期 runbook
- 结构性设计结论

这些仍应回到 `MindSync` 仓库维护。

## 4. 核心对象怎么理解

### 4.1 company

- 组织容器
- 承载 agents、projects、goals、issues

### 4.2 project

- 一组相关 issue 的聚合容器
- 通常对应 `MindSync` 中一个项目工作区或能力对象

### 4.3 goal

- 回答“为什么做”
- 既可以是公司目标，也可以是项目当前阶段目标

### 4.4 issue

- 默认工作单元
- 在 `墨予镜` 中会进一步被治理层解释为 `intake / epic / execution / artifact-review`

### 4.5 workspace

- 运行时工作目录映射
- 告诉 agent 进入哪个仓库目录执行

## 5. 在墨予镜里的真实边界

`Paperclip` 与 `MindSync` 的关系不是二选一，而是分层协作：

- `MindSync`
  - 治理源、知识库、项目文档与实现工作区
- `Paperclip`
  - 运行时协作面、任务派发面、状态回写面

因此默认工作路径应是：

1. 在 `Paperclip` 中建任务、分派、review、回写状态
2. 在 `MindSync` 中完成文档治理、实现、验证与交付
3. 再把关键结论回写到 `Paperclip`

## 6. 当前最重要的使用原则

### 6.1 状态不是语义

`todo / in_progress / in_review / done / blocked` 只表示流程信号。

任务真正是什么，要靠：

- `type:*`
- `review:*`
- description 模板
- 父子关系
- project / goal

来共同表达。

### 6.2 Paperclip 运行态不是唯一真相

当前 `墨予镜` 里：

- 仓库中的治理文档与注册表是长期治理源
- `Paperclip` 中的 project / goal / workspace / issue 是运行态对象

两者可能漂移，因此需要持续对账。

### 6.3 任务可以在运行时被修正，但规则要回到仓库

如果只是把某条 issue 修好了，但没有回到仓库补规则、模板或入口，系统还是会反复失忆。

## 7. 当前常见误区

### 7.1 把标题当状态面板

例如把 `✅ / ⚠️ / ❌` 写进标题，会导致任务修复后标题语义仍滞后。

当前更稳的做法是：

- 标题保持稳定语义
- 状态看字段
- 过程看评论

### 7.2 把 issue 当正式文档库

如果 spec、计划、qa、delivery 只留在 issue comments 里，后续很难 handoff。

### 7.3 把运行时 ID 当治理真相

`projectId / goalId / workspaceId` 是运行时标识，不应该反向替代仓库里的注册与入口关系。

## 8. 推荐入口

- 任务语义规则：
  - [company/任务类型与标签规范.md](/Users/xinran/Downloads/dev/mindsync/company/任务类型与标签规范.md)
  - [company/任务创建模板.md](/Users/xinran/Downloads/dev/mindsync/company/任务创建模板.md)
- 任务系统优化方向：
  - [company/Paperclip任务系统优化方案.md](/Users/xinran/Downloads/dev/mindsync/company/Paperclip任务系统优化方案.md)
- 与仓库分层关系：
  - [MindSync-设计机制分析.md](/Users/xinran/Downloads/dev/mindsync/company/knowledge-base/system/MindSync-设计机制分析.md)
