# RelayHub v1 dev-relay 任务矩阵与统一中转入口 QA Basis

> 状态：current
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-05-02
> source_of_truth：/Users/xinran/Downloads/dev/mindsync-worktrees/relayhub-dev/projects/relayhub/qa/2026-05-02-v1-dev-relay-任务矩阵与统一中转入口-qa-basis.md
> 项目：RelayHub
> 阶段：qa

## 1. 验收目标

确认 `dev-relay` 已经支持“任务别名驱动”的统一切模型口径，而不是只支持写死的 Claude/Codex 分支。

## 2. 核心验收项

1. `GET /tasks`
   - 能返回新增的开发线任务：
   - `task-dev-frontend`
   - `task-dev-backend`
   - `task-dev-test-fix`
   - `task-dev-docs`
   - `task-dev-research`
2. `GET /v1/models`
   - 在 Codex relay 开启时
   - 至少返回 `relayhub-task-codex-repo` 和当前绑定的真实模型
3. `POST /v1/chat/completions`
   - 当 `model = relayhub-task-dev-docs`
   - 应按 `task-dev-docs` 当前绑定路由
4. `POST /v1/responses`
   - 当 `model = relayhub-task-dev-backend`
   - 应按 `task-dev-backend` 当前绑定路由
5. 现有主链路不退化：
   - `task-claude-code` 继续可用
   - `task-codex-repo` 继续要求 Responses 流式能力

## 3. 验证方式

- 运行 `dev-relay` 单测
- 运行 `control-plane` 单测
- 检查新增 artifact 与种子任务是否一致

## 4. 风险提醒

- 目前任务别名仍依赖客户端显式传 `model = relayhub-task-*`
- 还没有自动从客户端上下文推断任务
- 还没有自动 fallback
