<audio title="01｜用十倍速制造事故：Loop Engineering 的暗面" src="https://res001.geekbang.org/media/audio/af/b9/af657399845fb03604e1f6d8d0a6b2b9/ld/ld.m3u8"></audio>

你好，我是李号双。

2026 年 6 月，Claude Code 创造者 Boris Cherny 宣布：“我不再直接提示 Claude 了。我有循环在运行，是它们在提示 Claude、决定下一步做什么。”

这个实践被命名为 Loop Engineering。它的愿景很诱人：你不再手动敲 Prompt，而是设计一个自动发现工作、分配任务、交叉检查、持久记忆的闭环系统。

但 Loop 里也埋着雷。当你照着 Loop Engineering 的宏观蓝图，搭起自动分诊、多 Agent 并行处理任务的系统，下班前满心欢喜地启动，第二天一看——Token 账单炸了，某个只读工具被组合调用导致全库数据泄露，甚至两个 Agent 并发修改同一份文件导致数据全飞了。

你查日志，发现一切正常。每一步都有输出，工具调用的标记是绿色的，模型响应时间在合理范围内。问题出在哪儿？

出在 Loop 的控制权如果交给了概率模型，自动化不仅会暴露缺陷，还会以更高的效率将缺陷放大为灾难。底层的 Agent 如果会撒谎、会死循环、会越权，再完美的顶层调度，也只是在用十倍速制造事故。

业界讨论基本停在“为什么要设计 Loop”，没有进入“Loop 内部该怎么设计、哪里会出事”。今天我们来剖析微观执行与宏观编排 Loop 内部的陷阱和坑，看看大模型时代的 Loop，到底遵循什么铁律。

## 微观执行与宏观编排，共享同一套工程宪法

我们先拆解两个概念：

Agent Loop（微观执行层）：包裹在大模型外围的 while True 逻辑，解决单个 Agent 怎么稳定跑完一次任务这一问题，它是发动机。

Loop Engineering（宏观编排层）：多 Agent 调度、外部工具对接、长期状态记忆的系统架构，解决怎么让 Agent 体系脱离人工值守、长期自主运转 ，它是整车工程。

两者看似层级不同，但根子里面对的是同一组核心挑战：

大模型是概率性的，而生产系统要求确定性；

大模型是无状态的，而长期运行要求有记忆；

大模型是单次推理的，而业务闭环要求可恢复；

多实例并发要求状态同步与隔离，而模型天生缺乏协调能力。

因此，无论是写单 Agent 的执行循环，还是设计整套 Loop Engineering 系统，它们都不是简单的重复劳动，而是共享同一套工程宪法。如果不遵守这些宪法，微观上你的 Agent 会陷入死循环空转 Token、盲目越权毁坏数据；宏观上你的多 Agent 编排会互相踩踏、状态撕裂、静默失效，最终整套系统沦为不可控的定时炸弹。

这套宪法，就是 5 大通用设计模式。

## 所有 Loop 都必须遵守的 5 条宪法

### 宪法一：硬边界熔断与独立裁决（绝不依赖模型自觉停下）

循环的终止不能由执行模型自己说了算。模型不仅会陷入死循环，还会“幻觉终止”——明明没做完，却说做完了。终止权必须由代码硬边界和独立验证逻辑裁决。

微观 Agent Loop 层

硬预算熔断：设定 max\_turns、max\_seconds、max\_tokens、max\_cost\_used，每轮强制检查。

@dataclass

class HardBudget:

max\_turns: int = 50

max\_seconds: int = 600

max\_tokens: int = 200\_000

max\_cost\_usd: float = 5.0

动作指纹去重与进度哈希（防死循环与幽灵循环）：同一参数调用超阈值判死循环；连续多轮上下文哈希不变判空转。

def detect\_infinite\_retry(run: AgentRun, call: ToolCall, \*, repeat\_threshold: int = 5) -> tuple\[bool, str\]:

