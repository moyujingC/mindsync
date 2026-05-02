# RelayHub v1 Claude Code 本地联调与 AITechFlux 任务切模型验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / QA
> last_updated：2026-04-22
> source_of_truth：projects/relayhub/qa/2026-04-22-v1-Claude-Code-本地联调与-AITechFlux-任务切模型-验证记录.md
> 项目：RelayHub
> 阶段：verification

## 1. 验证目标

确认本地已实现的三段链路可以在同一台机器上闭环：

1. `Claude Code -> dev-relay`
2. `dev-relay -> task-claude-code` 当前绑定入口
3. `AITechFlux` 激活、任务绑定与后续切换生效

## 2. 验证步骤

- 启动本地 `control-plane`
- 启动本地 `dev-relay`
- 为 `preset-aitechflux-relay` 保存 `API Key`
- 拉取 `/models/preset-aitechflux-relay/catalog`
- 选择真实可用 `modelId`
- 测试连接并确认状态为 `active`
- 把 `task-claude-code` 绑定到 `preset-aitechflux-relay`
- 通过 `dev-relay` 发起 Anthropic 与 OpenAI-compatible 两类请求
- 再把 `task-claude-code` 切回控制组入口
- 确认后续 relay 请求跟随切换

## 3. 通过标准

- `GET http://127.0.0.1:4318/health` 返回 `ok`
- `GET http://127.0.0.1:4319/health` 返回 `ok`
- `AITechFlux` 可返回真实 catalog
- 选中真实 `modelId` 后测试连接成功
- `PATCH /tasks/task-claude-code` 后任务绑定可读回
- `dev-relay` 后续请求会跟随 `task-claude-code.defaultModelEntryId` 变化
- 控制组切回后 relay 仍可继续工作

## 4. 实测结果

### 4.1 本地服务健康检查

- `GET http://127.0.0.1:4318/health` 返回 `{"ok":true}`
- `GET http://127.0.0.1:4319/health` 返回 `{"ok":true}`
- 本地 `control-plane` 与 `dev-relay` 已按联调口径分别监听 `4318 / 4319`

### 4.2 AITechFlux 真实 catalog 拉取

- `GET /models/preset-aitechflux-relay/catalog` 成功返回真实上游模型列表
- 实测返回至少包含以下条目：
  - `高性能极速模型`
  - `高性能低价模型`
  - `Claude混合版`
  - `Qwen3.6-35B-A3B`
  - `aitechflux-open-api-high-performance`
  - `aitechflux-high-performance`
- 本轮按计划优先选择 `高性能低价模型`

### 4.3 AITechFlux 激活结果

- 先通过 `PATCH /models/preset-aitechflux-relay` 保存 `API Key`
- 再把 `modelId` 更新为 catalog 中真实可用的 `高性能低价模型`
- `POST /models/preset-aitechflux-relay/test` 返回成功
- 实测状态为：
  - `status=active`
  - `lastTestResult=success`
- 结论：`AITechFlux` 已完成“补 Key -> 拉 catalog -> 选 modelId -> 测试连接”闭环

### 4.4 task-claude-code 绑定与 relay 跟随切换

- 通过 `PATCH /tasks/task-claude-code` 将 `task-claude-code` 绑定到 `preset-aitechflux-relay`
- 之后通过 `POST /v1/messages` 向本地 `dev-relay` 发请求
- relay 返回结果中的 `model` 为 `高性能低价模型`
- 结论：`dev-relay` 已正确读取 `task-claude-code.defaultModelEntryId`，并按当前任务绑定转发到 `AITechFlux`

### 4.5 控制组切换验证

- 再把 `task-claude-code` 切回 `preset-ppchat-relay`
- 后续 relay 请求的错误返回中明确显示：
  - `taskId=task-claude-code`
  - `modelEntryId=preset-ppchat-relay`
  - `modelId=gpt-5`
  - `baseUrl=https://code.ppchat.vip/v1`
- `PPChat` 上游返回 `401`，错误语义为 token 无效
- 结论：
  - 任务切换后的 relay 目标确实发生了变化
  - 这一步证明的是“切换语义生效”
  - 不证明 `PPChat` 当前凭据可用

### 4.6 本地 Claude Code（命令行）联调备注

- 当前机器存在全局 `Anthropic` 相关环境变量污染，默认值会把 `claude` 指向其他上游
- 另外已有后台 `Claude Code` / VS Code 扩展进程在运行，不适合直接拿它作为本轮唯一证据源
- 本轮已确认：
  - `run-claude-code-with-relay.sh` 需要同时导出 `ANTHROPIC_API_KEY`
  - 否则 `claude --bare` 不一定会使用本地 relay token
  - `dev-relay` 还需要补 `Anthropic` 流式事件兼容，才能更接近 `Claude Code` 的真实调用方式
- 本轮已完成：
  - `POST /v1/messages` 在 `stream=true` 时会返回 `Anthropic SSE`（服务器推送事件）格式
  - 直接对本地 `dev-relay` 的流式请求已成功返回 `message_start / content_block_* / message_delta / message_stop`
- 因此本轮主验证结论仍以：
  - 本地 `dev-relay` 成功请求
  - 任务绑定切换后目标跟随变化
  作为正式依据
- `claude --bare -p` 在当前机器上仍未形成稳定“自然退出”证据
- 结论：
  - relay 主链路已打通
  - CLI 客户端仍存在一层待继续收口的兼容细节，但不阻塞本轮“RelayHub 可作为本地中转站”的主结论

### 4.7 风险与观察

- `AITechFlux` 本轮可用，但上游模型没有严格遵守“只返回固定短句”的提示，响应中出现了额外推理文本
- 这不影响 relay 主链路是否打通，但说明上游模型行为仍需按真实模型特性看待，不能把“提示不完全服从”误判成 relay 故障
- `PPChat` 当前仅作为切换控制组；由于凭据无效，不能作为本轮主成功路径

### 4.8 本轮结论

- 通过
- 已证明以下最小闭环成立：
  1. `control-plane` 与 `dev-relay` 共用同一份状态
  2. `AITechFlux` 可被真实激活
  3. `task-claude-code` 可切绑定
  4. relay 后续请求会跟随任务绑定变化

## 5. 备注

- 本轮以本地命令/API 切换为准，不要求页面同源联调
- 若 `AITechFlux` 上游整体失败，允许记录 `PPChat` 控制组可用作为对照，但不替代本轮主结论
