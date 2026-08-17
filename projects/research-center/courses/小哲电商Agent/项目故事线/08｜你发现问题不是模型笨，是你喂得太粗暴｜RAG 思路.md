# 你发现问题不是模型笨，是你喂得太粗暴｜RAG 思路

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396437332-819b86af-42d4-45f3-b76c-6d1937b6cb0b.png" title="null" crop="0,0,1,1" id="pTGPb" class="ne-image">

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396417965-8247b471-8673-4353-992b-4092f0302595.png" title="null" crop="0,0,1,1" id="aEuJA" class="ne-image">

## 第三幕开始时的 Agent 形态 到第三幕开始时，Agent 已经能用 Prompt 边界和 Prompt Registry 管住一部分客服口径，也能看见 token 成本。但稳定规则仍然主要靠 Prompt 片段进入模型，越写越重。 这一幕只解决稳定知识怎么先检索、再回答：RAG 思路、文档切片、Embedding、向量检索、引用来源和低置信兜底。订单物流、库存价格、退款进度这些实时事实还不归 RAG 管。

## 老板拿着账单还没走，运营又拿着截图来了 第 07 课结束时，你终于把 token 成本算给老板看了。 老板看懂了一件事：

> 每轮都把一大堆规则塞给模型，确实贵。

> 你刚想顺着这个话题解释“以后要优化上下文”，运营同事已经把新截图拍到你面前。
> 用户问：

> 金卡会员买降噪耳机，会员价还能叠加优惠券吗？

> 上一版 Agent 的 Prompt Registry 明明已经把活动规则拆成了片段，但这一轮它还是带了不少上下文：
- 客服身份。
- 事实优先级。
- 活动规则。
- 售后边界。
- 历史活动复盘。
- 回答风格。
- 运行时用户事实。
模型回答比第 05 课后半段好一些，没有直接说能叠券。
但运营还是皱眉：

> 它为什么每次都要看售后退货规则？用户明明只问活动。

> 售后主管也补了一句：

> 用户问退货的时候，也不用把耳机商品卖点塞进去。

> 老板听完只问你：

> 所以它不是不会答，是你每次都给它塞一堆没用的东西？

> 这句话虽然扎心，但说对了。
> 第二幕的问题，不是模型突然变笨。
> 是你喂得太粗暴。

## 不是所有规则都该进这一轮 Prompt 前面你经历过三个阶段。 第 05 课，你先用 Prompt 边界堵住乱承诺，后来又把全部规则塞进去，发现旧活动和新活动会打架。 第 06 课，你把 Prompt 拆成片段，至少让人能维护。 第 07 课，你开始看到 token 成本。 这里不是推翻第 07 课。 第 08 课会替换“稳定规则进入模型”的方式：不再只按 Prompt Registry 选一批规则片段，而是先按用户问题检索相关知识，再把命中的知识送进模型。 这不是把 Prompt Registry 废掉，也不是把所有业务上下文都交给 RAG。身份边界仍然在 Prompt 和 Runtime Context 里，订单物流还要等 Tool，退款审批还要等 Workflow / HITL。RAG 这一幕只负责稳定知识依据。 这些都不是白做。 它们让小哲电商 Agent 从“会聊天但乱说”变成了“有口径但很重”。 现在真正露出来的问题是：

```latex
用户每次只问一个具体问题，但 Agent 每次都背着一大包规则进模型。
```

用户问活动，就先找活动规则。
用户问退货，就先找售后规则。
用户问发货，就先找物流 FAQ。
这就是这一幕要开始做的事：

```latex
先找相关知识，再让模型回答。
```

在这条新流程里，RAG 负责的就是“先找相关知识”这个动作：系统先检索，再把检索结果交给模型组织回答。
这个思路就是 RAG。

## 技术机制

### 先别急着背名词，先看小哲现场 你可以先把 RAG 理解成一条很朴素的客服处理流程。 以前的做法像这样：

```latex
用户问题 -> 把所有规则都塞给模型 -> 让模型自己在一大堆文字里找重点 -> 模型回答
```

