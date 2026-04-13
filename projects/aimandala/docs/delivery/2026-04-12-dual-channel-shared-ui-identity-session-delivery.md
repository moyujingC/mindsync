# 一镜一梳 To C 双端共享 UI 统一身份前端契约交付记录

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-12
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-12-dual-channel-shared-ui-identity-session-delivery.md
> 项目：aimandala
> 阶段：delivery
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-12-dual-channel-shared-ui-implementation-plan.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-12-dual-channel-shared-ui-identity-session-verification.md
> reviewers：CEO / Orchestrator, Test / QA

## 1. 本轮交付

1. 新增 shared identity 类型：`FrontendUserSession`
2. 新增 shared identity 纯函数：canonical user id 规范化、guest session 生成、匿名/实名 session 构建
3. 新增 `mobile-web` identity adapter：
   - query `userId`
   - local storage persisted session
   - guest session fallback
4. 新增 `miniapp` identity adapter：
   - preview session
   - linked-wechat session 占位契约
5. `mobile-web/browser-shell` 改为消费 session，而不是直接硬编码 `demo-user-id`
6. `mobile-web` route input / runtime 开始兼容 `session` 参数，并优先使用 canonical user id

## 2. 对计划的推进位置

本轮对应实现计划中的：

1. `identity` 任务线启动
2. `mobile-web` 壳开始从共享会话契约消费 canonical user id
3. `mobile-web` route/runtime 进入渐进式 session 收口阶段
4. `miniapp` 为后续真实微信身份接入保留正式接口位置

## 3. 下一阶段建议

1. 把 `mobile-web/runtime`、`router-plan`、`loaders` 内部参数逐步收口到 session 语义
2. 明确后端 `微信身份 -> 平台会话 -> 规范用户身份` 的正式换取接口
3. 在 `miniapp` 正式壳里接入真实 session 恢复与历史读取
