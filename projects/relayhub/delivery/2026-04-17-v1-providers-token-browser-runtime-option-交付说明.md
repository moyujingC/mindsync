# 2026-04-17 v1 Providers token browser runtime option 交付说明

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/delivery/2026-04-17-v1-providers-token-browser-runtime-option-交付说明.md


## 本轮目标

把 Providers token 链从“deployment 级 token input 统一决定来源”继续推进到“browser runtime 级 option 统一决定 token 输入策略”，为后续更高层 token runtime 装配预留 app 层集中入口。

## 交付边界

- 仅新增 app 层 token browser runtime option 装配
- 仅扩展 browser runtime 接线
- services 层继续只消费 `authHeadersResolver`
- 不新增 auth env key
- 不引入 refresh / cache / expiry / credential store

## 验证要求

- 自动化测试通过
- 构建通过
- 误导表达搜索通过
