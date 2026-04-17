# RelayHub v1 Providers app runtime input 验证记录

> 状态：current
> 版本：0.1.0
> owner：QA
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-app-runtime-input-验证记录.md
> 项目：RelayHub
> 阶段：verification

## 1. 执行项

- 已执行：`npm test`
- 已执行：`npm run build`
- 已执行：误导表达全文搜索

## 2. 结果

- `npm test` 通过：4 个测试文件，331 个测试全部通过。
- `npm run build` 通过。
- 新增 app runtime input 测试通过，覆盖：
  - 默认 `providersRuntimeInput` 解析为默认 mock app runtime options
  - `bootstrap-options` 映射到 `providersBootstrapOptions`
  - `bootstrap-input` 映射到 `providersBootstrapInput`
  - `createConsoleAppRuntimeFromInput()` 默认 mock 行为
  - `bootstrapConsoleAppRuntimeFromInput()` 驱动 env real-fetch
  - app runtime input 驱动 static mock / static real-fetch
  - `providersBootstrapOptions`、`providersBootstrapInput`、`providersRuntimeInput` 的优先级
- 误导表达全文搜索结果符合预期：
  - 产品代码命中继续只出现在“不提供”语境
  - 其余命中位于 `tasks/`、`qa/` 等检查 artifact

## 3. 结论

- 本轮 `Providers app runtime input` 装配层实现完成并通过验证。
- 默认 Providers 主链仍保持 mock，`main.tsx` 默认启动路径未切换到 app runtime input 主链。
