# 2026-04-17 v1 Providers token source 组合工厂 交付说明

## 本轮目标

把 Providers token 链从“可直接传 token provider/source”进一步推进到“由 token source factory 统一决定 token 来源”，为后续更高层 token 输入收束预留 services 层集中入口。

## 交付边界

- 仅新增 services 层 token source factory
- 仅扩展 runtime/deployment/browser 接线
- transport 继续只消费 `authHeadersResolver`
- 不新增 auth env key
- 不引入 refresh / cache / expiry / credential store

## 验证要求

- 自动化测试通过
- 构建通过
- 误导表达搜索通过
