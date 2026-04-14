# PaperClip Agent Configuration 页面研究与推荐配置手册

> 状态：current
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-04-06
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/research-center/delivery/2026-04-06-PaperClip-Agent-Configuration-页面研究与推荐配置手册.md
> 项目：研究中心
> 阶段：delivery

本文解释 PaperClip 中单个 agent 的 `Configuration` 页面：每个字段是什么意思、可以怎么设、以及它对 `墨予镜` 当前系统运行的影响。

## 1. 一句话理解

这个页面本质上同时在配置 4 类东西：

- Agent 身份与组织关系
- Adapter 启动参数
- Heartbeat / Run Policy
- 权限与认证

## 2. 对 `墨予镜` 当前系统最关键的映射

根据 [/.paperclip.yaml](/Users/xinran/Downloads/dev/mindsync/.paperclip.yaml)：

- `Idea Clarifier`
  - `pi_local`
- `Business Lead`、`Product Spec Lead`、`UI / UX`、`Research & Knowledge Lead`、`Architect`、`Content Lead`
  - `claude_local`
- `Engineer`、`Test / QA`
  - `codex_local`
- `CEO`
  - `hermes_local`

因此当前最重要的两类 adapter 是：

- `pi_local`
  - 适合 `Idea Clarifier` 这类高频澄清与连续追问场景
- `claude_local`
  - 适合研究、判断、写作、路由与组织协作
- `codex_local`
  - 适合实现、测试、工程执行

## 3. 字段解释

### 3.1 Identity

#### `Name`

- 含义：agent 的显示名称
- 影响：主要影响识别和 UI 展示

#### `Title`

- 含义：职位头衔
- 影响：主要影响展示，不直接改变运行逻辑

#### `Reports to`

- 含义：上级 manager
- 影响：影响组织图、chain of command 和少量管理权限判断

#### `Capabilities`

- 含义：能力边界说明
- 影响：当前更偏描述性元数据，但会影响组织可读性与任务路由理解

### 3.2 Adapter

#### `Adapter type`

- 含义：决定 PaperClip 用哪种 adapter 启动该 agent
- 影响：这是最关键的开关，直接决定运行方式

#### `Test environment`

- 含义：用当前配置做环境检查
- 影响：不改正式配置，但能提前发现 CLI、认证、模型、目录问题

#### `Command`

- 含义：实际运行的命令名或路径
- 影响：直接决定 PaperClip 启动哪个本地命令

#### `Model`

- 含义：模型覆盖项
- 影响：直接影响能力、速度、成本与稳定性

#### `Thinking effort`

- 含义：推理强度
- 影响：越高通常越稳、更慢、更贵

#### `Agent instructions file`

- 含义：运行时注入的 agent 说明文件路径
- 影响：对 agent 行为一致性影响很大

### 3.3 Claude local 常见项

#### `Enable Chrome`

- 含义：给 Claude CLI 加 `--chrome`
- 影响：提升浏览器相关能力，也扩大运行面

#### `Skip permissions`

- 含义：自动跳过 Claude 权限确认
- 影响：适合可信本地环境下的无人值守运行

#### `Max turns per run`

- 含义：单次 heartbeat 允许的最大 agentic turns
- 影响：防止单次 run 无限扩张

### 3.4 Codex local 常见项

#### `Bypass sandbox`

- 含义：绕过审批与沙箱
- 影响：执行力更强，但风险也更高

#### `Enable search`

- 含义：允许联网搜索
- 影响：提升查新能力，也增加输出波动和复杂度

### 3.5 Permissions & Configuration

#### `Extra args`

- 含义：额外 CLI 参数
- 影响：直接改变底层命令行行为

#### `Environment variables`

- 含义：注入到 adapter 进程中的环境变量
- 影响：对认证、目录、开关、联网等都可能有很大影响

#### `Timeout (sec)`

- 含义：单次 heartbeat 最长运行时长
- 影响：是防止 run 卡死的重要阀门

#### `Interrupt grace period (sec)`

- 含义：中断后等待强制 kill 的时间
- 影响：决定超时和取消时退出是否平滑

### 3.6 Run Policy

#### `Heartbeat on interval`

- 含义：是否允许定时唤醒
- 影响：决定它是定期巡检还是纯事件驱动

#### `Run heartbeat every N sec`

- 含义：定时频率
- 影响：直接影响系统轮询频率与资源占用

#### `Wake on demand`

- 含义：允许非 timer 的唤醒
- 影响：当前实现里基本覆盖 `assignment`、`on_demand`、`automation`

#### `Cooldown (sec)`

- 含义：页面上表示两次心跳最小间隔
- 影响：当前源码核对中未确认其已稳定接入主执行逻辑

#### `Max concurrent runs`

- 含义：同一 agent 允许并发多少个 run
- 影响：当前已在运行时生效

### 3.7 Permissions

#### `Can create new agents`

- 含义：允许创建或雇佣新的 agent
- 影响：会隐式带来 task assign 能力

#### `Can assign tasks`

- 含义：允许给别的 agent 派任务
- 影响：是多 agent 编排边界的重要权限

### 3.8 API Keys

#### `Create API Key`

- 含义：给该 agent 生成长期 token
- 影响：让外部调用或本地 CLI 可以代表该 agent 调用 PaperClip API

## 4. 对 `墨予镜` 的推荐总口径

- `Idea Clarifier` 优先 `pi_local`
  - 标准兜底：`claude_local`
  - 不再默认由 `CEO` 代跑
- 研究、产品、架构、内容、商业角色优先 `claude_local`
- 实现、测试角色优先 `codex_local`
- 第一轮优先保证：
  - `Reports to` 清楚
  - `Capabilities` 清楚
  - `Max concurrent runs = 1`
  - `Engineer` 与 `Test / QA` 不要长期 `Timeout = 0`
  - 只有 `CEO` 拥有管理权限

## 5. 本次核对中最需要记住的两个差异

- `*_local`
  - 当前含义是“Paperclip 所在宿主机本地”
  - 不是操作者这台电脑本地

- `Cooldown`
  - 当前不应作为可靠保护机制依赖
- `wakeOnAssignment / wakeOnOnDemand / wakeOnAutomation`
  - 历史规格中分开定义，当前实现更接近统一到 `wakeOnDemand`

## 6. 当前结论

`Configuration` 页面不是普通表单，而是对 agent 组织结构、运行方式、唤醒节奏、安全边界和权限边界的总控制面。
