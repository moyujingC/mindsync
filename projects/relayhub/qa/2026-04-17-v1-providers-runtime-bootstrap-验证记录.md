# RelayHub v1 Providers runtime bootstrap 验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-runtime-bootstrap-验证记录.md
> 项目：RelayHub
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-runtime-bootstrap-qa-basis.md, /Users/xinran/Downloads/dev/mindsync/projects/relayhub/console

这份文档记录 `RelayHub` 控制台在为 `Providers` 试点补 runtime bootstrap 最小装配层后的验证结果。

## 1. 本轮验证范围

本轮验证对象为：

- `services/providersRuntimeBootstrap.ts` 的 runtime bootstrap
- `services/mockConsoleDataSource.ts` 的默认 providers 拼装改造
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

### 3.1 runtime bootstrap 落位

结果：通过

说明：

- 已新增 `ProvidersRuntimeBootstrapOptions`、`ProvidersRuntimeBootstrap`、`createProvidersRuntimeBootstrap(options?)`、`getDefaultProvidersRuntimeBootstrap()`。
- default bootstrap 返回 mock providers source，行为与当前默认 mock providers 等价。
- static / env sourceFactoryOptions 均可通过 bootstrap 进入现有 source factory / datasource 链路。

### 3.2 默认行为与覆盖优先级

结果：通过

说明：

- `mockConsoleDataSource.ts` 默认 providers 拼装已改经由 default bootstrap，但行为与改造前保持等价。
- `createConsoleReadonlyDataSource({ providersSource })` 显式覆盖优先级保持最高，未被 bootstrap 默认值覆盖。
- bootstrap 只装配 Providers source，不影响 `dashboard / environments / eval`。

### 3.3 自动化与构建

结果：通过

说明：

- `npm test` 通过，累计 `112` 条测试通过。
- `npm run build` 通过，控制台静态构建成功。

### 3.4 边界表达

结果：通过

说明：

- bootstrap 仍只作用于 Providers；`dashboard / environments / eval` 继续保持 mock-only。
- 误导表达关键词已全文搜索，命中仅出现在 QA 文档或页面中的“禁止 / 不提供”说明语境；未引入真实控制面表达。
- 控制台仍保持内部只读运营台定位，未改写心理疗愈生产版“只允许国产模型”与“第三方中转不进入生产用户数据主链路”的硬边界。

## 4. 当前残留风险

1. 当前 bootstrap 默认仍固定为 mock，尚未接入真实部署配置来源。
2. 当前 bootstrap 只覆盖 Providers；其他资源仍保持 mock-only。
3. 当前 bootstrap 仍未定义真实认证字段与 runtime 自动切换。

## 5. 结论

当前 `RelayHub` 控制台已经把 `Providers` 从“有 runtime config source 组合工厂”推进到“有 runtime bootstrap 最小装配层”的阶段，为下一棒接真实部署配置与 runtime bootstrap 扩展提供集中落点。
