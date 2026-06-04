# 2026-04-17 v1 Providers auth deployment input 交付说明

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/delivery/2026-04-17-v1-providers-auth-deployment-input-交付说明.md


## 本轮目标

把 Providers auth 从“多种低层 auth 输入都可直接传入”进一步推进到“由 deployment 级 auth input 统一决定 auth 来源”，继续为后续 token provider 演进预留 app 层集中入口。

## 交付边界

- 仅新增 app 层 auth deployment input 装配入口
- 仅扩展 deployment/browser runtime 输入
- services 层继续只消费 `authHeadersResolver`
- 不新增 auth env key
- 不引入 token provider / refresh / cache

## 验证要求

- 自动化测试通过
- 构建通过
- 误导表达搜索通过
