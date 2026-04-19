# RelayHub 项目工作区

> 状态：current
> 版本：0.1.1
> owner：Architect / Engineer
> last_updated：2026-04-19
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/PROJECT.md
> 公司侧入口：[/Users/xinran/Downloads/dev/mindsync/company/projects/RelayHub/PROJECT.md](/Users/xinran/Downloads/dev/mindsync/company/projects/RelayHub/PROJECT.md)

这是 `RelayHub` 在 Monorepo 中的正式项目工作区入口。

它用于承接共享模型接入底座、开发版 relay、产品生产版 relay 和旁路 eval 的正式 artifact 与后续实现工作。

## 1. 项目是什么

`RelayHub` 是 `墨予镜` 的公司级共享模型能力项目。

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
- 已进入第一轮正式实现与 release 试用收口
- 当前长期实现分支固定为 `project/relayhub`
- 短期不并回 `main` / `release`

当前不做：

- 在没有 provider 抽象与 QA 基线的情况下开始接入实现
- 直接合并个人开发版和生产版配置
- 把生产路由策略写成开发实验默认值
- 为 RelayHub 额外拆出 `main / release` 双轨版本

## 5. 当前长期入口

当前长期真理源默认从这些目录入口进入：

- [specs/README.md](/Users/xinran/Downloads/dev/mindsync/projects/relayhub/specs/README.md)
- [tasks/README.md](/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/README.md)
- [qa/README.md](/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/README.md)

## 6. 当前窗口入口

当前执行窗口默认从这些入口进入：

- [2026-04-16-RelayHub-v1-架构与产品定义.md](/Users/xinran/Downloads/dev/mindsync/projects/relayhub/specs/2026-04-16-RelayHub-v1-架构与产品定义.md)
- [2026-04-16-v1-最小立项与实现准备任务.md](/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-16-v1-最小立项与实现准备任务.md)
- [2026-04-16-v1-qa-basis.md](/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-qa-basis.md)

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

1. 以 `project/relayhub` 作为长期项目分支推进 RelayHub。
2. 当前已在 `relayhub.jingshu.cc` 跑通独立 worktree + 最小 control-plane 试用链路。
3. 下一步优先解决“先激活谁、给谁用”的选型引导，以及表单交互细节，而不是继续解决部署路径。
4. 保持开发版、生产版、旁路 eval 三类职责分离，不让实现过程侵蚀已确认的边界。
