# RelayHub v1 Providers runtime bootstrap QA Basis

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-runtime-bootstrap-qa-basis.md
> 项目：RelayHub
> 阶段：verification-basis
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-17-v1-providers-runtime-bootstrap实施任务.md

这份文档定义 `RelayHub` 控制台在为 `Providers` 试点补 runtime bootstrap 最小装配层时的最小验证口径。

## 1. 目标行为

本轮应满足以下目标行为：

1. providers 已具备独立 runtime bootstrap
2. 默认 bootstrap 仍返回 mock providers source
3. static 与 env sourceFactoryOptions 可驱动 bootstrap
4. 页面与 service 对外接口保持不变

## 2. 验收标准

### 2.1 bootstrap 落位

必须满足：

- 存在 `ProvidersRuntimeBootstrapOptions`
- 存在 `ProvidersRuntimeBootstrap`
- 存在 `createProvidersRuntimeBootstrap(options?)`
- 存在 `getDefaultProvidersRuntimeBootstrap()`

### 2.2 行为稳定

必须满足：

- default bootstrap 等价于当前 mock providers 行为
- static mock / static real-fetch options 可驱动 bootstrap
- env options 可驱动 real-fetch bootstrap
- env 缺少必要字段时回退 mock
- 显式 `providersSource` override 仍高于 default bootstrap

### 2.3 边界保持

必须满足：

- 不引入真实环境变量读取、自动切换与真实控制动作
- 不把其他资源一并纳入 bootstrap
- 生产边界与只读边界不被改写

## 3. 验证方式

本轮至少执行：

1. `npm test`
2. `npm run build`
3. 误导表达全文搜索

## 4. 通过标准

只有同时满足下面条件，才允许宣布本轮完成：

- providers runtime bootstrap 已落位
- 自动化测试通过
- 构建通过
- `RelayHub` 项目边界未被改写
