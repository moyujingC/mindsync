# Paperclip Agent 模型配置总表

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-27
> source_of_truth：company/Paperclip-Agent-模型配置总表.md

这份文档用于收口 `Paperclip` 当前各类 Agent 的运行时模型配置。

它回答的是下面几个问题：

- 这个 Agent 现在实际走哪个 `adapter`
- 它连的是哪一家模型入口
- `base URL` 是什么
- 模型名是什么
- 鉴权是怎么进来的
- 这个状态在面板上应该如何解读

补充口径：

- RelayHub 当前正式把这些运行时入口收成 `entry-*`
- Paperclip 当前正式目标口径是固定接入 RelayHub，而不是每次切模后重新同步真实上游
- 后续切模型时，优先改 RelayHub 的入口绑定；同步脚本只保留为初始化或修复工具

它不是部署文档，也不是 Agent 提示词文档。
如果要看服务器、SSH、代理、宿主职责，请回到：

- [服务器与基础设施入口.md](company/服务器与基础设施入口.md)

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
- 对 `codex_local`
  - 默认不应继承非 Paperclip 显式批准的外部 connector（连接器）
  - 若运行宿主无法技术上完全隔离外部已连接能力，应按高风险能力处理，而不是按普通可用性提示处理
- `warn` 不等于不可用
  - 对 `claude_local` 来说，如果 `hello probe succeeded` 同时存在，则通常表示可用，只是当前在走 API-key 模式

## 2. 当前分组总表

| Agent 分组 | 当前 Agent | Adapter | Base URL | Model | 鉴权方式 | 当前口径 |
| --- | --- | --- | --- | --- | --- | --- |
| CEO | CEO | `claude_local` | `RelayHub /v1/messages` | `relayhub-entry-paperclip-claude-local-server` | Paperclip -> RelayHub 访问凭证 | 当前正式口径改为固定接 RelayHub，由入口绑定决定真实上游 |
| 工程实现 | Engineer | `codex_local` | `RelayHub /v1/responses` | `relayhub-entry-paperclip-codex-local-mac` 或 `relayhub-entry-paperclip-codex-local-server` | Paperclip -> RelayHub 访问凭证 | 当前正式口径改为固定接 RelayHub，由入口绑定决定真实上游与推理强度 |
| 测试验收 | Test / QA | `codex_local` | `RelayHub /v1/responses` | `relayhub-entry-paperclip-codex-local-mac` 或 `relayhub-entry-paperclip-codex-local-server` | Paperclip -> RelayHub 访问凭证 | 当前正式口径改为固定接 RelayHub，由入口绑定决定真实上游与推理强度 |
| 需求澄清 | Idea Clarifier | `pi_local` | `RelayHub /v1/chat/completions` | `relayhub-entry-paperclip-pi-local-mac` 或 `relayhub-entry-paperclip-pi-local-server` | Paperclip -> RelayHub 访问凭证 | 当前正式口径改为固定接 RelayHub，由入口绑定决定真实上游 |
| 规划/产品/内容/研究 | Architect, UI / UX, Business Lead, Product Spec Lead, Research & Knowledge Lead, Content Lead | `claude_local` | `RelayHub /v1/messages` | `relayhub-entry-paperclip-claude-local-mac` 或 `relayhub-entry-paperclip-claude-local-server` | Paperclip -> RelayHub 访问凭证 | 当前正式口径改为固定接 RelayHub，由入口绑定决定真实上游 |

## 3. 分组展开

### 3.1 CEO

- Agent：`CEO`
- Adapter：`claude_local`
- Base URL：`https://relayhub.jingshu.cc/claude/v1`
- Model：`relayhub-entry-paperclip-claude-local-server`
- 模型来源：
  - Agent 级 `ANTHROPIC_BASE_URL`
  - Agent 级 `ANTHROPIC_MODEL`
  - Agent 级 `ANTHROPIC_API_KEY`
  - Agent 级 `ANTHROPIC_AUTH_TOKEN`
