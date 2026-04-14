# AI Mandala 批次 D Miniapp API Contract / Stub-Only 实施计划

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-15
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-15-miniapp-batch-d-api-contract-stub-only-实施计划.md
> 项目：aimandala
> 阶段：implementation-plan
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-14-mvp-公开首发收口与小程序渐进并入实施计划.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-15-miniapp-batch-c-静态壳与页面闭环实施计划.md
> reviewers：CEO / Orchestrator, Architect, Engineer, Test / QA

## 1. 背景

批次 C 已把 `miniapp` 静态壳与页面闭环正式落盘，但当前 `/api/v2/miniapp/*` 仍只有前端共享合同，没有后端 stub 路由。

因此批次 D 的目标固定为：

1. 补齐 miniapp API contract-ready / stub-ready 能力
2. 保持 miniapp 与 Web 主链解耦
3. 不提前进入真实微信 `session / pay / native host`

## 2. 本轮目标

本轮固定补齐以下 5 个 stub 路由：

1. `POST /api/v2/miniapp/session/exchange`
2. `POST /api/v2/miniapp/orders`
3. `GET /api/v2/miniapp/orders/{order_id}`
4. `POST /api/v2/miniapp/orders/{order_id}/reconcile`
5. `POST /api/v2/miniapp/payments/wechat/notify`

## 3. 固定边界

本轮只做：

- 前后端 miniapp API 合同对齐
- stub session / order / reconcile / notify 状态机占位
- 独立测试与交付记录

本轮不做：

- 真实微信登录换取
- 真实支付拉起与 host payload
- 真实支付完成后的报告兑现
- miniapp runtime 接入这些 API
- Web 主链数据流改造

## 4. 实现方式

- 后端沿用现有 `pricing / upgrade placeholder` 风格，在 `routes_v2.py` 下新增 miniapp 合同模型与 stub 路由
- miniapp stub 数据单独存放，不与 interpretation record 共用持久化文件
- 前端 `shared/api/services.ts` 保持现有签名，只补 contract tests

## 5. 固定行为

### 5.1 session exchange

- 接受 `code | open_id | debug_canonical_user_id`
- 三者都缺失时返回 `400`
- `debug_canonical_user_id` 优先返回实名 stub session
- `code` 可推导确定性 stub `open_id`
- 返回确定性的 `canonical_user_id / open_id / session_id / display_label`

### 5.2 order create / get / notify / reconcile

- create 时校验 `interpretation_id` 存在
- `purchase_state` 初始为 `pending`
- 金额固定取当前 pricing 快照
- `wechat_pay_payload` 固定为 `mode=stub`
- notify 只推进订单状态，不写 interpretation
- reconcile 只在 `paid` 时推进到 `fulfilled`

## 6. 验证要求

- 先补 backend contract tests 与 frontend service contract tests
- 完整验证命令按本轮 QA 基线执行
- delivery 中必须写明“contract-ready，不是 live miniapp”
