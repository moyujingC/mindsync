# 一镜一梳历史任务批量关闭 Runbook

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-26
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/runbooks/历史任务批量关闭-runbook.md

## 1. 目标

本 runbook 用于执行 `aimandala` 控制面中的历史任务批量收口。

它解决的问题是：

1. 如何把 `2026-04-26 00:00 Asia/Shanghai` 之前的历史普通任务和历史 automation 任务统一关闭
2. 如何保留极少数例外任务
3. 如何在关闭时统一 comment 口径，避免把 `done` 误解释为“已技术解决”

它不解决的问题是：

1. 不修 heartbeat gate
2. 不修 diagnosis 分桶
3. 不修 automation 模板语义
4. 不修普通任务本地 Mac 自动执行器实现

## 2. 默认执行口径

本 runbook 固定使用下面口径：

1. 新基线时间：`2026-04-26 00:00 Asia/Shanghai`
2. 默认关闭范围：该时间点之前创建的历史普通任务 + 历史 automation 任务
3. 默认终态：`done`
4. 默认例外名单上限：`5`

说明：

1. 这里使用 `done` 只是统一收口状态
2. 不表示任务中的技术问题已解决
3. 这层语义必须通过 comment 明确写出

## 3. 执行前输入

正式批量关闭前，必须准备 3 份输入：

### 3.1 候选清单

候选清单至少应包含：

1. `identifier`
2. `title`
3. `status`
4. `created_at` 或可判定其属于旧窗口的时间依据
5. `task_class`
6. `execution_route`

### 3.2 例外名单

例外名单必须显式列出，不允许口头保留。

字段固定为：

1. `identifier`
2. `保留原因`
3. `预计保留到何时`
4. `继续跟进 owner`

默认规则：

1. 不在例外名单中的旧任务，全部关闭
2. 例外名单总量不超过 `5`

### 3.3 执行人信息

执行 comment 时必须能固定写出：

1. 执行时间
2. 执行人 / 执行角色
3. 基线重置说明

## 4. comment 模板

历史任务批量关闭时，comment 正文固定使用下面模板：

```text
历史任务基线重置时间：<ISO 时间>
- 当前收口状态：done
- 历史窗口：2026-04-26 00:00 Asia/Shanghai 之前创建
- 当前说明：本任务按历史窗口统一收口，不代表问题已技术解决
- 后续口径：后续仅跟踪新基线后产生的新任务
- 若问题仍成立：应由新模板 / 新执行规则重新生成新的任务，而不是继续复用本任务
```

最低字段要求：

1. `历史任务基线重置时间`
2. `当前收口状态`
3. `历史窗口`
4. `当前说明`
5. `后续口径`
6. `若问题仍成立`

## 5. 执行顺序

### 5.1 先 dry-run 小样本

第一次执行时，必须先选小样本 dry-run，而不是直接全量。

推荐最小样本：

1. `2` 条历史普通任务
2. `2` 条历史 automation 任务
3. `1` 条例外名单任务

dry-run 需要确认：

1. 非例外任务会进入关闭集合
2. 例外任务不会被误关
3. comment 模板正文已固定

### 5.2 再执行全量关闭

small sample（小样本）确认无误后，再做全量关闭。

全量关闭时固定顺序：

1. 先过滤新基线前任务
2. 再剔除例外名单
3. 对剩余任务统一写 comment
4. 再统一将状态收口到 `done`

禁止：

1. 边筛选边手改规则
2. 边执行边决定例外名单
3. 在执行中临时改成其他终态

### 5.3 关闭后抽样检查

关闭后至少抽查：

1. `3` 条已关闭普通任务
2. `3` 条已关闭 automation 任务
3. 全部例外名单任务

检查点固定为：

1. 状态已统一为 `done`
2. comment 模板完整
3. comment 明确说明“不是技术问题已解决”
4. 例外名单任务仍保持原状

## 6. 关闭后的观察窗口

历史任务关闭后，默认只观察：

1. 新基线后产生的普通任务
2. 新基线后产生的 automation 任务

但下一阶段唯一第一主线固定为：

1. 普通任务先在本地 Mac 自动执行

这意味着：

1. 历史任务关闭后，不应立刻把主精力转回 heartbeat
2. 也不应先回到 automation 模板语义整改
3. 应先看新的 `manual-review-required + local_manual_review` 任务是否能稳定进入本地执行器

## 7. 关联文档

1. [历史任务全量关闭与新基线切换规格](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-26-历史任务全量关闭与新基线切换规格.md)
2. [历史任务全量关闭与新基线切换实施计划](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-26-历史任务全量关闭与新基线切换实施计划.md)
3. [历史任务全量关闭与新基线切换-qa-basis](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-26-历史任务全量关闭与新基线切换-qa-basis.md)
4. [本地-Mac-自动执行器-runbook.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/runbooks/本地-Mac-自动执行器-runbook.md)
