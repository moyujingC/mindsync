# 2026-04-17 v1 Providers token source 组合工厂 v2 交付说明

## 本轮目标

把 Providers token 链从“由 token source factory 决定来源”继续推进到“由 token source composition factory 统一收束 default-disabled / static / global 三类来源”，为后续更高层 token 输入收束预留 services 层集中入口。

## 交付边界

- 仅新增 services 层 token source composition factory
- 仅扩展 runtime/deployment/browser 接线
- transport 继续只消费 `authHeadersResolver`
- 不新增 auth env key
- 不引入 refresh / cache / expiry / credential store

## 验证要求

- 自动化测试通过
- 构建通过
- 误导表达搜索通过
