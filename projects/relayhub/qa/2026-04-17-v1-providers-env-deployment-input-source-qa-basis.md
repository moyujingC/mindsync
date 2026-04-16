# RelayHub v1 Providers env deployment input source QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA / Engineer
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-env-deployment-input-source-qa-basis.md
> 项目：RelayHub
> 阶段：qa

这份文档定义 `RelayHub` 控制台为 `Providers` 增加真实 env deployment input source 后的验证口径。

## 1. 验证目标

确认控制台已经从“有 deployment runtime input 装配层”推进到“有真实前端 env deployment input source”，同时保持默认 mock、只读边界和公开 helper 稳定。

## 2. 核心验证点

### 2.1 env source 映射

- `resolveConsoleDeploymentRuntimeInputFromEnv({})` 返回 `default-mock`
- `RELAYHUB_PROVIDERS_RUNTIME_MODE=mock` 返回 `default-mock`
- 非法 runtime mode 返回 `default-mock`
- `real-fetch` 缺少 `baseUrl` 时返回 `default-mock`
- `real-fetch` 缺少 `fetchImpl` 时返回 `default-mock`
- `real-fetch + baseUrl + fetchImpl` 时返回 `env` deployment input
- 有效与无效 `DEFAULT_HEADERS_JSON` 都只原样保留在 env source 输出，不在这一层解析

### 2.2 env source 安装

- `bootstrapConsoleEnvDeploymentRuntime(env, fetchImpl)` 安装后的 providers datasource 能被 `consoleData.ts` helper 读到
- `bootstrapDefaultConsoleEnvDeploymentRuntime()` 在没有完整 real-fetch 条件时仍保持 mock providers 行为
- env source 继续只影响 Providers

### 2.3 默认启动与类型

- `main.tsx` 默认启动改经由 env deployment input source
- `vite-env.d.ts` 已声明本轮实际读取的 Providers env key
- `dashboard / environments / eval` 继续保持 mock-only

## 3. 自动化验证

在 `projects/relayhub/console` 执行：

- `npm install --cache .npm-cache`
- `npm test`
- `npm run build`

## 4. 误导表达检查

全文搜索：

- `保存策略`
- `立即切流`
- `发布到生产`
- `启用自动路由`
- `编辑生产白名单`
- `立即应用配置`

通过标准：

- 命中只能出现在“禁止 / 不提供”的说明语境中

## 5. 通过标准

- 新 env source 与默认启动入口已落位
- 默认 mock 行为未回归
- Providers real-fetch 仍需显式满足完整条件才进入
- 非 Providers 资源保持 mock-only
- 构建与测试全部通过
