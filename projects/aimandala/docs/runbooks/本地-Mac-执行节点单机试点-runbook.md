# 一镜一梳本地 Mac 执行节点单机试点 Runbook

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-21
> source_of_truth：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/runbooks/本地-Mac-执行节点单机试点-runbook.md

这份 runbook 用于收口 `aimandala` 普通任务接入本地 Mac 执行节点的单机试点操作步骤。

它回答的问题是：

- 你的 Mac 如何直连远端 Paperclip 控制面
- 如何在本地拿到 `Engineer` 或 `Test / QA` 的 local-cli 凭证
- 如何确认自己接的是远端真实控制面，而不是本地假实例
- 如何开始一条 `local_manual_review` 任务的最小闭环
- 如何回写最小 comment 字段并推进状态

它不回答的问题是：

- 如何修改 `PaperclipAI` 源码
- 如何做多开发者共享接入
- 如何做本地节点注册中心或自动选主
- 如何改 heartbeat / diagnosis / audit 的服务器侧主语义

## 1. 适用范围

本 runbook 只适用于下面这类任务：

1. `task_class: manual-review-required`
2. `execution_route: local_manual_review`
3. 需要由你的当前这台 Mac 承接执行

本 runbook 不适用于：

1. `automation-execution + server_automation`
2. deploy / smoke / runner / infra / maintenance
3. `automation-summary / commit-summary` 这类控制面协调父任务

## 2. 前置条件

使用前必须确认：

1. 远端 Paperclip 控制面继续运行在 automation 服务器
2. 你的当前 Mac 已有本地仓库或本地 worktree
3. 本地已可执行：
   - `paperclipai`
   - `curl`
4. 本地可访问仓库中的：
   - [paperclip-local-env.sh](/Users/xinran/.codex/worktrees/31f1/mindsync/shared/tools/paperclip-local-env.sh)

## 3. 本地加载控制面连接

### 3.1 加载基础连接信息

先执行：

```bash
eval "$(/Users/xinran/.codex/worktrees/31f1/mindsync/shared/tools/paperclip-local-env.sh --base)"
```

预期会得到至少下面 3 个变量：

1. `PAPERCLIP_API_URL`
2. `PAPERCLIP_COMPANY_ID`
3. `PAPERCLIP_WAKE_REASON`

通俗讲，这一步是在告诉你的 Mac：

1. 远端控制面在哪
2. 当前公司实例是谁
3. 这次是本地手工接入，而不是服务器自动运行

### 3.2 生成本地 agent 凭证

若你要以 `Engineer` 身份接入，执行：

```bash
eval "$(/Users/xinran/.codex/worktrees/31f1/mindsync/shared/tools/paperclip-local-env.sh engineer)"
```

若你要以 `Test / QA` 身份接入，执行：

```bash
eval "$(/Users/xinran/.codex/worktrees/31f1/mindsync/shared/tools/paperclip-local-env.sh test_qa)"
```

预期会补出：

1. `PAPERCLIP_AGENT_ID`
2. `PAPERCLIP_API_KEY`

说明：

1. 该脚本会优先复用缓存的 local-cli key
2. 若远端可连通，会校验缓存是否仍有效
3. 若缓存失效，会重新向远端控制面申请 local-cli exports

## 4. 确认接到的是远端真实控制面

执行：

```bash
curl -fsS \
  -H "Authorization: Bearer ${PAPERCLIP_API_KEY}" \
  "${PAPERCLIP_API_URL}/api/agents/me"
```

至少确认两件事：

1. 返回的 agent `id` 与 `PAPERCLIP_AGENT_ID` 一致
2. 返回的 agent 确实属于当前远端公司实例

若这一步失败，不应继续开始本地试点。

### 4.1 可选：先跑本地试点助手自检

若你希望先做一层更稳的本地自检，可执行：

```bash
node /Users/xinran/.codex/worktrees/31f1/mindsync/shared/tools/paperclip-local-pilot.mjs doctor
```

它会额外确认：

1. 当前环境变量里的 `PAPERCLIP_API_URL`
2. 当前 `PAPERCLIP_AGENT_ID`
3. `/api/agents/me` 返回的真实 agent 身份
4. 当前 Mac 宿主标识

## 5. 选择试点样本

单机试点必须至少区分下面两类样本：

### 5.1 正样本

