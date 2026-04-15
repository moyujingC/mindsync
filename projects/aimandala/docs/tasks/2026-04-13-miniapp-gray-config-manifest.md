# 一镜一梳 To C miniapp 灰度环境配置清单

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-13
> source_of_truth：/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-dual-channel-ui/projects/aimandala/docs/tasks/2026-04-13-miniapp-gray-config-manifest.md
> 项目：aimandala
> 阶段：config-manifest

## 1. Runtime 域名

1. `runtimeBaseUrl=https://web-gray.jingshu.cc`
2. `apiBaseUrl=https://web-api-gray.jingshu.cc`
3. `AIMANDALA_MINIAPP_WECHATPAY_NOTIFY_URL=https://web-api-gray.jingshu.cc/api/v2/miniapp/payments/wechat/callback`

## 2. Miniapp 会话

1. `AIMANDALA_MINIAPP_WECHAT_APP_ID`
2. `AIMANDALA_MINIAPP_WECHAT_APP_SECRET`
3. `AIMANDALA_MINIAPP_WECHAT_SESSION_BASE_URL=https://api.weixin.qq.com`

## 3. 微信支付 live

1. `AIMANDALA_MINIAPP_PAYMENT_MODE=wechatpay-live`
2. `AIMANDALA_MINIAPP_WECHATPAY_APP_ID`
3. `AIMANDALA_MINIAPP_WECHATPAY_MCH_ID`
4. `AIMANDALA_MINIAPP_WECHATPAY_MCH_CERT_SERIAL_NO`
5. `AIMANDALA_MINIAPP_WECHATPAY_PRIVATE_KEY_PATH`
6. `AIMANDALA_MINIAPP_WECHATPAY_API_V3_KEY`
7. `AIMANDALA_MINIAPP_WECHATPAY_PLATFORM_CERT_PATH`
8. `AIMANDALA_MINIAPP_WECHATPAY_PLATFORM_CERT_SERIAL`
9. `AIMANDALA_MINIAPP_WECHATPAY_ORDER_EXPIRE_MINUTES=15`
10. `AIMANDALA_MINIAPP_WECHATPAY_NOTIFY_DEV_FALLBACK=false`

## 4. 原生壳本机覆盖

1. `frontend/miniapp-native/project.private.config.json`
2. 其中 `appid` 必须与灰度小程序主体一致
3. 该文件不提交，按机器单独维护

## 5. 分离要求

1. 灰度 `.env.gray` 与正式 `.env.release` 分离
2. 灰度端口与正式端口分离
3. 灰度 callback 域名与正式 callback 域名分离
4. 微信开发者工具与真机体验只连灰度域名，不连正式域名
