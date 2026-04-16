# RelayHub v1 Providers deployment runtime input 验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-deployment-runtime-input-验证记录.md
> 项目：RelayHub
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-deployment-runtime-input-qa-basis.md, /Users/xinran/Downloads/dev/mindsync/projects/relayhub/console

这份文档记录 `RelayHub` 控制台在为 `Providers` 增加 deployment runtime input 装配层后的验证结果。

## 1. 本轮验证范围

本轮验证对象为：

- `app/consoleDeploymentRuntime.ts`
- `app/consoleAppRuntime.ts`
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

### 3.1 deployment input 映射

结果：通过

说明：

- 已新增 deployment runtime input 层。
- `resolveConsoleAppRuntimeOptions()` 默认输入映射为空 runtime options。
- `default-mock`、`static`、`env` 三类 deployment input 都已通过测试映射到现有 console app runtime。
- env 输入缺失必要字段时会继续回落到 mock providers 路径。

### 3.2 datasource 安装与作用范围

结果：通过

说明：

- `bootstrapConsoleDeploymentRuntime()` 安装后的 providers datasource 已被 `listProvidersRaw()` / `getProviderRaw()` 读到。
- deployment runtime input 继续只影响 Providers；`dashboard / environments / eval` 在该层接入后仍保持 mock-only。

### 3.3 默认启动与自动化

结果：通过

说明：

- `main.tsx` 已改为经由 deployment runtime input 启动。
- 默认启动不传 input，因此仍固定为 mock providers 路径。
- `npm test` 通过，累计 `131` 条测试通过。
- `npm run build` 通过，控制台静态构建成功。
- 误导表达关键词已全文搜索，命中仅出现在 QA 文档或页面中的“禁止 / 不提供”说明语境；未引入真实控制面表达。

## 4. 当前残留风险

1. 当前 deployment input 仍只服务 Providers。
2. 当前 deployment input 仍不读取真实环境变量。
3. 当前仍未定义认证字段与 runtime 自动切换。

## 5. 结论

当前 `RelayHub` 控制台已经把 `Providers` 从“有 console app runtime 启动层”推进到“有更高层 deployment runtime input 装配层”的阶段；下一棒若要接真实 env wiring 或认证注入，可以直接从 deployment input 的显式输入来源继续，而不需要回头改页面层、路由层、`consoleData.ts` 或 providers runtime 细层接口。
