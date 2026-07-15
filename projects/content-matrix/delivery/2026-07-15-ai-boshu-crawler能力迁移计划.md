> 状态：current
> 版本：0.1.0
> owner：CEO / Engineer
> last_updated：2026-07-15
> source_of_truth：projects/content-matrix/delivery/2026-07-15-ai-boshu-crawler能力迁移计划.md
> 项目：内容矩阵
> 关联项目：AI营销获客系统
> 阶段：migration-plan

# ai-boshu-crawler 能力迁移计划

本文把 `dragon-hh/ai-boshu-crawler` 里最值得迁移到当前 `influencer-tracker` 的能力，收束成一个正式改造清单。

目标不是整仓照搬，而是迁最有价值的部分：

```text
真实采集深度
-> 转写素材
-> 评论样本
-> enrich 洞察
```

## 1. 当前判断

### ai-boshu-crawler 强项

1. B站真实视频下载。
2. 抖音真实页面抓取。
3. 本地转写链路。
4. 评论抓取与回写飞书。
5. manifest（运行清单）比较完整。

### influencer-tracker 强项

1. 路线图、交付、runbook 更完整。
2. 采集 -> 选题 -> brief -> 草稿 -> 成稿 -> 反馈 -> 样本沟通链路更完整。
3. CLI / jobs / tests 结构更清晰。
4. 运维、审计、周复盘能力更强。

### 迁移原则

只迁移这些能力：

- 能增强真实采集能力。
- 能增强内容可分析素材。
- 能增强评论与需求信号质量。
- 不破坏当前 `influencer-tracker` 的结构化设计。

不迁移：

- Windows 本地路径依赖。
- 大脚本拼接结构。
- 平台逻辑和飞书逻辑深度耦合的写法。

## 2. 优先级

### P0

必须先做：

1. B站真实下载链路。
2. 转写链路。
3. B站评论入库。
4. manifest 细化。

### P1

第二批做：

1. enrich 内容理解层。
2. 抖音真实最新作品抓取。
3. transcript（转写稿）发飞书 doc（文档）。

### P2

第三批再做：

1. 跨平台重复判断。
2. 抖音评论页面提取。
3. 小红书真实半自动抓取。

## 3. 具体改造清单

### 3.1 P0-1 B站真实下载链路

目标：

```text
从 RSS 发现新视频
-> 下载视频/封面/元数据/简介
-> 生成本地 artifact（产物）目录
```

新增文件建议：

```text
src/platforms/bilibili/download.mjs
src/jobs/download-bilibili.mjs
src/cli/download-bilibili.mjs
tests/download-bilibili.test.mjs
```

建议输出目录：

```text
logs/downloads/bilibili/<creator>/<content-id>/
```

建议产物：

- `metadata.json`
- `description.txt`
- `cover.*`
- `video.*`
- `download-manifest.json`

内容对象新增字段建议：

- `artifactDir`
- `metadataPath`
- `descriptionPath`
- `coverPath`
- `videoPath`
- `downloadStatus`

最小验收：

1. 至少 1 条 B站内容可真实下载。
2. 下载结果可定位到本地目录。
3. 失败时可读错误写入 manifest。

### 3.2 P0-2 转写链路

目标：

```text
本地视频
-> 优先字幕
-> 无字幕则抽音频
-> Whisper 转写
-> 输出 raw/clean transcript
```

新增文件建议：

```text
src/jobs/transcribe-video.mjs
src/cli/transcribe-video.mjs
tests/transcribe-video.test.mjs
```

建议产物：

- `speech-raw.txt`
- `speech-clean.txt`
- `audio.m4a`
- `transcribe-manifest.json`

飞书/本地字段建议：

- `audioPath`
- `speechRawPath`
- `speechCleanPath`
- `transcriptStatus`

最小验收：

1. 至少 1 条 B站视频生成 clean transcript。
2. transcript 可被后续选题链路读取。

### 3.3 P0-3 B站评论入库

目标：

```text
B站视频
-> 拉评论
-> 写评论样本表
-> 形成基础需求信号
```

新增文件建议：

```text
src/jobs/sync-bilibili-comments.mjs
src/cli/sync-bilibili-comments.mjs
tests/sync-bilibili-comments.test.mjs
```

评论样本最小字段：

- `commentUniqueKey`
- `contentUniqueKey`
- `commentText`
- `likeCount`
- `publishedAt`
- `userNickname`
- `commentTag`

最小验收：

1. 至少 1 条 B站视频写入评论样本。
2. 重复运行不会重复写入同一评论。

### 3.4 P0-4 manifest 细化

目标：

```text
每个关键 job
-> 都有独立 manifest
-> 可追输入/输出/失败
```

新增文件建议：

```text
src/utils/manifest.mjs
```

先接这些 job：

- download
- transcribe
- comments
- enrich

最小验收：

1. 每个关键 job 都能单独写 manifest。
2. `ops-audit` 后续可以升级为读 manifest 而不只是读 run report。

## 4. 第二批改造

### 4.1 P1-1 enrich 内容理解层

输入：

- metadata
- transcript
- representative comments

输出：

- `contentSummary`
- `keyPoints`
- `painPoints`
- `controversies`
- `topicAngles`

新增文件建议：

```text
src/jobs/enrich-content.mjs
src/cli/enrich-content.mjs
tests/enrich-content.test.mjs
```

### 4.2 P1-2 抖音真实抓取入口

新增文件建议：

```text
src/platforms/douyin/cdp-latest.mjs
src/jobs/download-douyin.mjs
src/cli/download-douyin.mjs
```

第一步只做：

- 最新作品发现
- 标题 / 链接 / 发布时间 / aweme id

### 4.3 P1-3 transcript 发飞书 doc

新增文件建议：

```text
src/jobs/publish-transcript-doc.mjs
src/cli/publish-transcript-doc.mjs
tests/publish-transcript-doc.test.mjs
```

## 5. 推荐执行顺序

### 阶段 A

先做：

1. B站真实下载。
2. 转写链路。

### 阶段 B

再做：

1. B站评论入库。
2. enrich 内容理解。

### 阶段 C

再做：

1. 抖音真实抓取。
2. transcript 发飞书 doc。

## 6. 当前决定

当前立刻开始：

```text
P0-1 B站真实下载链路
```

原因：

- 它是后面转写、评论和选题增强的共同前提。
- 也是 `ai-boshu-crawler` 最值得先借的能力。
