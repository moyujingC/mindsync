# Codex + Hermes + 飞书运营分诊试点实施计划

> 状态：working
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-08-23
> source_of_truth：projects/ai-service-studio/tasks/2026-08-23-Codex-Hermes-飞书运营分诊试点-实施计划.md
> 项目：墨予镜企业 AI 服务
> 阶段：implementation-plan
> 任务级别：局部实验
> depends_on：[试点 SPEC](../specs/2026-08-23-Codex-Hermes-飞书运营分诊试点-SPEC.md)、[试点 QA 基线](../qa/2026-08-23-Codex-Hermes-飞书运营分诊试点-QA基线.md)

## 1. 本轮交付

`agent-pilot/` 是项目内唯一的试点实现入口。它应能在没有 Hermes、飞书 CLI、模型密钥和飞书凭证的机器上完成离线演练与安全回归。

## 2. 实施步骤

| 顺序 | 任务 | 产物 | 完成标准 |
| --- | --- | --- | --- |
| 1 | 固化输入/输出与权限合同 | SPEC、示例配置 | 不出现真实凭证和真实客户数据 |
| 2 | 编写 Hermes Skill | `hermes/skills/ai-service-operations/SKILL.md` | 明确只读、敏感阻断和人工确认规则 |
| 3 | 实现本地命令入口 | `bin/pilot.py` | 支持检查、离线路由、受控写入预检查 |
| 4 | 补离线样本与自动化测试 | `tests/` | 覆盖正常、缺字段、敏感、外部写入四类情形 |
| 5 | 写运行说明 | `agent-pilot/README.md` | 可区分“离线演练”“Hermes 已接入”“飞书已接入” |
| 6 | 运行 QA 门 | 测试结果与交付记录 | 无真实飞书写入；通过后等待用户配置测试环境 |

## 3. 运行阶段

```text
阶段 A：离线演练（本次）
  fixture JSON -> 确定性规则 / 可选 Hermes -> 建议 JSON

阶段 B：只读飞书测试（需用户提供测试表配置）
  飞书测试表 -> CLI 读 -> 建议 JSON -> 人工核对

阶段 C：受控写回（需单独确认）
  已批准建议 + 显式 --confirm + 写权限 -> 回写同一条测试记录
```

## 4. 退回条件

- 任何命令需要把真实凭证写入仓库：退回 Engineer，改用环境变量或本机配置文件。
- Hermes 无法明确区分建议与执行：退回 Engineer，保持确定性只读模式。
- 飞书 CLI 命令与实际安装版本不兼容：退回 Engineer，先在测试 profile 做只读探测，不绕过 CLI 直接写 API。
- 任何敏感输入被模型请求或输出回显：阻断，退回 Test / QA 和 Engineer。