fp = sha256(json.dumps({"name": call.name, "params": call.params}, sort\_keys=True))

count = run.\_fingerprint\_counter.get(fp, 0) + 1

run.\_fingerprint\_counter\[fp\] = count

if count > repeat\_threshold: return True, f"Dead loop: '{call.name}' called {count}×"

return False, ""

class ProgressMonitor:

def check(self, run: AgentRun) -> None:...

独立裁决（防幻觉终止）：模型说做完不算，系统验证才算。微观层面是 goal\_achieved(run) 函数；宏观层面，如 Claude Code 的 /goal 命令，通过 Stop Hook 调用另一个专门的小模型，来判断 Goal 是否达成——本质上是将终止权从“执行模型”交给了“校验模型”（Maker/Checker 分离），只有校验模型点头，循环才算真正终止。

宏观 Loop Engineering 层

全局任务硬约束，超出单日总预算（如 Claude Code 的 maxBudgetUsd），直接熔断；自动化任务必须定义可验证的终止条件，由独立验证节点判定。

本质：概率模型会自欺欺人，终止权必须交给有确定逻辑的守门员。

### 宪法二：提议 - 裁决分离与权限门禁（模型只是提议者，Loop 才是决策者）

模型只负责“提出下一步做什么”，Loop 负责“判断能不能做、要不要做”。工具执行永远不是第一步，而是层层门禁后的最后一步。

微观 Agent Loop 层

拦截工具幻觉：执行前必须过注册表强校验，参数类型必须匹配。

def validate\_tool\_call(call: ToolCall, registry: ToolRegistry) -> tuple\[bool, str\]:

if call.name not in registry:

return False, f"工具 {call.name} 不存在"

审批拦截与权限上下文注入：模型不知道当前用户的 RBAC 权限，它只会为了完成任务穷举路径。Loop 必须在执行前拦截高风险操作，并将用户的权限上下文强注入到工具调用参数中，防止“忠诚地越权”。

@dataclass

class ToolCallPolicy:

highRiskTools: set\[str\]

def decide(self, call: ToolCall, user\_context: UserContext) -> str:

if call.name in self.highRiskTools:

return "ask"

call.params\["scope"\] = user\_context.data\_scope

return "allow"

宏观 Loop Engineering 层

子 Agent 产出校验，写代码的和查代码的必须是两个 Agent（Maker/Checker 分离）。子 Agent 提交产出后，必须经校验节点通过，绝不采信子 Agent 的“已完成”声明。

本质：把模型从“决策者”打回“提议者”，工程系统才是最终的裁判，更是权限的守门员。

### 宪法三：显式状态机与上下文防挤压（别把系统跑成一笔糊涂账）

拒绝隐式的 while True，所有运行阶段必须有明确、可序列化的状态定义，同时防范长上下文导致的“指令失忆”。

微观 Agent Loop 层

拆分出 PREPARE -> THINK -> DECIDE -> EXECUTE -> DONE 阶段。

class RunState(StrEnum):

RUNNING = "running";

SUSPENDED = "suspended";

COMPLETED = "completed"

FAILED = "failed";

CANCELLED = "cancelled"

class RunPhase(StrEnum):

PREPARE = "prepare"

THINK = "think"

DECIDE = "decide"

EXECUTE = "execute"

DONE = "done"

防挤压认知：在 PREPARE 阶段，必须对上下文进行 L0-L3 分层（系统指令 > 当前状态 > 知识 > 历史）。系统区永不压缩，防止最关键的规则被长历史冲走。

宏观 Loop Engineering 层

任务全生命周期状态化，状态存在外部系统（Markdown、Linear），随时可查当前卡在哪一步。

本质：状态显式 = 可观测 = 可调试；上下文分层 = 防失忆 = 不越界。

### 宪法四：持久化可恢复（挂了能接着跑，绝不从头再来）

生产环境里，OOM、网络断、API 限流是常态。不可恢复的循环都是玩具。Checkpoint 不等于聊天记录，必须能完整恢复运行现场。

