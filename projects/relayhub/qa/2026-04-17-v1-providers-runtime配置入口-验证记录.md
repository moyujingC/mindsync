# RelayHub v1 Providers runtime 配置入口验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-runtime配置入口-验证记录.md
> 项目：RelayHub
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-runtime配置入口-qa-basis.md, /Users/xinran/Downloads/dev/mindsync/projects/relayhub/console

这份文档记录 `RelayHub` 控制台在为 `Providers` 试点补显式 runtime 配置解析入口后的验证结果。

## 1. 本轮验证范围

本轮验证对象为：

- `services/providersRuntimeConfig.ts` 的 providers runtime config resolver
- `services/providersRuntimeDataSource.ts` 的 config 接入
- `consoleDataSource.test.ts`、`consoleData.test.ts`、`readonlyApiAdapters.test.ts` 与 `routes.test.tsx`

## 2. 验证方式

### 2.1 自动化验证

- 在 `projects/relayhub/console` 运行 `npm install --cache .npm-cache`
- 运行 `npm test`
- 运行 `npm run build`

### 2.2 误导表达搜索

全文搜索：

- `保存策略`
- `立即切流`
- `发布到生产`
- `启用自动路由`
- `编辑生产白名单`
- `立即应用配置`

确认命中仍只出现在“明确不提供 / 不做”的说明语境中。

## 3. 验证结果

### 3.1 runtime config 落位

结果：通过

说明：

- 已新增 `ProvidersRuntimeConfigMode`、`ProvidersRuntimeConfig`、`getDefaultProvidersRuntimeConfig()`、`resolveProvidersRuntimeDataSourceOptions(config?)`。
- 默认 config 会解析为 `{ mode: "mock" }`，`getProvidersRuntimeDataSource()` 在未传 config 时保持现有 mock providers 行为。
- `mode = "real-fetch"` 时，config 会被解析为 `ProvidersRuntimeDataSourceOptions` 并继续交给 `createRealProvidersFetchDataSource(config)`，本轮未自动启用。
- `ProvidersRuntimeConfig` 公开形态继续只承载 `baseUrl / fetchImpl / defaultHeaders?`，未把 auth/token/security app 层输入并入 runtime config 接口。

### 3.2 默认行为与透传

结果：通过

说明：

- `getProvidersRuntimeDataSource()` 在未传 config 或 `mode = "mock"` 时，providers 行为与当前默认 mock providers 等价。
- `baseUrl / fetchImpl / defaultHeaders` 已通过 runtime config resolver 透传到 fetch datasource / transport。
- `mode = "real-fetch"` 下若 request 或 datasource 抛错，错误会继续向上抛出，不会 fallback 到 mock。

### 3.3 自动化与构建

结果：通过

说明：

- `npm test` 通过，4 个测试文件、312 个测试全部通过。
- `npm run build` 通过，控制台静态构建成功。

### 3.4 边界表达

结果：通过

说明：

- runtime config 仍只作用于 Providers；`dashboard / environments / eval` 继续保持 mock-only。
- 误导表达关键词已全文搜索，命中仅出现在 QA 文档或页面中的“禁止 / 不提供”说明语境；未引入真实控制面表达。
- 控制台仍保持内部只读运营台定位，未改写心理疗愈生产版“只允许国产模型”与“第三方中转不进入生产用户数据主链路”的硬边界。

## 4. 当前残留风险

1. 当前 runtime config 仍是显式对象配置，尚未接入环境变量或正式运行时配置来源。
2. 当前 runtime config 只覆盖 Providers；其他资源仍保持 mock-only。
3. 当前 real-fetch 仍未定义真实内网地址与认证方式。

## 5. 结论

当前 `RelayHub` 控制台已经把 `Providers` 从“结构上可切换但默认关闭”推进到“有显式 runtime 配置解析入口”的阶段，为下一棒接真实 runtime 配置来源提供集中落点。
