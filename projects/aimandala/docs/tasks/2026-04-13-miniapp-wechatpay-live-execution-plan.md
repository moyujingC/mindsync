# 一镜一梳 To C miniapp 普通商户 JSAPI 真实支付执行计划

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-13
> source_of_truth：/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-dual-channel-ui/projects/aimandala/docs/tasks/2026-04-13-miniapp-wechatpay-live-execution-plan.md
> 项目：aimandala
> 阶段：implementation-plan
> depends_on：/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-dual-channel-ui/projects/aimandala/docs/specs/2026-04-13-miniapp-wechatpay-live-addendum.md
> reviewers：CEO / Orchestrator, Backend, Test / QA

## 1. 本轮实现

1. backend 新增 `wechatpay-live` provider、真实 JSAPI 下单 client 和支付配置校验
2. order store 增加支付过期时间、支付确认原始载荷等 live 必需字段
3. 新增 `POST /api/v2/miniapp/payments/wechat/callback`
4. `POST /api/v2/miniapp/payments/wechat/notify` 改为 dev-only fallback
5. frontend miniapp purchase adapter 分成真实宿主与浏览器 emulator 两条路径
6. `order-runtime` 在 live 模式下改为 `host success -> poll paid -> upgrade -> reconcile`
7. README、运维说明、qa、delivery 同步更新

## 2. 本轮不做

1. Lite 下单
2. 服务商模式
3. 退款、关单、订单查询补偿任务
4. 小程序独立支付页

## 3. 实现顺序

1. 先落 backend provider、回调和测试
2. 再落 frontend live host adapter 和恢复链
3. 最后补文档和联调说明
