# RelayHub v1 Codex-first 原生 Responses 接入说明

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect
> last_updated：2026-04-26
> source_of_truth：/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/specs/2026-04-26-v1-Codex-first-原生-Responses-接入说明.md
> 项目：RelayHub
> 阶段：spec

## 1. 本轮目标

把 `RelayHub` 从“Claude Code 最小 relay”推进成“Codex 可直接使用的真实入口”。

本轮固定目标：

- `Codex` 不再直连 `code.ppchat.vip`
- `Codex` 改走 `RelayHub -> 购买的中转站 / 官方 API`
- 本地入口固定为 `http://127.0.0.1:4319/v1`
- release 入口固定为 `https://relayhub.jingshu.cc/codex/v1`

## 2. 当前范围

本轮只覆盖 `task-codex-repo`：

- 它是唯一的 Codex 主链路任务
- 不做多 Codex 任务拆分
- 不做多客户端自动识别
- 不做 `responses -> chat/completions` 协议转译

当前路由边界固定为：

- `task-claude-code`
  - 继续服务 Claude Code
- `task-codex-repo`
  - 新增服务 Codex

## 3. 数据面要求

`dev-relay` 本轮新增：

- `GET /v1/models`
- `POST /v1/responses`

其中：

- `GET /v1/models`
  - 只暴露 `task-codex-repo` 当前绑定条目的 `modelId`
  - 不依赖上游实时 `/models`
- `POST /v1/responses`
  - 固定读取 `task-codex-repo`
  - 覆盖请求体中的 `model`
  - 转发到上游 `<baseUrl>/responses`
  - `stream=false` 原样透传 JSON
  - `stream=true` 原样透传 SSE

本轮明确不做：

- `responses` 事件转译
- `chat/completions` 到 `responses` 的桥接
- fallback 自动切流

## 4. 控制面要求

模型入口测试从“假成功”改成“真实探测”。

探测顺序固定为：

1. `GET /models`
2. `POST /responses` 非流式
3. `POST /responses` 流式
4. `POST /chat/completions` 非流式

模型条目必须新增能力摘要：

- `capabilities.responses.ok`
- `capabilities.responses.streamOk`
- `capabilities.chatCompletions.ok`
- `capabilities.lastProbedAt`
- `capabilities.lastErrorMessage`

任务绑定规则固定为：

- `task-codex-repo`
  - 仅允许绑定 `responses.ok=true && streamOk=true` 的入口
- `task-claude-code`
  - 继续允许绑定只支持 `chat/completions` 的入口

## 5. 控制台要求

不新增页面，只增强现有模型库与任务库。

模型库需要明确显示：

- `Responses 可用`
- `Responses 仅非流式可用`
- `仅 Chat 可用`
- `未测试`

任务库对 `Codex Repo Coding` 固定增加前置提示：

- 只有通过 `Responses` 流式探测的入口，才能绑定为 Codex 默认入口

## 6. Release 路由要求

release 侧新增独立路由：

- `location /codex/v1/`

该路由与下列路径完全隔离：

- `/api/control-plane/*`
- `/api/*`
- `/codex/v1/*`

同时必须启用 SSE 友好配置：

- `proxy_http_version 1.1`
- `proxy_buffering off`
- `proxy_request_buffering off`
- 较长 `proxy_read_timeout`
- 禁用该 location 下压缩

## 7. 一句话结论

本轮不是做一个“更大的 Claude relay”，而是补齐 `Codex + Responses + task-codex-repo + release 入口` 这一条最小但真实可用的统一网关主链路。