现在要改成：

```latex
用户问题 -> 先从知识库里找相关规则 -> 只把相关规则交给模型 -> 模型依据这些规则回答
```

RAG 这个词展开是 Retrieval-Augmented Generation，它对应的正是刚才新流程里的两步：先 Retrieval，后 Generation。
中间的 Augmented 可以先理解成“增强”：模型不再只靠自己训练时见过的知识回答，而是被小哲电商当前知识库里的资料增强。检索结果不是摆在旁边给人看的附件，而是进入模型输入，成为生成回答时可以依赖的外部依据。
放到小哲电商里，不用先记英文。
你只要抓住两个动作：

| 动作 | 在小哲项目里是什么意思 |
| --- | --- |
| Retrieval | 先按用户问题找相关知识，比如活动规则、售后规则、商品知识。

|
| Generation | 再让模型根据这些相关知识组织客服回答。

| 它不是让模型突然变成数据库。 它也不是把 Prompt 写得更长。 它是把“找资料”和“组织回答”分开。 这里先把第三幕和第四幕合起来看。 第三幕要做的是基础 RAG：从“不再全量塞规则”开始，逐步走到文档切片、向量检索、citations 和低置信兜底。第四幕要做的是 Hybrid RAG：当基础 RAG 已经能跑以后，再处理查询改写、重排、关键词召回、规则路由、索引更新和缓存。 这两幕合起来，对应这门课里的 RAG 主线：

```latex
稳定知识 -> RAG 实时订单、物流、库存、价格 -> Tool 退款、退货、补偿、审批 -> Workflow / HITL 角色、安全边界、事实优先级 -> Prompt / Runtime Context
```

所以 RAG 不是“小哲电商所有问题的总入口”。它只负责稳定知识依据：活动规则、售后政策、发票 FAQ、配送说明、商品知识。用户问订单到哪了、库存还有没有、退款是否到账时，后面必须接业务工具和流程，不能让知识库替业务系统做结论。

### 这一版先做最小 RAG 这一课先不碰复杂系统。 注意，这一课的知识片段先手工整理在 `backend/knowledge/*.md` 里。你可以把它看成一小份已发布知识库；真实系统通常会把知识放进数据库、搜索引擎或向量库，后续课程会一步步把这里替换掉。 你先做一个最小版本：
1. 准备几段小哲电商知识。
2. 根据用户问题找出相关片段。
3. 只把命中的片段放进模型输入。
4. 继续返回当前已有的意图、成本和运行状态。
这一版的设计原则很克制。
第一，先把 RAG 的位置立住，不急着把检索做复杂。
第 08 课真正要改变的是：

```latex
用户问题 -> 先找相关知识 -> 再让模型回答
```

只要这条链路成立，系统就已经从“全量喂规则”走向“按问题取资料”。
第二，检索结果宁可少，也不要重新变成全量 Prompt。
这一课的 `RAG_TOP_K = 2`，意思是本轮最多只带 2 段知识进去。
这个数字故意很小。目的不是把所有可能相关的材料都捞上来，而是先证明一个原则：少量高相关片段，通常比大量混杂片段更适合进入 Prompt。
如果知识库有 100 条规则，`top_k=2` 当然可能漏掉材料。但这一课宁可先暴露“漏召回”的问题，也不要重新回到“把一堆无关规则都塞给模型”的老路。后面第 10、11 课会继续处理切片和检索质量。
第三，先用简单命中证明方向，再把切片、向量和引用一层层接上。
第 08 课的知识片段还很粗，检索也只是关键词和意图加权。你现在不用追求“检索多聪明”，先让团队看到：旧活动复盘不该因为它也包含“降噪耳机、会员券”就混进当前回答。
这一版的知识原文先放在：

```latex
backend/knowledge/*.md
```

这一版先不展开正式切片参数。代码会先把 Markdown 原文粗读成 `KnowledgeSection`，这是解析阶段的中间产物；再把它整理成 `KnowledgeSnippet`，这是检索阶段真正使用的知识片段。分成两层，是为了让“怎么解析文档”和“怎么参与检索”各管各的。
代码里每段知识先用 `KnowledgeSnippet` 表示：

