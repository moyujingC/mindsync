# Codex + Hermes + 飞书运营分诊试点 QA 基线

> 状态：current
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-08-23
> source_of_truth：projects/ai-service-studio/qa/2026-08-23-Codex-Hermes-飞书运营分诊试点-QA基线.md
> 项目：墨予镜企业 AI 服务
> 阶段：qa-basis
> 任务级别：局部实验
> 关联 SPEC：[试点 SPEC](../specs/2026-08-23-Codex-Hermes-飞书运营分诊试点-SPEC.md)

## 1. 本次检查对象

检查 `agent-pilot/` 的离线运行链、配置边界和外部写入保护。它不检查真实飞书权限、真实 Gateway 延迟或模型质量；这些需要用户配置独立测试环境后另开验证记录。

## 2. 必过项

| 编号 | 情形 | 预期 |
| --- | --- | --- |
| Q1 | 未安装 Hermes 或飞书 CLI | `check` 明确报告缺失，命令本身仍可结束 |
| Q2 | 一条普通研究任务 | 返回 `research`、建议动作和 `approval_required: false` |
| Q3 | 缺少标题 | 返回 `needs_clarification`，不猜测任务目的 |
| Q4 | 要求发送消息、修改状态或创建记录 | 返回 `proposal_only` 或 `handoff_required`，且 `approval_required: true` |
| Q5 | 输入含 Token、密码、联系人或证件号 | 返回 `blocked_sensitive_data`，输出不含原值 |
| Q6 | 默认配置执行写入命令 | 失败，且不调用任何外部命令 |
| Q7 | 即使显式传入 `--confirm`，但记录未批准 | 失败，且不调用任何外部命令 |
| Q8 | 无凭证运行自动化测试 | 所有测试通过 |

## 3. 回归点

- 修改 Hermes Skill 时，重复 Q2-Q5，确认文字规则与脚本规则不相互冲突。
- 修改飞书命令模板时，先重复 Q1-Q8，再只读访问模拟表；单次最多读取 5 条。
- 开启写回前，新增“同一条记录、同一字段、幂等键、人工批准标记”的真实集成测试。

## 4. 退回条件

任一必过项失败即不允许进入真实飞书演练。出现凭证、真实客户数据或未经确认的外部写入，立即停止该试点实例，撤销测试配置并人工检查日志。
