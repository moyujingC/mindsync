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

旧的 `daily-summary`、`ops-audit` 和 `weekly-review` 只保留作历史运行审计，不会生成研究请求、选题、发布或服务决策。`weekly-review` 已移出 npm 默认脚本；如需审计历史文件，必须显式传入日期范围和 `--historical-summary`：

```bash
node src/cli/weekly-review.mjs \
  --historical-summary \
  --start-date 2026-07-09 \
  --end-date 2026-07-15
```

不要将上述汇总误作 Agent Loop。只有已有 3-5 轮真实“研究 -> 发布 -> 外部反馈”记录，并证明反馈会改变下一轮关键词、样本或 CTA，才可设计每周循环。

## 操作规范 Skills

以下 Skills 是跨组件的操作规范，可供不同业务研究模板、Workflow（固定工作流）或 Agent（智能代理）复用：

- [内容入库规范](./skills/content-ingestion/SKILL.md)
- [市场调研规范](./skills/market-research/SKILL.md)
- [需求洞察规范](./skills/demand-insight/SKILL.md)
- [发布反馈规范](./skills/publishing-feedback/SKILL.md)

## 平台标识

手工 JSON、命令参数和飞书展示可以填写中文平台名：`小红书`、`抖音`、`公众号`、`视频号`。进入内容唯一键、研究请求台账和 TikHub 调用前，系统统一转换为内部平台 ID：`xiaohongshu`、`douyin`、`wechat_mp`、`wechat_channels`；飞书仍展示中文名。已有中文唯一键在去重时继续识别，不会因迁移重复导入。

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

## 真实联调前检查

在启用真实 TikHub 采集前，先运行只读前检查。默认不请求 TikHub、不写飞书、不写研究台账；它检查 Key、可选飞书配置和已有真实发布反馈记录。

```bash
npm run preflight:readiness -- --feishu config/feishu.local.json
```

账户恢复后，才可显式加 `--probe` 访问一条公开链接，验证对应详情接口权限。探针不会写入内容、评论、博主、飞书或本地台账，但可能消耗一次 TikHub 调用。

```bash
npm run preflight:readiness -- \
  --feishu config/feishu.local.json \
  --probe \
  --platform xiaohongshu \
  --share-url '公开内容链接'
```

输出 `safeToRunWriteMode: true` 仅表示 Key 与飞书配置在本地检查中通过，不能替代真实响应、人工审核或业务成交验证。

权限恢复后，每个平台的首个真实接口响应还应捕获为脱敏合同样本。该命令固定使用 `dry-run` 采集，不写飞书或研究台账；会删除授权信息、Cookie、用户标识、正文/评论文本，并去掉 URL 查询参数。不要提交未审阅的原始响应。

```bash
npm run capture:tikhub-contract -- \
  --mode detail \
  --platform xiaohongshu \
  --share-url '公开内容链接' \
  --include-comments \
  --limit 1 \
  --comment-limit 1 \
  --output-dir fixtures/tikhub-contracts/real
```

真实验收时，对每个平台至少分别捕获详情、搜索、账号列表和评论列表响应，再人工复核其中的详情字段、分页游标、二级评论字段与 `cache_url`。只保留经审阅的脱敏合同样本；真实用户文本和可识别信息留在受控本地运行产物，不进入仓库。

捕获完成后运行只读校验。它检查文件结构、脱敏安全，以及指定平台是否已有详情、搜索、账号列表和评论四类成功响应；通过不代表已完成飞书写入或业务验证。

```bash
npm run validate:tikhub-contracts -- \
  --fixture-dir fixtures/tikhub-contracts/real \
  --platform xiaohongshu
```

## 研究请求：日常唯一入口

研究请求会把采集、证据整理和候选选题串成一次可交接的 Workflow。它不会自动发布或联系任何人。每次运行同时生成研究简报和本地台账 `logs/research-requests.json`；台账记录请求范围、调用摘要、候选状态、人工决定和验证依据。

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

### 人工确认与证据等级

