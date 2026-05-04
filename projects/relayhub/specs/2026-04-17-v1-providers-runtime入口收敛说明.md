# RelayHub v1 Providers runtime 入口收敛说明

> 状态：current
> 版本：0.1.0
> owner：Architect / Engineer
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/specs/2026-04-17-v1-providers-runtime入口收敛说明.md
> 项目：RelayHub
> 阶段：spec

## 1. 目标

当前 Providers runtime 已形成较完整的 transport / datasource / runtime config / app runtime 链路。

本说明用于从“继续铺 seam”切换到“冻结新增抽象 + 用现有 seam 跑真实闭环”，避免 app 层与 auth/token/security 包装层继续扩散。

## 2. 冻结规则

短期冻结新增以下抽象类别：

- `Input`
- `Option`
- `SourceFactory`
- `CompositionFactory`
- `StartupInput`

例外条件：

- 必须先有真实闭环试点证明现有 seam 无法承载目标行为。
- 必须能指出具体缺口，而不是为了层次对齐继续包一层。

## 3. 推荐入口

### 3.1 services 层推荐

- `ProvidersRuntimeConfigSourceFactoryOptions`

用于 services 侧 runtime 配置来源治理，是当前推荐的新接入起点。

### 3.2 app / deployment 推荐

- `ConsoleDeploymentRuntimeInput` 的 `env`

用于显式 Providers real-fetch 试点，推荐作为 deployment 场景的新接入起点。

### 3.3 app / browser 推荐

- `ConsoleBrowserDeploymentRuntimeInput` 的 `browser-fetch`
- `ConsoleBrowserDeploymentRuntimeInput` 的 `browser-fetch-source`

用于浏览器 fetch 注入试点，推荐作为 browser 场景的新接入起点。

### 3.4 正式试点说明

- `projects/relayhub/specs/2026-04-17-v1-providers-real-fetch-readonly-trial接入说明.md`
- `projects/relayhub/specs/2026-04-17-v1-providers-readonly-trial-config-governance说明.md`
- `projects/relayhub/specs/2026-04-17-v1-providers-readonly-wire-contract说明.md`

用于本阶段 Providers readonly real-fetch trial 的正式接入、配置治理、wire contract 与验证口径说明。

## 4. 兼容入口

以下入口保留，但当前视为 compatibility-only：

- auth/token/security deployment/browser/startup wrapper

这些入口继续保留以维持现有测试和渐进演进路径，但不再作为新增功能的默认推荐入口。

## 5. deprecated-candidate

以下类别进入后续删除候选：

- 仅为连续包装存在、暂无真实试点必要性的 browser/deployment/security wrapper
- token/auth 的 composition factory 层，如果真实试点未使用

已移除：

- `ConsoleProvidersAppRuntimeInput`
- `ConsoleProvidersAppRuntimeStartupInput`
- `ConsoleProvidersSecurityStartupInput`
- `ConsoleProvidersSecurityBrowserRuntimeInput`
- `ConsoleProvidersSecurityDeploymentInput`
- `createConsoleAppRuntimeFromInput(...)`
- `bootstrapConsoleAppRuntimeFromInput(...)`
- `bootstrapConsoleAppRuntimeFromStartupInput(...)`
- `getDefaultConsoleAppRuntimeFromStartupInput()`

当前 `ConsoleAppRuntime` 已收敛回较低层 bootstrap 容器，只承载 `providersBootstrapOptions?` 与 `providersBootstrapInput?`。
当前 startup helper 也已收敛回 env + fetch/browserFetch 装配入口，不再承载额外 security 聚合语义。
当前 browser/deployment 主链也已不再保留额外 security 聚合层。
