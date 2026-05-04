# 2026-04-17 v1 Providers token deployment input 交付说明

## 本轮目标

把 Providers token 链从“多种低层 token 输入都可直接传入”继续推进到“由 deployment 级 token input 统一决定 token 来源”，为后续更高层 token runtime 输入收束预留 app 层集中入口。

## 交付边界

- 仅新增 app 层 token deployment input 装配
- 仅扩展 deployment/browser runtime 接线
- services 层继续只消费 `authHeadersResolver`
- 不新增 auth env key
- 不引入 refresh / cache / expiry / credential store

## 验证要求

- 自动化测试通过
- 构建通过
- 误导表达搜索通过
