# 一镜一梳 To C miniapp 真机灰度联调 checklist

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-13
> source_of_truth：/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-dual-channel-ui/projects/aimandala/docs/tasks/2026-04-13-miniapp-gray-checklist.md
> 项目：aimandala
> 阶段：ops-checklist

## 1. 微信开发者工具前检查

1. 已复制 `frontend/miniapp-native/project.private.config.example.json` 为本机 `project.private.config.json`
2. `project.private.config.json` 已填入真实灰度 `appid`
3. 启动参数已配置：
   - `apiBaseUrl`
   - `runtimeBaseUrl`
   - 可选 `runtimePath`
4. 开发者账号已加入小程序开发者或体验者列表
5. 小程序后台已配置 request / upload / download / web-view 合法域名

## 2. 灰度环境前检查

1. `AIMANDALA_MINIAPP_PAYMENT_MODE=wechatpay-live`
2. `AIMANDALA_MINIAPP_WECHATPAY_NOTIFY_DEV_FALLBACK=false`
3. 已配置 `AIMANDALA_MINIAPP_WECHAT_APP_ID`
4. 已配置 `AIMANDALA_MINIAPP_WECHAT_APP_SECRET`
5. 已配置全套 `AIMANDALA_MINIAPP_WECHATPAY_*`
6. callback 公网地址可达
7. 平台证书文件与 serial 已核对

## 3. 真机成功链

1. 打开小程序原生壳
2. `wx.login -> session exchange` 成功
3. 创建订单返回 live `request_payment_args`
4. 拉起 `wx.requestPayment`
5. callback 写出 `paid`
6. 前端补跑 `upgrade`
7. `reconcile` 推到 `fulfilled`
8. 最终自动进入 `report`

## 4. 真机取消链

1. 创建订单成功
2. 拉起 `wx.requestPayment`
3. 用户取消
4. 页面保持在选择页或恢复态
5. 不误开 Pro 报告
6. 不触发本地假升级

## 5. 结果核对

1. `GET status` 含 `pro`
2. `GET history` 中该记录含 `pro`
3. `GET report?version=pro` 返回 `200`
4. 日志中能看到：
   - session exchange success
   - order create
   - callback accept 或 mismatch reject
   - `pending -> paid -> fulfilled`
