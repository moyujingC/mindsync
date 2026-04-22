# Paperclip Agent 模型配置总表

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-15
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/company/Paperclip-Agent-模型配置总表.md

这份文档用于收口 `Paperclip` 当前各类 Agent 的运行时模型配置。

它回答的是下面几个问题：

- 这个 Agent 现在实际走哪个 `adapter`
- 它连的是哪一家模型入口
- `base URL` 是什么
- 模型名是什么
- 鉴权是怎么进来的
- 这个状态在面板上应该如何解读

它不是部署文档，也不是 Agent 提示词文档。
如果要看服务器、SSH、代理、宿主职责，请回到：

- [服务器与基础设施入口.md](/Users/xinran/Downloads/dev/mindsync/company/服务器与基础设施入口.md)

## 1. 当前总原则

- 当前 `Paperclip` 控制面主宿主为 automation 节点：`150.158.9.95`
- control plane（控制面）继续运行在 automation 节点
- `server_automation` 继续由 automation 节点承接
- 对 `manual-review-required + local_manual_review`，`*_local` 当前正式宿主已收正为用户当前这台 Mac；不再默认等于 automation 服务器本地
- 当前不追求所有 Agent 用同一个 `adapter`
- 当前追求的是：
  - CEO 链路稳定
  - 工程与测试链路稳定
  - 规划/内容/研究类链路稳定
- `warn` 不等于不可用
  - 对 `claude_local` 来说，如果 `hello probe succeeded` 同时存在，则通常表示可用，只是当前在走 API-key 模式

## 2. 当前分组总表

| Agent 分组 | 当前 Agent | Adapter | Base URL | Model | 鉴权方式 | 当前口径 |
| --- | --- | --- | --- | --- | --- | --- |
| CEO | CEO | `claude_local` | `https://ark.cn-beijing.volces.com/api/coding` | `ark-code-latest` | Agent 级 `ANTHROPIC_*` 环境变量 | 当前目标宿主切到用户当前 Mac；若本地链路失败，应记录为本地运行缺口 |
| 工程实现 | Engineer | `codex_local` | `https://code.ppchat.vip/v1` | `gpt-5.3-codex` | Codex provider API key 配置 | 当前主工程链路；对 `local_manual_review` 单机试点，目标宿主切到用户当前 Mac |
| 测试验收 | Test / QA | `codex_local` | `https://code.ppchat.vip/v1` | `gpt-5.3-codex` | Codex provider API key 配置 | 当前主测试链路；对 `local_manual_review` 单机试点，目标宿主切到用户当前 Mac |
| 需求澄清 | Idea Clarifier | `pi_local` | `https://ark.cn-beijing.volces.com/api/coding/v3` | `volcengine-coding-plan/Doubao-Seed-2.0-pro` | `pi` 自定义 provider + 服务器环境变量 `OPENAI_API_KEY` | 当前为独立链路，不与 CEO 强制统一 |
| 规划/产品/内容/研究 | Architect, UI / UX, Business Lead, Product Spec Lead, Research & Knowledge Lead, Content Lead | `claude_local` | `https://ark.cn-beijing.volces.com/api/coding` | `ark-code-latest` | Agent 级 `ANTHROPIC_*` 环境变量 | 当前主“火山 Coding Plan”链路；普通任务单机试点时不默认继续视为服务器本地 |

## 3. 分组展开

### 3.1 CEO

- Agent：`CEO`
- Adapter：`claude_local`
- Base URL：`https://ark.cn-beijing.volces.com/api/coding`
- Model：`ark-code-latest`
- 模型来源：
  - Agent 级 `ANTHROPIC_BASE_URL`
  - Agent 级 `ANTHROPIC_MODEL`
  - Agent 级 `ANTHROPIC_API_KEY`
- 当前语义：
  - 这是当前为了绕开 `hermes_local` session resume 上游 bug 的临时回退链路
  - 当前目标不是保留 Hermes 实验链路，而是先恢复 CEO 可用性
  - 等 `paperclip` 上游修复后，再评估是否切回 `hermes_local`
  - 对普通任务本地自动执行链，CEO 不再保留服务器宿主例外

### 3.2 Engineer

