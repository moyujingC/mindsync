# RelayHub 项目入口

> 状态：current
> 版本：0.1.0
> owner：Architect / Engineer
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/company/projects/RelayHub/PROJECT.md
> 对应项目工作区：[/Users/xinran/Downloads/dev/mindsync/projects/relayhub](/Users/xinran/Downloads/dev/mindsync/projects/relayhub)
> 项目类型：公司级模型接入、评测与优化能力项目

这份文档是 `RelayHub` 在 `mindsync` 中的公司侧项目入口。

它用于把原本分散在个人开发、产品生产、供应商比较和模型优化决策里的模型能力治理，升级成一个可长期维护、可跨产品复用、可被正式派活的公司级 capability。

## 1. 这个项目是什么

`RelayHub` 不是某一个具体产品的附属模块，也不是一次性中转 API 试验。

这里保留“模型接入与评测中心”作为中文能力解释，但不再把它当成正式项目名使用。

它是 `墨予镜` 的共享模型基础设施项目。

当前它至少覆盖 4 条主线：

1. 共享模型接入与路由
   - 为多个项目提供统一的 provider 接入、鉴权、路由和观测骨架
2. 个人开发版 relay
   - 面向 `Claude Code`、`Codex` 等个人工作流，比较第三方中转、国产模型和少量可获得免费国外 API 的真实使用效果
3. 产品生产版 relay
   - 面向各产品生产流量，负责隐私治理、供应商收口、任务级路由和成本观测
4. 旁路 eval 与优化决策
   - 面向模型测评、日报、评分板和任务级优化建议，不与生产主链路强耦合

它最终服务的是：

- 公司级共享模型接入底座
- 个人开发工作流提效
- 各产品的生产模型治理
- 中转站续费、国产替代和成本优化决策

## 2. 为什么要项目化

仅在某一个产品里临时做 relay 不够。

因为你现在真正需要的是：

- 一个可被多个产品复用的正式入口
- 一套清晰的开发版 / 生产版 / 评测版边界
- 一条从模型接入到评测、再到优化决策的正式链路
- 一套不会把生产用户数据和个人开发实验混在一起的治理方式

因此这里采用：

- `RelayHub`
  - 作为公司级 capability，承接文档、任务、阶段产物和长期基础设施演进
- 具体产品
  - 继续拥有自己的生产版 relay 配置、任务路由和合规约束

## 3. 与现有项目的边界

- `研究中心`
  - 负责知识、方法、外部研究与长期判断沉淀
- `RelayHub`
  - 负责模型接入、评测基础设施、路由策略、观测与优化治理
- `一镜一梳` 及后续产品
  - 负责把本能力提供的接入、评测与优化结论，转成各自产品的正式生产策略

默认协作方式：

- 研究框架、评测方法和长期判断可由 `研究中心` 提供上游输入
- provider 接入、环境隔离、路由能力和评测执行由 `RelayHub` 负责
- 产品级生产流量治理由对应产品项目承接与落地

## 4. 当前硬边界

当前阶段已经确认的约束如下：

- 个人开发版 relay 可以使用第三方中转
- `Claude Code`、`Codex` 是开发版的优先工作流
- 心理疗愈应用生产版只允许国产模型
- 第三方中转不进入心理疗愈应用生产用户数据主链路
- 公司级主 Relay 正式部署优先放在 `4G / 8核` 生产机
- `4G / 4核` automation 节点优先承担评测调度、探活、日报与健康检查

## 5. 当前阶段目标

当前阶段先完成最小正式立项闭环，而不是直接开始实现。

本轮目标是：

- capability 正式注册
- 公司侧入口建立
- 项目工作区骨架建立
- 正式 `spec`、`task`、`qa basis` 建立
- 公司内对该 capability 的边界、部署分层和默认决策说法一致

当前不做：

- 直接进入 provider 适配实现
- 直接上线公司级主 Relay
- 在没有 QA 基线和任务分解前开始编码
- 把个人开发版和生产版混成同一套无差别运行策略

## 6. 固定必读

任何 Agent 第一次进入 `RelayHub` 项目时，默认优先读取以下材料：

1. [PROJECT.md](/Users/xinran/Downloads/dev/mindsync/company/projects/RelayHub/PROJECT.md)
2. [项目工作区入口](/Users/xinran/Downloads/dev/mindsync/projects/relayhub/PROJECT.md)
3. [2026-04-16-RelayHub-v1-架构与产品定义.md](/Users/xinran/Downloads/dev/mindsync/projects/relayhub/specs/2026-04-16-RelayHub-v1-架构与产品定义.md)
4. [2026-04-16-v1-最小立项与实现准备任务.md](/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-16-v1-最小立项与实现准备任务.md)
5. [2026-04-16-v1-qa-basis.md](/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-qa-basis.md)
6. [company/服务器与基础设施入口.md](/Users/xinran/Downloads/dev/mindsync/company/服务器与基础设施入口.md)
7. [agents/architect/AGENTS.md](/Users/xinran/Downloads/dev/mindsync/agents/architect/AGENTS.md)
8. [agents/engineer/AGENTS.md](/Users/xinran/Downloads/dev/mindsync/agents/engineer/AGENTS.md)

如果任务明确涉及产品生产边界，还应继续进入对应产品项目入口。

## 7. 这里应该放什么

这里优先放：

- capability 的项目定义与公司侧边界
- 与多个产品共享的长期定位
- 会影响公司级模型治理的结论入口
- 对部署分层、职责划分和默认约束的正式说明

这里不优先放：

- 单一产品的具体生产配置
- 实现期的局部调试笔记
- 某一个 provider 的一次性试验记录
- 项目工作区下更适合沉淀的 spec、task、qa 与交付细节

## 8. 当前一句话结论

从现在开始，`RelayHub` 应作为 `墨予镜` 的正式 capability 存在。

以后凡是“需要统一模型接入、正式评测、产出优化建议，且可被多个产品或多个工作流复用”的任务，都优先进入这个项目，而不是继续零散挂在单个产品或临时脚本上。
