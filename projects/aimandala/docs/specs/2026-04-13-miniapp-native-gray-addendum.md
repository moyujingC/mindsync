# 一镜一梳 To C miniapp 真机灰度上线 addendum

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-13
> source_of_truth：/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-dual-channel-ui/projects/aimandala/docs/specs/2026-04-13-miniapp-native-gray-addendum.md
> 项目：aimandala
> 阶段：spec
> depends_on：/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-dual-channel-ui/projects/aimandala/docs/specs/2026-04-13-miniapp-wechatpay-live-addendum.md
> reviewers：CEO / Orchestrator, Architect, Backend, Frontend, Test / QA

## 1. 本轮目标

把已经落好的 `wechatpay-live` 主链推进到“可真机联调、可灰度启用”的状态：

1. 仓库内存在可被微信开发者工具直接打开的最小小程序工程壳
2. 原生壳能为现有 miniapp runtime 提供真实 `session + payment host`
3. 灰度环境能跑通 `session -> 下单 -> wx.requestPayment -> callback -> paid -> upgrade -> fulfilled`

## 2. 原生壳边界

新增原生壳只负责：

1. 小程序 `app.json / project.config.json / 页面入口`
2. `wx.login`
3. `wx.requestPayment`
4. `storage / 生命周期`
5. `web-view` 装配现有 H5 miniapp runtime

现有 `frontend/miniapp/` 继续作为 shared runtime 源头：

1. 报告、历史、选择页主体不迁回原生壳
2. shared UI 不新增支付页
3. 支付和 session 强依赖逻辑仍留在渠道层

## 3. session exchange 语义

新增正式后端接口：

- `POST /api/v2/miniapp/session/exchange`

本阶段固定行为：

1. 请求接受：
   - `code`
   - `open_id`
   - `debug_canonical_user_id`
2. 若传 `open_id`，直接走 open_id 链接路径
3. 若传 `code`，后端调用微信 `jscode2session`
4. 若同一 `open_id` 已存在历史绑定，返回既有 `canonical_user_id`
5. 若不存在绑定：
   - 优先使用 `debug_canonical_user_id`
   - 否则生成稳定 canonical user id

## 4. H5/native host bridge 语义

当前 shared miniapp runtime 不直接调用原生壳 API，而是通过 `web-view bridge` 承接：

1. H5 在 native host 模式下不再使用浏览器 purchase adapter
2. H5 将 `request_payment_args` 通过 bridge 发给原生壳
3. 原生壳调用 `wx.requestPayment`
4. 宿主结束后原生壳刷新 `web-view` URL，并带回：
   - `userId`
   - `openId`
   - `miniappRoute`
   - `interpretationId`
   - `reportVariant`
   - `miniappAutoRecover`
   - `miniappPaymentResult`
5. H5 runtime 根据已有恢复记录自动续接 `recover`

## 5. 灰度上线门槛

灰度环境必须满足：

1. `AIMANDALA_MINIAPP_PAYMENT_MODE=wechatpay-live`
2. `AIMANDALA_MINIAPP_WECHATPAY_NOTIFY_DEV_FALLBACK=false`
3. `session exchange` 已配置真实小程序 `app_id + app_secret`
4. 回调公网域名可达
5. 平台证书与 serial 匹配
6. 真机至少跑通一次成功链和一次取消链
