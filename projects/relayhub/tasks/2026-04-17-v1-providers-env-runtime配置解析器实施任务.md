# RelayHub v1 Providers env runtime 配置解析器实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect / Test
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-17-v1-providers-env-runtime配置解析器实施任务.md
> 项目：RelayHub
> 阶段：implementation-plan
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/delivery/2026-04-17-v1-providers-runtime配置来源入口-交付说明.md

这份任务文档用于把 `Providers` 的 runtime config source 继续推进到“env runtime config 解析器”。

## 1. 任务目标

本轮目标是：

- 为 providers 新增独立 env runtime config parser
- 固化 env 输入 shape 与最小解析语义
- 保持默认 providers 行为仍为 mock
- 为下一棒接真实部署配置预留显式 env helper

## 2. 当前固定决策

实现过程中必须沿用以下固定决策：

- env parser 只服务 `Providers`
- env parser 只解析显式传入对象
- 默认解析结果固定为 mock
- 不读取 `import.meta.env`、`process.env` 或全局配置文件
- 页面层与 `consoleData.ts` 对外接口保持不变

## 3. 本轮要做的实现

### 3.1 env parser 层

要求：

- 新增 `ProvidersRuntimeEnv`
- 新增 `resolveProvidersRuntimeConfigFromEnv(env, fetchImpl?)`
- 新增 `createProvidersRuntimeConfigSourceFromEnv(env, fetchImpl?)`

### 3.2 env key 语义

要求：

- `RELAYHUB_PROVIDERS_RUNTIME_MODE` 仅支持 `mock / real-fetch`
- `RELAYHUB_PROVIDERS_READONLY_BASE_URL` 仅在 `real-fetch` + `fetchImpl` 下进入 real-fetch config
- `RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON` 仅解析 JSON object 字符串

### 3.3 测试层

要求：

- 验证缺失 env、mock env、非法 mode 都回退到 mock
- 验证 real-fetch 缺少 `baseUrl` 或 `fetchImpl` 时回退到 mock
- 验证有效 headers JSON 能透传，无效 JSON 不抛错
- 验证 env source helper 可驱动 real-fetch datasource

## 4. 本轮明确不做

本轮不做：

- 把 env parser 接入默认 source
- 读取真实环境变量
- 认证头字段决策
- runtime 自动切换
- 把 dashboard / environments / eval 纳入 env parser
- 任何真实控制动作

## 5. 完成标准

只有同时满足下面条件，才算本轮完成：

- providers env runtime config parser 已落位
- `npm test` 通过
- `npm run build` 通过
- 已补 QA 验证记录与交付说明
