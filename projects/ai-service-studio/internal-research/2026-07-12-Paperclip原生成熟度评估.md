# Paperclip 原生成熟度评估

> 评估日期：2026-07-12
> 评估对象：`paperclipai/paperclip` 官方原生版本 `v2026.707.0`
> 官方发布时间：2026-07-07
> 官方 tag commit：`390627b46eb333309d357004384b220ecf8a65af`
> 评估目的：判断 Paperclip 当前能做到什么程度，以及是否适合作为企业 AI 服务的交付载体。

## 1. 结论

Paperclip `v2026.707.0` 已经从早期任务板，成长为一个较完整的 AI agent 控制平面（control plane，调度和治理层）。它能管理 company、agent、task/issue、routine、workspace、secret、approval、plugin，并把 agent 的执行过程、人工审批、任务状态、成本与审计记录收束到同一个系统里。

对当前 `墨予镜企业AI服务` 来说，它适合做一类交付载体：承载“一个客户业务流程如何被拆成任务、由谁负责、什么时候调用 AI、如何审核、如何留下交付记录”。它不应被包装成成熟的企业级 AI 平台，也不宜一开始就让客户把它暴露到公网、接入敏感生产系统，或承诺替代客户现有 OA/Jira/飞书/企业微信流程。

更准确的定位是：

- 可用于个人或小团队的真实工作流试点。
- 可用于咨询交付中的流程承载、任务审阅、agent 调度演示和交付记录留存。
- 可作为客户企业 AI 协作机制的样板环境。
- 暂不建议作为客户核心生产系统的无监督执行平台。

## 2. 本次评估边界

本评估只看 Paperclip 官方原生版本，不纳入 MindSync 对 Paperclip 的本地配置、二次改造、自动化脚本或历史部署经验。

证据来源：

- GitHub 官方 release：`v2026.707.0`
- 官方 README、产品定义、部署文档、API 文档、adapter 文档、secrets 文档、roadmap
- 官方 security advisories
- 官方 tag 文件树与 package/test/route/schema 清单

本地 `/Users/xinran/Downloads/dev/paperclip` 不作为评估对象。该目录当前落后官方 `origin/master` 592 个提交，且存在大量删除、新增和修改状态，不能代表原生版本。

## 3. 它现在是什么

Paperclip 官方定义是“用来管理工作型 AI agents 的应用”。从产品结构看，它包含三层：

1. 操作层：Web UI、CLI、任务板、收件箱、审批、活动日志。
2. 协调层：company、org chart、agent、issue、routine、goal、project、workspace。
3. 执行层：adapter、heartbeat、workspace、sandbox、secret injection、runtime logs。

通俗讲，它像一个“AI 员工公司的后台”。你不是只开一个 Codex 或 Claude Code 窗口，而是把多个 AI worker 放进一个有组织结构、任务、预算、审批和记录的系统里。

它的基础抽象是：

```text
Company：一套组织和目标
Agent：一个 AI 员工
Issue：一件具体工作
Routine：定期或外部触发的工作
Workspace：agent 执行工作的目录/隔离环境
Approval：人工审批点
Secret：运行时凭据
Plugin：扩展能力
```

## 4. 当前可用能力

### 4.1 Company 与多组织

一个 Paperclip instance 可以运行多个 company。每个 company 有自己的 agents、projects、issues、routines、secrets、activity 和成员关系。

成熟度判断：可用于单人多项目、小团队多客户样板、咨询演示环境。多租户隔离已有设计和实现，但如果用于真实客户数据隔离，仍需要部署、权限、安全和备份的额外验证。

### 4.2 Agent 管理

Paperclip 可以创建、更新、暂停、恢复、终止 agent，并管理 agent 的 adapter config、预算、状态和组织关系。

官方 API 覆盖：

- `GET /api/companies/{companyId}/agents`
- `POST /api/companies/{companyId}/agents`
- `PATCH /api/agents/{agentId}`
- `POST /api/agents/{agentId}/pause`
- `POST /api/agents/{agentId}/resume`
- `POST /api/agents/{agentId}/terminate`
- `GET /api/agents/{agentId}/config-revisions`
- `POST /api/agents/{agentId}/config-revisions/{revisionId}/rollback`

