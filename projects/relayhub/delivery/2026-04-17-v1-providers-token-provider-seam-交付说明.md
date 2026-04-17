# 2026-04-17 v1 Providers token provider seam 交付说明

## 本轮目标

把 Providers auth 从“上层显式传 resolver/source”进一步推进到“底层支持显式 token provider/source”，为后续接真实 token 来源预留 services 层集中 seam。

## 交付边界

- 仅新增 services 层 token provider seam
- 仅扩展 runtime/deployment/browser 接线
- transport 继续只消费 `authHeadersResolver`
- 不新增 auth env key
- 不引入 refresh / cache / expiry / credential store

## 验证要求

- 自动化测试通过
- 构建通过
- 误导表达搜索通过
