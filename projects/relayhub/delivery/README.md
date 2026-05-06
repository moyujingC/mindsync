# Delivery

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/delivery/README.md


这里放 `RelayHub` 的交付记录、阶段 handoff 和实现后结论。

`delivery` 用于承接窗口性证据链，不用于替代长期 `spec`、`task` 或 `qa`。

当前目录入口说明：

- `delivery` 用于阶段性交付记录、handoff 和实现后结论
- 本目录中的带日期文档默认属于窗口性证据链，不承担长期 canonical 职责
- 进入本目录前，先以 [PROJECT.md](../../../projects/relayhub/PROJECT.md)、[specs/README.md](../../../projects/relayhub/specs/README.md)、[tasks/README.md](../../../projects/relayhub/tasks/README.md) 为上游入口

进入本目录前，先对齐：

- [本项目 PROJECT.md](../../../projects/relayhub/PROJECT.md)
- [2026-04-16-RelayHub-v1-架构与产品定义.md](../specs/2026-04-16-RelayHub-v1-架构与产品定义.md)
- [2026-04-16-v1-最小立项与实现准备任务.md](../tasks/2026-04-16-v1-最小立项与实现准备任务.md)

当前窗口交付链：

- [2026-04-27-v1-VS-Code-Claude-Code-主路径收口-交付说明.md](./2026-04-27-v1-VS-Code-Claude-Code-主路径收口-交付说明.md)
- [2026-04-27-v1-VS-Code-Claude-Code-环境注入模板化-交付说明.md](./2026-04-27-v1-VS-Code-Claude-Code-环境注入模板化-交付说明.md)
- [2026-04-27-v1-VS-Code-Claude-Code-本地配置检查闭环-交付说明.md](./2026-04-27-v1-VS-Code-Claude-Code-本地配置检查闭环-交付说明.md)
- [2026-04-27-v1-VS-Code-Claude-Code-本机直接可用收口-交付说明.md](./2026-04-27-v1-VS-Code-Claude-Code-本机直接可用收口-交付说明.md)
- [2026-04-27-v1-Claude-Code-双中转入口便捷切换-交付说明.md](./2026-04-27-v1-Claude-Code-双中转入口便捷切换-交付说明.md)

较早窗口交付链：

- [2026-04-19-v1-control-plane-release-交付说明.md](./2026-04-19-v1-control-plane-release-交付说明.md)
- [2026-04-19-v1-治理控制台主路径可用性收口-交付说明.md](./2026-04-19-v1-治理控制台主路径可用性收口-交付说明.md)
- [2026-04-19-v1-模型激活闭环收口-交付说明.md](./2026-04-19-v1-模型激活闭环收口-交付说明.md)
- [2026-04-19-v1-任务级默认模型快速切换-交付说明.md](./2026-04-19-v1-任务级默认模型快速切换-交付说明.md)
- [2026-04-19-v1-预置模型质量与选型引导收口-交付说明.md](./2026-04-19-v1-预置模型质量与选型引导收口-交付说明.md)
- [2026-04-19-v1-运行记录主路径收口-交付说明.md](./2026-04-19-v1-运行记录主路径收口-交付说明.md)
- [2026-04-20-v1-中转入口优先的模型库与任务切换收口-交付说明.md](./2026-04-20-v1-中转入口优先的模型库与任务切换收口-交付说明.md)
- [2026-04-21-v1-AITechFlux-中转入口预置接入-交付说明.md](./2026-04-21-v1-AITechFlux-中转入口预置接入-交付说明.md)
- [2026-04-21-v1-中转入口可用模型列表拉取与-modelId-切换-交付说明.md](./2026-04-21-v1-中转入口可用模型列表拉取与-modelId-切换-交付说明.md)
- [2026-04-21-v1-Claude-Code-可调用的最小-dev-relay-接入-交付说明.md](./2026-04-21-v1-Claude-Code-可调用的最小-dev-relay-接入-交付说明.md)
- [2026-04-21-v1-Claude-Code-Anthropic兼容接入-交付说明.md](./2026-04-21-v1-Claude-Code-Anthropic兼容接入-交付说明.md)
- [2026-04-22-v1-Claude-Code-CLI-真链路收口-交付说明.md](./2026-04-22-v1-Claude-Code-CLI-真链路收口-交付说明.md)
- [2026-04-24-v1-Claude-Code-任务页一键切模型-交付说明.md](./2026-04-24-v1-Claude-Code-任务页一键切模型-交付说明.md)
- [2026-04-24-v1-Claude-Code-任务页切后即验-交付说明.md](./2026-04-24-v1-Claude-Code-任务页切后即验-交付说明.md)
- [2026-04-24-v1-本地可互动控制台开发口径收口-交付说明.md](./2026-04-24-v1-本地可互动控制台开发口径收口-交付说明.md)
- [2026-04-22-v1-Claude-Code-本地联调与-AITechFlux-任务切模型-交付说明.md](./2026-04-22-v1-Claude-Code-本地联调与-AITechFlux-任务切模型-交付说明.md)
- [2026-04-26-v1-Codex-first-原生-Responses-接入-交付说明.md](./2026-04-26-v1-Codex-first-原生-Responses-接入-交付说明.md)
- [2026-04-27-v1-Codex-任务页快捷切换与切后即验-交付说明.md](./2026-04-27-v1-Codex-任务页快捷切换与切后即验-交付说明.md)
- [2026-04-27-v1-Codex-线路临时停用与-Claude-Code-优先-交付说明.md](./2026-04-27-v1-Codex-线路临时停用与-Claude-Code-优先-交付说明.md)
