# 老板终于看到回答来源｜RAG Citations

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396418856-e3a5b284-12f7-411e-975e-74c6c9ba5f7d.png" title="null" crop="0,0,1,1" id="FAWlI" class="ne-image">

## 老板终于问出了最致命的问题 前面几课，你已经把知识检索跑起来了。 前面你已经想明白了：不能把所有规则都塞进 Prompt，要按问题找相关知识。 接着你把售后规则、商品知识、FAQ 拆成更合适的片段。 然后你做了第一次检索：用户问什么，系统就找最相关的知识片段。 这听起来已经很像 RAG 了。 老板也重新坐回电脑前，输入：

> 金卡会员今天买降噪耳机，有什么优惠？

> Agent 回答：

> 会员优惠和活动价以结算页展示为准，客服不能承诺系统没有展示的额外折扣。降噪耳机适合通勤、差旅和办公降噪场景。

> 老板沉默了一下。
> 这次他没有直接拍桌子，而是问了一个更麻烦的问题：

> 它这话从哪儿来的？

> 你看着日志里的“命中 2 个片段”，突然发现这句话根本没法给老板看。
> “命中了”不是证据。
> “模型说得挺对”也不是证据。
> 如果老板看不到来源，他还是会觉得 AI 在瞎编。
> 你现在要解决的就是这个问题：

> RAG 答案必须带引用来源。

> ## 现在到底要解决什么 老板现在只看到日志里的“命中 2 个片段”，仍然看不到回答背后的真实来源。
> 所以你现在要把检索命中结果接到 `/chat` 响应里，让系统能留下这条证据链：

```latex
检索命中了 -> 回答里怎么留下可追溯证据
```

这个证据就是 `citations`。
没有 `citations` 时，调试后台只能看到：

```json
{
  "answer": "会员优惠以结算页为准。"
}
```

有了 `citations` 后，调试后台可以看到：

```json
{
  "answer": "会员优惠以结算页为准。",
  "citations": [
    {
      "citation_id": "C1",
      "source_title": "会员优惠与活动价",
      "source_path": "shipping_faq.md",
      "chunk_id": "faq-member-offer",
      "score": 0.8,
      "snippet": "会员优惠、满减、优惠券、积分抵扣和活动价以结算页展示为准。"
    }
  ]
}
```

这两者对用户来说可能差不多。
但对老板、调试后台、评测和排错来说，完全不是一回事。

## 技术机制

### citation 不是把全文贴出来 一听到“引用来源”，你可能会想：

> 那就把原文全贴到回答下面。

> 这不行。
> 客服回答不是知识库全文复制器。引用要让人知道“依据来自哪里”，而不是把所有命中文档塞回页面。
> 所以 citation 只保留几个关键字段：

| 字段 | 作用 |
| --- | --- |
| `citation_id` | 本次响应里的引用编号，方便回答和调试后台对上。

|
| `source_title` | 人能看懂的来源标题。

|
| `source_path` | 来源文件或知识库路径。

|
| `chunk_id` | 命中的知识片段 ID，方便排查和评测。

|
| `score` | 当前检索相关度分数，用来观察命中质量。

|
| `snippet` | 小段依据摘要，不贴整篇文档。

| 这几个字段足够回答老板的问题：

> 它这话从哪儿来的？

> 也足够回答你自己的问题：

> 如果答错了，是哪个片段把它带歪了？

> ### 回答和引用要一起返回 自从系统有了第一版结构化意图后，响应里至少已经有：

```python
intent: Intent
```

现在在这个基础上增加 `citations`：

```python
class ChatResponse(BaseModel): session_id: str answer: str intent: Intent citations: list[Citation] reasoning_summary: list[str] session_state: dict[str, Any]
```

注意，不要把 citations 写进 `answer` 字符串里。
错误做法是：

```latex
根据 shipping_faq.md 的第 3 段，会员优惠以结算页为准……
```

这样前端、评测和调试后台都要从自然语言里抠来源，后面很难稳定。
正确做法是：

