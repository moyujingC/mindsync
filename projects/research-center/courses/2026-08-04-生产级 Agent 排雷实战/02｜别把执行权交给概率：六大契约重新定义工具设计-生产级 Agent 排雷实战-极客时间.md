<audio title="02｜别把执行权交给概率：六大契约重新定义工具设计" src="https://res001.geekbang.org/media/tts_audio/20260803/tts-15689-30-1002776/ld/ld.m3u8"></audio>

你好，我是李号双。这节课我们来看工具调用容易踩的坑。

先给你看一个工具最基础的写法，估计很多人第一轮都是这么写的：

def send\_email(to: str, subject: str, body: str):

"""发送邮件"""

return email\_client.send(to, subject, body)

def query\_order(order\_id: str):

"""查询订单"""

return db.query(order\_id)

def manage\_account(action: str, user\_id: str, \*\*kwargs):

"""账户管理（查询/修改/删除/冻结）"""

if action == "query": return fetch\_user(user\_id)

elif action == "delete": return hard\_delete\_user(user\_id)

加起来不到二十行。跑起来没问题，还接入了几个第三方 MCP Server。过了两天，你的手机响了。 监控面板显示过去 6 小时，工具调用异常计数已达 1,024 次。你爬起来翻日志，看到了三段让你后背发凉的画面：