这说明 agent 已经是可管理对象，不只是配置文件。

成熟度判断：个人和小团队可用。正式企业环境需要先定义谁能创建 agent、谁能改配置、谁承担 agent 行为责任。

### 4.3 Adapter 与外部 AI 工具连接

Adapter（适配器）负责把 Paperclip 的任务调度转成具体 AI 工具的执行。官方内置 adapter 包括：

- `claude_local`：本地 Claude Code
- `codex_local`：本地 Codex
- `acpx_local`：通过 ACPX 执行 Claude、Codex 或自定义 ACP agent
- `opencode_local`
- `cursor`
- `pi_local`
- `hermes_local`
- `hermes_gateway`
- `openclaw_gateway`
- `process`：执行任意命令
- `http`：调用外部 webhook/API

这点对企业 AI 服务很重要。它意味着 Paperclip 不要求客户放弃员工手动使用 Codex、Claude Code 等工具。Paperclip 可以管“任务和流程状态”，具体执行仍可以由人或 agent 在熟悉的工具里完成。

成熟度判断：adapter 生态已经成型，但不同 adapter 的稳定性和可观测性不一样。`process` / `http` 是通用兜底；`codex_local` / `claude_local` 适合本地试点；sandbox/cloud adapter 仍需单独验证。

### 4.4 Issue / Task 系统

Paperclip 的 issue 是工作单元，包含 title、description、status、priority、assignee、parent issue、project、goal、comments、documents、attachments、work products 等。

官方 core concepts 里定义的状态流是：

```text
backlog -> todo -> in_progress -> in_review -> done
                       |
                    blocked
```

并且 `in_progress` 需要 atomic checkout（原子领取），避免多个 agent 同时拿同一件事。

成熟度判断：这是 Paperclip 最适合作为“交付载体”的部分。企业 AI 服务最难的往往不是模型能力，而是谁负责、做哪一步、结果如何验收、异常怎么处理。Paperclip 的 issue/comment/approval/work product 模型正好承载这些信息。

### 4.5 Heartbeat 执行

Heartbeat（心跳）是 agent 被唤醒执行工作的机制。触发方式包括 schedule、assignment、comment、manual、approval resolution。

Paperclip 在 heartbeat 中做的事情包括：

- 找到 agent 和 adapter 配置
- 解析运行 workspace
- 注入运行时环境变量和 secret
- 调用 agent runtime
- 记录 run、log、cost、session state、audit trail
- 处理恢复和异常

成熟度判断：这是 Paperclip 区别于普通任务管理器的主要能力。它已经能承接真实自动化任务，但建议在咨询试点中先使用“人工可审阅 + agent 辅助执行”的模式，不要直接放开全自动长期运行。

### 4.6 Routine / 自动化

Routine 是周期性或外部触发的任务。官方 API 支持：

- cron schedule
- webhook trigger
- API trigger
- manual run
- concurrency policy
- catch-up policy
- revision restore
- trigger secret rotation

Routine 可以用于周报、巡检、资料整理、客户线索处理、固定审阅等重复任务。

成熟度判断：对企业 AI 服务非常有价值。它可以把“一次性教会使用 AI”变成“固定节奏下持续产生任务和记录”。但 webhook 对外暴露时必须做签名、重放窗口、权限和日志审查。

### 4.7 Workspace 与执行隔离

Paperclip 支持 project workspace 和 execution workspace。execution workspace 可以用 git worktree 等方式隔离执行目录、分支和运行状态。

官方文档明确：

- workspace services 由 UI 手动启动/停止。
- issue 执行不会自动启动/停止 workspace services。
- server 启动不会自动恢复 workspace services。
- execution workspace 持久存在，直到人工关闭。

成熟度判断：适合代码类或文档类任务隔离，也适合演示“每个任务有自己的执行空间”。但它不是全自动 DevOps 平台。客户如果期待“任务一来自动开环境、跑服务、验收、发布”，需要额外设计。

