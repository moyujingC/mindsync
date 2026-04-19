# 2026-04-17 v1 Providers auth headers source 组合工厂 v2 交付说明

## 本轮目标

把 Providers auth 从“已有多个 source / factory mode”进一步推进到“由单一 composition factory 统一决定 auth source 来源”，为后续 token provider 演进继续预留集中入口。

## 交付边界

- 仅新增 auth source composition factory
- 仅收束 `default-disabled / static / global`
- 不新增 auth env key
- 不引入 token provider / refresh / cache
- 不默认启动自动读取 global auth resolver

## 验证要求

- 自动化测试通过
- 构建通过
- 误导表达搜索通过
