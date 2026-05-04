# ADR-0002: MVP 采用 app-domain-tests 三层最小代码结构

> 状态：current
> 版本：0.1.0
> owner：Architect
> last_updated：2026-04-03
> source_of_truth：projects/aicareer/decisions/ADR-0002-mvp-code-layout.md
> 项目：aicareer
> 阶段：architecture
> depends_on：projects/aicareer/specs/MVP技术方案.md

## 1. 背景

`aicareer` 已完成纸面验证，下一步需要进入第一版实现任务。

在没有现成代码包袱的情况下，最重要的是先定义一个不会过度设计、又足以支撑 MVP 演进的目录边界。

## 2. 决策

第一版实现采用以下最小代码结构：

- `app/`
  - 交互入口、流程编排、输入输出适配
- `domain/`
  - 领域对象、流程状态、结构化数据定义
- `tests/`
  - 自动化测试与样本驱动验证
- `data/`
  - 本地样本、静态配置、示例输出

## 3. 备选方案

1. 只建一个扁平目录
2. 一开始就拆前后端和多服务
3. 先只写文档，不建任何代码结构

## 4. 权衡

选择当前方案的原因：

- 比单目录更清楚，便于维护边界
- 比多服务结构更轻，不会过早工程化
- 能直接承接当前 spec、QA 和 fixtures

放弃其他方案的原因：

- 单目录容易在第一轮实现就混层
- 多服务对当前 MVP 来说过重
- 完全不建代码结构会让下一轮实现仍然缺少落点

## 5. 后续影响

- 第一版实现任务必须按该目录边界拆解
- 后续如需增加 UI 或 API 层，应在此基础上演进，而不是推倒重来