- 当前语义：
- 当前通过 `claude_local` 走 RelayHub 的 Anthropic Messages（Claude 协议）入口
- `relayhub-entry-paperclip-claude-local-server` 是入口别名，不是真实上游模型名
- 真实上游供应商、真实模型名、真实厂商密钥统一在 RelayHub 后台绑定里治理
- `ANTHROPIC_API_KEY` / `ANTHROPIC_AUTH_TOKEN` 在这里是 RelayHub 门禁 token（门禁卡），不是厂商 API Key
- 对普通任务本地自动执行链，CEO 继续保留 `server` 入口这条正式分流
- 当前 `server` 入口默认绑定已收口到 `DeepSeek V4 官方`

### 3.2 Engineer

- Agent：`Engineer`
- Adapter：`codex_local`
- Base URL：`https://relayhub.jingshu.cc/claude/v1`
- Model：`relayhub-entry-paperclip-codex-local-server`
- 协议：`OpenAI Responses`
- 当前默认入口绑定：`preset-ppchat-relay`
- 当前真实上游：`https://code.ppchat.vip/v1`
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
  - 稳态口径是让 `codex_local` 固定接入 RelayHub，而不是直接写死上游模型商
  - 当前服务器侧正式入口是 `relayhub-entry-paperclip-codex-local-server`
  - 当前客户端落地配置位置是：
    - `/paperclip/.codex/config.toml`
    - `/paperclip/.codex/auth.json`
  - 当前真实上游由 RelayHub 入口绑定解析到 `preset-ppchat-relay`
  - 若后续切模型、切 key 或切 `reasoningEffort`，优先在 RelayHub 控制面改入口绑定
  - 达到 session compaction 阈值后切新 session，属于成本控制，不代表故障
  - 对 `manual-review-required + local_manual_review`，正式目标宿主是用户当前这台 Mac，而不是 automation 服务器
- 安全边界口径：
  - `codex_local` 默认不应继承用户在其他 OpenAI / ChatGPT 应用表面已连接、但未在 Paperclip 显式批准的 connector
  - 若当前运行宿主做不到技术上完全隔离，这类外部读写能力默认按高风险能力处理
  - 对邮箱、发送消息、外部写入这类 connector，当前默认不视为已纳入 `墨予镜` 正式治理边界
  - 这类风险不属于普通 `warn`，而属于执行边界与安全边界问题
  - 若后续要正式启用，必须先单独立 `spec -> plan -> verification -> delivery`
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
- Base URL：`https://relayhub.jingshu.cc/claude/v1`
- Model：`relayhub-entry-paperclip-codex-local-server`
- 协议：`OpenAI Responses`
- 当前默认入口绑定：`preset-ppchat-relay`
- 当前真实上游：`https://code.ppchat.vip/v1`
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
  - 与 `Engineer` 保持同一条服务器侧 RelayHub 入口口径
  - 当前客户端落地配置位置同样是：
    - `/paperclip/.codex/config.toml`
    - `/paperclip/.codex/auth.json`
  - 当前真实上游由 RelayHub 入口绑定解析到 `preset-ppchat-relay`
  - 达到 session compaction 阈值后切新 session，属于成本控制，不代表故障
  - 对 `manual-review-required + local_manual_review`，正式目标宿主是用户当前这台 Mac，而不是 automation 服务器
- 安全边界口径：
  - 与 `Engineer` 共用同一条 `codex_local` connector 风险边界
  - 若测试链路可见外部已连接读写能力，默认先按治理缺口处理，而不是把它当作“顺带可用的工具”

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
- Base URL：`https://relayhub.jingshu.cc/claude/v1`
- Model：`relayhub-entry-paperclip-claude-local-mac`（本机）或 `relayhub-entry-paperclip-claude-local-server`（服务器）
- 相关环境变量：
  - `ANTHROPIC_API_KEY`
  - `ANTHROPIC_AUTH_TOKEN`
  - `ANTHROPIC_BASE_URL`
  - `ANTHROPIC_MODEL`
  - `ANTHROPIC_DEFAULT_OPUS_MODEL`
  - `ANTHROPIC_DEFAULT_SONNET_MODEL`
  - `ANTHROPIC_DEFAULT_HAIKU_MODEL`
  - `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1`

