# 一镜一梳 To C miniapp 普通商户 JSAPI 真实支付交付记录

> 状态：current
> 版本：0.1.1
> owner：Engineer
> last_updated：2026-04-15
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-13-miniapp-wechatpay-live-delivery.md
> 项目：aimandala
> 阶段：delivery
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-13-miniapp-wechatpay-live-verification.md
> reviewers：CEO / Orchestrator, Test / QA

## 1. 本轮交付目标

1. miniapp Pro 购买进入普通商户 JSAPI 真实支付主链
2. 微信回调成为唯一支付真相源
3. 浏览器调试壳退回 emulator / dev fallback
4. shared UI 保持不承接支付宿主逻辑

## 2. 交付说明

1. 后端已支持 `stub / wechatpay-dry-run / wechatpay-live`
2. `wechatpay-live` 已落普通商户 `JSAPI` 下单、真实 `request_payment_args` 生成和回调验签解密
3. `POST /api/v2/miniapp/payments/wechat/callback` 已作为生产支付确认主入口接通
4. `POST /api/v2/miniapp/payments/wechat/notify` 已降级为 dev-only fallback，默认关闭
5. miniapp 前端已新增真实微信宿主 adapter，live 模式宿主成功后只会轮询等订单进入 `paid`
6. live 模式下缺 `open_id` 会直接阻断，不再本地伪造下单成功
7. 本轮自动化验证已通过：
   - `pytest projects/aimandala/toC/app/backend/tests/unit/test_api_health.py`
   - `pytest projects/aimandala/toC/app/backend/tests/unit/test_miniapp_wechatpay_live.py`
   - `npm test`
   - `npm run typecheck`
   - `npm run build:mobile-web`

## 2.1 当前口径补充

1. 本文档对应的 `wechatpay-live` gray 能力与配套文档现已并入 `main`
2. 当前口径是“已并主干、默认灰度关闭、可联调参考”，不是“已正式放量上线”
3. 当前 Web 主链不依赖这组能力，因此它不构成 Web 默认放行门
4. 后续若继续做真实微信联调，应以 `2026-04-15 batch E` 的 runbook 和交付链继续回写

## 3. 下一阶段风险

1. 微信平台证书轮换与序列号更新仍需运维手册落地
2. 退款、关单、超时取消尚未进入本轮
3. 真机与灰度环境是本轮之后的必须门槛

## 4. 当前后续路径

1. 当前继续开发与分批摘入时，唯一并行来源分支是 `codex/aimandala-dual-channel-ui`
2. 若继续推进微信真机支付联调，应优先参考：
   - `/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-13-miniapp-gray-checklist.md`
   - `/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-13-miniapp-gray-config-manifest.md`
   - `/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-15-miniapp-batch-e-真实微信宿主与独立购买收束交付记录.md`
