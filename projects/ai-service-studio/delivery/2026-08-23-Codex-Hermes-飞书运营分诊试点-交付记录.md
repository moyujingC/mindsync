# Codex + Hermes + 飞书运营分诊试点交付记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test QA
> last_updated：2026-08-23
> source_of_truth：projects/ai-service-studio/delivery/2026-08-23-Codex-Hermes-飞书运营分诊试点-交付记录.md
> 项目：墨予镜企业 AI 服务
> 阶段：delivery
> 任务级别：局部实验
> depends_on：[试点 SPEC](../specs/2026-08-23-Codex-Hermes-飞书运营分诊试点-SPEC.md)、[实施计划](../tasks/2026-08-23-Codex-Hermes-飞书运营分诊试点-实施计划.md)、[QA 基线](../qa/2026-08-23-Codex-Hermes-飞书运营分诊试点-QA基线.md)

## 1. 交付结果

已交付一个无凭证、可离线运行的运营分诊试点包：

- `agent-pilot/bin/pilot.py`：环境检查、离线路由、外部写入保护。
- `agent-pilot/hermes/skills/ai-service-operations/SKILL.md`：Hermes 分诊 Skill。
- `agent-pilot/config/pilot.example.json`：只含环境变量名称的配置模板。
- `agent-pilot/tests/`：离线样本和自动化回归测试。

当前实现状态是 `offline_simulation`。未安装 Hermes、未安装飞书 CLI、未配置飞书 profile 时，试点会明确报告缺失并继续支持离线测试；没有把任何一个缺失项描述成“已上线”。

## 2. 验证记录

2026-08-23 在本机执行：

```bash
python3 -m py_compile projects/ai-service-studio/agent-pilot/bin/pilot.py
python3 projects/ai-service-studio/agent-pilot/bin/pilot.py check
python3 projects/ai-service-studio/agent-pilot/bin/pilot.py route
python3 -m unittest discover -s projects/ai-service-studio/agent-pilot/tests -v
```

结果：7/7 测试通过。覆盖普通研究任务、人工确认任务、缺标题、敏感内容不回显、Gateway 缺密钥降级和默认写回拒绝。

额外验证：`pilot.py write --approved --confirm` 在默认配置下返回“飞书适配器未启用”，未调用外部命令。

## 3. 当前风险与不做声明

- Hermes 和 `feishu-cli` 尚未安装或配置在本机；本次没有真实 API 调用、真实飞书读取或写入。
- Hermes API Server 可能包含终端等工具。接入前必须建立独立无工具/只读 profile，并保持仅本机监听和 Bearer Key 鉴权。
- 飞书 CLI 的多维表格命令模板需要根据用户创建的测试表和当时安装版本做只读探测后再填写；不能猜测表字段或直接启用写回。
- 当前没有启用 Hermes 记忆、定时任务或无人值守操作。

## 4. 下一阶段 handoff

交给 CEO / 人工运营负责人确认以下条件后，才进入阶段 B（只读飞书演练）：

1. 安装 Hermes 与 `feishu-cli`，但不复用含危险工具的 Hermes profile。
2. 创建一张只含模拟、脱敏任务的飞书多维表格，最多准备 5 条记录。
3. 在仓库外创建私有配置，提供飞书 profile、App Token、Table ID 和 Hermes Gateway Key 的环境变量名称/实际值。
4. 先验证读 5 条模拟记录并输出本地建议 JSON；人工逐条核对建议，不写回飞书。

阶段 C（飞书写回）需要独立确认，不随本交付自动开启。
