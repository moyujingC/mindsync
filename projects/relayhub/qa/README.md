# QA

这里放 `RelayHub` 的 QA 基线、验收标准和验证记录。

规则：

- 没有 QA 文档，不进入正式实现
- 先写人工验证口径，再逐步补自动化验证
- 对开发版、生产版和旁路评测的边界要分别验证

当前目录入口说明：

- `qa` 目录保留带日期 `qa-basis` 与验证记录是合理的
- 这些文档默认属于阶段性验收基线与验证证据，不应直接等同于长期 canonical
- 若要判断当前窗口验证口径，优先看当前窗口 QA 链

当前窗口 QA 链：

- [2026-04-27-v1-VS-Code-Claude-Code-主路径收口-qa-basis.md](projects/relayhub/qa/2026-04-27-v1-VS-Code-Claude-Code-主路径收口-qa-basis.md)
- [2026-04-27-v1-VS-Code-Claude-Code-环境注入模板化-qa-basis.md](projects/relayhub/qa/2026-04-27-v1-VS-Code-Claude-Code-环境注入模板化-qa-basis.md)
- [2026-04-27-v1-VS-Code-Claude-Code-本地配置检查闭环-qa-basis.md](projects/relayhub/qa/2026-04-27-v1-VS-Code-Claude-Code-本地配置检查闭环-qa-basis.md)
- [2026-04-27-v1-VS-Code-Claude-Code-本机直接可用收口-qa-basis.md](projects/relayhub/qa/2026-04-27-v1-VS-Code-Claude-Code-本机直接可用收口-qa-basis.md)
- [2026-04-27-v1-Claude-Code-双中转入口便捷切换-qa-basis.md](projects/relayhub/qa/2026-04-27-v1-Claude-Code-双中转入口便捷切换-qa-basis.md)

较早窗口 QA 基线：

- [2026-04-16-v1-qa-basis.md](projects/relayhub/qa/2026-04-16-v1-qa-basis.md)
- [2026-04-16-v1-控制台静态壳-qa-basis.md](projects/relayhub/qa/2026-04-16-v1-控制台静态壳-qa-basis.md)
- [2026-04-18-v1-使用场景与用户旅程收束-qa-basis.md](projects/relayhub/qa/2026-04-18-v1-使用场景与用户旅程收束-qa-basis.md)
- [2026-04-19-v1-治理控制台下的模型库与任务闭环-qa-basis.md](projects/relayhub/qa/2026-04-19-v1-治理控制台下的模型库与任务闭环-qa-basis.md)
- [2026-04-19-v1-治理控制台主路径可用性收口-qa-basis.md](projects/relayhub/qa/2026-04-19-v1-治理控制台主路径可用性收口-qa-basis.md)
- [2026-04-19-v1-模型激活闭环收口-qa-basis.md](projects/relayhub/qa/2026-04-19-v1-模型激活闭环收口-qa-basis.md)
- [2026-04-19-v1-任务级默认模型快速切换-qa-basis.md](projects/relayhub/qa/2026-04-19-v1-任务级默认模型快速切换-qa-basis.md)
- [2026-04-19-v1-预置模型质量与选型引导收口-qa-basis.md](projects/relayhub/qa/2026-04-19-v1-预置模型质量与选型引导收口-qa-basis.md)
- [2026-04-19-v1-运行记录主路径收口-qa-basis.md](projects/relayhub/qa/2026-04-19-v1-运行记录主路径收口-qa-basis.md)
- [2026-04-20-v1-中转入口优先的模型库与任务切换收口-qa-basis.md](projects/relayhub/qa/2026-04-20-v1-中转入口优先的模型库与任务切换收口-qa-basis.md)
- [2026-04-21-v1-AITechFlux-中转入口预置接入-qa-basis.md](projects/relayhub/qa/2026-04-21-v1-AITechFlux-中转入口预置接入-qa-basis.md)
- [2026-04-21-v1-中转入口可用模型列表拉取与-modelId-切换-qa-basis.md](projects/relayhub/qa/2026-04-21-v1-中转入口可用模型列表拉取与-modelId-切换-qa-basis.md)
- [2026-04-21-v1-Claude-Code-可调用的最小-dev-relay-接入-qa-basis.md](projects/relayhub/qa/2026-04-21-v1-Claude-Code-可调用的最小-dev-relay-接入-qa-basis.md)
- [2026-04-21-v1-Claude-Code-Anthropic兼容接入-qa-basis.md](projects/relayhub/qa/2026-04-21-v1-Claude-Code-Anthropic兼容接入-qa-basis.md)
- [2026-04-22-v1-Claude-Code-CLI-真链路收口-qa-basis.md](projects/relayhub/qa/2026-04-22-v1-Claude-Code-CLI-真链路收口-qa-basis.md)
- [2026-04-24-v1-Claude-Code-任务页一键切模型-qa-basis.md](projects/relayhub/qa/2026-04-24-v1-Claude-Code-任务页一键切模型-qa-basis.md)
- [2026-04-24-v1-Claude-Code-任务页切后即验-qa-basis.md](projects/relayhub/qa/2026-04-24-v1-Claude-Code-任务页切后即验-qa-basis.md)
- [2026-04-24-v1-本地可互动控制台开发口径收口-qa-basis.md](projects/relayhub/qa/2026-04-24-v1-本地可互动控制台开发口径收口-qa-basis.md)
- [2026-04-19-v1-control-plane-release-qa-basis.md](projects/relayhub/qa/2026-04-19-v1-control-plane-release-qa-basis.md)
- [2026-04-26-v1-Codex-first-原生-Responses-接入-qa-basis.md](projects/relayhub/qa/2026-04-26-v1-Codex-first-原生-Responses-接入-qa-basis.md)
- [2026-04-27-v1-Codex-任务页快捷切换与切后即验-qa-basis.md](projects/relayhub/qa/2026-04-27-v1-Codex-任务页快捷切换与切后即验-qa-basis.md)
- [2026-04-27-v1-Codex-线路临时停用与-Claude-Code-优先-qa-basis.md](projects/relayhub/qa/2026-04-27-v1-Codex-线路临时停用与-Claude-Code-优先-qa-basis.md)

验证记录入口：

- [2026-04-22-v1-Claude-Code-本地联调与-AITechFlux-任务切模型-验证记录.md](projects/relayhub/qa/2026-04-22-v1-Claude-Code-本地联调与-AITechFlux-任务切模型-验证记录.md)