候选项同时有两组独立字段，不能混用：

- `证据等级`：`线索` 表示内容样本；`观察` 表示至少两条相关评论。采集程序不会自动给出“已验证”。
- `结论等级`：自动生成的洞察一律为 `假设`；只有人工提供外部反馈或样本沟通依据，才可改为 `已验证`。
- `选题状态`：`待人工审核 -> 已转选题 -> 已发布`，也可从任意未结束状态标为 `已结束`。每次流转必须填写人工决定说明。

研究简报和台账会在确认时同步更新。以下命令只更新台账和简报，不会创建草稿、发布内容或联系用户：

```bash
# 让第 1 个候选进入选题池
npm run research:confirm -- \
  --request-id 'research-2026-07-21T...' \
  --candidate 1 \
  --action 转选题 \
  --decision-note '用于下一轮企业 AI 服务选题。'

# 只有已有可追溯人工证据时才标记为已验证
npm run research:confirm -- \
  --request-id 'research-2026-07-21T...' \
  --candidate 1 \
  --action 验证 \
  --verification-evidence '2026-07-21 样本沟通记录：两名目标用户确认流程诊断需求。'
```

如需将台账存到其他目录，`research:run` 和 `research:confirm` 均支持 `--ledger path/to/research-requests.json`。

传入 `--feishu config/feishu.local.json` 后，研究请求会按 `请求ID` 写入或更新飞书“研究请求”表。飞书仅保存请求元数据、状态和项目内的相对简报路径；候选详情、评论原文和 API 原始响应继续保留在本地台账与简报中。

当前 TikHub 账户调用会返回 HTTP 402，需先在 TikHub 后台确认余额与对应接口套餐权限。开通后先加 `--dry-run` 验证真实响应，再移除它写入飞书。

### 手工内容研究

TikHub 不可用时，随机刷到的公开内容、已获授权的手工摘录或人工整理的评论样本仍可进入同一研究台账。`research:manual` 不访问 TikHub；它会写入内容/评论样本、研究请求、简报和候选选题，后续确认与内容交接命令完全相同。

```bash
# 先用 --dry-run 检查输入和候选，不写飞书或本地去重库
npm run research:manual -- \
  --input fixtures/manual-research.example.json \
  --dry-run

# 确认后写入飞书内容、评论和研究请求表
npm run research:manual -- \
  --input fixtures/manual-research.example.json \
  --feishu config/feishu.local.json
```

输入中的 `comments` 只有在请求明确 `includeComments: true` 或命令附加 `--include-comments` 时才会解析和写入。请只保存公开内容、经授权的材料或脱敏聚合评论；不要录入客户非公开资料和可识别个人信息。

手工研究项可选填 `refinedTextPath`，引用已由 `media:refine` 输出的本地清理稿。相对路径以手工研究 JSON 文件所在目录为准。研究时会使用清理稿辅助生成候选，并在本地台账和简报保留路径、字符数及有限片段；逐字稿正文不会写入飞书。

```bash
# 1. 对已有字幕或逐字稿提纯
npm run media:refine -- \
  --input path/to/source.srt \
  --output-dir logs/media-refinement

# 2. 在手工研究 JSON 的内容项中填写：
# "refinedTextPath": "../logs/media-refinement/source.refined.txt"

# 3. 先确认输入和候选，不产生写入
npm run research:manual -- \
  --input fixtures/manual-research.example.json \
  --dry-run
```

对于你已合法取得的本地音频或视频，可先用本机的 `ffmpeg`（媒体处理工具）和 Whisper（语音转文字工具）生成 SRT 字幕，再自动提纯。该流程不下载、上传或写入飞书；媒体文件、字幕和清理稿仅保留在本地。首次使用前需已安装 `ffmpeg` 和 `whisper`，并有本地 Whisper 模型。

