# 一镜一梳 To C miniapp 普通商户 JSAPI 真实支付 addendum

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-13
> source_of_truth：/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-dual-channel-ui/projects/aimandala/docs/specs/2026-04-13-miniapp-wechatpay-live-addendum.md
> 项目：aimandala
> 阶段：spec
> depends_on：/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-dual-channel-ui/projects/aimandala/docs/specs/2026-04-12-miniapp-wechatpay-contract-addendum.md
> reviewers：CEO / Orchestrator, Architect, Backend, Test / QA

## 1. 本轮目标

在现有 `contract-ready wechatpay` 基线上，把 miniapp Pro 购买推进到“普通商户 JSAPI 真实支付可上线”状态：

1. 订单创建返回真实 `wx.requestPayment` 参数
2. 真实支付确认以微信回调为唯一支付真相源
3. 浏览器调试壳只保留 emulator / dev fallback 能力
4. shared UI 继续不承接支付壳逻辑

## 2. live provider 语义

支付 mode 正式收口为：

1. `stub`
2. `wechatpay-dry-run`
3. `wechatpay-live`

兼容旧值 `wechatpay`，但仅按 `wechatpay-dry-run` 处理。

当 mode 为 `wechatpay-live` 时：

1. `POST /api/v2/miniapp/orders` 必须校验完整商户配置
2. `open_id` 缺失时直接阻断，不创建真实订单
3. `wechat_pay_payload` 继续返回：
   - `mode: "wechatpay"`
   - `order_id`
   - `next_action: "wait_for_payment_confirmation"`
   - `dry_run: false`
   - `request_payment_args`
4. `request_payment_args` 必须直接对齐 `wx.requestPayment`

## 3. 真实回调语义

新增生产支付确认入口：

- `POST /api/v2/miniapp/payments/wechat/callback`

固定规则：

1. 只接受微信支付 v3 JSON 回调
2. 固定先验签，再解密 `resource`
3. 只接受 `trade_state=SUCCESS`
4. 用 `out_trade_no` 命中当前 `order_id`
5. 必须校验 `appid / mchid / payer.openid / amount.total`
6. 通过后幂等写入 `purchase_state=paid`

当前 JSON：

- `POST /api/v2/miniapp/payments/wechat/notify`

继续保留，但只允许 `dev/local fallback` 使用；默认关闭。

## 4. 订单状态正式语义

从本 addendum 开始，生产主链只真正依赖：

1. `pending`
2. `paid`
3. `fulfilled`

状态推进固定为：

1. `pending` 在未收到真实支付确认时保持 `pending`
2. `paid` 仅表示支付确认已写入，尚未完成 Pro 升级履约
3. `fulfilled` 表示支付确认和 Pro 升级写回都已完成

`failed / cancelled` 仅保留给 `dev fallback` 或后续关单扩展，不作为当前 live 主路径真相源。

## 5. 前端壳行为

live 模式下：

1. 若 `session.platformUserId` 缺失，前端必须阻断下单并提示先恢复微信会话
2. 宿主 `success` 后，不再直接 `notify paid`
3. 前端只做短轮询等待订单进入 `paid`
4. 一旦订单进入 `paid`，前端显式调用现有 `upgrade`
5. `upgrade + reconcile` 成功后才打开 Pro 报告

结论：

1. 真实支付结果不再由前端宿主“自报成功”决定
2. 浏览器调试壳继续可模拟支付，但不代表生产语义