```python
class KnowledgeSnippet(BaseModel): snippet_id: str title: str topic: str keywords: list[str] effective_status: str = "active" text: str
```

检索命中以后，会用 `KnowledgeHit` 记录“这次为什么选中它”：

```python
class KnowledgeHit(BaseModel): snippet: KnowledgeSnippet score: float matched_keywords: list[str]
```

`KnowledgeSnippet` 是知识片段本身，`KnowledgeHit` 是本轮检索结果。它会把命中的片段、相关性分数和命中的关键词放在一起，方便后面排序，也方便调试后台展示本轮 RAG 的运行信息。
这一版的知识片段还很粗。
比如当前活动规则是：

```latex
2026 春季音频节期间，降噪耳机会员价不能再叠加会员券或满减券，最终优惠以结算页展示为准。
```

历史活动复盘也还在知识列表里：

```latex
2024 双11 期间，部分降噪耳机曾允许金卡会员价叠加一张会员券；该口径已经过期，只能用于复盘。
```

关键区别是：这一版不会把两段都无脑塞进去。
用户问“金卡会员买降噪耳机，会员价还能叠加优惠券吗”，系统会先按问题找相关片段，再把 top 结果放进 Prompt。
旧活动还有一个额外边界：它的 `effective_status` 是 `expired`。用户如果只是在问当前优惠，过期片段就不会进入这一轮模型输入；只有用户明确问历史、复盘、2024 双11 这类问题时，它才允许参与检索。
这就是第 08 课的核心变化。

## 代码落地

### 当前代码的实现入口 这一版 Agent 后端在：

```latex
code/agent-course-versions/lesson-08-rag-thinking/backend/
```

相比第 07 课，它没有继续扩大 Prompt Registry，而是新增了一个很小的 RAG 检索步骤。
核心文件是：

| 文件 | 作用 |
| --- | --- |
| `main.py` | 应用启动和路由挂载 |
| `api/schemas.py` | 请求、响应、知识片段和成本结构 |
| `api/routes.py` | `/health`、`/capabilities`、`/chat` |
| `agents/customer_service_agent.py` | 粗意图、RAG、模型调用和成本观察的 Agent 编排 |
| `rag/knowledge_base.py` | Markdown 读取、章节解析、相关知识检索、RAG Prompt |
| `models/llm_client.py` | OpenAI 兼容聊天模型调用 |
| `cost/observer.py` | token 与成本趋势估算 |
| `config/settings.py` | 路径、统一课程环境和能力声明读取 |
| `agent_capabilities.json` | 调试后台适配当前 Agent 版本 | 这一版仍然读取统一课程环境配置：

```latex
code/agent-course-versions/course.env
```

如果你没有配置模型 Key，后端会提示配置缺失。

### 核心代码拆解 这一版的关键链路是：

```latex
/chat -> ChatRequest -> classify_intent(user_message) -> retrieve_relevant_knowledge(user_message, intent) -> render_rag_messages(...) -> call_chat_model(messages) -> build_cost_summary(messages, answer) -> ChatResponse
```

先看入口。`/chat` 还是小哲电商客服入口调用 Agent 的门，这一课没有为了 RAG 改掉外部请求格式：

```python
class ChatRequest(BaseModel): session_id: str runtime_user_id: str runtime_member_level: str | None = None user_message: str
```

RAG 新增的是 Agent 内部的“查相关知识”步骤，不是把调用方的请求字段重新设计一遍。
再看检索函数：

