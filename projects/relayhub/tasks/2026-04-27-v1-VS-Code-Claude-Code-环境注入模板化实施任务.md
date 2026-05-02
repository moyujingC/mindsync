# RelayHub v1 VS Code Claude Code 环境注入模板化实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-27
> source_of_truth：projects/relayhub/tasks/2026-04-27-v1-VS-Code-Claude-Code-环境注入模板化实施任务.md
> 项目：RelayHub
> 阶段：task

## 1. 实施目标

把 `VS Code / Claude Code` 的本地环境注入补成可复制、可执行、可验证的模板化入口。

## 2. 实施内容

- 新增一轮 `spec / task / qa / delivery` artifact，主题明确为“环境注入模板化”
- 在 `projects/relayhub/dev-relay` 新增：
  - `env` 模板
  - `VS Code settings` 模板片段
  - setup 示例脚本
- 更新现有 `VS Code Claude Code` runbook：
  - 明确前台 smoke
  - 明确后台宿主接入
  - 明确哪些文件复制到本地 `.vscode/`
  - 明确哪些文件只是参考模板
- 同步 `specs/README.md`、`tasks/README.md`、`qa/README.md`、`delivery/README.md`

## 3. 测试要求

至少覆盖：

- 模板文件不含真实密钥
- 模板明确不是仓库自动生效配置
- runbook 明确区分 CLI 验证和 VS Code 宿主接入
- 现有 `Claude Code` 页面能力不回归

## 4. 回归要求

必须继续通过：

- `cd projects/relayhub/dev-relay && npm test`
- `cd projects/relayhub/control-plane && npm test`
- `cd projects/relayhub/console && npm test`
- `cd projects/relayhub/console && npm run build`
