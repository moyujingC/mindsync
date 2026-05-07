# 2026-04-17 v1 Providers auth runtime input 接线实施任务

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/tasks/2026-04-17-v1-providers-auth-runtime-input接线实施任务.md

## Summary

本轮目标是把已经存在的 `ProvidersAuthHeaderResolver` 从 fetch transport 配置层向上接到 runtime 输入层，让 deployment/browser runtime 可以显式传入 auth resolver，但默认启动仍固定为 mock。

## Key Changes

- 扩展 `ProvidersRuntimeConfig` 的 real-fetch 形态，新增可选 `authHeadersResolver?`
- 扩展 `ConsoleDeploymentRuntimeInput` 的 `env` 模式，新增可选 `authHeadersResolver?`
- 扩展 `ConsoleBrowserDeploymentRuntimeInput` 的 `browser-fetch` / `browser-fetch-source` / `global-browser-fetch` 模式，新增可选 `authHeadersResolver?`
- 扩展以下 helper 参数透传：
  - `resolveConsoleDeploymentRuntimeInputFromEnv(env, fetchImpl?, authHeadersResolver?)`
  - `bootstrapConsoleEnvDeploymentRuntime(env, fetchImpl?, authHeadersResolver?)`
  - `bootstrapConsoleEnvDeploymentRuntimeWithBrowserFetch(env, browserFetch?, authHeadersResolver?)`
- 保持默认 mock 启动、页面 helper 与 `main.tsx` 默认路径不变

## Acceptance

- static real-fetch config 可把 `authHeadersResolver` 传到 fetch transport
- env deployment input 可显式携带 `authHeadersResolver`
- browser runtime 三条 real-fetch 路径都可显式携带 `authHeadersResolver`
- 缺少 `fetchImpl` 或 `baseUrl` 时继续回到 mock，即使传了 resolver
- resolver 抛错时继续向上抛，不 fallback
