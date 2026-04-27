# Delivery

这里放 `RelayHub` 的交付记录、阶段 handoff 和实现后结论。

`delivery` 用于承接窗口性证据链，不用于替代长期 `spec`、`task` 或 `qa`。

当前阶段：

- 本轮只完成 capability 正式立项与最小 artifact 建立
- 尚未进入实现与交付窗口

进入本目录前，先对齐：

- [本项目 PROJECT.md](/Users/xinran/Downloads/dev/mindsync/projects/relayhub/PROJECT.md)
- [2026-04-16-RelayHub-v1-架构与产品定义.md](/Users/xinran/Downloads/dev/mindsync/projects/relayhub/specs/2026-04-16-RelayHub-v1-架构与产品定义.md)
- [2026-04-16-v1-最小立项与实现准备任务.md](/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-16-v1-最小立项与实现准备任务.md)

当前阶段补充入口：

- [2026-04-19-v1-control-plane-release-交付说明.md](/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/delivery/2026-04-19-v1-control-plane-release-交付说明.md)
- [2026-04-19-v1-治理控制台主路径可用性收口-交付说明.md](/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/delivery/2026-04-19-v1-治理控制台主路径可用性收口-交付说明.md)
- [2026-04-19-v1-模型激活闭环收口-交付说明.md](/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/delivery/2026-04-19-v1-模型激活闭环收口-交付说明.md)
- [2026-04-19-v1-任务级默认模型快速切换-交付说明.md](/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/delivery/2026-04-19-v1-任务级默认模型快速切换-交付说明.md)
- [2026-04-19-v1-预置模型质量与选型引导收口-交付说明.md](/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/delivery/2026-04-19-v1-预置模型质量与选型引导收口-交付说明.md)
- [2026-04-19-v1-运行记录主路径收口-交付说明.md](/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/delivery/2026-04-19-v1-运行记录主路径收口-交付说明.md)
- [2026-04-20-v1-中转入口优先的模型库与任务切换收口-交付说明.md](/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/delivery/2026-04-20-v1-中转入口优先的模型库与任务切换收口-交付说明.md)
- [2026-04-21-v1-AITechFlux-中转入口预置接入-交付说明.md](/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/delivery/2026-04-21-v1-AITechFlux-中转入口预置接入-交付说明.md)
- [2026-04-21-v1-中转入口可用模型列表拉取与-modelId-切换-交付说明.md](/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/delivery/2026-04-21-v1-中转入口可用模型列表拉取与-modelId-切换-交付说明.md)
- [2026-04-21-v1-Claude-Code-可调用的最小-dev-relay-接入-交付说明.md](/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/delivery/2026-04-21-v1-Claude-Code-可调用的最小-dev-relay-接入-交付说明.md)
- [2026-04-21-v1-Claude-Code-Anthropic兼容接入-交付说明.md](/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/delivery/2026-04-21-v1-Claude-Code-Anthropic兼容接入-交付说明.md)
- [2026-04-22-v1-Claude-Code-CLI-真链路收口-交付说明.md](/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/delivery/2026-04-22-v1-Claude-Code-CLI-真链路收口-交付说明.md)
- [2026-04-24-v1-Claude-Code-任务页一键切模型-交付说明.md](/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/delivery/2026-04-24-v1-Claude-Code-任务页一键切模型-交付说明.md)
- [2026-04-24-v1-Claude-Code-任务页切后即验-交付说明.md](/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/delivery/2026-04-24-v1-Claude-Code-任务页切后即验-交付说明.md)
- [2026-04-24-v1-本地可互动控制台开发口径收口-交付说明.md](/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/delivery/2026-04-24-v1-本地可互动控制台开发口径收口-交付说明.md)
- [2026-04-22-v1-Claude-Code-本地联调与-AITechFlux-任务切模型-交付说明.md](/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/delivery/2026-04-22-v1-Claude-Code-本地联调与-AITechFlux-任务切模型-交付说明.md)
- [2026-04-26-v1-Codex-first-原生-Responses-接入-交付说明.md](/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/delivery/2026-04-26-v1-Codex-first-原生-Responses-接入-交付说明.md)
- [2026-04-27-v1-Codex-任务页快捷切换与切后即验-交付说明.md](/Users/xinran/Downloads/dev/mindsync-worktrees/relayhub-dev/projects/relayhub/delivery/2026-04-27-v1-Codex-任务页快捷切换与切后即验-交付说明.md)
- [2026-04-27-v1-Codex-线路临时停用与-Claude-Code-优先-交付说明.md](/Users/xinran/Downloads/dev/mindsync-worktrees/relayhub-dev/projects/relayhub/delivery/2026-04-27-v1-Codex-线路临时停用与-Claude-Code-优先-交付说明.md)
- [2026-04-27-v1-VS-Code-Claude-Code-主路径收口-交付说明.md](/Users/xinran/Downloads/dev/mindsync-worktrees/relayhub-dev/projects/relayhub/delivery/2026-04-27-v1-VS-Code-Claude-Code-主路径收口-交付说明.md)
- [2026-04-27-v1-VS-Code-Claude-Code-环境注入模板化-交付说明.md](/Users/xinran/Downloads/dev/mindsync-worktrees/relayhub-dev/projects/relayhub/delivery/2026-04-27-v1-VS-Code-Claude-Code-环境注入模板化-交付说明.md)
- [2026-04-27-v1-VS-Code-Claude-Code-本地配置检查闭环-交付说明.md](/Users/xinran/Downloads/dev/mindsync-worktrees/relayhub-dev/projects/relayhub/delivery/2026-04-27-v1-VS-Code-Claude-Code-本地配置检查闭环-交付说明.md)
- [2026-04-27-v1-VS-Code-Claude-Code-本机直接可用收口-交付说明.md](/Users/xinran/Downloads/dev/mindsync-worktrees/relayhub-dev/projects/relayhub/delivery/2026-04-27-v1-VS-Code-Claude-Code-本机直接可用收口-交付说明.md)
