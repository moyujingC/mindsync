# 一镜一梳 To C miniapp 真机灰度上线交付记录

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-13
> source_of_truth：/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-dual-channel-ui/projects/aimandala/docs/delivery/2026-04-13-miniapp-native-gray-delivery.md
> 项目：aimandala
> 阶段：delivery
> depends_on：/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-dual-channel-ui/projects/aimandala/docs/qa/2026-04-13-miniapp-native-gray-verification.md
> reviewers：CEO / Orchestrator, Test / QA

## 1. 本轮交付目标

1. 仓库内新增真机可接入的小程序原生工程壳
2. session exchange 与支付宿主桥进入灰度启用状态
3. 真机灰度启用门槛被文档化

## 2. 交付说明

1. 原生壳只承接平台能力，不承接 shared UI 页面主体
2. `session exchange` 与 `wechatpay-live` 共同构成真机灰度主链
3. 真机灰度通过前，`stub / dry-run` 仍保留给开发与调试
4. backend 已正式接通 `open_id / code -> canonical_user_id` 的最小持久化映射
5. H5 miniapp runtime 已支持 `miniappHost=native + miniappAutoRecover`
6. 原生壳当前通过 `web-view` + bridge 装配现有 shared miniapp runtime

## 3. 本轮完成内容

1. 新增 `backend/app/core/identity/miniapp_session.py`
2. 新增 `POST /api/v2/miniapp/session/exchange`
3. 新增 `frontend/miniapp/native-host.ts` 与对应单测
4. 新增 `frontend/miniapp-native/` 最小微信原生工程壳
5. 更新 frontend/backend README 与运维手册中的灰度门槛说明
6. 新增灰度联调 checklist、配置清单、成功链记录模板、取消链记录模板

## 4. 下一阶段风险

1. 退款、关单、超时取消仍未进入实现
2. 真机与灰度验证仍是上线前必须门槛
3. 若后续放大用户规模，还需补支付对账与运营回查链
4. 当前原生壳依赖 `web-view` bridge，最终灰度前仍需确认 `wx.miniProgram.postMessage` 在目标宿主环境中的行为

## 5. 下一阶段执行入口

1. `/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-dual-channel-ui/projects/aimandala/docs/tasks/2026-04-13-miniapp-gray-checklist.md`
2. `/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-dual-channel-ui/projects/aimandala/docs/tasks/2026-04-13-miniapp-gray-config-manifest.md`
3. `/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-dual-channel-ui/projects/aimandala/docs/delivery/2026-04-13-miniapp-gray-success-chain-record.md`
4. `/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-dual-channel-ui/projects/aimandala/docs/delivery/2026-04-13-miniapp-gray-cancel-chain-record.md`
