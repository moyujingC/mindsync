# 模型接入与评测中心项目工作区

> 状态：current
> 版本：0.1.0
> owner：Architect / Engineer
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/model-gateway-eval-center/PROJECT.md
> 公司侧入口：[/Users/xinran/Downloads/dev/mindsync/company/projects/模型接入与评测中心/PROJECT.md](/Users/xinran/Downloads/dev/mindsync/company/projects/模型接入与评测中心/PROJECT.md)

这是 `模型接入与评测中心` 在 Monorepo 中的正式项目工作区入口。

它用于承接共享模型接入底座、开发版 relay、产品生产版 relay 和旁路 eval 的正式 artifact 与后续实现工作。

## 1. 项目是什么

`模型接入与评测中心` 是 `墨予镜` 的公司级共享模型能力项目。

它负责把原本零散存在于个人开发、产品生产和供应商对比里的模型使用问题，收束成：

- 共享模型接入底座
- 统一评测入口
- 正式优化建议
- 可复用的生产治理骨架

## 2. 三类运行形态

当前正式定义 3 类运行形态：

- `dev-relay`
  - 服务个人开发工作流，允许接第三方中转、国产模型和少量可获得免费国外 API
- `prod-relay/<product>`
  - 服务具体产品生产流量，当前心理疗愈应用生产版只允许国产模型
- `eval-sidecar`
  - 服务旁路评测、日报、探活、评分板和优化建议，不承接生产主链路

## 3. 当前硬边界

当前已确认的硬边界如下：

- 个人开发可使用第三方中转
- 心理疗愈应用生产只使用国产模型
- 第三方中转不进入心理疗愈应用生产用户数据主链路
- 本地环境只用于开发、调试与实验
- `4G / 4核` automation 节点优先承担评测调度、探活、日报与健康检查
- `4G / 8核` 生产机优先承担公司级主 Relay 和各产品生产版 Relay

## 4. 当前阶段

当前阶段是：

- capability 已正式立项
- 项目工作区已建立最小骨架
- `spec`、`task`、`qa basis` 已形成最小闭环
- 尚未进入正式实现

当前不做：

- 在没有 provider 抽象与 QA 基线的情况下开始接入实现
- 直接合并个人开发版和生产版配置
- 把生产路由策略写成开发实验默认值

## 5. 当前长期入口

当前长期真理源默认从这些目录入口进入：

- [specs/README.md](/Users/xinran/Downloads/dev/mindsync/projects/model-gateway-eval-center/specs/README.md)
- [tasks/README.md](/Users/xinran/Downloads/dev/mindsync/projects/model-gateway-eval-center/tasks/README.md)
- [qa/README.md](/Users/xinran/Downloads/dev/mindsync/projects/model-gateway-eval-center/qa/README.md)

## 6. 当前窗口入口

当前执行窗口默认从这些入口进入：

- [2026-04-16-模型接入与评测中心-v1-架构与产品定义.md](/Users/xinran/Downloads/dev/mindsync/projects/model-gateway-eval-center/specs/2026-04-16-模型接入与评测中心-v1-架构与产品定义.md)
- [2026-04-16-v1-最小立项与实现准备任务.md](/Users/xinran/Downloads/dev/mindsync/projects/model-gateway-eval-center/tasks/2026-04-16-v1-最小立项与实现准备任务.md)
- [2026-04-16-v1-qa-basis.md](/Users/xinran/Downloads/dev/mindsync/projects/model-gateway-eval-center/qa/2026-04-16-v1-qa-basis.md)

## 7. 目录说明

- `specs/`
  - 正式架构定义、产品边界与核心决策
- `tasks/`
  - 实现计划、阶段任务与 handoff 用执行文档
- `qa/`
  - QA 基线、验收标准与验证记录
- `delivery/`
  - 阶段交付说明、handoff 和上线后结论
- `notes/`
  - 临时笔记，不替代正式 artifact

## 8. 当前下一步

1. 以当前 `spec`、`task`、`qa basis` 为输入，收束 provider 抽象与运行模式边界。
2. 先实现共享底座与 `dev-relay` 最小闭环，再进入产品生产版。
3. 在 automation 与 production 的故障域分离前，不把评测任务和主 Relay API 混跑。
4. 保持开发版、生产版、旁路 eval 三类职责分离，不让实现过程侵蚀已确认的边界。
