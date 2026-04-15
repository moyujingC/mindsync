# 一镜一梳 To C miniapp 真机灰度上线执行计划

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-13
> source_of_truth：/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-dual-channel-ui/projects/aimandala/docs/tasks/2026-04-13-miniapp-native-gray-execution-plan.md
> 项目：aimandala
> 阶段：implementation-plan
> depends_on：/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-dual-channel-ui/projects/aimandala/docs/specs/2026-04-13-miniapp-native-gray-addendum.md
> reviewers：CEO / Orchestrator, Backend, Frontend, Test / QA

## 1. 本轮实现

1. backend 新增 `POST /api/v2/miniapp/session/exchange`
2. backend 增加 open_id 到 canonical user 的最小持久化映射
3. frontend miniapp runtime 新增 native host bridge 与自动恢复链
4. 新增最小微信小程序原生工程壳，承接 `wx.login + wx.requestPayment + web-view`
5. README、运维文档、灰度门槛说明同步更新

## 2. 本轮不做

1. 退款
2. 关单
3. 超时取消
4. Lite 下单
5. 订单运营后台

## 3. 实现顺序

1. 先补 artifact
2. 再落 backend session exchange 与测试
3. 再落 H5/native host bridge
4. 最后补原生壳与灰度说明
