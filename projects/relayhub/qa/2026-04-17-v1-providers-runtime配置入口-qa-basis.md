# RelayHub v1 Providers runtime 配置入口 QA Basis

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-runtime配置入口-qa-basis.md
> 项目：RelayHub
> 阶段：verification-basis
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-17-v1-providers-runtime配置入口实施任务.md

这份文档定义 `RelayHub` 控制台在为 `Providers` 试点补显式 runtime 配置解析入口时的最小验证口径。

## 1. 目标行为

本轮应满足以下目标行为：

1. providers 已具备独立 runtime config 解析入口
2. 默认 config 仍解析为 mock
3. real-fetch config 只能通过显式对象传入
4. 页面与 service 对外接口保持不变

## 2. 验收标准

### 2.1 config 入口落位

必须满足：

- 存在 `ProvidersRuntimeConfigMode`
- 存在 `ProvidersRuntimeConfig`
- 存在 `getDefaultProvidersRuntimeConfig()`
- 存在 `resolveProvidersRuntimeDataSourceOptions(config?)`

### 2.2 行为稳定

必须满足：

- 默认 config 解析为 `{ mode: "mock" }`
- `mode = "mock"` 等价于当前默认 mock providers 行为
- `mode = "real-fetch"` 只影响 Providers 资源
- `baseUrl / fetchImpl / defaultHeaders` 能进入 fetch transport
- real-fetch 错误继续向上抛出，不 fallback

### 2.3 边界保持

必须满足：

- 不引入环境变量、自动切换与真实控制动作
- 不把其他资源一并纳入 runtime config
- 生产边界与只读边界不被改写

## 3. 验证方式

本轮至少执行：

1. `npm test`
2. `npm run build`
3. 误导表达全文搜索

## 4. 通过标准

只有同时满足下面条件，才允许宣布本轮完成：

- providers runtime config 解析入口已落位
- 自动化测试通过
- 构建通过
- `RelayHub` 项目边界未被改写
