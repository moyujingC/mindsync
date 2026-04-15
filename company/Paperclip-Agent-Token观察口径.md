# Paperclip Agent Token 观察口径

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-15
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/company/Paperclip-Agent-Token观察口径.md

这份文档用于观察 `Paperclip` 中 Agent 的 token 消耗是否处于健康状态，尤其用于验证：

- `Engineer`
- `Test / QA`

在启用 `session compaction` 之后，是否真的减少了长会话上下文膨胀。

它不定义模型配置本身；模型口径请看：

- [Paperclip-Agent-模型配置总表.md](/Users/xinran/Downloads/dev/mindsync/company/Paperclip-Agent-模型配置总表.md)

## 1. 这份文档解决什么问题

当我们说“省 token 生效了”，不能只靠感觉。

当前应该通过以下三个层面判断：

1. 单次 run 的输入 token 是否还在持续走高
2. 长链路任务是否还在不断复用同一个越来越重的 session
3. session rotation 是否真的发生，并且原因可解释

## 2. 当前适用对象

当前主要用于：

- `Engineer`
- `Test / QA`

当前它们的省 token 策略是：

- 不降模型
- 不切 provider
- 只通过 `session compaction` 限制长会话

当前阈值固定为：

```json
{
  "enabled": true,
  "maxSessionRuns": 12,
  "maxRawInputTokens": 300000,
  "maxSessionAgeHours": 24
}
```

## 3. 优先看哪里

### 3.1 Agent 详情页

先看对应 Agent 的 `runs` 视图。

重点看：

- 每次 run 的：
  - `input`
  - `cached`
  - `output`
  - provider
  - model
- 是否出现明显的“越跑越重”

当前健康信号：

- 相近类型任务中，单次 run 的 `input tokens` 不再持续单向上升
- 即使任务链路较长，也不会无限接近历史峰值

### 3.2 Costs 页面

再看 `Costs` 页面里按 agent 的聚合。

重点看：

- `Engineer`
- `Test / QA`

关注：

- 总 token 量
- 同周期内的输入 token 变化
- 是否仍主要集中在当前模型：
  - `gpt-5.3-codex`

当前健康信号：

- 总 token 仍可能增长，但增长曲线更平稳
- 单位任务对应的 token 消耗没有继续滚大

### 3.3 Task Sessions / 运行态

如果怀疑 session 还在无限复用，应看 task session。

重点看：

- `sessionId`
- `updatedAt`
- `lastRunId`

当前健康信号：

- 同一类持续任务不是永远复用同一个超长 session
- 到达阈值后，应能看到新 `sessionId` 出现

## 4. 当前可追踪字段

当前系统里已经能看到或导出的关键字段包括：

- `inputTokens`
- `cachedInputTokens`
- `outputTokens`
- `provider`
- `model`
- `usageSource`
- `sessionReused`
- `taskSessionReused`
- `freshSession`
- `sessionRotated`
- `sessionRotationReason`

其中最关键的是：

- `sessionRotated`
- `sessionRotationReason`

因为它们能直接说明：

- 这次是不是因为 session compaction 切了新 session
- 为什么切

## 5. 一周观察口径

启用 `session compaction` 后，建议按 1 周窗口看，不要只看单次运行。

### 5.1 观察目标

1. `Engineer` 的单次输入 token 是否不再持续爬升
2. `Test / QA` 的长链路验收任务是否减少“上下文雪球”
3. 是否出现合理的 session rotation

### 5.2 建议比较方式

对比优化前后各 1 周：

- 总 input tokens
- 平均单次 input tokens
- 高输入 run 的数量
- 长链路任务里是否出现新的 sessionId

### 5.3 重点结论标准

可以认为“优化有效”，当同时满足下面至少两条：

1. 单次 run 的 `input tokens` 不再持续走高
2. 高频/长链路任务出现了新的 `sessionId`
3. telemetry 中能看到：
   - `sessionRotated = true`
4. rotation 原因与阈值一致，例如：
   - `session exceeded 12 runs`
   - `session raw input reached 300000 tokens`
   - `session age reached 24 hours`

## 6. 什么不算问题

以下情况当前不应直接判定为故障：

- 出现新的 `sessionId`
- `sessionRotated = true`
- 某次 run 的 token 比上一次高

这些更可能只是正常的成本控制行为。

只有下面情况才需要进一步排查：

- 明明已经启用 `session compaction`，但 session 长期不轮换
- 长链路任务的 input token 仍然持续显著上升
- rotation 发生后，任务质量明显下降
- rotation 发生后，续跑语义丢失严重，导致任务经常重复劳动

## 7. 下一阶段再考虑什么

如果这一轮“限制长会话”后效果仍不够，再考虑下一层优化：

1. 精简 `Engineer / Test / QA` 的提示词与 skills 注入
2. 调整部分任务的 fresh session 策略
3. 为 `codex_local` 准备火山引擎备用链路

本轮不默认进入这些动作。
