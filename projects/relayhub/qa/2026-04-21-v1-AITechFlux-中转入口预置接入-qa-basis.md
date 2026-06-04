# RelayHub v1：AITechFlux 中转入口预置接入 QA Basis

> 状态：historical-reference
> 版本：0.1.0
> owner：Architect / Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/qa/2026-04-21-v1-AITechFlux-中转入口预置接入-qa-basis.md

## Summary

本轮 QA 只验证 `AITechFlux` 作为系统预置中转入口被正确接入，不验证新的路由、部署或入口内多模型目录能力。

## Checks

- `/models` 中能看到 `AITechFlux 中转`
- 条目展示 `purchaseUrl`
- 编辑时：
  - `baseUrl` 锁定
  - `modelId` 锁定
  - `kind` 锁定
- 条目仍支持补 `API Key`、保存和测试连接
- `GET /models` 返回 `preset-aitechflux-relay`
- `PATCH /models/:id` 不允许改写 `baseUrl`、`modelId`、`kind`
- 现有其他预置入口行为不回归

## Verification

- `cd projects/relayhub/control-plane && npm test`
- `cd projects/relayhub/console && npm test`
- `cd projects/relayhub/console && npm run build`
