# 一镜一梳 To C miniapp 普通商户 JSAPI 真实支付验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-13
> source_of_truth：/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-dual-channel-ui/projects/aimandala/docs/qa/2026-04-13-miniapp-wechatpay-live-verification.md
> 项目：aimandala
> 阶段：qa
> depends_on：/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-dual-channel-ui/projects/aimandala/docs/tasks/2026-04-13-miniapp-wechatpay-live-execution-plan.md
> reviewers：Engineer, Test / QA

## 1. 验证目标

1. `wechatpay-live` 缺配置时不会静默启动
2. live 模式缺 `open_id` 不会创建真实订单
3. 真实回调必须经过验签、解密和订单匹配后才能把订单推进到 `paid`
4. `pending` 不会再被前端或 `reconcile` 伪造成 `paid`
5. frontend live 模式宿主成功后只轮询等待，不直接 `notify paid`
6. 恢复最近购买时，`pending / paid / fulfilled` 语义保持稳定

## 2. 验证命令

1. `pytest projects/aimandala/toC/app/backend/tests/unit/test_api_health.py`
2. `pytest projects/aimandala/toC/app/backend/tests/unit/test_miniapp_wechatpay_live.py`
3. `npm test`
4. `npm run typecheck`
5. `npm run build:mobile-web`

## 3. 本轮结果

1. `test_api_health.py` 通过，dev notify 默认关闭语义已回归
2. `test_miniapp_wechatpay_live.py` 通过，覆盖 live 配置校验、真实下单 shape、订单过期重建、回调验签解密与 paid/fulfilled 推进
3. 前端 `npm test` 通过，live host adapter 与恢复链回归正常
4. 前端 `npm run typecheck` 通过
5. 前端 `npm run build:mobile-web` 通过

## 4. 手工验证

1. 微信开发者工具里验证一次真实 `wx.requestPayment`
2. 灰度环境验证一次真实支付回调写入
3. 支付成功后核对 `status / history / report(version=pro)` 一致