```latex
answer：给用户看的客服回答 citations：给系统和调试后台看的依据列表
```

这里继续沿用已经立住的边界：

> 用户话术和系统状态分开放。

> ### 引用来源怎么让老板看懂 这一次，调试后台不只是显示回答，还要显示依据。
> 前面做意图分拣时，调试后台第一次看到了粗意图标签。
> 现在，它要让系统第一次看到回答依据。
> 这一次你希望看到：

```latex
用户问题 -> 金卡会员今天买降噪耳机，有什么优惠？ Agent 回答 -> 会员优惠和活动价以结算页展示为准…… 引用来源 -> 会员优惠与活动价 / shipping_faq.md / faq-member-offer -> 降噪蓝牙耳机 / product_guide.md / product-anc-headphone
```

老板不需要看向量距离，也不需要知道 embedding 是什么。
他只需要看到：

> AI 不是凭空说的，它引用了小哲电商自己的规则和商品知识。

> 这就是 citations 在业务里的价值。

### 找不到依据时也要诚实 这里还有一个边界： 没有命中知识片段，不等于客服完全不能说话。 普通问候、能力说明这类接待话术，不需要 RAG citation；但只要用户问的是活动、商品、发货、售后、发票这类需要小哲电商规则依据的问题，Agent 就不能继续硬答。 现在先做最朴素的处理：普通接待正常回复，规则依据不足时明确承认。

```latex
我暂时没有在当前知识库里找到可靠依据，不能直接给出规则结论。
```

更完整的低置信兜底、召回质量评测、澄清和转人工，要等系统开始专门处理“找得准不准”时再展开。
现在你先立住一条线：

> 普通接待可以没有 citations；规则结论必须有依据，有依据就带 citations，没有依据就承认没有依据。

> ## 代码落地

### 当前代码的实现入口 这一版 Agent 后端在：

```latex
code/agent-course-versions/lesson-11-rag-citations/backend/
```

相比前面的版本，这一版不重新发明检索算法，而是沿用第 10 课已经跑通的向量召回，再新增引用返回：

| 文件 | 作用 |
| --- | --- |
| `main.py` | 应用启动和路由挂载 |
| `api/schemas.py` | `KnowledgeHit`、`Citation`、带 citations 的 `ChatResponse` |
| `api/routes.py` | `/health`、`/capabilities`、`/chat` |
| `agents/customer_service_agent.py` | 向量命中、引用生成、带依据回答 |
| `rag/knowledge_base.py` | Markdown 读取、章节解析、chunk 构建、候选过滤 |
| `rag/vector_store.py` | 向量库构建、缓存、cosine similarity、top_k 召回 |
| `embeddings/client.py` | OpenAI 兼容 embedding 调用、批量向量化和文本缓存 |
| `config/settings.py` | 路径、embedding 默认值、chunk 参数、阈值和统一课程环境 |
| `knowledge/*.md` | 这一版用的小哲电商知识原文 | 老板要看到引用证据，代码就先从 Markdown 原文构建 chunk，再用 embedding 得到向量命中结果，最后把命中的 `KnowledgeHit` 接到 citations 上。 这里要坚持本课的本质：

```latex
第 10 课：用户问题怎么找到相似知识片段 第 11 课：已经命中的知识片段怎么变成可追溯引用
```

所以第 11 课不把重点放回“怎么算相似度”，而是把第 10 课的向量命中结果继续往响应结构里接。
当前代码先走通一条链路：

```latex
向量命中结果 -> citations -> 可展示、可追溯、可评测
```

### 核心代码拆解 当前代码的关键链路是：

```latex
/chat -> load_source_documents() -> build_knowledge_chunks() -> retrieve_by_vector(user_message) -> KnowledgeHit -> build_citations(hits) -> 有命中：render_cited_rag_messages(...) -> call_chat_model(...) -> 无命中普通接待：build_general_chat_answer() -> 无命中规则问题：build_fallback_answer() -> build_cost_summary(messages, answer) -> ChatResponse(answer, citations, cost_summary)
```

