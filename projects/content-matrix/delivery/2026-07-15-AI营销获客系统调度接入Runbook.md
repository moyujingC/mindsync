> 状态：current
> 版本：0.1.0
> owner：CEO / Engineer
> last_updated：2026-07-15
> source_of_truth：projects/content-matrix/delivery/2026-07-15-AI营销获客系统调度接入Runbook.md
> 项目：内容矩阵
> 关联能力：AI 营销获客系统 / Automation Platform
> 阶段：runbook

# AI 营销获客系统调度接入 Runbook

这份文档是 `AI 营销获客系统` 对 `Automation Platform` 的项目级接入说明。

它不定义公司级执行规则，只说明这个项目现在如何接本地调度，以及后续如何接到正式自动化平台。

## 1. 当前推荐入口

统一入口命令：

```bash
cd /Users/xinran/Downloads/dev/mindsync/projects/content-matrix/tools/influencer-tracker
node src/cli/ops-daily.mjs --feishu config/feishu.local.json --pause-source
```

封装脚本：

```bash
/Users/xinran/Downloads/dev/mindsync/projects/content-matrix/tools/influencer-tracker/scripts/run-ops-daily.sh
```

这个入口会顺序执行：

```text
采集更新
-> 写运行报告
-> 生成选题候选
-> 写入飞书洞察表
-> 生成每日摘要
-> 生成失败账号复核
```

## 2. 当前推荐调度方式

### 本地 cron

推荐先用本地 cron：

```cron
15 9 * * * /Users/xinran/Downloads/dev/mindsync/projects/content-matrix/tools/influencer-tracker/scripts/run-ops-daily.sh
```

原因：

- 现在真实飞书配置在本机。
- 当前系统还需要人工观察失败账号和内容质量。
- 先形成稳定运行证据，再考虑平台化迁移。

### Automation Platform

后续如果迁到 `Automation Platform`，建议保留同一条入口命令，只替换宿主机和调度器。

当前建议口径：

- `execution_route`：`local_manual_review`
- 默认宿主：当前 Mac
- 不走 `server_automation` 自动写仓库

原因：

- 这条链路会调用真实飞书账号权限。
- 它会写飞书数据和本地日志，但不需要服务器侧 git 自动提交。
- 当前公司级规则仍冻结服务器自动写仓库。

## 3. 日志与产物位置

运行后主要看：

- `logs/runs/YYYY-MM-DD/*.json`
- `logs/topic-candidates/*.json`
- `logs/daily-summaries/YYYY-MM-DD.md`
- `logs/failure-reviews/YYYY-MM-DD.md`
- `logs/ops-daily.log`

## 4. 失败处理

### 先看哪里

先看：

```text
logs/failure-reviews/<date>.md
```

再看对应运行报告中的失败账号和错误信息。

### 何时暂停

当同一账号最近 7 天连续失败达到 3 次，并且确认不是临时网络波动时，执行：

```bash
node src/cli/failure-review.mjs \
  --date 2026-07-15 \
  --lookback-days 7 \
  --threshold 3 \
  --feishu config/feishu.local.json \
  --mark-status \
  --pause-source
```

效果：

- `最近状态 = 需人工处理`
- `启用状态 = 暂停`

### 何时恢复

确认数据源已修复后，人工在飞书里改回：

- `启用状态 = 启用`
- `最近状态 = 正常`

## 5. 当前边界

- 当前有调度入口，但还没有真实 7 天连续运行证据。
- 当前有项目级 runbook，但没有独立的 Automation Platform 配置文件。
- 当前周复盘只汇总采集与内容产物，不自动汇总真实咨询和成交反馈。

## 6. 下一步

下一阶段建议补：

1. 连续 7 天运行记录截图或日志证据。
2. 发布反馈回写格式。
3. 周复盘接入发布链接、评论反馈、私信反馈。
