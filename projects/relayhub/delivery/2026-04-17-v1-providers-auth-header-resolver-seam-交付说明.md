# 2026-04-17 v1 Providers auth header resolver seam 交付说明

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/delivery/2026-04-17-v1-providers-auth-header-resolver-seam-交付说明.md


## 本轮交付

- Providers fetch transport 新增显式 auth header resolver seam
- 请求头合并规则固定为 `defaultHeaders` 基底 + resolver 覆盖
- 默认 mock 启动与页面层接口保持不变

## 未做事项

- 未决定真实认证 header 名称
- 未接入真实 token 来源
- 未把 auth resolver 接入默认 runtime 启动
- 未扩展到 `dashboard / environments / eval`

## 下一棒建议

在明确 token 来源后，把 auth resolver 显式接入 `browser-fetch-source` 或 `global-browser-fetch` 路径，并补对应集成测试。
