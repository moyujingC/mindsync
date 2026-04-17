# RelayHub v1 Providers runtime 收敛与真实闭环试点实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-17-v1-providers-runtime收敛与真实闭环试点实施任务.md
> 项目：RelayHub
> 阶段：task

这份任务用于把 `RelayHub Console` 从“继续铺 seam”切换到“冻结新增抽象 + 用现有 seam 跑真实闭环”。

## 1. 目标

本轮目标是：

- 对 Providers 底座做最小软减法
- 明确推荐入口与兼容入口
- 用现有 real-fetch 主链跑一个最小真实只读闭环试点

同时继续保持：

- 默认仍走 mock
- 不删除已有 public type/function
- 不引入真实网络请求或真实环境读取

## 2. 关键实现

### 2.1 收敛说明

新增 `specs/2026-04-17-v1-providers-runtime入口收敛说明.md`，至少明确：

- 冻结新增 `Input / Option / SourceFactory / CompositionFactory / StartupInput`
- 推荐入口：
  - services：`ProvidersRuntimeConfigSourceFactoryOptions`
  - deployment：`ConsoleDeploymentRuntimeInput.env`
  - browser：`ConsoleBrowserDeploymentRuntimeInput.browser-fetch / browser-fetch-source`
- compatibility-only 入口
- deprecated-candidate 入口

### 2.2 代码层软减法

在推荐入口相关文件顶部增加简短注释，说明：

- 哪些入口是 recommended
- 哪些入口是 compatibility-only
- 当前不再继续新增更高层 wrapper

本轮不删除现有 public 入口。

### 2.3 真实只读闭环试点

在测试中新增两条推荐路径 smoke：

- deployment `env` real-fetch
- browser `browser-fetch` real-fetch

覆盖：

- `/providers` collection 成功
- `/providers/:id` detail 成功
- 404 detail -> `not-found`
- fetch error 向上抛
- `defaultHeaders` / `authHeadersResolver` 进入 transport 请求

## 3. 本轮不做

- 不删除 auth/token/security wrapper
- 不删除 app runtime input/startup input
- 不修改 `main.tsx`
- 不新增新 mode / 新 wrapper / 新 composition factory

## 4. 验收要求

- `npm test` 通过
- `npm run build` 通过
- 推荐入口 smoke 场景可跑通 Providers real-fetch
- 兼容入口现有测试继续通过
- 误导表达关键词命中仍只出现在“不提供 / 禁止 / QA检查项”语境中
