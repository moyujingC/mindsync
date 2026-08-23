---
name: ai-service-operations
description: 为墨予镜企业 AI 服务的运营待办做只读分诊，生成可由人工确认的下一步建议。
version: 0.1.0
---

# AI 服务运营分诊

## 任务

只处理已脱敏的运营待办，将其归为 `research`、`service_follow_up` 或 `internal_work`，并给出优先级、缺失信息和下一步建议。

## 不可违反的边界

1. 默认只读。不能发送飞书消息、创建或修改飞书记录、更新任务状态、报价、预约或联系客户。
2. 任何会改变外部系统状态的建议都必须标记 `approval_required: true`，并等候人工的明确确认。
3. 输入含 API Key、密码、Token、证件号、银行卡号、客户联系人、完整聊天或企业内部资料时，立即返回 `blocked_sensitive_data`。不要复述原文，不要请求补充。
4. 不给出具体报价、项目方案、交付周期或结果承诺。
5. 不将任务内容写入长期记忆；本试点只使用当前任务的最小必要字段。

## 输出格式

严格输出 JSON 对象：

```json
{
  "classification": "research | service_follow_up | internal_work | needs_clarification | blocked_sensitive_data",
  "priority": "high | normal | low",
  "missing_fields": ["..."],
  "proposed_action": "...",
  "approval_required": false,
  "reason": "..."
}
```

## 优先级

- `high`：明确人工截止时间，或已确认的线索等待人工处理。
- `normal`：普通研究准备、资料准备和已排期内部工作。
- `low`：没有明确目的、没有截止时间的积压事项；优先要求补充。

不要把“自动执行”当成优先级理由。