当前明确口径：

- 这组 Agent 当前正式口径是固定接入 RelayHub，而不是直连某一家上游厂商
- `ANTHROPIC_MODEL` 控的是 RelayHub entry alias（入口别名），不是 `deepseek-v4-pro` 这类真实模型名
- 当前采用 RelayHub 门禁 token 模式，而不是 Claude 登录态模式
- 后续如果要切真实上游模型，应优先改 RelayHub 后台绑定，而不是回写 Paperclip agent 的 `ANTHROPIC_MODEL`
- [shared/tools/sync-paperclip-claude-local-model.sh](shared/tools/sync-paperclip-claude-local-model.sh) 只保留为初始化或修复工具；它负责把 agent 对齐回 RelayHub，不负责定义真实上游模型是谁
- 当前正式默认绑定已收口为：
  - `entry-paperclip-claude-local-mac -> preset-deepseek-v4`
  - `entry-paperclip-claude-local-server -> preset-deepseek-v4`
- 当前真实默认上游模型是 `deepseek-v4-pro`
- 因此面板里出现：
  - `ANTHROPIC_API_KEY is set...`
  - 且状态为 `warn`
  - 这是预期现象，不单独视为故障

当前宿主分流口径：

- 本机 Mac 侧默认入口：`relayhub-entry-paperclip-claude-local-mac`
- 服务器侧默认入口：`relayhub-entry-paperclip-claude-local-server`
- 两条入口都走 `https://relayhub.jingshu.cc/claude/v1/messages`
- 前端里看到的“当前绑定模型”由 RelayHub 解析结果决定，不由 Paperclip 直接决定

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
- Provider / Model：`relayhub-entry-paperclip-pi-local-server`（服务器）或 `relayhub-entry-paperclip-pi-local-mac`（本地）
- Base URL：`RelayHub /v1/chat/completions`
- 运行时附加环境：
  - `HOME=/paperclip`
- 当前语义：
  - 这是保留 `pi_local` adapter 的独立执行链
  - 但底层模型已与其他 Agent 统一到 `deepseek-v4-pro`
- 当前实现口径：
  - `pi` 默认内置的 `openai` provider 会优先走 `openai-responses`
  - 当前切到 DeepSeek 后，仍建议优先保留可显式指定兼容口径的 provider 配置
  - 若运行时出现 `responses` 兼容问题，应优先改成稳定走 `chat/completions` 的 provider
- 治理口径：
  - 若后续本机 `pi` 环境不稳定，再决定是否继续保留、替换或只做 fallback
  - 若后续重建容器或迁移宿主，必须同步恢复 `/paperclip/.pi/agent/models.json`
  - 若只保留 `OPENAI_BASE_URL` / `OPENAI_API_KEY`，但遗漏自定义 provider，`Test environment` 仍可能失败
- RelayHub 入口绑定口径：
  - `entry-paperclip-pi-local-mac`
  - `entry-paperclip-pi-local-server`
  - 稳态口径是让 Paperclip 固定指向 RelayHub，并把 `adapterConfig.model` 固定为对应 `relayhub-entry-*`
  - 真实 `base_url / model / api_key / reasoningEffort` 由 RelayHub 控制面决定
  - [shared/tools/sync-paperclip-pi-model.sh](shared/tools/sync-paperclip-pi-model.sh) 只保留为初始化或修复工具

### 3.6 CEO Hermes

- Agent：`CEO`
- Adapter：`hermes_local`
- 当前规划范围：
  - 只纳入服务器入口
  - 对应 `entry-paperclip-hermes-local-server`
- RelayHub 入口绑定口径：
  - 稳态口径是让 Paperclip 固定指向 `relayhub-entry-paperclip-hermes-local-server`
  - 真实 `base_url / model / api_key / reasoningEffort` 由 RelayHub 控制面决定
  - [shared/tools/sync-paperclip-hermes-model.sh](shared/tools/sync-paperclip-hermes-model.sh) 只保留为初始化或修复工具

