# RelayHub v1 Providers runtime 数据源入口验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：projects/relayhub/qa/2026-04-16-v1-providers-runtime数据源入口-验证记录.md
> 项目：RelayHub
> 阶段：verification
> depends_on：projects/relayhub/qa/2026-04-16-v1-providers-runtime数据源入口-qa-basis.md, projects/relayhub/console

这份文档记录 `RelayHub` 控制台在为 `Providers` 试点补默认关闭的 runtime 数据源入口后的验证结果。

## 1. 本轮验证范围

本轮验证对象为：

- `services/providersRuntimeDataSource.ts` 的 providers runtime seam
- `services/mockConsoleDataSource.ts` 的 providers 默认拼装改造
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

### 3.1 runtime seam 落位

结果：通过

说明：

- 已新增 `ProvidersRuntimeMode`、`ProvidersRuntimeDataSourceOptions`、`createProvidersRuntimeDataSource(options)`、`getProvidersRuntimeDataSource(options?)`。
- 默认 runtime seam 返回 mock providers source，`getProvidersRuntimeDataSource()` 与 `createProvidersRuntimeDataSource({ mode: "mock" })` 均保持现有 mock providers 行为。
- `mode = "real-fetch"` 时，runtime seam 会切到 `createRealProvidersFetchDataSource(config)`，但只作用于 Providers 资源，本轮未自动启用。

### 3.2 默认行为与覆盖优先级

结果：通过

说明：

- `createConsoleReadonlyDataSource()` 在未显式传入 `providersSource` 时，默认经由 runtime seam 返回 mock providers 行为，与改造前保持等价。
- `createConsoleReadonlyDataSource({ providersSource })` 仍以显式注入为最高优先级，可覆盖 runtime seam 默认返回值。
- `mode = "real-fetch"` 下若 transport 或 datasource 抛错，错误会继续向上抛出，现有页面错误态可复用。

### 3.3 自动化与构建

结果：通过

说明：

- `npm test` 通过，累计 `81` 条测试通过。
- `npm run build` 通过，控制台静态构建成功。

### 3.4 边界表达

结果：通过

说明：

- runtime seam 仍只作用于 Providers；`dashboard / environments / eval` 继续保持 mock-only。
- 误导表达关键词已全文搜索，命中仅出现在 QA 文档或页面中的“禁止 / 不提供”说明语境；未引入真实控制面表达。
- 控制台仍保持内部只读运营台定位，未改写心理疗愈生产版“只允许国产模型”与“第三方中转不进入生产用户数据主链路”的硬边界。

## 4. 当前残留风险

1. 当前 runtime seam 仍默认固定为 mock，尚未接入环境变量或真实 runtime 注入路径。
2. 当前 runtime seam 只覆盖 Providers；其他资源仍保持 mock-only。
3. 当前 real-fetch 仍依赖显式代码配置，尚未进入真实内网地址与认证方式的正式落位。

## 5. 结论

当前 `RelayHub` 控制台已经把 `Providers` 从“可接真实 fetch”推进到“结构上可切换但默认关闭”的阶段，为下一棒接真实 providers 只读 API 提供了一个集中且可测试的 runtime seam。
