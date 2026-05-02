# RelayHub v1 Providers runtime 收敛与真实闭环试点 QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/qa/2026-04-17-v1-providers-runtime收敛与真实闭环试点-qa-basis.md
> 项目：RelayHub
> 阶段：qa

## 1. 目标

验证 Providers 底座已进入“软减法 + 真实闭环试点”阶段，推荐入口可承载 real-fetch，兼容入口不回归。

## 2. 必测场景

1. 推荐 deployment 入口 `ConsoleDeploymentRuntimeInput.env` 可完成 Providers real-fetch collection 请求。
2. 推荐 deployment 入口可完成 detail 请求，并把 404 映射为 `not-found`。
3. 推荐 browser 入口 `ConsoleBrowserDeploymentRuntimeInput.browser-fetch` 可完成 Providers real-fetch collection 请求。
4. 推荐 browser 入口下 `defaultHeaders` 与显式 `authHeadersResolver` 能进入 transport。
5. 真实 fetch 错误继续向上抛，不 fallback 到 mock。
6. 默认 `bootstrapDefaultConsoleBrowserDeploymentRuntime()` 仍保持 mock providers 行为。
7. 兼容入口现有测试继续通过。
8. `consoleDataSource.test.ts`、`consoleData.test.ts`、`routes.test.tsx` 全部继续通过。

## 3. 验证命令

- `npm test`
- `npm run build`
- 误导表达全文搜索：
  - `保存策略`
  - `立即切流`
  - `发布到生产`
  - `启用自动路由`
  - `编辑生产白名单`
  - `立即应用配置`

## 4. 通过标准

- 自动化测试与构建全部通过。
- 推荐入口 smoke 路径证明现有 seam 足以承载真实只读闭环。
- 软减法不破坏兼容入口与默认 mock 行为。