- Agent：`Engineer`
- Adapter：`codex_local`
- Base URL：`https://code.ppchat.vip/v1`
- Model：`gpt-5.3-codex`
- Reasoning：`medium`
- Token 优化策略：
  - 不降模型
  - 通过限制长会话控制上下文膨胀
  - 当前 session compaction 阈值：
    - `enabled: true`
    - `maxSessionRuns: 12`
    - `maxRawInputTokens: 300000`
    - `maxSessionAgeHours: 24`
- 当前语义：
  - 用于工程实现
  - 当前已经从“和 CEO 用同一模型”的尝试中回退，固定为 `gpt-5.3-codex`
  - 这是当前更稳的工程执行口径
  - 达到 session compaction 阈值后切新 session，属于成本控制，不代表故障
  - 对 `manual-review-required + local_manual_review`，正式目标宿主是用户当前这台 Mac，而不是 automation 服务器
- 人工接管口径：
  - 当前允许用户在成本敏感阶段手动暂停 `Engineer`
  - 当公共卡点被人工清除后，再恢复 `Engineer` 继续运行
  - 后续推荐补成自动升级规则：
    - 同一任务连续失败 `3` 次
    - 或累计运行超过 `90` 分钟
    - 或失败原因命中 `infra / auth / env / dependency / external service`
  - 命中上述任一条件后，`Engineer` 不应继续重复燃烧 token
  - 推荐动作是：
    - 停止继续自动尝试
    - 将任务转为 `blocked`
    - 自动 assign 给用户本人
    - 附带已尝试次数、最后失败摘要、建议先处理的公共卡点

### 3.3 Test / QA

- Agent：`Test / QA`
- Adapter：`codex_local`
- Base URL：`https://code.ppchat.vip/v1`
- Model：`gpt-5.3-codex`
- Reasoning：`medium`
- Token 优化策略：
  - 不降模型
  - 通过限制长会话控制上下文膨胀
  - 当前 session compaction 阈值：
    - `enabled: true`
    - `maxSessionRuns: 12`
    - `maxRawInputTokens: 300000`
    - `maxSessionAgeHours: 24`
- 当前语义：
  - 用于测试、QA、验收
  - 与 `Engineer` 保持同模型口径，方便工程链路一致
  - 达到 session compaction 阈值后切新 session，属于成本控制，不代表故障
  - 对 `manual-review-required + local_manual_review`，正式目标宿主是用户当前这台 Mac，而不是 automation 服务器

### 3.4 claude_local 系列

当前这组 Agent 包括：

- `Architect`
- `UI / UX`
- `Business Lead`
- `Product Spec Lead`
- `Research & Knowledge Lead`
- `Content Lead`

它们当前共享同一组模型入口：

- Adapter：`claude_local`
- Base URL：`https://ark.cn-beijing.volces.com/api/coding`
- Model：`ark-code-latest`
- 相关环境变量：
  - `ANTHROPIC_API_KEY`
  - `ANTHROPIC_BASE_URL`
  - `ANTHROPIC_MODEL`
  - `ANTHROPIC_DEFAULT_OPUS_MODEL`
  - `ANTHROPIC_DEFAULT_SONNET_MODEL`
  - `ANTHROPIC_DEFAULT_HAIKU_MODEL`
  - `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1`

当前明确口径：

- 这组 Agent 使用的是火山引擎 `Coding Plan` 兼容接口
- 当前采用 API-key 模式，而不是 Claude 登录态模式
- 因此面板里出现：
  - `ANTHROPIC_API_KEY is set...`
  - 且状态为 `warn`
  - 这是预期现象，不单独视为故障

当前面板解读规则：

- 如果同时看到 `Claude hello probe succeeded`
  - 说明链路可用
- 如果是 `warn` 但 hello probe 成功
  - 说明只是“API-key 模式提示”
- 只有真正出现 `fail`
  - 才进入排障流程

### 3.5 Idea Clarifier

- Agent：`Idea Clarifier`
- Adapter：`pi_local`
- Provider / Model：`volcengine-coding-plan/Doubao-Seed-2.0-pro`
- Base URL：`https://ark.cn-beijing.volces.com/api/coding/v3`
- 运行时附加环境：
  - `HOME=/paperclip`