![](https://static001.geekbang.org/infoq/0d/0d534b5dfa9c7fdf5375b1be172f2b43.png)

画面一：无限重试。 Agent 循环查询一个不存在的订单 ID，报错 Order not found，但它没有停，连续调了 847 次。

画面二：重复发送。 网络超时，你的 Loop 自动重试，而第三方邮件 MCP Server 没做防重，给同一个客户连发了 50 封通知邮件。

画面三：状态覆盖与上下文爆炸。 调用第三方账户管理工具时，工单的原始状态被直接覆盖；同时，另一个查询工具一次性返回了 10MB 的日志，直接撑爆了 LLM 的 Context Window，后续对话全部丢失。

你去查代码，发现一切“正常”。要说哪里出问题了？看不出。

## 把带副作用的执行权毫无保留地交给了概率模型

绝大多数人理解 Tool Calling 是这样的：模型决定调哪个工具，传什么参数，代码执行完返回结果，模型继续思考。

这个理解里藏着个陷阱：你把带有副作用的执行权，毫无保留地交给了概率模型。

传统软件里，重试是由人触发的，人知道分寸；但在 Agent Loop 里，重试是由概率模型触发的——遇到超时它重试，遇到空数据它重试，崩溃恢复后它接着重试。如果你的工具本身不防重，Agent 的每一次重试，都是在制造生产事故。

无论你是在写 Native Tool，还是接入黑盒的第三方 MCP Server，底层的设计哲学是不变的。MCP 协议本身只管通信，它不区分读和写，也不管你幂不幂等。你不能再奢求修改别人的代码，你必须把工具当成一个对抗性系统的入口来设计。

工具设计的本质不是“实现功能”，而是“定义 Agent 能做什么、不能做什么，以及做错了怎么兜底”。

## 六大契约重新定义工具的生命周期

一个完整的工具调用生命周期，包含“设计 -> 模型决策 -> 系统拦截 -> 执行 -> 异常反馈 -> 结果返回”六个环节。我们必须在每个环节建立强契约。

### 设计契约：工具原子化，拒绝瑞士军刀

一切灾难的起点，往往是从设计一个“瑞士军刀”式的工具开始的。你如果给了 Agent 一个 manage\_account（包含查询、修改、删除、冻结），它想删数据时，你的权限防线根本拦不住，因为工具名看起来人畜无害。

![](https://static001.geekbang.org/infoq/9a/9afbbc6268c1159c1b969e7e61256cb0.png)

Agent Loop 的权限拦截是挂在工具级别（工具名）上的。最佳实践是工具原子化与正交化：将大而全的操作拆分为 get\_user\_profile（只读）、freeze\_user\_account（写操作）、delete\_user\_account（高危操作）。

只有工具拆细了，后面所有的拦截、并发控制、元数据打标才有意义。在 MCP 场景下，如果第三方给了一个不可拆分的瑞士军刀，Host 必须在网关层通过条件判断将其路由到不同的安全策略中。

### 决策契约：描述工程让模型做对选择

模型永远看不到你的实现代码，它选择工具的唯一依据，就是你给它的 name 和 description。一个实现完美但描述模糊的工具，对模型来说就是隐形的。生产级的描述必须遵循“六要素”框架：

一句话总结：它干什么。

使用场景：何时用。

与其他工具的区别：为什么选它而不选另一个。

参数语义：关键参数的含义、格式和边界。

重要约束：什么情况下不能用，副作用是什么。

使用示例：典型的输入输出。

{

"name": "search\_code",

"description": "用 ripgrep 在代码库中搜索文本模式或正则表达式。

【用途】找函数定义位置、追踪变量使用。

【区别】优先于 bash+grep：结果自动带行号和文件路径，排除.gitignore 路径。

【局限】不适用于语义级搜索，请改用 LSP 工具。

【参数】pattern 支持正则；path 为空时搜索整个项目。

【约束】只读操作；超大项目建议缩小 path 范围。

【示例】search\_code('def create\_user', 'src/') → \[{file: 'src/user.py', line: 12, text: '...'}\]"

}

投入 80% 时间打磨描述，20% 时间写实现，而不是反过来。

### 拦截契约：工具元数据让 Loop 看透工具本质

模型选好工具后，Agent Loop 接手。Loop 要做串行 / 并发裁决、要做熔断、要做权限拦截，它怎么知道这个工具是读还是写？是快还是慢？仅靠解析 Description 吗？模型会看错，但代码不能看错。工具不能只是一段代码，它必须是一个自描述的实体，向 Agent Loop 暴露它的“安全指纹”。

from prodagent.types import SideEffectLevel

from prodagent.tools.base import tool

@tool(

side\_effect\_level=SideEffectLevel.HIGH,

enforced\_idempotent=True,

estimated\_latency\_ms=2000,

is\_readonly=False,

)

async def freeze\_user\_account(user\_id: str) -> dict:

"""冻结用户账号（高危，需人工审批）"""

...

对于 MCP 工具，Host 必须在加载时解析本地配置，为其动态打上这层 Metadata 补丁。把“工具是什么性质”这个判断，从自然语言猜测，下沉到代码级的强类型声明。

### 执行契约：严格的无状态与系统级幂等

Loop 决定执行后，重试随时可能发生。第一条铁律是：副作用工具必须幂等，且服务端必须无状态。LLM 可能会因为网络波动、超时或幻觉重复发送请求。如果你在内存中保存会话状态，当 LLM 重试或并发调用时，内存状态会错乱。所有状态必须通过 arguments 显式传递，或存入外部 Redis。生产级的解法是双向奔赴：Host 层强行注入幂等键，Server 端利用唯一约束去重。

def inject\_idempotency\_key(run: AgentRun, call: ToolCall, call\_index: int) -> str:

"""幂等键由 Loop 注入，不由 LLM 生成。key 与任务位置绑定，重试时完全一致。"""

key = f"{run.run\_id}:{run.turn\_count}:{call\_index}"

call.params\["idempotency\_key"\] = key

return key

def send\_email(params: SendEmailParams) -> dict:

if redis.exists(f"email\_sent:{params.idempotency\_key}"):

return {"status": "skipped", "reason": "邮件已发送，幂等拦截"}

result = email\_client.send(params.to, params.subject, params.body)

redis.setex(f"email\_sent:{params.idempotency\_key}", 3600, "1")

return result

这里有个更深的坑：如果是跨多个工具的长事务，比如“先扣款再发货”，光防重还不够。如果发货失败，扣款操作不可逆，就需要引入分布式系统中的 Saga 补偿模式 进行逆序回滚。

### 反馈契约：超时控制与可操作的错误红绿灯

执行中难免出错。LLM 对延迟非常敏感，一个卡住的工具会导致整个对话线程僵死。同时，模型遇到报错，默认动作是“换种说法再试一次”。如果你只给它返回一个 500 Internal Server Error，它就像个没头苍蝇一样瞎撞。传统软件的报错是给人看的；Agent 工具的报错是给模型看的，可操作性比详细度更重要。

import asyncio

async def query\_order(order\_id: str) -> Order | ToolError:

if not re.match(r'^ORD-\[0-9\]{8}

在 MCP 场景下，如果第三方 Server 返回标准的 JSON-RPC Error，Host 层必须有一个错误翻译代理，将其拦截并翻译成红绿灯语义，再塞回给 LLM。

### 资源契约：响应大小与 Token 经济

执行成功返回结果，危机就解除了吗？并没有。这是 Agent 工具与传统 API 最大的不同点。LLM 的 Context Window 是有限的，且 Token 昂贵。传统软件返回 10MB 的 JSON 没人在意，但在 Agent 里，这会直接撑爆上下文，导致后续对话丢失并产生巨额费用。生产级工具必须遵循 Token 经济原则：硬性限制返回大小（如 4KB），并提供游标分页机制。

def list\_user\_orders(user\_id: str, limit: int = 10, cursor: str = None) -> dict:

"""获取用户订单列表。

【约束】为防止撑爆上下文，每次最多返回 limit 条（默认10）。"""

limit = min(limit, 50)

orders, next\_cursor = db.orders.paginate(user\_id=user\_id, limit=limit, cursor=cursor)

return {

"orders": orders,

"next\_cursor": next\_cursor,

"has\_more": next\_cursor is not None,

"hint": "如果需要查看更多，请使用 next\_cursor 作为参数继续调用。"

}

## 闭环：元数据驱动的完整决策流水线

好，六大契约讲完了，但 Loop 怎么把它们串起来？我们回到凌晨那个值班场景——假设 Agent 同时想查订单（只读）、发邮件（写操作）、删账户（高危），Loop 该怎么处理这一批调用？

最后，我们把上述六大契约装配到 robust\_agent\_loop 中。Loop 怎么读这些信息并做决策？核心在于预检层和错误处理层。预检层：基于元数据的执行策略

class ToolRunner:

async def run\_batch(self, run: AgentRun, calls: list\[ToolCall\]):

readonly\_calls, serial\_calls = \[\], \[\]

for i, call in enumerate(calls):

is\_loop, reason = detect\_infinite\_retry(run, call, repeat\_threshold=5)

if is\_loop:

raise InfiniteLoopDetected(reason)

meta = self.\_dispatcher.get\_meta(call.name)

if meta and meta.enforced\_idempotent:

inject\_idempotency\_key(run, call, i)

verdict = decide(call, meta)

if verdict.decision is PolicyDecision.SUSPEND and not self.\_dispatcher.\_hooks:

run.state = RunState.SUSPENDED

raise SuspendPendingApproval(tool=call.name)

if self.\_dispatcher.is\_readonly(call.name):

readonly\_calls.append((i, call))

else:

serial\_calls.append((i, call))

yield ToolCallStartEvent(call=call, run\_id=run.run\_id)

if readonly\_calls:

raw = await asyncio.gather(

\*\[self.\_dispatcher.dispatch(c) for \_, c in readonly\_calls\],

return\_exceptions=True,

)

for (\_, call), outcome in zip(readonly\_calls, raw):

result = outcome if isinstance(outcome, dict) else {"error": str(outcome)}

run.messages.append(Message(role="user", content=f"Tool '{call.name}' result: {result}"))

yield ToolResultEvent(name=call.name, result=result, run\_id=run.run\_id)

for \_, call in serial\_calls:

result = await self.\_dispatch\_with\_retry(call, run)

run.messages.append(Message(role="user", content=f"Tool '{call.name}' result: {result}"))

yield ToolResultEvent(name=call.name, result=result, run\_id=run.run\_id)

错误处理层：红绿灯驱动的重试路由

async def \_dispatch\_with\_retry(self, call: ToolCall, run: AgentRun) -> dict:

for attempt in range(4):

result = await self.\_dispatcher.dispatch(call)

tr = ToolResult.from\_raw(result, tool=call.name)

if tr.outcome in (ToolOutcome.OK, ToolOutcome.BLOCKED):

return result

if tr.outcome is ToolOutcome.ABORT:

run.messages.append(Message(role="system",

content=f"工具 '{call.name}' 永久失败（不要重试）：{tr.error.message}"

\+ (f"\\n建议：{tr.error.hint}" if tr.error.hint else "")))

return result

retry\_count = run.\_retry\_counter.get(call.name, 0)

if retry\_count >= 3:

run.messages.append(Message(role="system",

content=f"工具 '{call.name}' 重试 3 次依然失败，放弃。"))

return result

run.\_retry\_counter\[call.name\] = retry\_count + 1

run.messages.append(Message(role="system",

content=f"工具 '{call.name}' 遇到临时错误，等待 5 秒后重试（{retry\_count + 1}/3）"))

await asyncio.sleep(5)

return result

## 总结

这一讲我们给工具上了六道锁：防混的原子化拆分、防错的描述工程、防越权的元数据、防重的无状态幂等、防卡死的红绿灯反馈、防爆的 Token 经济。

但这六道锁能生效的前提，是 Loop 知道该在什么时候、用什么方式上锁——这就是 ToolMeta 的价值：把“工具是什么性质”的判断，下沉到代码级的强类型声明。在面对黑盒 MCP Server 时，这种宿主侧的强类型声明更是不可妥协的底线。

从 Native Tool 走向 MCP，就像软件架构从单体走向微服务。微服务时代的超时熔断、无状态设计、限流降级，在 Agent 时代一样都不能少。你不能信任别人的 Server 代码，你只能信任你自己定义的边界。

## 思考题

本讲通过 ToolMeta 让 Loop 实现了并发控制和红绿灯重试。但假设模型在一次回复中连续生成了两个有前后依赖的写操作（例如：先调用 freeze\_account 冻结账户，再调用 send\_email 发送冻结通知）。Loop 将它们串行执行时，第一步成功了，但第二步因网络问题连续重试失败最终报错。

此时系统留下了“账户已冻结但未通知”的脏状态。在传统软件开发中，我们靠数据库事务（ACID）来保证要么全成功要么全失败；但在 Agent 架构中，工具调用往往是跨网络的独立 API，没有数据库事务可以依托。

你能否在 Agent Loop 层面设计一种通用的机制，来解决这种“多步写操作的部分成功”问题？

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

把带副作用的执行权毫无保留地交给了概率模型

六大契约重新定义工具的生命周期

设计契约：工具原子化，拒绝瑞士军刀

决策契约：描述工程让模型做对选择

拦截契约：工具元数据让 Loop 看透工具本质

执行契约：严格的无状态与系统级幂等

反馈契约：超时控制与可操作的错误红绿灯

资源契约：响应大小与 Token 经济

闭环：元数据驱动的完整决策流水线

总结

思考题