微观 Agent Loop 层

关键节点写 Checkpoint，且必须保证写入的原子性。

class CheckpointStore(Protocol):

async def save(self, run: AgentRun) -> None:...

async def load(self, run\_id: str) -> AgentRun | None:...

loop = AgentLoop(..., checkpoint\_writer=store.save, checkpoint\_loader=store.load)

宏观 Loop Engineering 层

全局进度持久化到外部存储。系统重启或次日运行时，读取继续未完成的任务进度，而不是重跑全流程。

本质：Checkpoint 粒度决定恢复精度。存聊天记录得重头理解，存执行位置 + 快照能直接续跑。

### 宪法五：同步与隔离（多 Loop 共享世界的生存法则）

当多个 Loop 实例（或 Agent）并发操作共享状态时，必须通过隔离和同步机制防止数据竞争与静默覆盖。

微观 Agent Loop 层：对写入操作必须串行化。模型一次输出多个工具调用，如果是“只读工具”，可受控并发；如果是“写入 / 删除工具”，必须按顺序串行执行，且涉及共享资源时必须加锁。

宏观 Loop Engineering 层：用 Git Worktree 做工作空间隔离（如 Claude Code 的 --worktree 参数）。每个子 Agent 在独立分支干活，不仅防止代码冲突，更是确保 Checker Agent 审查的基准不被 Maker Agent 篡改；任务分派支持去重，同一项工作不会重复派发。

本质：没有隔离的并行是相互毁灭，没有同步的共享是定时炸弹。在概率性的模型输出之上，必须构建确定性的协调机制。

## 终局代码：5 条宪法焊死后的 Agent Loop

我们把 5 条宪法焊进代码，一个单 Agent 的微观循环就不再是单薄的 while True，而是一台有明确状态转换的执行引擎。以下是完整的落地代码：

@dataclass

class AgentRun:

run\_id: str; task: str

state: RunState = RunState.RUNNING

phase: RunPhase = RunPhase.PREPARE

turn\_count: int = 0

input\_tokens: int = 0; output\_tokens: int = 0; cost\_usd: float = 0.0

messages: list\[Message\] = field(default\_factory=list)

tool\_history: list\[ToolCall\] = field(default\_factory=list)

pending\_tool\_call: ToolCall | None = None

\_fingerprint\_counter: dict\[str, int\] = field(default\_factory=dict)

\_retry\_counter: dict\[str, int\] = field(default\_factory=dict)

fault\_class: str | None = None; last\_error: str | None = None

class AgentLoop:

def \_\_init\_\_(self, llm, dispatcher, \*, budget, checkpoint\_writer, checkpoint\_loader,...):

self.\_runner = ToolRunner(dispatcher)

self.\_progress = ProgressMonitor()

async def \_loop\_events(self, run: AgentRun):

while True:

check\_budget(run, self.\_budget)

self.\_progress.check(run)

run.phase = RunPhase.PREPARE

system, messages\_to\_send = await self.\_context\_manager.prepare(run)

run.phase = RunPhase.THINK

response = await self.\_llm.complete(messages\_to\_send, system=system, tools=...)

run.turn\_count += 1; run.add\_tokens(response)

run.phase = RunPhase.DECIDE

if response.stop\_reason == "end\_turn":

if await self.\_goal\_achieved(run):

run.state = RunState.COMPLETED; yield RunCompletedEvent(run); return

run.messages.append(Message(role="user", content="目标尚未达成，请继续。"))

continue

run.phase = RunPhase.EXECUTE

async for event in self.\_runner.run\_batch(run, response.tool\_calls):

yield event

if self.\_write\_checkpoint:

await self.\_write\_checkpoint(run)

## 骨架大图：生产级 Agent Loop 状态机

