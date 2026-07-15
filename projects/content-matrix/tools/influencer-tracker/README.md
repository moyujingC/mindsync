# 博主更新追踪 MVP

> 状态：working
> source_of_truth：projects/content-matrix/tools/influencer-tracker/README.md

这是 `AI 营销获客系统` 的第一版采集工具。

完整迭代过程见：[AI 营销获客系统 MVP 迭代工作流复盘](../../delivery/2026-07-15-AI营销获客系统MVP迭代工作流复盘.md)。

后续阶段计划见：[AI 营销获客系统后续阶段路线图](../../delivery/2026-07-15-AI营销获客系统后续阶段路线图.md)。

阶段 1-3 第一轮实现记录见：[AI 营销获客系统阶段 1-3 实现记录](../../delivery/2026-07-15-AI营销获客系统阶段1-3实现记录.md)。

阶段 3-4 第二轮实现记录见：[AI 营销获客系统阶段 3-4 实现记录](../../delivery/2026-07-15-AI营销获客系统阶段3-4实现记录.md)。

阶段 4 第三轮实现记录见：[AI 营销获客系统阶段 4 实现记录](../../delivery/2026-07-15-AI营销获客系统阶段4实现记录.md)。

阶段 4 草稿转存实现记录见：[AI 营销获客系统阶段 4 草稿转存实现记录](../../delivery/2026-07-15-AI营销获客系统阶段4草稿转存实现记录.md)。

阶段 4 成稿编辑入口实现记录见：[AI 营销获客系统阶段 4 成稿编辑入口实现记录](../../delivery/2026-07-15-AI营销获客系统阶段4成稿编辑入口实现记录.md)。

阶段 4 成稿骨架实现记录见：[AI 营销获客系统阶段 4 成稿骨架实现记录](../../delivery/2026-07-15-AI营销获客系统阶段4成稿骨架实现记录.md)。

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
- 支持内容唯一键去重；真实飞书模式会优先读取 `内容更新` 表已有 `内容唯一键`，本地 store 只做缓存。
- 支持单个账号失败后继续处理其他账号。
- 支持把选题候选写入飞书 `洞察与选题` 表。
- 支持 `洞察与选题` 按 `来源内容 + 洞察类型` 去重，避免重复写入同一来源候选。
- 支持从飞书已审核选题生成 Markdown brief（内容生产交接稿）。

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

生成候选并写入飞书 `洞察与选题` 表：

```bash
node src/cli/generate-topic-candidates.mjs \
  --report logs/runs/2026-07-15/xxx.json \
  --feishu config/feishu.local.json
```

写入飞书时会按 `来源内容 + 洞察类型` 去重。重复执行同一份报告时，已存在的候选会被跳过。

本地样例：

```bash
npm run generate:topics
```

输出会写入 `logs/topic-candidates/`。这些结果只能作为选题池输入，不能直接当成最终内容判断。每条候选仍需要人工查看原文和评论区，再决定是否进入 `知行AI服务` 的内容获客链路。

## 生成内容 brief

当人工在飞书 `洞察与选题` 表中把候选状态改成 `已转选题` 后，可以生成 Markdown brief：

```bash
node src/cli/build-briefs.mjs --feishu config/feishu.local.json
```

默认只处理 `状态 = 已转选题` 的记录，输出到 `logs/briefs/`。

如果要临时导出全部洞察：

```bash
node src/cli/build-briefs.mjs --feishu config/feishu.local.json --all
```

brief 用于交接给后续成稿、配图、排版链路，不代表已经完成事实核验或市场判断。

如果要同时生成草稿种子：

```bash
node src/cli/build-briefs.mjs \
  --feishu config/feishu.local.json \
  --draft-dir logs/drafts
```

如果确认这些选题已经完成 brief / 草稿入口处理，可以回写飞书状态：

```bash
node src/cli/build-briefs.mjs \
  --feishu config/feishu.local.json \
  --draft-dir logs/drafts \
  --mark-status 已验证
```

`--mark-status` 会修改飞书 `洞察与选题` 表。日常建议只在人工确认后使用；默认命令不会回写状态。

## 转存到账号草稿目录

当某条 draft seed 已经确认要进入具体账号，可以显式转存到账号目录：

```bash
node src/cli/promote-draft.mjs \
  --draft logs/drafts/xxx-draft.md \
  --account 墨予镜
```

默认输出到：

```text
projects/content-matrix/accounts/<账号名>/<日期>-<标题>-草稿.md
```

如果同名草稿已存在，命令会失败；确认要覆盖时再加：

```bash
--overwrite
```

这个命令只创建账号草稿，不生成成稿、不配图、不排版、不发布。

## 生成成稿编辑任务包

账号草稿确认要进入成稿编辑后，可以生成编辑任务包：

```bash
node src/cli/prepare-edit.mjs \
  --draft ../../accounts/墨予镜/2026-07-15-从AI服务第一条样例视频看AI工作流诊断的真实需求-草稿.md \
  --account 墨予镜
```

默认输出到：

```text
logs/edit-packages/
```

任务包会引用 `墨予镜文章成稿编辑Skill-v1`，并内置结构审稿、表达降噪、待发检查三轮最小提示词。它只是编辑入口，不会直接生成最终成稿。

## 生成成稿骨架

编辑任务包确认要进入账号成稿文件后，可以生成 `*-成稿.md` 骨架：

```bash
node src/cli/scaffold-final.mjs \
  --edit-package logs/edit-packages/xxx-成稿编辑任务包.md \
  --account 墨予镜
```

默认输出到：

```text
projects/content-matrix/accounts/<账号名>/<日期>-<标题>-成稿.md
```

成稿骨架会标记 `状态：待人工编辑`，并保留编辑进度清单和原始草稿备份。它不是最终成稿，不会自动配图、排版或发布。

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