```python
# backend/rag/knowledge_base.py def retrieve_relevant_knowledge(user_message: str, intent: Intent) -> list[KnowledgeHit]: message = user_message.lower() hits: list[KnowledgeHit] = [] for snippet in load_knowledge_snippets(): asks_for_history = any(word in message for word in ["历史", "复盘", "双11", "2024"]) if snippet.effective_status != "active" and not asks_for_history: continue matched = first_matched_keywords(message, snippet.keywords) if not matched: continue keyword_score = len(matched) / max(len(snippet.keywords), 1) topic_boost = 0.2 if snippet.topic == intent else 0 score = min(1.0, keyword_score + topic_boost) hits.append(KnowledgeHit(snippet=snippet, score=round(score, 3), matched_keywords=matched)) return sorted(hits, key=lambda hit: hit.score, reverse=True)[:RAG_TOP_K]
```

这里做了四件事。
第一，遍历当前知识片段，同时过滤不适合当前问题的过期或未上线片段。
第二，检查用户问题有没有命中片段关键词。
第三，根据命中关键词数量和粗意图做一个简单分数。
第四，只取前 `RAG_TOP_K` 个结果。当前代码里 `RAG_TOP_K = 2`，所以最多返回 2 个知识片段。
`max(len(snippet.keywords), 1)` 只是为了避免片段没有关键词时出现除以 0。
这个简单分数有很多问题：关键词多的片段天然吃亏，关键词少的片段天然占便宜。比如一个片段有 10 个关键词，只命中 1 个，分数会很低；另一个片段只有 1 个关键词，只要命中就会拿到很高分。
`topic_boost = 0.2` 也不是一个神奇参数。
这一版知识文件的 front matter 里有 `domain`，代码会先把业务域映射成粗意图，再和 `classify_intent()` 得到的 `intent` 比较： `domain` 是知识文档作者写的业务域，比如促销、售后、物流；`topic` 是检索系统内部用来对齐粗意图的标签，比如 `promotion_consult`、`refund_request`。两者通常能对应上，但不强行用同一个字段，是为了以后一个业务域下的不同片段可以服务不同意图。

| 知识文档 domain | 映射后的 snippet.topic | 可能匹配的 intent |
| --- | --- | --- |
| `promotion` | `promotion_consult` | 用户问优惠、活动、会员价、券 |
| `after_sale` | `refund_request` | 用户问退货、退款、质量问题 |
| `shipping` | `order_query` | 用户问订单、物流、发货 |
| `product` | `product_consult` | 用户问商品、推荐、参数 | 所以当用户问“金卡会员买降噪耳机，会员价还能叠加优惠券吗”，粗意图是 `promotion_consult`，活动知识片段也被映射成 `promotion_consult`，才会拿到这 0.2 分加权。 这个 0.2 只是当前版本里放得很轻的提示分：它让业务域一致的片段稍微靠前，但不应该压过关键词命中本身。生产环境里，这个权重需要靠评测集和线上效果调，而不是拍脑袋固定。 这还不是成熟检索。 但它已经把 RAG 的工程位置打出来了：

```latex
query -> candidate knowledge -> score -> top_k -> prompt context
```

后面第 09 课会把知识片段整理得更像真实文档。
第 10 课会把关键词检索换成向量检索。
现在先让你看到：模型回答前，系统可以先筛资料。
接着看 Prompt 怎么变了：

```python
retrieved_context = '\n\n'.join((f'[{hit.snippet.snippet_id} | score={hit.score}]\n{hit.snippet.text}' for hit in hits))
```

这一段不再拼一整面 Prompt 墙。
它只拼这一轮命中的知识片段。
如果没有命中，就明确告诉模型：

```latex
当前问题没有命中相关知识。回答时要说明没有可靠依据，不能编规则。
```

这句话很重要。
RAG 不是“查不到也要答”。
查不到时，当前版本宁愿承认没有依据，也不要为了客服话术好看继续编。
发送问题后，你可以在调试后台右侧的“生产行为观察台”里看这一版新增的 RAG 运行信息。
现在先不要急着看回答里有没有完整的来源展示。你主要看运行状态，它让你能回答：
- 这一轮是不是走了检索？
- 总共有多少候选知识？
- 最后命中了几个？
- 命中了哪些知识 ID？
注意，这里的重点是运行状态：系统先证明自己确实从“全量喂规则”转向了“先找相关规则”。

