# 2026-04-17 v1 Providers auth header resolver seam 交付说明

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
