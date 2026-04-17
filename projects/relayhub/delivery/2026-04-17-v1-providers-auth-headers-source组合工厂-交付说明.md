# 2026-04-17 v1 Providers auth headers source 组合工厂 交付说明

## 本轮目标

把 Providers auth 从“source seam”继续推进到“source factory”，为后续 token 来源扩展预留集中入口，同时保持默认启动为 mock/disabled。

## 交付边界

- 仅新增 `default-disabled/static` 两种 auth source factory 模式
- 仅接入 Providers runtime/deployment/browser 输入链
- 不新增 env auth key
- 不接真实 token 来源
- 不引入 token provider 抽象

## 验证要求

- 自动化测试通过
- 构建通过
- 误导表达搜索通过
