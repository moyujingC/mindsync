# RelayHub v1 Providers app runtime startup input 验证记录

> 状态：current
> 版本：0.1.0
> owner：QA
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-app-runtime-startup-input-验证记录.md
> 项目：RelayHub
> 阶段：verification

## 1. 执行项

- 已执行：`npm test`
- 已执行：`npm run build`
- 已执行：误导表达全文搜索

## 2. 结果

- `npm test` 通过：4 个测试文件，338 个测试全部通过。
- `npm run build` 通过。
- 新增 app runtime startup input 测试通过，覆盖：
  - 默认 `startup input` 解析为空 `ConsoleAppRuntimeOptions`
  - `app-runtime-options` 映射到现有 `ConsoleAppRuntimeOptions`
  - `app-runtime-input` 映射到现有 `ConsoleProvidersAppRuntimeInput`
  - `bootstrapConsoleAppRuntimeFromStartupInput()` 默认 mock 行为
  - startup input 驱动 static mock / static real-fetch / env real-fetch
  - `ConsoleAppRuntimeOptions` 内部既有优先级未回归
- 误导表达全文搜索结果符合预期：
  - 源码命中继续只出现在“不提供”语境
  - 其余命中位于 `tasks/`、`qa/`、`delivery/` 等检查 artifact
  - 构建产物 `dist/` 中的打包字符串不作为误导表达语义回归

## 3. 结论

- 本轮 `Providers app runtime startup input` 装配层实现完成并通过验证。
- 默认 Providers 主链仍保持 mock，`main.tsx` 默认启动路径未切换到 app runtime startup input 主链。
