# RelayHub v1 Providers env runtime 配置解析器 QA Basis

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/qa/2026-04-17-v1-providers-env-runtime配置解析器-qa-basis.md
> 项目：RelayHub
> 阶段：verification-basis
> depends_on：projects/relayhub/tasks/2026-04-17-v1-providers-env-runtime配置解析器实施任务.md

这份文档定义 `RelayHub` 控制台在为 `Providers` 试点补 env runtime config 解析器时的最小验证口径。

## 1. 目标行为

本轮应满足以下目标行为：

1. providers 已具备独立 env runtime config parser
2. 缺失或非法 env 仍回退到 mock
3. valid real-fetch env 能解析出 real-fetch config
4. 页面与 service 对外接口保持不变

## 2. 验收标准

### 2.1 env parser 落位

必须满足：

- 存在 `ProvidersRuntimeEnv`
- 存在 `resolveProvidersRuntimeConfigFromEnv(env, fetchImpl?)`
- 存在 `createProvidersRuntimeConfigSourceFromEnv(env, fetchImpl?)`

### 2.2 行为稳定

必须满足：

- 缺失 env 与非法 mode 返回 mock config
- real-fetch 缺少 `baseUrl` 或 `fetchImpl` 时返回 mock config
- valid headers JSON 能进入 `defaultHeaders`
- invalid / non-object JSON 会被忽略且不抛错
- env source helper 可驱动 real-fetch datasource

### 2.3 边界保持

必须满足：

- 不引入真实环境变量读取、自动切换与真实控制动作
- 不把其他资源一并纳入 env parser
- 生产边界与只读边界不被改写

## 3. 验证方式

本轮至少执行：

1. `npm test`
2. `npm run build`
3. 误导表达全文搜索

## 4. 通过标准

只有同时满足下面条件，才允许宣布本轮完成：

- providers env runtime config parser 已落位
- 自动化测试通过
- 构建通过
- `RelayHub` 项目边界未被改写
