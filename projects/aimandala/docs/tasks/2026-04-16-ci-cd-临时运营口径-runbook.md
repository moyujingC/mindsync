# Aimandala CI/CD 临时运营口径 Runbook

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-16-ci-cd-临时运营口径-runbook.md
> 项目：aimandala
> 阶段：implementation-plan
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-16-ci-cd-面板视图与收束规则.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 适用背景

在 `Paperclip` workflow 面板尚未更新前，当前不再把它当作 `CI/CD 当前状态面板` 使用。

临时口径改为：

1. `GitHub Actions` 负责判断当前红绿
2. `Paperclip` 负责承接当前仍需协作的问题
3. 已被后续绿色覆盖的旧失败，不再作为当前处理项

## 2. 默认操作顺序

### 2.1 先看 GitHub

先在 GitHub `Actions` 中判断：

1. 最近 `3-5` 次 run 是红还是绿
2. 最新一次 `ci` 是否通过
3. 最新一次 `deploy` / `smoke` 是否通过
4. 是否存在连续失败

这一步只回答一个问题：

`现在主链健康吗？`

### 2.2 再看 Paperclip

进入 `Paperclip` 后，只看：

1. 最新失败 run 对应的 `commit-summary` 父任务
2. 该父任务下当前仍打开的子任务
3. 当前最新 run 对应的 deploy / smoke 风险单

不要把 workflow 面板里更早的红灯自动理解成“仍然要修”。

## 3. 什么算当前需要处理

只有下面几类情况，才算当前问题：

1. 最新一次 terminal run 失败
2. 最近窗口内连续失败
3. 当前 deploy / smoke 失败且尚无后续成功覆盖
4. 当前 runner / credential / workspace drift 阻塞执行

## 4. 什么不再算当前需要处理

满足下面任一条件时，旧失败默认不再处理：

1. 后续更新的 run 已成功
2. 同类 job 在更近提交上已经恢复为绿色
3. 当前主分支或发布链路已不再被该失败阻塞

这些旧失败仍可保留在历史里，但默认不再进入当前待办。

## 5. 对旧 issue 的临时收束动作

如果某条旧 `commit-summary` 或旧子任务已经被后续绿色覆盖，可执行最小收束动作：

1. 补一条评论：
   - `已被后续成功 run 覆盖，转入历史追溯，不再作为当前处理项。`
2. 若语义明确，可改为 `done`
3. 若暂不关单，也不再把它放进当前关注清单

目标不是“把历史擦干净”，而是停止把旧问题误当成当前问题。

## 6. 当前推荐心智模型

一句话版本：

1. GitHub 看红绿
2. Paperclip 看协作
3. 历史失败只做追溯，不自动变成当前债务

## 7. 通过标准

按本 runbook 操作后，值班或巡检的人应能在很短时间内回答：

1. 现在 `ci` 是不是绿的
2. 现在 `deploy` 是否可放行
3. 当前真正要处理的是哪一个最新失败
4. 哪些旧红灯其实已经不需要再追
