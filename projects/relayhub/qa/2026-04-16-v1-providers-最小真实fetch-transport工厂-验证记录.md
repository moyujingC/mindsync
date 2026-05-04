# RelayHub v1 Providers 最小真实 fetch transport 工厂验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：projects/relayhub/qa/2026-04-16-v1-providers-最小真实fetch-transport工厂-验证记录.md
> 项目：RelayHub
> 阶段：verification
> depends_on：projects/relayhub/qa/2026-04-16-v1-providers-最小真实fetch-transport工厂-qa-basis.md, projects/relayhub/console

这份文档记录 `RelayHub` 控制台在为 `Providers` 试点补最小真实 fetch transport 工厂后的验证结果。

## 1. 本轮验证范围

本轮验证对象为：

- `services/realProvidersFetchTransport.ts` 的 fetch transport 工厂
- `services/realProvidersDataSource.ts` 的 detail `404` 归一化与 fetch datasource 组合 helper
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

### 3.1 fetch transport 工厂

结果：通过

说明：

- collection / detail URL 拼接测试已通过
- `defaultHeaders` 透传行为已通过测试验证
- `204 / 404 / 非 2xx / 非法 JSON` 的 transport 行为均已通过测试验证

### 3.2 facade 归一化与 helper

结果：通过

说明：

- detail `404 -> not-found` 映射已通过测试验证
- `createRealProvidersFetchDataSource(config)` 已通过测试验证可用

### 3.3 自动化与构建

结果：通过

说明：

- `npm test` 已通过，共 `74` 条测试全部通过
- `consoleDataSource.test.ts` 已新增 fetch transport 与 facade 归一化验证
- `consoleData.test.ts`、`readonlyApiAdapters.test.ts` 与 `routes.test.tsx` 继续通过
- `npm run build` 已通过

### 3.4 边界表达

结果：通过

说明：

- 默认 datasource 仍继续使用 mock providers source
- 误导表达关键词搜索已确认命中只出现在“明确不提供 / 不做”的说明语境中
- 控制台只读边界与心理疗愈生产版“只允许国产模型”边界未被改写

## 4. 当前残留风险

1. 当前 fetch transport 仍依赖测试 stub fetch，尚未接入真实 base URL 与认证方式。
2. 当前只把 detail `404` 视为显式 HTTP 语义，collection 仍未进入更复杂状态协议。
3. providers 之外的其他资源仍保持 mock-only。

## 5. 结论

当前 `RelayHub` 控制台已经把 `Providers` 从“抽象 transport”推进到“具备最小真实 fetch transport 工厂”的阶段，为下一棒接真实只读 API 留出了更直接的 HTTP 接入点。
