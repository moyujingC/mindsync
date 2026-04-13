# 一镜一梳 To C 双端共享 UI 统一身份前端契约验证

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-12
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-12-dual-channel-shared-ui-identity-session-verification.md
> 项目：aimandala
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-12-dual-channel-shared-ui-implementation-plan.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-12-dual-channel-shared-ui-qa-basis.md
> reviewers：Test / QA, CEO / Orchestrator

## 1. 本轮目标

1. 前端存在统一的 `FrontendUserSession` 契约，而不是继续把身份语义散落为裸 `userId`
2. `mobile-web` browser shell 改为走 `query -> persisted -> guest` 的会话解析链
3. `miniapp` 补齐预览态与后续微信绑定态的 identity adapter 落点

## 2. 自动化验证

- `npm run typecheck`
- `npm test`
- `npm run build:mobile-web`

结果：全部通过

## 3. 本轮新增检查点

1. `shared/core/identity` 单测覆盖 canonical user id 规范化、guest id 生成、匿名/实名 session 构建
2. `mobile-web/identity` 单测覆盖 query 优先级、persisted fallback、guest fallback、session 持久化
3. `miniapp/identity` 单测覆盖 preview session 与 linked-wechat session
4. `mobile-web/browser-shell` 已改为从 `FrontendUserSession.canonicalUserId` 派生当前用户标识
5. `mobile-web` route input / runtime 已开始优先从 `session` 读取 canonical user id，并兼容 legacy `userId`

## 4. 当前残留风险

1. 后端 `V2` 契约仍以 `user_id` 为正式接口字段，前端本轮只是先完成统一会话抽象
2. `mobile-web/runtime` 与 loader 仍保留部分 `userId` 形参命名，语义上已视作 canonical user id，但尚未全量重命名
3. `miniapp` 身份层目前仍是预览 adapter，尚未接真实微信登录换取流程
