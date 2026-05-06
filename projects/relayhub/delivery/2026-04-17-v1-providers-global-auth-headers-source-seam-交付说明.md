# 2026-04-17 v1 Providers global auth headers source seam 交付说明

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/delivery/2026-04-17-v1-providers-global-auth-headers-source-seam-交付说明.md


## 本轮目标

在不进入 token provider 抽象的前提下，为 Providers auth 增加显式 global resolver 入口，让后续真实 token 来源可以先通过 `globalThis` 注入到现有 runtime 链。

## 交付边界

- 仅新增 explicit global auth headers source seam
- 仅扩展现有 auth source factory 的 `global` 模式
- 不新增 auth env key
- 不接默认启动自动注入
- 不引入 token provider / refresh / cache

## 验证要求

- 自动化测试通过
- 构建通过
- 误导表达搜索通过