## 4. 当前服务器侧全局环境

automation 节点当前重要环境变量如下：

```env
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_MODEL=deepseek-v4-pro
HTTP_PROXY=http://47.253.255.110:18888
HTTPS_PROXY=http://47.253.255.110:18888
```

当前解读：

- `hermes_local`
  - 主要吃服务器侧 `OPENAI_*`
  - 同时应以 `/paperclip/.hermes/config.yaml` 作为 Hermes 进程直接读取的落地配置
- `claude_local`
  - 主要吃各 Agent 自己的 `adapterConfig.env` 中的 `ANTHROPIC_*`
- `codex_local`
  - 服务器侧稳态不再直接吃上游 `base_url`
  - 当前客户端固定指向 `https://relayhub.jingshu.cc/claude/v1`
  - 当前模型固定写为 `relayhub-entry-paperclip-codex-local-server`
  - 当前 Relay 访问 token 由 RelayHub 控制面的 `relay-config.json` 管理
  - Paperclip 客户端侧只消费 relay token，不直接持有上游供应商长期密钥
- automation 节点国际出网当前通过阿里云美国机 `tinyproxy` 辅助
- `Idea Clarifier`
  - 虽然也复用服务器侧 `OPENAI_API_KEY`
  - 当前模型已改为 `deepseek-v4-pro`
  - 但真正执行仍依赖 `/paperclip/.pi/agent/models.json` 中的自定义 provider
- `Engineer / Test QA`
  - 当前不通过降模型省 token
  - 当前通过 `session compaction` 控制长会话上下文体积

## 5. 当前推荐稳定口径

### 5.1 推荐保留

- `CEO`
  - `claude_local + relayhub-entry-paperclip-claude-local-server`
- `Engineer`
  - `codex_local + relayhub-entry-paperclip-codex-local-server`
  - `sessionCompaction = { enabled: true, maxSessionRuns: 12, maxRawInputTokens: 300000, maxSessionAgeHours: 24 }`
  - 对普通任务单机试点，允许通过本地 Mac 直连远端 control plane 执行
  - 成本压力较高或遇到公共卡点时，允许用户手动暂停；后续再补“多次失败自动转人工”
- `Test / QA`
  - `codex_local + relayhub-entry-paperclip-codex-local-server`
  - `sessionCompaction = { enabled: true, maxSessionRuns: 12, maxRawInputTokens: 300000, maxSessionAgeHours: 24 }`
  - 对普通任务单机试点，允许通过本地 Mac 直连远端 control plane 执行
- 规划/产品/内容/研究类 Agent
  - `claude_local + relayhub-entry-paperclip-claude-local-mac / relayhub-entry-paperclip-claude-local-server`
- `Idea Clarifier`
  - `pi_local + deepseek-v4-pro`
  - `HOME=/paperclip`
  - `claude_local` 仅作环境失败兜底

### 5.2 当前不建议

- 不建议为了“面板没有 warning”去改 `paperclip` 仓库语义
- 不建议为了统一而强行把所有 Agent 都迁成同一个 adapter
- 不建议把 `claude_local` 的 API-key warning 直接当故障
- 不建议把 `codex_local` 能访问到的外部已连接 connector 直接当作可默认使用能力

## 6. 后续变更时怎么更新

如果后续发生下面任一情况，应更新本表：

1. `CEO` 更换模型供应商或 base URL
2. `Engineer / Test QA` 切换模型
3. `claude_local` 系列从 RelayHub 门禁 token 模式改为别的鉴权模式
4. `Idea Clarifier` 改 adapter 或改为 fallback-only
5. automation 节点的全局环境变量发生变化

更新时优先同步：

1. 本文
2. [服务器与基础设施入口.md](company/服务器与基础设施入口.md)
3. `.paperclip.yaml`
4. 需要时再同步到项目级运维文档