### 4.8 Secrets 与凭据

Paperclip 已有较完整的 secrets 设计：

- 本地 encrypted provider
- AWS Secrets Manager 外部引用
- user-specific secrets
- secret binding
- strict mode
- secret access event
- provider vault
- provider health check

重要边界是：Paperclip 只能保护 secret 到注入 agent 之前。一旦 secret 进入 agent 进程、sandbox 或远程主机，agent 可以读取、记录或转发它。

成熟度判断：比早期原型成熟很多，已经考虑企业部署会遇到的凭据边界。但不能把它当成“agent 绝对无法泄露 secret”的安全方案。客户试点应使用最小权限、测试账号、可轮换凭据。

### 4.9 Approval 与人工治理

Paperclip 支持 board approval、hire approval、strategy approval、execution policy、agent pause/resume/terminate、activity audit trail。

对企业 AI 服务来说，这正好对应人的角色：

- 人决定是否启动工作。
- 人审核 agent 的计划。
- 人处理异常和越权行为。
- 人对最终交付负责。

成熟度判断：适合把“人机协作”做成可见流程。企业试点中应优先使用审批和 review，而不是追求完全自动化。

### 4.10 Plugin / Skills

官方 roadmap 显示 plugin system 已完成。源码中也有 plugin SDK、example plugin、sandbox provider plugin、LLM wiki plugin、workspace diff plugin、create-paperclip-plugin 等包。

这说明 Paperclip 的扩展路径不是只能 fork core，而是可以通过插件扩展。

成熟度判断：对长期产品化有价值，但第一阶段咨询交付不建议依赖自定义插件。先用原生 issue/routine/adapter/secrets/workspace 能力验证价值。

### 4.11 CLI、Docker 与部署

官方支持：

- `pnpm paperclipai onboard`
- `pnpm paperclipai run`
- `pnpm paperclipai doctor`
- `pnpm paperclipai configure`
- `pnpm paperclipai secrets doctor`
- Docker Compose quickstart
- authenticated private/public deployment mode

部署模式包括：

| 模式 | 认证 | 适用场景 |
|---|---|---|
| `local_trusted` | 无登录 | 单人本地使用 |
| `authenticated + private` | 登录 | Tailscale/VPN/LAN 内部访问 |
| `authenticated + public` | 登录 | 云部署/公网访问 |

成熟度判断：本地试用门槛可控；私有网络共享有明确路径；公网部署已有设计但仍需要认真做安全、备份、反向代理、密钥和升级流程。

## 5. 工程成熟度信号

官方 `v2026.707.0` tag 下的可观测信号：

- monorepo package 数量较多，包含 server、ui、cli、db、shared、mcp-server、adapter-utils、多个 adapters、plugin SDK、skills catalog、teams catalog。
- 文件树中 package 包括 Claude、Codex、Cursor、Gemini、Hermes、OpenClaw、OpenCode、Pi、ACPX、本地/远程 sandbox providers。
- test/spec 文件约 871 个。
- server route 覆盖 access、activity、agents、approvals、companies、costs、dashboard、environments、execution-workspaces、goals、health、issues、plugins、projects、routines、secrets、workspace runtime 等。
- DB schema 覆盖 agents、issues、routines、approvals、secrets、costs、activity、plugins、workspace、pipeline、goals、documents、assets 等。
- 2026-06 到 2026-07 仍保持高频 release，`v2026.707.0` 包含 89 commits、8 contributors。

这些信号说明它不是一个玩具 demo，已经进入可运行产品阶段。但它仍在快速变化，roadmap 里仍有多项未完成能力，例如 cloud/sandbox agents、artifacts/work products、memory/knowledge、enforced outcomes、work queues、deep planning、desktop app。

## 6. 安全成熟度

Paperclip 官方 security advisories 显示，2026-04 曾集中披露多项严重问题，包括：

- 未授权 RCE
- command injection
- cross-tenant API key / token 问题
- unauthenticated endpoint access
- agent-controlled config 导致任意文件读取或 OS command execution
- stored XSS
- approval attribution spoofing
- malicious skills 数据外泄风险