- 当前语义：
  - 这是单独保留的一条本机 `pi` 链路
  - 当前没有与 CEO 或 `claude_local` 做强制统一
- 当前实现口径：
  - `pi` 默认内置的 `openai` provider 会优先走 `openai-responses`
  - 火山当前这条 `coding/v3` 链路对 `chat/completions` 兼容正常，但对 `responses` 口径不兼容
  - 因此 `Idea Clarifier` 当前必须通过 `~/.pi/agent/models.json` 中的自定义 provider
  - 该 provider 固定使用 `openai-completions`
- 治理口径：
  - 若后续本机 `pi` 环境不稳定，再决定是否继续保留、替换或只做 fallback
  - 若后续重建容器或迁移宿主，必须同步恢复 `/paperclip/.pi/agent/models.json`
  - 若只保留 `OPENAI_BASE_URL` / `OPENAI_API_KEY`，但遗漏自定义 provider，`Test environment` 仍可能失败

## 4. 当前服务器侧全局环境

automation 节点当前重要环境变量如下：

```env
OPENAI_BASE_URL=https://ark.cn-beijing.volces.com/api/coding/v3
OPENAI_MODEL=minimax-m2.5
HTTP_PROXY=http://47.253.255.110:18888
HTTPS_PROXY=http://47.253.255.110:18888
```

当前解读：

- `hermes_local`
  - 主要吃服务器侧 `OPENAI_*`
- `claude_local`
  - 主要吃各 Agent 自己的 `adapterConfig.env` 中的 `ANTHROPIC_*`
- `codex_local`
  - 主要吃自身 provider 配置，当前指向 `https://code.ppchat.vip/v1`
- automation 节点国际出网当前通过阿里云美国机 `tinyproxy` 辅助
- `Idea Clarifier`
  - 虽然也复用服务器侧 `OPENAI_API_KEY`
  - 但不能直接依赖 `pi` 内置 `openai` provider
  - 需要额外的 `volcengine-coding-plan` 自定义 provider 才能稳定走火山 `Doubao-Seed-2.0-pro`
- `Engineer / Test QA`
  - 当前不通过降模型省 token
  - 当前通过 `session compaction` 控制长会话上下文体积

## 5. 当前推荐稳定口径

### 5.1 推荐保留

- `CEO`
  - `hermes_local + minimax-m2.5`
- `Engineer`
  - `codex_local + gpt-5.3-codex`
  - `sessionCompaction = { enabled: true, maxSessionRuns: 12, maxRawInputTokens: 300000, maxSessionAgeHours: 24 }`
  - 对普通任务单机试点，允许通过本地 Mac 直连远端 control plane 执行
  - 成本压力较高或遇到公共卡点时，允许用户手动暂停；后续再补“多次失败自动转人工”
- `Test / QA`
  - `codex_local + gpt-5.3-codex`
  - `sessionCompaction = { enabled: true, maxSessionRuns: 12, maxRawInputTokens: 300000, maxSessionAgeHours: 24 }`
  - 对普通任务单机试点，允许通过本地 Mac 直连远端 control plane 执行
- 规划/产品/内容/研究类 Agent
  - `claude_local + ark-code-latest`
- `Idea Clarifier`
  - `pi_local + volcengine-coding-plan/Doubao-Seed-2.0-pro`
  - `HOME=/paperclip`
  - `claude_local` 仅作环境失败兜底

### 5.2 当前不建议

- 不建议为了“面板没有 warning”去改 `paperclip` 仓库语义
- 不建议为了统一而强行把所有 Agent 都迁成同一个 adapter
- 不建议把 `claude_local` 的 API-key warning 直接当故障

## 6. 后续变更时怎么更新

如果后续发生下面任一情况，应更新本表：

1. `CEO` 更换模型供应商或 base URL
2. `Engineer / Test QA` 切换模型
3. `claude_local` 系列从 API-key 模式改为登录态模式
4. `Idea Clarifier` 改 adapter 或改为 fallback-only
5. automation 节点的全局环境变量发生变化

更新时优先同步：

1. 本文
2. [服务器与基础设施入口.md](/Users/xinran/Downloads/dev/mindsync/company/服务器与基础设施入口.md)
3. `.paperclip.yaml`
4. 需要时再同步到项目级运维文档