```bash
# 分步执行：本地媒体 -> WAV 音频 -> SRT 字幕
npm run media:transcribe -- \
  --input path/to/local-video.mp4 \
  --output-dir logs/media-transcription \
  --model base \
  --language zh

# 一步执行转写并提纯，输出中的 refinedTextPath 可填入手工研究 JSON
npm run media:process -- \
  --input path/to/local-video.mp4 \
  --output-dir logs/media-transcription \
  --model base \
  --language zh
```

支持的本地媒体扩展名：`.mp4`、`.mov`、`.mkv`、`.webm`、`.mp3`、`.m4a`、`.wav`、`.aac`、`.flac`、`.ogg`、`.opus`、`.avi`。转写运行清单会记录输入、输出路径、模型和工具名；若需要迁移到其他电脑，只需重新安装工具和模型后重新执行，不应提交媒体文件或逐字稿。

## 业务研究模板

同一套研究请求、采集、飞书写入和证据台账可以服务不同业务。模板只补齐研究目的、默认样本量、交付重点和安全约束，不会创建新的采集器、飞书表或自动发布链路。

```bash
# 查看模板 ID、默认参数与交付重点
npm run research:run -- --list-templates
```

| 模板 ID | 适用场景 | 默认输出 | 特殊边界 |
| --- | --- | --- | --- |
| `enterprise_ai_service` | 企业 AI 服务市场调研 | 服务假设 | 线索不等于成交证据 |
| `moyujing` | 墨予镜内容研究 | 内容角度 | 保留原文依据，人工判断是否成稿 |
| `yijing_yishu` | 一镜一梳内容研究 | 匿名内容观察 | 不记录可识别信息，不输出心理诊断或疗效判断 |
| `client_project` | 客户项目调研 | 样本包与问题清单 | 必须使用内部项目代号，不上传客户非公开材料 |

```bash
# 企业 AI 服务：默认采样 10 条，并采集评论
npm run research:run -- \
  --template enterprise_ai_service \
  --mode search \
  --platform xiaohongshu \
  --keyword '企业 AI 工作流' \
  --dry-run

# 一镜一梳：默认采样 5 条，不默认采集评论
npm run research:run -- \
  --template yijing_yishu \
  --mode detail \
  --platform xiaohongshu \
  --share-url '公开内容链接' \
  --dry-run

# 客户项目：项目代号只用于内部台账和简报
npm run research:run -- \
  --template client_project \
  --project-name 'client-2026-retail-pilot' \
  --mode search \
  --platform douyin \
  --keyword '门店 AI' \
  --dry-run
```

命令中显式提供的 `--purpose`、`--service-direction`、`--target-account`、`--limit` 和 `--include-comments` 优先于模板默认值。

## 研究到内容的人工交接

候选必须先经人工确认并进入“已转选题”，才可生成交接包。交接包包含可追溯的内容简报和草稿种子，不会写入账号目录、更不会自动发布。

```bash
# 1. 人工确认候选进入选题池
npm run research:confirm -- \
  --request-id 'research-2026-07-21T...' \
  --candidate 1 \
  --action 转选题 \
  --decision-note '用于下一轮内容选题。'

# 2. 生成简报和草稿种子，默认输出到 logs/research-handoffs/
npm run research:handoff -- \
  --request-id 'research-2026-07-21T...' \
  --candidate 1

# 3. 审阅后，才显式指定账号写入草稿目录
npm run promote:draft -- \
  --draft logs/research-handoffs/research-...-candidate-1-draft.md \
  --account 墨予镜
```

`client_project` 模板例外：`research:handoff` 只生成内部研究包（样本证据、待确认问题和交接边界），不生成草稿种子，也不能进入 `promote:draft`。客户项目是否形成正式交付、报价或试点，由项目负责人基于授权材料另行确认。

进入正式草稿后，仍沿用 `prepare:edit`、`scaffold:final` 和 `prepare:feedback`。这些步骤均不发布内容；发布链接、互动和服务信号只能在真实发生后由人工填写到发布反馈记录。

## 发布反馈与服务验证

发布反馈是人工填写的 Workflow，不会调用任何平台发布接口。候选从研究请求交接进入草稿后，`source_insight_record_id` 会贯穿草稿、编辑包、成稿和反馈记录。填写真实发布链接与反馈后，再显式回写研究候选状态。

