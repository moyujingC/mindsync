# 一镜一梳 To C 双端共享 UI 执行计划

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-12
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-12-dual-channel-shared-ui-implementation-plan.md
> 项目：aimandala
> 阶段：implementation-plan
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-12-dual-channel-shared-ui-spec-addendum.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/decisions/2026-04-12-dual-channel-shared-ui-architecture-decision.md
> reviewers：CEO / Orchestrator, Architect, Test / QA

## 1. 当前任务流

### 1.1 shared

- 新增 `shared/design-system`
- 新增 `shared/ui`
- 抽取第一批可复用展示组件
- 为共享 UI 建立独立测试

### 1.2 web

- 把 `mobile-web` 的报告与历史主体改为消费 `shared/ui`
- 保持现有 `build:mobile-web` 与页面行为不退化

### 1.3 miniapp

- 把 `miniapp` 从占位目录升级为正式渠道入口
- 增加最小页面壳、route 定义与开发说明
- 接入 `shared/ui` 的预览级页面主体

### 1.4 identity

- 先在 artifact 中明确统一账号与历史策略
- 后续再进入真实接口与登录态换取实现

### 1.5 release

- 准备小程序上线前置检查项
- 不在本轮直接接微信支付或审核提交

## 2. 当前批次目标

本批先完成：

1. worktree 分支建立
2. artifact 补齐
3. `shared/design-system` 与 `shared/ui` 建立
4. 报告页与历史页的共享展示主体抽取
5. miniapp 正式入口骨架建立

## 3. 当前不在本批

1. 上传页共享化
2. 微信登录态换取
3. 微信支付
4. 分享能力
5. 真实小程序审核提交

## 4. 通过条件

1. `npm test` 通过
2. `npm run typecheck` 通过
3. `npm run build:mobile-web` 通过
4. shared UI 测试可单独通过
5. 文档 artifact 已回写