这组安全公告有两层含义：

1. 正面：项目开始认真处理安全边界，且使用 GitHub Security Advisory 公开披露。
2. 负面：它确实经历过多项高危/严重漏洞，说明不适合在没有安全审查的情况下直接承载客户敏感生产数据。

到 `v2026.707.0`，release notes 显示安全和治理方向已有明显强化：

- user-specific runtime secrets
- responsible-user run attribution
- Work Timeline 安全过滤
- secret redaction
- authenticated deployment
- strict mode
- read-only diagnostics endpoints
- branch incoherence containment
- sandbox reliability fixes

成熟度判断：安全能力在快速补齐，但对企业客户仍应按“需要受控试点”处理，而不是按成熟 SaaS 平台处理。

## 7. 作为企业 AI 服务交付载体的适配度

你的判断“企业 AI 服务的痛点是交付，所以考虑用 Paperclip 作为交付载体”是成立的，但要把 Paperclip 放在正确位置。

它适合管：

- 谁负责这一步。
- 当前做到哪一步。
- 需要什么输入。
- 产出物在哪里。
- 是否需要人工审核。
- 谁批准继续。
- 哪些任务被阻塞。
- 哪个 routine 会定期触发。
- 哪个 agent / 人用哪个工具执行。
- 交付过程留下什么记录。

它不适合直接承诺：

- 自动理解客户全部业务流程。
- 自动替代客户内部管理系统。
- 自动保证 agent 不犯错。
- 自动保证数据安全。
- 自动完成复杂跨系统集成。
- 自动让非技术员工无学习成本上手。

因此推荐的服务话术应接近：

```text
我们用 Paperclip 把一条具体业务流程变成可运行、可审阅、可复盘的 AI 协作流程。
员工仍然可以手动使用 Codex、Claude Code、ChatGPT 或企业现有工具。
Paperclip 负责把任务、责任、状态、审批、交付记录和复盘留住。
```

## 8. 最适合的试点场景

优先选择这样的客户流程：

- 高频发生。
- 当前交接和返工明显。
- 有清楚负责人。
- 有明确验收结果。
- 可以人工审核。
- 不需要一开始接入复杂生产系统。
- 2-4 周内能跑出一次真实闭环。

推荐试点类型：

1. 文档批处理：合同初筛、政策整理、客户资料摘要、知识库整理。
2. 内容生产流程：选题、初稿、审核、发布准备、复盘。
3. 销售/客服线索处理：线索归类、跟进建议、FAQ 草拟、人工确认。
4. 项目周报：从任务记录生成周报，人工审核后发送。
5. 内部需求澄清：把零散需求变成任务、问题清单、验收标准。

不推荐第一批试点：

- 财务付款、合同签署、HR 处罚、客户正式承诺等高风险动作。
- 需要深度写入客户核心系统的流程。
- 涉及大量个人隐私、商业秘密或受监管数据的流程。
- 没有明确负责人、没有验收标准的“AI 转型”泛项目。

## 9. 推荐交付方式

### 阶段 1：顾问代管试点

由顾问在受控环境里配置 Paperclip，客户只参与任务、输入、审核和复盘。

优点：

- 上手成本低。
- 交付边界可控。
- 不要求客户运维 Paperclip。
- 适合验证服务是否有价值。

限制：

- 客户没有完全自维护能力。
- 数据边界必须说清。
- 不适合敏感数据。

### 阶段 2：客户私有网络部署

在客户可控机器或私有网络部署 `authenticated + private`。

优点：

- 更符合企业数据边界。
- 可引入客户自己的账号、密钥和内部流程。
- 适合小团队长期使用。

限制：

- 需要运维、备份、升级、安全审查。
- 客户需要有一个技术或运营 owner。

### 阶段 3：混合托管

顾问维护模板、流程和升级建议，客户维护账号、数据和最终审批。

优点：

- 平衡交付效率和客户控制。
- 有利于持续服务收费。

限制：

- 责任边界必须写清：谁维护系统，谁处理数据，谁承担业务决策。

## 10. 对墨予镜企业AI服务的产品化建议

