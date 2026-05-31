# Observe-only Checkout 历史残留清理验证记录

> 状态：historical-reference
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-05-03
> source_of_truth：projects/aimandala/docs/qa/2026-05-03-observe-only-checkout-历史残留清理验证记录.md
> 项目：aimandala
> 阶段：verification
> depends_on：projects/aimandala/docs/runbooks/2026-05-03-observe-only-checkout-治理-runbook.md
> depends_on：projects/aimandala/docs/qa/2026-05-03-observe-only-checkout-治理-qa-basis.md

## 1. 当前验证结论

automation 节点本轮 observe-only checkout 与历史 dirty worktree 清理已经完成。

当前确认通过的事实为：

1. `/opt/automation/app/mindsync`
   - 已恢复干净
   - 当前为 `main...origin/main`
2. `/opt/automation/app/mindsync-heartbeat`
   - 已恢复干净
   - 当前为 `main...origin/main`
3. `/opt/automation/worktrees`
   - 已无 dirty worktree 残留
4. 被清理的历史现场都已先备份，再移除
5. 对应 `MIN-150 / MIN-160 / MIN-163 / MIN-165`
   - 已转为 `blocked`
   - 已补“历史 worktree 归档说明”评论

## 2. 已执行验证

### 2.1 observe-only checkout 清理

已执行：

1. 对 `/opt/automation/app/mindsync` 执行现场备份后 `reset --hard + clean -fd`
2. 对 `/opt/automation/app/mindsync-heartbeat` 执行现场备份后 `reset --hard + clean -fd`

结果：

1. 两个 observe-only checkout 当前都回到 `origin/main`
2. 后续复核中未再出现新增脏改

### 2.2 历史 dirty worktree 分流

已清理并移除：

1. `done` 但仍残留代码改动：
   - `MIN-134-frontend-quality`
2. `in_review` 且仅剩纯文档残留：
   - `MIN-157-deploy-dev`
   - `MIN-159-nightly-dev-smoke`
   - `MIN-161-nightly-prod-smoke`
3. 进一步复核后确认只是挂在老基线提交上的未提交残留副本：
   - `MIN-150-33`
   - `MIN-160-16`
   - `MIN-163-nightly-prod-smoke`
   - `MIN-165-nightly-dev-smoke`

结果：

1. 所有上述 worktree 都已先打包备份
2. 所有上述 worktree 都已从 `/opt/automation/worktrees` 正式移除
3. 最终复核结果为 `CLEAN`

### 2.3 任务系统状态收口

已执行：

1. 把 `MIN-150 / MIN-160 / MIN-163 / MIN-165` 的 issue 状态统一改为 `blocked`
2. 通过 `POST /api/issues/<issueId>/comments`
   - 单独写入“历史 worktree 归档说明”
3. 逐条核对最新评论 id 与创建时间

结果：

1. 4 个 issue 不再伪装成 `in_progress / in_review`
2. 4 条归档说明评论均已落库并可见

## 3. 本轮关键备份目录

### 3.1 observe-only checkout

1. `/home/ubuntu/cleanup-backups/20260503-185240`
   - 主 checkout / heartbeat checkout 的早期现场备份
2. `/home/ubuntu/cleanup-backups/20260503-185656-heartbeat`
   - heartbeat checkout 清理前备份

### 3.2 done 与 review 残留 worktree

1. `/home/ubuntu/cleanup-backups/20260503-190217-MIN-134-frontend-quality`
2. `/home/ubuntu/cleanup-backups/20260503-190707-doc-review-worktrees/MIN-157-deploy-dev`
3. `/home/ubuntu/cleanup-backups/20260503-190707-doc-review-worktrees/MIN-159-nightly-dev-smoke`
4. `/home/ubuntu/cleanup-backups/20260503-190707-doc-review-worktrees/MIN-161-nightly-prod-smoke`

### 3.3 老基线残留副本

1. `/home/ubuntu/cleanup-backups/20260503-191124-stale-active-worktrees/MIN-150-33`
2. `/home/ubuntu/cleanup-backups/20260503-191124-stale-active-worktrees/MIN-160-16`
3. `/home/ubuntu/cleanup-backups/20260503-191124-stale-active-worktrees/MIN-163-nightly-prod-smoke`
4. `/home/ubuntu/cleanup-backups/20260503-191124-stale-active-worktrees/MIN-165-nightly-dev-smoke`

## 4. 本轮关键判断

本轮有两个关键判断需要固定下来：

1. 并不是所有 `in_progress / in_review` worktree 都应该继续保留。
   只要它没有独立提交历史，只是挂在同一个老基线提交上的未提交残留副本，就应先备份，再从运行目录摘除。
2. 文件系统层清理完成后，还必须把任务系统状态同步收口。
   否则 Paperclip UI 仍会显示任务在跑，但对应 worktree 已不存在。

## 5. 当前残留风险

本轮之后，主要风险已不再是“远端工作区继续变脏”，而是：

1. 被转成 `blocked` 的 4 个 issue
   - 后续是否恢复执行
   - 是否改判为 `done`
   - 是否长期保留为历史阻塞记录
   仍需要按任务治理口径决定
2. backup 目录中保留了完整历史现场
   - 若后续要恢复，必须重新 materialize 新 worktree
   - 不应把备份目录直接当运行目录继续写

## 6. 验证后结论

可以正式确认：

1. 本轮 observe-only checkout 治理不再停留在“只防新增脏改”
2. automation 宿主的历史 dirty worktree 已完成一轮真实清仓
3. 运行态、备份现场与 issue 状态三层已经对齐
