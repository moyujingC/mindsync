# 一镜一梳 To C miniapp 真机灰度上线验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-13
> source_of_truth：/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-dual-channel-ui/projects/aimandala/docs/qa/2026-04-13-miniapp-native-gray-verification.md
> 项目：aimandala
> 阶段：qa
> depends_on：/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-dual-channel-ui/projects/aimandala/docs/tasks/2026-04-13-miniapp-native-gray-execution-plan.md
> reviewers：Engineer, Test / QA

## 1. 验证目标

1. 原生小程序工程壳可被微信开发者工具打开
2. session exchange 能用 `open_id` 或 `code` 恢复 miniapp 会话
3. native host 模式下 H5 runtime 不再走浏览器本地假升级
4. `wx.requestPayment` 发起后，H5 能基于恢复记录继续完成 paid/fulfilled 恢复
5. 浏览器调试壳行为不退化

## 2. 验证命令

1. `pytest projects/aimandala/toC/app/backend/tests/unit/test_api_health.py`
2. `pytest projects/aimandala/toC/app/backend/tests/unit/test_miniapp_wechatpay_live.py`
3. `npm test`
4. `npm run typecheck`
5. `npm run build:mobile-web`

结果：

1. `pytest projects/aimandala/toC/app/backend/tests/unit/test_api_health.py` 通过
2. `pytest projects/aimandala/toC/app/backend/tests/unit/test_miniapp_wechatpay_live.py` 通过
3. `npm test` 通过
4. `npm run typecheck` 通过
5. `npm run build:mobile-web` 通过

## 3. 手工验证

1. 微信开发者工具打开原生壳工程
2. 真机拉起一次 `wx.requestPayment`
3. 成功支付后自动回到 `report`
4. 取消支付后仍停留在选择页恢复态

## 4. 本轮自动化检查点

1. backend 已新增 `POST /api/v2/miniapp/session/exchange`
2. `data/miniapp_sessions/` 已进入测试重置范围
3. frontend 已新增 `native-host.ts`，覆盖：
   - 宿主模式解析
   - native bridge 发消息
   - `wechatpay-live` 参数校验
4. `MiniappBrowserShell` 在 `miniappHost=native` 下不再显示浏览器调试控制台
5. 仓库里已新增 `frontend/miniapp-native/` 原生工程壳

## 5. 当前未完成验证

1. 微信开发者工具 smoke 仍需人工确认
2. 真机支付成功 / 取消两条链仍需灰度环境实测
3. callback 公网域名、平台证书轮换、真实商户配置仍需按环境清单逐项核对
4. 真机联调执行时应同步回填：
   - `/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-dual-channel-ui/projects/aimandala/docs/delivery/2026-04-13-miniapp-gray-success-chain-record.md`
   - `/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-dual-channel-ui/projects/aimandala/docs/delivery/2026-04-13-miniapp-gray-cancel-chain-record.md`