沿着这条链路看，检索命中以后，系统马上要做四件事：把命中片段交给模型生成回答，保留来源，生成引用，再把引用、回答和成本摘要一起返回。没有命中时，还要先看问题是不是普通接待；只有需要规则依据的问题才进入固定兜底。
先看知识片段结构：

```python
class KnowledgeChunk(BaseModel): chunk_id: str title: str source_path: str section: str keywords: list[str] text: str
```

从 `knowledge/*.md` 构建出来的每一段知识，都要能回答两个问题：

```latex
这段知识是什么？ -> title / section / text 这段知识从哪里来？ -> source_path / chunk_id
```

拿“会员优惠与活动价”这段举例：

```json
{
  "chunk_id": "faq-member-offer",
  "title": "会员优惠与活动价",
  "source_path": "shipping_faq.md",
  "section": "会员优惠与活动价",
  "keywords": [
    "会员",
    "金卡",
    "优惠",
    "活动",
    "结算页"
  ],
  "text": "会员优惠、满减、优惠券、积分抵扣和活动价以结算页展示为准。"
}
```

用户问“金卡会员今天买降噪耳机，有什么优惠”时，向量检索会把用户问题和 chunk 内容放到同一个向量空间里比较。`title`、`section`、`keywords` 和 `text` 会一起参与 embedding，让检索带上业务语境；真正给回答提供依据的，仍然是 `text`。
这也是为什么 `source_path` 和 `chunk_id` 必须在 chunk 里保留下来。向量相似度只能告诉你“它像不像”，不能告诉老板“这句话到底从哪份小哲电商规则里来的”。Citation 要补上的正是这个缺口。
再看命中结果：

```python
class KnowledgeHit(BaseModel): chunk: KnowledgeChunk score: float = Field(ge=0, le=1)
```

`KnowledgeHit` 不是最终响应，它是向量检索阶段的中间结果。
它把“命中了哪段知识”和“相似度分数是多少”先放在一起。`score` 让调试后台知道相关度大概有多高；`chunk` 让后面的 citation 能拿到来源标题、文件路径和片段 ID。
接着看检索函数：

```python
def retrieve_by_vector(query: str) -> list[KnowledgeHit]: query_embedding = embed_text(query) asks_for_history = query_asks_for_history(query) hits: list[KnowledgeHit] = [] for record in get_vector_store(): if not should_include_chunk_for_query(record.chunk, asks_for_history): continue score = cosine_similarity(query_embedding, record.embedding) if score >= SCORE_THRESHOLD: hits.append(KnowledgeHit(chunk=record.chunk, score=round(score, 3))) return sorted(hits, key=lambda hit: hit.score, reverse=True)[:TOP_K]
```

这段代码做了五步。
第一，把用户问题交给 embedding 模型，得到 query 向量。
第二，取出第 10 课已经建立的向量知识库。
第三，按当前问题过滤掉不该参与普通咨询的历史片段。
第四，用 cosine similarity 算用户问题和每个知识片段的相似度，再用 `SCORE_THRESHOLD` 过滤明显不相关的片段。
第五，按分数排序，只保留前 `TOP_K` 个命中。
这部分仍然属于“检索 / 召回”的能力，核心在第 10 课已经讲过。
第 11 课只需要确认一个接口事实：

```latex
retrieve_by_vector(...) -> list[KnowledgeHit]
```

只要检索阶段能返回 `KnowledgeHit`，本课就可以把它变成 citations。换更好的 embedding、调 `top_k`、调阈值、加 reranker，都会影响“命中谁”；但 citations 解决的是另一个问题：

```latex
命中了以后，证据怎么展示、怎么追溯、怎么评测
```

然后看引用结构：

```python
class Citation(BaseModel): citation_id: str source_title: str source_path: str chunk_id: str score: float snippet: str
```

它是给调试后台、评测流程和排错过程用的证据。
再看检索结果怎么变成 citation：

