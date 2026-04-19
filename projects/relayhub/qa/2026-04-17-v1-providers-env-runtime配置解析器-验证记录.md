# RelayHub v1 Providers env runtime 配置解析器验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-env-runtime配置解析器-验证记录.md
> 项目：RelayHub
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-env-runtime配置解析器-qa-basis.md, /Users/xinran/Downloads/dev/mindsync/projects/relayhub/console

这份文档记录 `RelayHub` 控制台在为 `Providers` 试点补 env runtime config 解析器后的验证结果。

## 1. 本轮验证范围

本轮验证对象为：

- `services/providersRuntimeEnvConfig.ts` 的 env runtime config parser
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

### 3.1 env parser 落位

结果：通过

说明：

- 已新增 `ProvidersRuntimeEnv`、`resolveProvidersRuntimeConfigFromEnv(env, fetchImpl?)`、`createProvidersRuntimeConfigSourceFromEnv(env, fetchImpl?)`。
- 缺失 env、`mode = mock`、非法 mode、以及 `real-fetch` 缺少 `baseUrl` 或 `fetchImpl` 时，都会回退到 `{ mode: "mock" }`。
- valid real-fetch env 在同时具备 `baseUrl` 与显式 `fetchImpl` 时，会解析出 real-fetch config。

### 3.2 默认行为与透传

结果：通过

说明：

- 默认 providers 行为保持 mock，当前默认 source 未接入 env parser。
- `baseUrl / fetchImpl / defaultHeaders` 已通过 env parser 和 env source helper 透传到 fetch transport。
- invalid headers JSON 与 non-object JSON 都会被忽略，且不会抛错。

### 3.3 自动化与构建

结果：通过

说明：

- `npm test` 通过，累计 `99` 条测试通过。
- `npm run build` 通过，控制台静态构建成功。

### 3.4 边界表达

结果：通过

说明：

- env parser 仍只作用于 Providers；`dashboard / environments / eval` 继续保持 mock-only。
- 误导表达关键词已全文搜索，命中仅出现在 QA 文档或页面中的“禁止 / 不提供”说明语境；未引入真实控制面表达。
- 控制台仍保持内部只读运营台定位，未改写心理疗愈生产版“只允许国产模型”与“第三方中转不进入生产用户数据主链路”的硬边界。

## 4. 当前残留风险

1. 当前 env parser 仍未接入默认 source，尚未进入真实部署配置链路。
2. 当前 env parser 只覆盖 Providers；其他资源仍保持 mock-only。
3. 当前 default headers 仍只做原样透传，尚未定义真实认证字段。

## 5. 结论

当前 `RelayHub` 控制台已经把 `Providers` 从“有显式 runtime 配置来源 seam”推进到“有显式 env runtime config 解析器”的阶段，为下一棒接真实部署配置提供明确 env helper。
