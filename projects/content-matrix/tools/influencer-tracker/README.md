# 博主更新追踪 MVP

> 状态：working
> source_of_truth：projects/content-matrix/tools/influencer-tracker/README.md

这是 `AI 营销获客系统` 的第一版采集工具。

当前目标是跑通：

```text
博主列表 -> 检查更新 -> 标准化内容 -> 去重 -> dry-run / 飞书写入 -> 状态日志
```

## 当前能力

- 支持本地 JSON 博主清单。
- 支持飞书多维表格读写骨架。
- 支持飞书配置结构校验。
- 支持 `dry-run`，不会写飞书。
- 支持 B 站 RSS 入口作为第一版公开数据源。
- 支持本地 RSS fixture，保证无网络时也能验证 MVP。
- 支持内容唯一键去重。
- 支持单个账号失败后继续处理其他账号。

## 本地验证

```bash
npm test
npm run check
npm run validate:feishu
npm run run:daily
npm run generate:topics
```

或直接运行：

```bash
node src/cli/check-updates.mjs --dry-run --creators fixtures/creators.example.json
```

默认样例使用 `fixtures/bilibili-rss.example.xml`，所以不依赖外部网络。

如果要测试真实 RSS 源，把博主配置中的 `source` 改成：

```json
{
  "kind": "rss",
  "url": "https://rsshub.app/bilibili/user/video/2"
}
```

## 真实飞书配置

复制配置样例：

```bash
cp config/feishu.example.json config/feishu.local.json
```

填入：

- `appId`
- `appSecret`
- `baseAppToken`

先创建表结构：

```bash
node src/cli/bootstrap-feishu-schema.mjs --feishu config/feishu.local.json
```

它会在指定 `baseAppToken` 对应的多维表格里创建：

- `博主账号`
- `内容更新`
- `评论样本`
- `洞察与选题`

命令会输出 `nextConfig`，把其中的 `tables` 回填到 `config/feishu.local.json` 后，再继续执行：

然后运行：

```bash
node src/cli/validate-config.mjs --feishu config/feishu.local.json
node src/cli/inspect-feishu.mjs --feishu config/feishu.local.json
node src/cli/check-updates.mjs --feishu config/feishu.local.json
```

`validate-config` 只检查配置结构和字段映射是否齐全，不会访问飞书 API（应用程序接口）。

`inspect-feishu` 会访问飞书 API，读取真实多维表格字段，并检查配置中的字段名是否存在。它是只读命令，不会创建或修改记录。

### 当前已创建的飞书表

已通过 `lark-cli` 用用户身份创建：

- Base：`AI营销获客系统`
- URL：https://ocn8icdz3ez3.feishu.cn/base/L2ghbMSJiaJrJKsUNMTcMLxInMb
- base token：`L2ghbMSJiaJrJKsUNMTcMLxInMb`
- `博主账号`：`tblShoJENEvdH1m6`
- `内容更新`：`tbl30niUryp9Sgp8`
- `评论样本`：`tbl2NTi3iiKXjliG`
- `洞察与选题`：`tblcgq7lKn2mXE6p`

已写入 1 条样例博主，并验证采集器可写入 2 条样例内容更新。

本地真实配置文件是 `config/feishu.local.json`，已被 `.gitignore` 排除，不提交到仓库。

## 日常运行

本地 dry-run：

```bash
node src/cli/run-daily.mjs --dry-run --creators fixtures/creators.example.json
```

真实飞书运行：

```bash
node src/cli/run-daily.mjs --feishu config/feishu.local.json
```

`run-daily` 会在 `logs/runs/YYYY-MM-DD/` 下写入 JSON 运行报告，便于 cron（定时任务）或 Automation Platform 做审计。

## 选题候选

从运行报告生成待人工审核的选题候选：

```bash
node src/cli/generate-topic-candidates.mjs --report logs/runs/2026-07-15/xxx.json
```

本地样例：

```bash
npm run generate:topics
```

输出会写入 `logs/topic-candidates/`。这些结果只能作为选题池输入，不能直接当成最终内容判断。每条候选仍需要人工查看原文和评论区，再决定是否进入 `知行AI服务` 的内容获客链路。

cron 示例：

```cron
15 9 * * * cd /Users/xinran/Downloads/dev/mindsync/projects/content-matrix/tools/influencer-tracker && /usr/local/bin/node src/cli/run-daily.mjs --feishu config/feishu.local.json >> logs/cron.log 2>&1
```

## 当前边界

- 第一版不绕过平台风控。
- B 站适配器先使用 RSS 源，后续可以替换为更稳定的数据入口。
- 抖音、小红书暂时只保留适配器边界，不在本轮强行接入。
- 评论区采集不属于当前 MVP。
- `validate-config` 只验证配置结构，飞书字段类型差异仍需要用真实表验证后再细调。
- `inspect-feishu` 需要真实飞书应用权限和网络访问，样例配置不能直接通过。
- `run-daily` 的默认样例是 dry-run；真实运行前必须确认飞书配置和字段验表通过。
- `generate-topic-candidates` 使用的是规则推断，不是最终市场洞察；输出状态默认是 `待人工审核`。
