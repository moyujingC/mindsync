# RelayHub v1 Codex 线路临时停用与 Claude Code 优先实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-27
> source_of_truth：projects/relayhub/tasks/2026-04-27-v1-Codex-线路临时停用与-Claude-Code-优先实施任务.md
> 项目：RelayHub
> 阶段：task
> depends_on：projects/relayhub/tasks/2026-04-26-v1-Codex-first-原生-Responses-接入实施任务.md, projects/relayhub/tasks/2026-04-27-v1-Codex-任务页快捷切换与切后即验实施任务.md

## 1. 实施目标

不删除现有 `Codex` 实现基础，但先把它从当前默认使用路径上停掉，避免继续干扰日常 `Codex` 使用。

当前优先级改为：

- `Codex` 线路临时停用
- `Claude Code` 继续作为当前主开发线路推进
- 等 `Claude Code` 跑稳后，再回到 `Codex` 线路继续开发

## 2. 实施范围

### 2.1 dev-relay

- `GET /v1/models`
- `POST /v1/responses`

默认改为停用状态：

- 未显式开启时直接返回明确停用提示
- 不删除原有实现
- 后续只需通过环境变量恢复即可继续开发

### 2.2 console

- 撤掉任务页顶部新增的 `Codex 当前模型` 快捷区
- 撤掉 `验证 Codex 当前模型`
- 保留任务表格里现有 `task-codex-repo` 数据结构与兼容校验基础

### 2.3 文档与交付

- 新增本轮 `task / qa / delivery`
- 更新 `tasks/README.md`
- 更新 `qa/README.md`
- 更新 `delivery/README.md`

文档口径固定为：

- `Codex -> RelayHub` 当前是暂停主用的开发中线路
- 当前不要把 `Codex` 继续接到 RelayHub 上日常使用
- 当前主路径应优先转向 `Claude Code`

## 3. 非目标

本轮不做：

- 删除 `task-codex-repo`
- 删除 `dev-relay` 的 Codex 相关实现
- 修改 release 上既有 `codex /v1` 部署脚本
- 修改 `Claude Code` 当前主路径

## 4. 回归要求

必须继续通过：

- `cd projects/relayhub/dev-relay && npm test`
- `cd projects/relayhub/console && npm test`
- `cd projects/relayhub/console && npm run build`

