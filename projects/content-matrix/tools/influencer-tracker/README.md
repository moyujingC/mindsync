# 多平台内容情报组件

> 状态：working
> source_of_truth：`projects/content-matrix/tools/influencer-tracker/README.md`

这是 `AI 营销获客系统` 的上游内容情报组件。它使用 TikHub 采集小红书、抖音、公众号和视频号的公开内容，统一写入飞书，再进入内容提纯、需求归纳、洞察与选题、内容发布反馈和 AI 服务验证。

## 组件边界

```text
TikHub 多平台采集
-> 博主账号 / 内容更新 / 评论样本（飞书）
-> 内容提纯与需求归纳
-> 洞察与选题
-> 内容发布与反馈
-> AI 服务获客依据
```

- `Tool`：TikHub HTTP 调用、内容/评论标准化、飞书写入和去重。
- `Workflow`：链接详情、关键词搜索、账号追踪和评论采样。
- `Agent`：基于内容和评论生成待人工审核的需求洞察与选题。
- `Agent Loop`：在已有多轮真实研究和发布反馈后再启用，不作为当前日常入口。

## 支持平台

| 平台 | 账号追踪 | 关键词搜索 | 单篇详情 | 评论与回复 |
| --- | --- | --- | --- | --- |
| 小红书 | 支持 | 支持 | 支持 | 一级/二级评论 |
| 抖音 | 支持 | 支持 | 支持 | 一级评论 |
| 公众号 | 文章列表 | 支持 | 支持 | 文章留言 |
| 视频号 | 支持 | 支持 | 支持 | 评论与回复 |

## 前置配置

TikHub Key 只从环境变量读取，不写入仓库或飞书配置：

```bash
export TIKHUB_API_KEY='你的 TikHub API Key'
```

飞书配置使用本机忽略文件 `config/feishu.local.json`。示例结构见 `config/feishu.example.json`。

## 研究请求：日常唯一入口

研究请求会把采集、证据整理和候选选题串成一次可交接的 Workflow。它不会自动发布或联系任何人，结果状态始终是“待人工确认”。

```bash
npm run research:run -- \
  --purpose 评论挖需求 \
  --service-direction '企业 AI 服务' \
  --target-account 墨予镜 \
  --mode detail \
  --platform xiaohongshu \
  --share-url '小红书分享链接' \
  --include-comments \
  --dry-run
```

输出在 `logs/research-briefs/`：包含研究目的、服务方向、样本与调用量、评论证据、最多 3 个候选选题，以及明确的人工确认点。

当前 TikHub 账户调用会返回 HTTP 402，需先在 TikHub 后台确认余额与对应接口套餐权限。开通后先加 `--dry-run` 验证真实响应，再移除它写入飞书。

## 组件调试入口

仅在调试采集组件时，才直接使用下列命令：

```bash
# 小红书或抖音等分享链接：详情加一页评论
npm run collect:tikhub -- \
  --mode detail \
  --platform xiaohongshu \
  --share-url 'https://www.xiaohongshu.com/explore/...' \
  --include-comments \
  --dry-run

# 企业 AI 服务关键词：默认最多采样 10 条
npm run collect:tikhub -- \
  --mode search \
  --platform douyin \
  --keyword '企业 AI 工作流' \
  --limit 10 \
  --dry-run

# 已知账号标识的内容采样
npm run collect:tikhub -- \
  --mode creator \
  --platform xiaohongshu \
  --creator-id '平台账号标识' \
  --limit 10 \
  --dry-run
```

确认内容后，移除 `--dry-run` 并加入飞书配置：

```bash
npm run collect:tikhub -- \
  --mode detail \
  --platform xiaohongshu \
  --share-url '分享链接' \
  --include-comments \
  --feishu config/feishu.local.json
```

采集结果会保留调用次数和 TikHub `cache_url`。同一响应在 24 小时内应优先使用缓存，避免重复付费。

## 内容提纯与洞察

`enrich-content` 接收标准化内容与评论，不依赖任何平台专用下载器：

```json
{
  "content": {
    "platform": "xiaohongshu",
    "creatorName": "AI 实践者",
    "contentExternalId": "note-id",
    "title": "标题",
    "description": "正文",
    "url": "https://..."
  },
  "comments": []
}
```

```bash
node src/cli/enrich-content.mjs \
  --input research-input.json \
  --output logs/enrichment.json
```

它只产出“待人工审核”的洞察和候选选题，不自动发布，也不把样本直接写成市场结论。

## 媒体提纯组件

字幕、人工逐字稿或其他文本先独立进入媒体提纯 Workflow，再作为原文证据提供给研究和洞察组件。当前支持 `.srt`、`.vtt`、`.txt`：保留原始副本、清理字幕时间轴和空行，并生成 manifest（运行清单）。

```bash
npm run media:refine -- \
  --input path/to/source.srt \
  --source-label '访谈或视频名称' \
  --output-dir logs/media-refinement
```

音频或视频的下载、转码和转写不绑定在本组件中；它们后续只需把输出逐字稿传给 `media:refine`。

## 验证

```bash
npm test
npm run validate:feishu
```

自动测试不调用 TikHub，避免消耗额度。真实联调前提与验收步骤见：

- `../../qa/2026-07-21-TikHub多平台内容情报组件验收基线.md`
- `../../specs/2026-07-21-TikHub多平台内容情报组件规格.md`
