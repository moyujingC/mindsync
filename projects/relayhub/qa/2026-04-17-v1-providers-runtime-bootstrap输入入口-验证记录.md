# 2026-04-17 v1 Providers Runtime Bootstrap 输入入口 验证记录

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer / QA
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/qa/2026-04-17-v1-providers-runtime-bootstrap输入入口-验证记录.md


## 执行项

- `npm test`
- `npm run build`
- 误导表达全文搜索

## 结果

- `npm test` 通过，4 个测试文件、323 个测试全部通过
- `npm run build` 通过
- 默认 bootstrap input 继续等价于 mock providers 行为
- `source-factory-options` bootstrap input 可驱动 static mock / static real-fetch / env real-fetch
- `providersBootstrapOptions` 与 `providersBootstrapInput` 同时存在时，`providersBootstrapOptions` 优先
- `getDefaultProvidersRuntimeBootstrap()`、`createConsoleReadonlyDataSource()`、`getDefaultConsoleAppRuntime()` 继续保持 mock providers 行为
- 误导表达全文搜索已执行
- 代码命中仍仅见于 `console/src/app/AppRoutes.tsx` 的“不提供...”语境
