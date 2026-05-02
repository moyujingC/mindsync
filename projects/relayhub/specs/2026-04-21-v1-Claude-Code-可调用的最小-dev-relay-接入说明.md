# RelayHub v1 Claude Code 可调用的最小 dev-relay 接入说明

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect
> last_updated：2026-04-21
> source_of_truth：/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/specs/2026-04-21-v1-Claude-Code-可调用的最小-dev-relay-接入说明.md
> 项目：RelayHub
> 阶段：spec

## 1. 本轮目标

本轮把 RelayHub 第一次收口成“本地 Claude Code 可调用的最小中转站”。

固定链路：

1. 本地 `Claude Code` 请求打到 RelayHub `dev-relay`
2. `dev-relay` 固定读取 `task-claude-code` 当前绑定的默认模型入口
3. RelayHub 使用该入口的 `baseUrl + apiKey + modelId` 转发到上游
4. 当任务库切换 `Claude Code Web Coding` 的默认模型后，后续本地请求自动跟着切换

## 2. 本轮范围

本轮新增一个最小本地服务：

- `projects/relayhub/dev-relay`

职责固定为：

- 暴露本地可调用的 OpenAI-compatible `chat/completions`
- 读取当前 control-plane 的配置真理源
- 解析 `task-claude-code -> defaultModelEntryId -> ModelEntry`
- 转发到绑定入口对应上游

本轮不做：

- `responses`
- 多任务动态选择
- 全局当前任务
- 自动评测
- 自动回写运行记录
- fallback（回退）到第二模型
- release 域名部署

## 3. 固定任务映射

`dev-relay` 不接额外任务参数。

固定映射为：

- `Claude Code -> task-claude-code`

解析规则固定为：

1. 读取 `task-claude-code`
2. 读取其 `defaultModelEntryId`
3. 找到对应模型入口
4. 仅当该入口：
   - `status = active`
   - 具备服务端保存的 `apiKey`
   时才允许继续转发

## 4. 接口与转发语义

### 4.1 本地接口

新增最小本地 HTTP 服务接口：

- `GET /health`
- `POST /chat/completions`

### 4.2 转发规则

`POST /chat/completions` 的最小转发规则固定为：

- 保留请求体主体
- 由 relay 用当前绑定入口的 `modelId` 覆盖或注入 `model`
- 使用当前绑定入口的 `apiKey` 注入 `Authorization: Bearer ...`
- 目标 URL 固定拼接为 `baseUrl + /chat/completions`

### 4.3 协议优先级

本轮优先跑通 `stream`（流式输出）。

若请求为非流式，也继续复用同一条最小转发链路，不拆第二套协议。

## 5. 错误语义

以下错误必须返回清楚可读的说明：

- `task-claude-code` 不存在
- `task-claude-code` 未绑定模型
- 绑定入口不存在
- 绑定入口不是 `active`
- 绑定入口无 `apiKey`
- 上游不可达
- 上游返回非 `2xx`

固定说明口径：

- 未绑定模型：提示先去任务库绑定
- 入口未激活：提示先去模型库测试连接
- 缺少 API Key：提示先补 Key
- 上游非 `2xx`：保留核心状态码与错误摘要，并加最小 RelayHub 包装说明

## 6. 与 control-plane 的关系

`control-plane` 继续是配置真理源。

本轮不新增 `control-plane` 路由。

`dev-relay` 直接复用当前本地持久化状态读取方式，优先读取与 `control-plane` 同一份 `state.json`，确保：

- 控制台改任务绑定
- `dev-relay` 后续转发立即跟随

本轮接受在 relay 进程内直接复用 `control-plane/src/store.mjs` 的读取逻辑。

## 7. 本地接入口径

本轮必须给出明确本地使用口径：

- Claude Code 的 `Base URL（基础地址）` 指向本地 `dev-relay`
- 模型切换动作不在 Claude Code 内完成
- 模型切换统一在 RelayHub 任务库里完成

因此用户心智固定为：

- 本地工具只认一个 RelayHub 入口
- 具体切哪个模型，在 RelayHub 任务库里切

