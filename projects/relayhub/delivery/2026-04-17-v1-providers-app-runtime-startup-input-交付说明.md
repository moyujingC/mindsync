# RelayHub v1 Providers app runtime startup input 交付说明

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/delivery/2026-04-17-v1-providers-app-runtime-startup-input-交付说明.md
> 项目：RelayHub
> 阶段：delivery

## 1. 本轮交付

- 新增 `ConsoleProvidersAppRuntimeStartupInput` startup helper 装配层。
- `ConsoleAppRuntime` 现支持 `bootstrapConsoleAppRuntimeFromStartupInput(input?)`。
- 新增 `getDefaultConsoleAppRuntimeFromStartupInput()`，默认行为仍保持 mock。

## 2. 保持不变

- `main.tsx` 默认仍走 `bootstrapDefaultConsoleBrowserDeploymentRuntime()`。
- `ConsoleAppRuntimeOptions` 与 `ConsoleProvidersAppRuntimeInput` 兼容入口保留。
- auth/token/security 语义未上提到 app runtime startup input。

## 3. 验证

- `npm test` 通过：4 个测试文件，338 个测试全部通过。
- `npm run build` 通过。
- 误导表达全文搜索已执行；源码与 artifact 命中继续只出现在“不提供 / 禁止 / QA检查项”语境。

## 4. 残留边界

- 本轮只做 startup helper 装配层，不把这层接入默认 browser startup 主链。
