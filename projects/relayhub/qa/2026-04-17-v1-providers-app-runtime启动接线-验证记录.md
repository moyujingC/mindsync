# RelayHub v1 Providers app runtime 启动接线 验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/qa/2026-04-17-v1-providers-app-runtime启动接线-验证记录.md
> 项目：RelayHub
> 阶段：verification
> depends_on：projects/relayhub/qa/2026-04-17-v1-providers-app-runtime启动接线-qa-basis.md, projects/relayhub/console

这份文档记录 `RelayHub` 控制台在为 `Providers` 增加 app runtime 启动接线层后的验证结果。

## 1. 本轮验证范围

本轮验证对象为：

- `app/consoleAppRuntime.ts`
- `services/mockConsoleDataSource.ts`
- `services/consoleData.ts`
- `main.tsx`
- `consoleDataSource.test.ts`、`consoleData.test.ts`、`routes.test.tsx`

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

### 3.1 app runtime 装配

结果：通过

说明：

- 已新增 console app runtime 启动层。
- `getDefaultConsoleAppRuntime()` 与 `createConsoleAppRuntime()` 默认都返回 mock providers 路径。
- `providersBootstrapOptions` 已通过测试覆盖 static mock、static real-fetch、env real-fetch 与 env 不完整时回落到 mock 的行为。

### 3.2 datasource 安装 seam

结果：通过

说明：

- 已新增 `setConsoleReadonlyDataSource(dataSource)` 与 `resetConsoleReadonlyDataSource()`。
- `consoleData.ts` 已改为运行时通过 `getConsoleReadonlyDataSource()` 读取 datasource。
- `bootstrapConsoleAppRuntime()` 安装后的 providers datasource 已被 `listProvidersRaw()` / `getProviderRaw()` 读到，`resetConsoleReadonlyDataSource()` 也能恢复默认 mock 行为。

### 3.3 默认启动与资源边界

结果：通过

说明：

- `main.tsx` 已改为在渲染前 bootstrap app runtime。
- 默认启动不传 options，因此仍固定为 mock providers 路径。
- app runtime 继续只影响 Providers；`dashboard / environments / eval` 在 runtime 装配后仍保持 mock-only。

### 3.4 自动化与构建

结果：通过

说明：

- `npm test` 通过，累计 `122` 条测试通过。
- `npm run build` 通过，控制台静态构建成功。
- 误导表达关键词已全文搜索，命中仅出现在 QA 文档或页面中的“禁止 / 不提供”说明语境；未引入真实控制面表达。

## 4. 当前残留风险

1. 当前 app runtime 仍只服务 Providers。
2. 当前启动接线仍不读取真实部署配置。
3. 当前仍未定义认证字段与 runtime 自动切换。

## 5. 结论

当前 `RelayHub` 控制台已经把 `Providers` 从“有 runtime bootstrap”推进到“app startup 已有最小 runtime 启动接线层”的阶段；下一棒若要接真实 deployment wiring 或认证注入，可以直接从 app runtime 输入层继续，而不需要回头改页面层或 `consoleData.ts` 对外接口。
