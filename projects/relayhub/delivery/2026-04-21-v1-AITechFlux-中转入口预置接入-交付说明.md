# RelayHub v1：AITechFlux 中转入口预置接入交付说明

## Summary

本轮交付把 `AITechFlux` 接入为 `RelayHub` 的系统预置中转入口。

交付后，用户在模型库中可直接看到该入口，默认不需要手填：

- `baseUrl`
- `purchaseUrl`
- `modelId`

只需补 `API Key`，保存并测试连接，即可把该入口纳入任务库默认模型绑定与切换。

## Delivery Notes

- 预置入口固定为 `relay-api`
- 锁定 `baseUrl=https://aitechflux.com/v1`
- 锁定 `modelId=claude-sonnet`
- 页面继续沿用“预置入口锁定、补 Key 激活”的现有交互
- 不新增 control-plane 路由