## 怎么验证老板能闭嘴 如果用小哲电商客服 Agent 调试后台验证这一课，重点看右侧的“生产行为观察台”是否展示本轮 RAG 运行状态。 你可以问：

```latex
金卡会员买降噪耳机，会员价还能叠加优惠券吗？
```

这一版应该能看到：
1. `intent` 是 `promotion_consult`。
2. 调试后台能看到本轮已经进入“选择相关知识片段”的 RAG 模式。
3. 命中知识 ID 里有 `promotion-current-audio-offer`。
4. Prompt 里出现当前活动规则。
5. Prompt 里不出现无关的旧活动复盘。
6. 顶层响应仍然沿用前面已经讲过的结构，本课新增证据交给调试后台展示，不把它当成新的业务接口重点来讲。
你可以通过调试后台的 RAG 运行状态确认：当前活动规则进入了本轮上下文，旧活动复盘没有进入这一轮 Prompt。
这证明第 08 课真正解决的是：

```latex
不再每轮都喂全量规则，而是先把相关知识挑出来。
```

老板这次至少能看到：

> 你不是让模型在一整仓库文档里瞎翻，而是先把相关资料拿出来再让它回答。

> ## 本节知识总结 RAG 是把“先找依据，再组织回答”变成系统链路。
> 它不是简单地把更多资料塞给模型。真正重要的是：用户问题进来后，系统先从外部知识里找出本轮最相关、最够用的内容，再把这些内容交给模型生成回答。这样模型回答时就不只依赖自己的语言能力，而是有了可控的知识来源。
> 这个思路可以用在客服、企业知识库、法务制度问答、产品手册问答、内部运维助手等很多场景。只要答案依赖一批可维护资料，而不是只靠模型常识，RAG 就是你要优先考虑的基础方案。

| 知识点 | 核心概念 | 小哲项目里的落点 |
| --- | --- | --- |
| RAG 思路 | 先检索相关知识，再让模型基于命中内容生成回答。

| 小哲不再把所有活动和售后规则全塞进 Prompt，而是先找本轮相关规则。

|
| Retrieval | 检索阶段负责找依据，目标是相关且够用，不是把所有沾边内容都捞出来。

| 用户问活动时优先找活动知识，避免物流、售后、旧复盘一起进上下文。

|
| Generation | 生成阶段负责把依据组织成自然语言，不能让模型自己猜知识库里还有什么。

| 客服话术来自命中的小哲知识片段，而不是模型临场编政策。

|
| top_k | `top_k` 控制带回多少候选知识，是上下文入口的水闸。

| 少量相关片段比大量混杂片段更适合回答具体客服问题。

|
| RAG 边界 | RAG 解决稳定知识依据，不自动解决实时事实、权限和高风险动作。

| 活动规则可以先走 RAG，订单物流和退款审批后面还要接业务系统和流程。

|

## 第一版 RAG 暴露出的新麻烦 这版把方向扭过来了。 但一旦开始“先找相关知识”，新的麻烦马上出现：
- 知识片段先放在 `backend/knowledge/*.md`，还不是完整知识库系统。
- metadata 还很薄，只够演示来源、业务域和有效期，后面还要继续补齐更稳定的切片信息。
- 检索还是关键词和粗意图，不是真正的向量相似度。
- 老板还看不到回答来源卡片。
- 找到了相关片段，也不代表一定找得准。
所以这版是第三幕的开门。
它不是 RAG 的终局。

## 小哲心中隐隐的担心 你也能解释：

> 这次用户问活动，我们只把活动相关知识送进模型。

> 老板点点头：

> 那以后规则多了也这么找？

> 你刚想说“对”，售后主管已经把售后 SOP 发来了。
> 十几页 Markdown。
> 标题有的叫“退换货说明”，有的叫“售后注意事项”，有的把无理由退货和质量问题写在同一段里。
> 你盯着那份文档，突然意识到：

> 想找相关知识，得先把知识切得像样。

> RAG 的下一步，不是继续写检索。
> 是先把售后规则切开，再给每段贴标签。
