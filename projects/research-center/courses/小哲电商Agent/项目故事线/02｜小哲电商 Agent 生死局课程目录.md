# 小哲电商 Agent 生死局课程目录

## 老板不看命令行

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396405295-9938dfb9-7af2-41e5-a8e9-a4f23320806c.png" title="null" crop="0,0,1,1" id="faBZ3" class="ne-image">

上一节你已经把模型在本地调通了。
你知道怎么准备 system message，怎么把用户问题塞进 user message，也知道模型会返回 assistant message。你在终端里跑了一下，看到模型确实能回复。
你刚想松一口气，老板就把头探过来：

> 你这个东西，用户能在哪儿问？

> 你把终端窗口往他面前一推。
> 老板沉默了两秒：

> 我是让你做客服，不是让用户来你电脑上敲命令。

> 这句话把问题一下子打回现实。
> 模型能回复，不代表它已经接进小哲电商。真正的客服入口必须能被系统调用：用户在商城里问一句，电商服务把问题转给 Agent，Agent 再把回答还回来。
> 所以这一课不再多写一个模型调用样例，而是把上一课的本地能力包成一个稳定服务入口：

```latex
POST /chat
```

你这一节只要守住一件事：

> 给小哲电商提供一个可以调用的 Agent 对话接口。

> ## 先把关系画清楚 这一课里有四个角色：

```mermaid
flowchart LR Debug["小哲电商客服 Agent 调试后台<br/>code/frontend"] Ecommerce["电商后端 / 客服网关<br/>ecommerce-backend"] Agent["本课 Agent 后端<br/>code/agent-course-versions/lesson-02-chat-service/backend<br/>POST /chat"] Model["模型服务<br/>Chat Completions"] Debug -->|"POST /chat"| Agent Ecommerce -->|"POST /chat"| Agent Agent -->|"messages"| Model
```

| 模块 | 在第 02 课里的角色 |
| --- | --- |
| Agent 后端 | 这一节要实现的服务，提供 `POST /chat`。

|
| 调试后台 | 共享教学工具，只负责把问题发到当前 Agent 地址。

|
| 电商后端 / 客服网关 | 正式业务调用方，后续会把商品、订单、物流、售后事实交给 Agent。

|
| 模型服务 | 仍然负责生成回答，但不直接暴露给页面或业务调用方。

| 现在的重点不是“页面怎么画”，也不是“订单怎么查”。重点是：小哲电商以后只需要调用 `/chat`，不用知道模型 Key、模型供应商、Prompt 细节和后续工具编排。

## `/chat` 先只做一件事 这一版 `/chat` 的职责很朴素：
1. 接收小哲电商传来的用户问题。
2. 带上当前运行时用户信息。
3. 调用当前这一版 Agent。
4. 返回客服回答和最小运行状态。
注意，`/chat` 不是电商业务接口。
它不负责查订单，不负责查物流，不负责判断退款资格，也不负责管理商品。那些都是小哲电商业务系统的事情，需要时由 Agent 后端通过明确的业务接口去查。
这一版只证明一件事：

```latex
模型能力已经从本地脚本，变成小哲电商可以调用的 Agent 服务。
```

## 请求里要分清用户说法和系统事实 你最开始可能会想，`/chat` 接口只要这样就行：

```json
{
  "message": "你好，我想问一下优惠活动"
}
```

这确实能跑，但很快会出事。
客服系统里，用户说的话不等于系统事实。用户可以说“我是金卡会员”，也可以说“我是 U9999”，但 Agent 不能因为用户这么说就当真。
所以当前请求会显式分成两条线：

```latex
user_message：用户说了什么 runtime_*：小哲电商系统确认了什么
```

代码里的 `ChatRequest` 就是这张字段说明书：

```python
class ChatRequest(BaseModel): session_id: str runtime_user_id: str runtime_nickname: str | None = None runtime_member_level: str | None = None runtime_risk_level: str | None = None user_message: str runtime_context: dict[str, Any] | None = None
```

这里先记住三个字段组就够了：

| 字段组 | 这一版为什么要有 |
| --- | --- |
| `session_id` | 让后端知道几句话属于同一段会话。

|
| `runtime_*` | 接住小哲电商系统传来的当前用户事实，不能让用户靠自述冒充身份。

|
| `user_message` | 代表用户真正说了什么，也是这一版唯一交给模型的输入。

| 这条边界从现在就要立住：**用户输入是用户说法，runtime 字段才是系统事实。**

## 响应也不能只回一段话 老板现在只关心回答：

> 它到底说了啥？

> 但接口不能只返回一段字符串。因为调用方还要知道：这次回答属于哪个会话，后端是在什么状态下跑出来的。
> 所以这一版 `ChatResponse` 只保留三个字段：

```python
class ChatResponse(BaseModel): session_id: str answer: str session_state: dict[str, Any]
```

| 字段 | 作用 |
| --- | --- |
| `session_id` | 把回答挂回同一段客服会话。

|
| `answer` | 用户能看到的客服回复。

|
| `session_state` | 给系统和调试后台看的本轮运行状态。

| 现在的 `session_state` 还很薄，只放版本号、消息次数和运行时用户信息。它不是业务判断，也不是公开执行摘要，只是告诉调用方：这一轮请求是在什么状态下跑出来的。

## 代码只看这一条链路 这一版 Agent 后端在：

```latex
code/agent-course-versions/lesson-02-chat-service/backend/
```

