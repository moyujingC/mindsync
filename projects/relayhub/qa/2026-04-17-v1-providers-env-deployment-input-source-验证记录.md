# RelayHub v1 Providers env deployment input source 验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/qa/2026-04-17-v1-providers-env-deployment-input-source-验证记录.md
> 项目：RelayHub
> 阶段：verification
> depends_on：projects/relayhub/qa/2026-04-17-v1-providers-env-deployment-input-source-qa-basis.md, projects/relayhub/console

这份文档记录 `RelayHub` 控制台在为 `Providers` 增加真实 env deployment input source 后的验证结果。

## 1. 本轮验证范围

本轮验证对象为：

- `app/consoleEnvDeploymentRuntime.ts`
- `app/consoleDeploymentRuntime.ts`
- `main.tsx`
- `vite-env.d.ts`
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

### 3.1 env source 映射

结果：通过

说明：

- 已新增 env deployment input source。
- 缺失 env、mock env、非法 mode、缺少 `baseUrl`、缺少 `fetchImpl` 都会回落到 `default-mock`。
- `real-fetch + baseUrl + fetchImpl` 会映射为 env deployment input。
- `DEFAULT_HEADERS_JSON` 在 env source 层原样保留，由下游 Providers env config parser 负责解析或忽略。

### 3.2 env source 安装与默认启动

结果：通过

说明：

- `bootstrapConsoleEnvDeploymentRuntime(env, fetchImpl)` 安装后的 providers datasource 已被 `listProvidersRaw()` / `getProviderRaw()` 读到。
- `bootstrapDefaultConsoleEnvDeploymentRuntime()` 在没有显式 `fetchImpl` 时继续保持 mock providers 行为。

### 3.3 自动化与边界

结果：通过

说明：

- `main.tsx` 已改为经由 env deployment input source 启动。
- `npm test` 通过，累计 `141` 条测试通过。
- `npm run build` 通过，控制台静态构建成功。
- 误导表达关键词已全文搜索，命中仅出现在 QA 文档或页面中的“禁止 / 不提供”说明语境；未引入真实控制面表达。

## 4. 当前残留风险

1. 当前 env source 仍只服务 Providers。
2. 当前默认启动虽已读取 `import.meta.env`，但仍未接真实 `fetchImpl`。
3. 当前仍未定义认证字段与 runtime 自动切换。

## 5. 结论

当前 `RelayHub` 控制台已经把 `Providers` 从“有 deployment runtime input 装配层”推进到“有真实前端 env deployment input source”的阶段；下一棒若要接真实 `fetchImpl` 注入、认证注入契约或更正式的 env wiring，可以直接从 env source 的输入来源或 real-fetch transport 输入层继续，而不需要回头改页面层、路由层、`consoleData.ts` 或 providers runtime 细层接口。
