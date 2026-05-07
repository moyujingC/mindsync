# 2026-04-17 v1 Providers auth runtime input 接线 交付说明

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/delivery/2026-04-17-v1-providers-auth-runtime-input接线-交付说明.md


## 本轮交付

- Providers auth resolver 已可由 runtime config / deployment input / browser runtime input 显式传入
- 现有 real-fetch transport 会继续消费同一份 `authHeadersResolver`
- 默认 mock 启动、页面 helper 与 route 行为保持不变

## 未做事项

- 未决定认证 header 名称
- 未接入真实 token 来源
- 未新增 auth env key
- 未把 auth resolver 接入默认启动路径

## 下一棒建议

在明确 token 来源后，为 Providers 增加显式 auth source seam 或 token provider，并把它接到 `browser-fetch-source` / `global-browser-fetch` 的显式输入链。