```python
hits = retrieve_by_vector(request.user_message) citations = [ Citation( citation_id=f"C{i}", source_title=hit.chunk.title, source_path=hit.chunk.source_path, chunk_id=hit.chunk.chunk_id, score=hit.score, snippet=hit.chunk.text, ) for i, hit in enumerate(hits, start=1) ]
```

这里要注意两件事。
第一，`answer` 不负责保存来源。
第二，citation 不依赖模型随口编“出处”。它来自检索命中的真实知识片段。
只要这条链路清楚，后面排查 RAG 问题才有入口。
这里还要注意 `citation_id`。
`C1`、`C2` 只负责本次响应里的引用编号。真正稳定定位知识片段的，是 `chunk_id` 和 `source_path`。
也就是说：

```latex
citation_id：方便本次响应里的引用卡片排序和展示 chunk_id + source_path：方便长期定位来源
```

这里没有把 `[C1]`、`[C2]` 硬塞进 `answer` 字符串，是刻意的。
当前版本的 citation 先给调试后台、评测和排错看。以后前端要不要把 `C1` 显示成用户可见脚注，是展示策略；但后端不要让自然语言回答承担结构化来源的职责。
再看回答怎么生成：

```python
def build_fallback_answer() -> str:
    return '我暂时没有在当前知识库里找到可靠依据，不能直接给出规则结论。'
```

这一段只负责一个边界：需要规则依据但没有命中知识时，回答必须承认没有可靠依据，`citations` 也会是空列表。它不能为了让用户满意继续编规则。
普通寒暄走另一条更轻的路径：

```python
def build_general_chat_answer() -> str:
    return '你好，我是小哲电商公司的客服 Agent。你可以直接描述商品、活动、发货、物流、发票或售后问题；涉及具体规则时，我会优先依据当前知识库回答，找不到可靠依据时不会编造。'
```

这个分支没有 citations，不是因为证据丢了，而是因为“你好，在吗”这类问题本来不需要规则证据。
如果命中了知识，主路径不会用模板把 chunk 文本硬拼成回答，而是把命中片段渲染成 RAG messages 交给模型生成客服话术。模型只能依据本轮命中片段回答，实时价格、库存、订单状态和结算页金额仍然不能靠知识库决定。这延续了前面已经立住的边界：稳定知识和实时事实要分开。
回答还要继续带上意图字段：

```python
intent = classify_intent(request.user_message, hits)
```

`intent` 告诉系统“这大概是哪类问题”，`citations` 告诉系统“这次回答依据来自哪里”。
最后看 `Lesson11Agent.chat` 的主流程：

```python
hits = retrieve_by_vector(request.user_message) citations = build_citations(hits) intent = classify_intent(request.user_message, hits) if hits: messages = render_cited_rag_messages(request, intent, hits) answer = call_chat_model(messages) elif intent == "general_chat": messages = render_general_chat_messages(request, intent) answer = build_general_chat_answer() else: messages = render_cited_rag_messages(request, intent, hits) answer = build_fallback_answer()
```

这段分支就是这一版 Agent 的核心。
它们的顺序不能随便换：
1. 先检索，拿到真实命中的知识片段。
2. 再从命中片段生成 citations。
3. 再沿用结构化意图，让调试后台同时看到“这是哪类问题”和“依据来自哪里”。
4. 最后根据命中情况和意图组织回答：有依据就让模型基于依据回答；普通接待可以直接回复；需要规则依据但没有依据时才走固定兜底。
`session_state` 里的 `rag` 也不是随便塞的调试信息：

```python
"rag": { "mode": "vector_retrieval", "query": request.user_message, "embedding_model": read_embedding_model_name(), "top_k": TOP_K, "score_threshold": SCORE_THRESHOLD, "retrieved_count": len(hits), "citation_count": len(citations), "answer_path": answer_path, "matched_chunk_ids": [hit.chunk.chunk_id for hit in hits], "scores": {hit.chunk.chunk_id: hit.score for hit in hits}, }
```