![](https://static001.geekbang.org/infoq/8a/8a258a928c13d203d475099553d772e9.png)

## 大模型是油门，Loop 才是刹车系统

这 5 条宪法不是理论推演，而是生产级系统的共识。市面上顶级的 Agent 框架和实现，无一例外都遵循着这些宪法规则。差别只在各自的权衡偏好：

| 维度 | Claude Code | OpenAI Agents SDK | LangGraph | 5 条工程宪法 |
| --- | --- | --- | --- | --- |
| 熔断与裁决 | 美元预算 + 轮数 + /goal 校验 | 轮数 + 超时 + Guardrail | 图深度 + 递归限制 + 拓扑终态 | 硬边界熔断 + 独立裁决 |
| 裁决与权限 | canUseTool + hooks | 三层 Guardrail | interrupt\_before/after | 提议 - 裁决分离 + 权限门禁 |
| 状态与防挤压 | 层次化（会话 + 循环） | 类型化（RunResult 子类） | 图快照链 | 显式状态机 + 上下文防挤压 |
| 恢复 | 会话级持久化 | 需自行实现 | 一等公民 Checkpoint | 持久化可恢复 |
| 同步与隔离 | Worktree 隔离 + 文件锁 | 并发控制 | 节点级管控 + 状态锁 | 同步与隔离 |

## 总结

从 Prompt Engineering 到 Context Engineering，再到 Loop Engineering，AI 应用的构建范式正在发生深刻转移。这一转移的核心本质是：将系统的控制权从“概率性的大模型”剥离，交还给“确定性的工程系统”。

大模型是油门，负责提供智能与创意；而 Loop 系统是刹车与方向盘，负责兜底、纠偏与导航。今天我们拆解了生产级 Agent Loop 必须遵守的 5 条工程宪法：

硬边界熔断与独立裁决：绝不依赖模型自觉停下，终止权必须交给代码硬预算与独立校验逻辑；

提议 - 裁决分离与权限门禁：把模型降级为提议者，用工程代码做最终决策与权限拦截；

显式状态机与上下文防挤压：拒绝隐式循环，用分层上下文防止指令失忆，让系统可观测、可调试；

持久化可恢复：用细粒度的 Checkpoint 替代聊天记录，确保系统在崩溃后能原地续跑；

同步与隔离：在概率模型之上构建确定性的协调机制，用工作空间隔离和串行化写入防止并发踩踏。

这 5 条宪法不仅适用于单 Agent 的微观循环，也是多 Agent 宏观编排的底层铁律。掌握它们，你搭的才是稳定运转的自动化系统，而不是一台随时失控的定时炸弹。

## 思考题

在宪法一中我们提到，为了防止模型“幻觉终止”，需要引入独立校验节点来判断目标是否真正达成。但如果执行 Agent 为了尽快完成任务，伪造了看似成功的“证据”（比如假装跑了测试、或者生成了假的成功日志）传给校验模型，导致校验模型也产生了误判。

如何设计更健壮的 Maker/Checker 机制，来防范这种“执行模型欺骗校验模型”的共谋风险？

欢迎你在留言区分享你的思路和见解，如果你觉得有所收获，也欢迎你分享给其他朋友，我们下节课见！

公开

同步至部落

取消

完成

0/2000

直线

曲线

AI

2026-08-04给文章提建议

馨冉

Command + Enter 发表

0/2000字符

提交留言

大纲



固定大纲

微观执行与宏观编排，共享同一套工程宪法

所有 Loop 都必须遵守的 5 条宪法

宪法一：硬边界熔断与独立裁决（绝不依赖模型自觉停下）

宪法二：提议 - 裁决分离与权限门禁（模型只是提议者，Loop 才是决策者）

宪法三：显式状态机与上下文防挤压（别把系统跑成一笔糊涂账）

宪法四：持久化可恢复（挂了能接着跑，绝不从头再来）

宪法五：同步与隔离（多 Loop 共享世界的生存法则）

终局代码：5 条宪法焊死后的 Agent Loop

骨架大图：生产级 Agent Loop 状态机

大模型是油门，Loop 才是刹车系统

总结

思考题
