# 2026-04-17 v1 Providers auth headers source seam 交付说明

## 本轮交付

- Providers auth 已从“直接传 resolver”推进到“可显式选择 resolver 来源”
- auth headers source seam 当前支持 disabled/static 两种最小来源
- deployment/browser runtime 可显式接入 auth source，默认 mock 启动保持不变

## 未做事项

- 未新增 global token source
- 未新增 env auth source
- 未引入 token provider 抽象
- 未决定真实认证 header 名、token 刷新或凭据存储位置

## 下一棒建议

在 token 来源明确后，为 Providers 增加更正式的 auth source factory 或 token provider seam，再把它接到 browser/global 显式输入链。