你读代码时只抓这一条线：

```latex
/chat -> ChatRequest -> Lesson02Agent.chat(request) -> call_chat_model(user_message) -> ChatResponse
```

路由入口很薄：

```python
@router.post("/chat", response_model=ChatResponse) def chat(request: ChatRequest) -> ChatResponse: return agent_provider().chat(request)
```

这段代码定住两个边界：

| 边界 | 含义 |
| --- | --- |
| 请求必须是 `ChatRequest` | 缺字段或字段类型不对，会在进入 Agent 逻辑前被拦下来。

|
| 响应必须是 `ChatResponse` | 调试后台和电商客服网关可以按稳定结构读取结果。

| Agent 收到请求后，先更新最小会话状态，再调用模型：

```python
self._message_count_by_session[request.session_id] = ( self._message_count_by_session.get(request.session_id, 0) + 1 ) answer = call_chat_model(request.user_message)
```

这里有两个细节很关键。
第一，`message_count` 按 `session_id` 记录，证明同一个会话下的多轮请求会被后端识别到。
第二，当前版本只把 `request.user_message` 交给模型。`runtime_user_id`、会员等级、风险等级先作为系统状态保留，不混进模型输入里让模型自由解释。
然后 Agent 把运行状态放进 `session_state`：

```python
session_state = {'agent_version': 'lesson-02-chat-service', 'message_count': message_count, 'runtime_context': {'user_id': request.runtime_user_id, 'nickname': request.runtime_nickname, 'member_level': request.runtime_member_level, 'risk_level': request.runtime_risk_level, 'page_context': request.runtime_context or {}}, 'next_gap': '能聊天不代表能接客服；真实业务问题很快会暴露第一版 AI 客服的缺口。'}
```

这段代码的重点不是字段多，而是结构清楚：

```latex
用户可见回答 -> answer 系统运行状态 -> session_state
```

最后，模型调用被封装在 `call_chat_model` 里。Agent 主流程只关心拿到一个 `answer` 字符串，不需要知道底层 HTTP 请求怎么拼。
当模型接口可用时，代码会构造最小 messages：

```python
"messages": [ { "role": "system", "content": ( "你是小哲电商公司的客服 Agent。当前版本只负责普通聊天，" "不能承诺优惠、退款、物流或售后处理结果。" ), }, {"role": "user", "content": user_message}, ]
```

这仍然是第 01 课讲过的 message 结构。区别在于：现在它不再藏在你的终端脚本里，而是被 `/chat` 服务统一调用。
如果模型 Key 没配好，`/chat` 应该返回明确错误，而不是把“配置缺失”塞进 `answer` 里假装客服已经正常回答。成功响应里的 `answer` 必须来自模型调用结果。

## 怎么验证老板能闭嘴 这一课只验证一件事：小哲电商已经能通过 `/chat` 调到 Agent 服务。 你要看到：
1. `POST /chat` 能返回 `200`。
2. 请求体里用户问题放在 `user_message`。
3. 当前用户、会员等级、风险等级放在 `runtime_*` 字段。
4. 响应体里有 `session_id`、`answer`、`session_state`。
5. 同一个 `session_id` 下，`message_count` 会递增。
6. `session_state.runtime_context` 能看到系统传进来的用户信息。
现在不要验证优惠活动回答是否正确。
因为活动规则还没有接进来。现在问活动，Agent 只能泛泛回答或承认自己还没接入规则。入口通了，不代表客服能力已经可用。
这次真正让老板闭嘴的是：

> 模型不再只是你电脑上的脚本，它已经变成小哲电商可以通过 `/chat` 调用的 Agent 服务。

> ## 本节知识总结 这一课把第 01 课的模型调用，推进成了一个稳定后端接口。
> 你要带走三条线：

```latex
输入要区分用户输入和系统事实 输出要区分用户可见回答和系统可读状态 模型调用要收回到 Agent 后端服务里
```

| 知识点 | 小哲项目里的落点 |
| --- | --- |
| Agent 服务入口 | `/chat` 是小哲电商客服入口、调试后台和后续客服网关调用 Agent 的门。

|
| 请求契约 | `user_message` 放用户说法，`runtime_*` 放系统传入的当前用户事实。

|
| 响应契约 | `answer` 给用户看，`session_state` 给调试后台和后续系统看。

|
| 会话标识 | `session_id` 让连续追问能挂在同一条客服会话上。

|
| 后端封装 | 页面和电商后端只调用 `/chat`，模型调用收在 Agent 后端里。

| 这一步完成后，Agent 终于可以被小哲电商叫到了。 但它现在只是能接话，还不知道小哲电商的商品、活动、订单、物流和售后规则。

## 小哲心中隐隐的担心 老板终于能看到一个像样的入口了。 他在小哲电商的客服入口里打字，问题能发到 Agent，Agent 也能回话。 老板的脸色缓和了一点：

> 行，至少不是只会在你电脑上跑。

> 然后他随手问了一句：

> 金卡会员今天买降噪耳机，有什么优惠？

> Agent 很快回了一个听起来很像客服的话术。
> 小哲心里却开始发凉。
> 它现在只是能接进来，根本不知道小哲电商今天有什么活动，也不知道金卡会员到底有什么权益。
> 很快，第一版 AI 客服会正式站到老板面前。小哲马上会发现：能聊天，和能接客服，根本不是一回事。