第一版不要卖“Paperclip 平台搭建”。建议卖：

```text
一条业务工作流的 AI 协作交付试点
```

周期：2-4 周。

交付物：

- 当前流程与责任地图。
- Paperclip 中的一条任务/状态/审批配置。
- 2-3 个员工可复用的 Codex/Claude/ChatGPT 操作模板。
- 人工审核和异常升级规则。
- 一次真实任务辅助运行记录。
- 一份复盘：周期、返工、阻塞点、员工可独立完成比例。
- 客户自维护说明。

验收指标：

- 这条流程是否跑完一次真实任务。
- 任务状态是否可追踪。
- 产出物是否可找到。
- 审核责任是否明确。
- 员工是否知道何时手动使用 AI 工具。
- 返工原因是否被记录。
- 客户是否愿意继续跑第二轮。

## 11. 当前风险清单

### 技术风险

- 项目变化快，版本升级可能带来行为变化。
- 部署和运行仍需要工程能力。
- sandbox/cloud 相关能力还在成熟中。
- workspace runtime services 仍是手动管理，不是全自动运行平台。

### 安全风险

- 历史上出现过多项高危漏洞。
- agent 拿到 secret 后，Paperclip 无法继续保证 secret 不泄露。
- 公网部署需要额外安全审查。
- plugin 和 skill 能力越强，越需要权限边界。

### 交付风险

- 客户可能把 Paperclip 理解成“AI 自动干活平台”，而不是“协作流程承载层”。
- 非技术员工仍需要学习如何写清输入、审核输出、记录例外。
- 如果流程没有 owner，Paperclip 只会把混乱流程可视化，不能自动修复组织问题。
- 如果试点流程太大，会变成平台实施项目，脱离当前现金流验证阶段。

## 12. 成熟度评分

| 维度 | 成熟度 | 判断 |
|---|---:|---|
| 本地个人使用 | 高 | local trusted、CLI、UI、adapter、issue/routine 已经可用 |
| 小团队私有试点 | 中高 | authenticated/private、多用户、secrets、approval 已具备，但需 owner |
| 咨询交付载体 | 中高 | 很适合承载流程、任务、审批、复盘；应限制范围 |
| 客户生产系统 | 中 | 需要安全、备份、权限、升级、运维方案 |
| 公网企业平台 | 中低 | 有 authenticated/public 路径，但不建议无审查直接使用 |
| agent 全自动运营 | 中低 | heartbeat/routine 可用，但 outcome enforcement、memory、work queues 仍在 roadmap |
| 插件生态 | 中 | plugin system 已完成，生态还需要验证 |
| 安全治理 | 中 | 设计明显加强，但历史漏洞密集，必须保守部署 |

## 13. 当前可执行建议

近期可做：

1. 用官方原生 Paperclip 建一个干净试点环境，不叠加 MindSync 改造。
2. 选择一条低敏、高频、有明确验收的客户流程。
3. 只配置必要对象：company、project、agents、issue template、routine、approval。
4. 让员工继续手动使用 Codex/Claude/ChatGPT，把结果贴回 Paperclip。
5. 用 Paperclip 记录任务、审核、返工、阻塞和最终交付物。
6. 试点结束后复盘：它到底减少了什么交付摩擦。

暂时不要做：

- 不要把 Paperclip 包装成“企业 AI 平台”。
- 不要直接卖公网部署。
- 不要第一单就做复杂系统集成。
- 不要把客户敏感生产数据放进未审计环境。
- 不要让 agent 直接执行不可逆业务动作。

## 14. 一句话定位

Paperclip 当前最有价值的位置，不是替代 Codex 或 Claude Code，而是把“人如何使用这些 AI 工具完成一条业务流程”变成可运行、可审阅、可复盘的交付系统。

## 15. 官方来源

- Release：<https://github.com/paperclipai/paperclip/releases/tag/v2026.707.0>
- Security advisories：<https://github.com/paperclipai/paperclip/security/advisories>
- 官方仓库：<https://github.com/paperclipai/paperclip>
- 官方文档入口：<https://paperclip.ing/docs>