选择 1 条真实普通研发任务，要求：

1. `task_class: manual-review-required`
2. `execution_route: local_manual_review`
3. 不是 `automation-summary / commit-summary`

### 5.2 反样本

固定保留：

1. `MIN-137`
   - 摘要任务反例
2. `MIN-133`
   - CI commit-summary 父任务反例

它们不能被误接成你的 Mac 的自动执行目标。

如需先筛候选正样本，可执行：

```bash
node /Users/xinran/.codex/worktrees/31f1/mindsync/shared/tools/paperclip-local-pilot.mjs candidates
```

该命令会默认排除：

1. `source: automation-summary`
2. `commit-summary` / `automation-summary` 这类摘要父任务

## 6. 本地执行最小闭环

### 6.1 本地 claim

先在 issue comment 中回写一条接手 comment，至少包含：

1. 已由你的当前 Mac 接手
2. 本地执行目录 `cwd`
3. 本地 `branch`
4. 当前 `sha`
5. 下一步动作

如需先预览而不真正回写，可执行 dry-run：

```bash
node /Users/xinran/.codex/worktrees/31f1/mindsync/shared/tools/paperclip-local-pilot.mjs claim MIN-119 --cwd /Users/xinran/.codex/worktrees/31f1/mindsync --judgment "已在本地 Mac 接手，准备进入文档收口。" --next "先核对文档链与当前差口，再决定是否进入修改。"
```

若确认无误，再加 `--execute` 真正执行 checkout + `status=in_progress` + comment 回写：

```bash
node /Users/xinran/.codex/worktrees/31f1/mindsync/shared/tools/paperclip-local-pilot.mjs claim MIN-119 --cwd /Users/xinran/.codex/worktrees/31f1/mindsync --judgment "已在本地 Mac 接手，准备进入文档收口。" --next "先核对文档链与当前差口，再决定是否进入修改。" --execute
```

### 6.2 本地 checkout

在你的 Mac 本地仓库或本地 worktree 中处理。

明确禁止：

1. 使用 `/opt/automation/...`
2. 使用服务器 heartbeat checkout
3. 使用服务器 main mirror checkout

### 6.3 本地执行

在本地完成：

1. 分析
2. 修改
3. 验证
4. 判断是否继续推进

### 6.4 本地回写

执行过程中至少要回写下面字段：

1. `cwd`
2. `branch`
3. `sha`
4. 当前判断
5. 已做动作
6. 下一步动作
7. 验证结论

如需在进展、评审或完成时生成标准回写，可使用：

```bash
node /Users/xinran/.codex/worktrees/31f1/mindsync/shared/tools/paperclip-local-pilot.mjs update MIN-119 --status in_review --cwd /Users/xinran/.codex/worktrees/31f1/mindsync --judgment "文档链已收口，可进入交付物验收。" --actions "已补齐 spec / task / qa / verification 互链。" --next "等待 review 结论，再决定是否转 done。" --verification "本地文本卫生检查通过。"
```

确认无误后，再加 `--execute` 真正回写到 issue。

## 7. 推荐状态路径

推荐路径固定为：

1. `todo`
2. `in_progress`
3. `in_review`
4. `done`

若中途受阻，可转：

1. `blocked`

本 runbook 不引入新状态。

## 8. 服务器边界

在本地 Mac 单机试点下，服务器只负责：

1. control plane 展示
2. issue / comment / status 存储
3. 审计与 heartbeat

服务器不负责：

1. 代跑本地 CLI
2. 先 reject 再 handoff
3. 为本地节点离线承担 strict gate 失败责任

## 9. 关联文档

1. spec：
   - [../specs/2026-04-21-local-mac-execution-host-pilot-spec.md](/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/specs/2026-04-21-local-mac-execution-host-pilot-spec.md)
2. task：
   - [../tasks/2026-04-21-local-mac-execution-host-pilot-plan.md](/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/tasks/2026-04-21-local-mac-execution-host-pilot-plan.md)
3. QA：
   - [../qa/2026-04-21-local-mac-execution-host-pilot-qa-basis.md](/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/qa/2026-04-21-local-mac-execution-host-pilot-qa-basis.md)
4. 基础连接脚本：
   - [paperclip-local-env.sh](/Users/xinran/.codex/worktrees/31f1/mindsync/shared/tools/paperclip-local-env.sh)