这些字段让你能回答几个排错问题：
- 这次到底有没有检索？
- 检索拿了几个片段？
- 为什么只展示这些引用？
- 命中的 chunk ID 是哪些？
- 每个命中片段的相似度分数是多少？
- 本轮回答走的是带引用回答、普通接待，还是无依据兜底？
- 是 `top_k` 太小，还是阈值太高？
现在还不展开 RAG 质量评测，但 `session_state.rag` 已经把排查所需证据放出来了。
当前代码的重点就是这条链路：

```latex
检索命中不是终点，能展示来源才是客服 Agent 的证据起点。
```

## 怎么验证老板能闭嘴 这一版验证的重点有三个：有依据的问题要返回 `citations`，普通接待不能被 RAG 命中卡住，需要依据但没有依据的问题要明确承认找不到可靠依据。 现在要验证的是“回答有依据”。 你要看到：
1. `POST /chat` 能返回 `200`。
2. 命中知识的问题会返回非空 `citations`。
3. 每条 citation 都有 `citation_id`、`source_title`、`source_path`、`chunk_id`、`score`、`snippet`。
4. `answer` 里不塞完整来源结构，来源结构放在 `citations` 字段。
5. 普通问候可以返回正常客服接待话术，并且 `citations` 为空。
6. 需要规则依据但没有命中依据的问题不能硬编答案。
7. 调试后台能展示引用来源卡片。
老板这次终于能看到：

> AI 这句话不是凭空来的，它引用了小哲电商自己的知识库。

> 但你心里还没有完全踏实。
> 因为显示了引用，不代表引用一定对。
> 命中了，也可能命错。

## 本节知识总结 RAG citation 解决的是“回答能不能追溯依据”的问题。 当模型回答依赖外部知识时，用户、运营、审核人员和开发者都需要知道：这句话是从哪段资料来的。引用不是给答案加装饰，也不是让回答看起来更权威，而是让系统能追踪、复核和排查。 真正可用的引用应该来自检索命中的真实知识片段，并且作为结构化数据返回。不能让模型在自然语言里自己写“根据某某规则”，因为模型可能编出看起来像来源的标题，也可能把多个来源混在一起。

| 知识点 | 核心概念 | 小哲项目里的落点 |
| --- | --- | --- |
| RAG 引用来源 | citation 的价值是让回答能追溯到具体知识片段，而不是装饰答案。

| 老板可以看到回答来自会员优惠规则或商品知识，而不是模型随口说。

|
| 结构化引用 | 来源应该作为独立字段返回，便于页面展示、日志记录和后续评测。

| `/chat` 返回 `citations`，调试后台展示引用卡片。

|
| 引用生成原则 | 引用只能来自真实命中的知识片段，不能让模型自己编出处。

| citation 从 chunk 的 `source_path`、`title`、`chunk_id` 生成。

|
| 无依据兜底 | 找不到可靠依据时，要承认没有依据，而不是伪造来源继续回答。

| 小哲知识没命中时，Agent 不能硬讲售后或活动规则。

|
| 引用边界 | 有引用只说明有依据可查，不等于命中的依据一定正确。

| 签收第八天问题即使带引用，也还要看引用是否真的覆盖这个条件。

|

## 小哲心中隐隐的担心 老板看着调试后台里的引用卡片，脸色终于好看了一点。

> 这次我知道它不是在瞎说了。

> 你也终于能指着屏幕解释：

> 这句来自会员优惠规则，这句来自降噪耳机产品知识。

> 老板点点头，转身准备离开。
> 你刚要喝水，屏幕上又跳出一个用户问题：

> 我签收八天了，但是包装都没拆，能不能无理由退货？

> Agent 很快给了答案，也带了引用。
> 可是你看着引用标题，心里一沉。
> 它命中了“签收后 7 天无理由退货”，这没错。
> 但用户说的是第八天，包装没拆。
> 引用有了。
> 问题是，引用真的够准吗？