```bash
# 1. 为已人工完成的成稿创建反馈模板
npm run prepare:feedback -- \
  --final-draft ../../accounts/墨予镜/2026-07-21-某篇成稿.md \
  --account 墨予镜

# 2. 人工填入发布链接、互动、服务信号和反对意见后，才回写为“已发布”
npm run feedback:record -- \
  --feedback ../../accounts/墨予镜/feedback/2026-07-21-某篇成稿-发布反馈.md \
  --feishu config/feishu.local.json

# 3. 仅当反馈明确标记“需要转入 ai-service-studio 记录：是”时，才人工转入样本沟通记录
npm run promote:feedback -- \
  --feedback ../../accounts/墨予镜/feedback/2026-07-21-某篇成稿-发布反馈.md \
  --service-direction 'AI 工作流诊断'
```

发布反馈中还应填写“下一轮研究调整”：只有真实发布链接存在，且人工记录本次反馈如何改变下一轮的关键词、样本范围或 CTA（行动号召）时，才算作 Agent Loop 的一轮有效证据。系统不会自动启用循环；只读评估器达到 3 个不同研究请求的有效循环后，才提示“可评估”。

```bash
npm run evaluate:agent-loop -- \
  --ledger logs/research-requests.json
```

`feedback:record` 只有同时满足以下条件才更新研究台账：反馈文件带有 `research:<请求ID>:<候选编号>`、候选已“转选题”、发布链接为 `http` 或 `https` 地址。传入 `--feishu` 时会同步“研究请求”表的摘要状态；它只保存人工填写的事实和下一步，不会把点赞、评论或咨询意向自动判断为成交。

`promote:feedback` 转入 `ai-service-studio` 时保留研究候选 ID、发布链接、服务信号和截断后的反对意见摘要，用研究候选 ID 去重；历史反馈没有该 ID 时，沿用“记录日期 + 对象”去重。它不会复制评论或私信全文。

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

搜索和账号采样会按 `--limit`（总条数）继续读取后续页，默认最多读取 10 页；可用 `--max-pages` 进一步收紧。评论默认只取第一页，避免一次研究请求意外扩大成本；只有显式传入 `--comment-pages` 和 `--comment-limit` 才会跨页。服务端缺少或重复下一页游标时，采集会安全停止并在返回结果的 `audit.pagination` 记录原因。

```bash
# 最多采 15 条内容，至多 3 页；每条内容最多采 20 条评论、2 页
npm run collect:tikhub -- \
  --mode search \
  --platform xiaohongshu \
  --keyword '企业 AI 工作流' \
  --limit 15 \
  --max-pages 3 \
  --include-comments \
  --comment-limit 20 \
  --comment-pages 2 \
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

字幕、人工逐字稿或其他文本先独立进入媒体提纯 Workflow，再作为原文证据提供给研究和洞察组件。`media:refine` 支持 `.srt`、`.vtt`、`.txt`：保留原始副本、清理字幕时间轴和空行，并生成 manifest（运行清单）。手工研究入口可通过 `refinedTextPath` 消费该清理稿；飞书不保存逐字稿正文。

```bash
npm run media:refine -- \
  --input path/to/source.srt \
  --source-label '访谈或视频名称' \
  --output-dir logs/media-refinement
```

`media:transcribe` 和 `media:process` 只接收合法取得的本地音频或视频，使用本机 `ffmpeg` 和 Whisper 转写，不下载平台媒体、不上传文件，也不写飞书。`media:process` 会在转写后自动调用 `media:refine`，其 `refinedTextPath` 可直接填入手工研究输入。

## 验证

```bash
npm test
npm run validate:feishu
```

自动测试不调用 TikHub，避免消耗额度。真实联调前提与验收步骤见：

- `../../qa/2026-07-21-TikHub多平台内容情报组件验收基线.md`
- `../../specs/2026-07-21-TikHub多平台内容情报组件规格.md`
