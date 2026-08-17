# 第一次向量检索：用户问什么，就找最像的规则｜Embedding 与向量检索

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396418135-0887b7ff-4bea-419d-8468-7b7ac2e0f261.png" title="null" crop="0,0,1,1" id="EIoe4" class="ne-image">

## 用户不会照着文档标题提问 第 09 课之后，你终于把小哲电商生产形状的售后、商品、物流/发票/FAQ 知识切成了 chunk。 每个 chunk 都带着来源、章节和 metadata。 你以为这下 RAG 稳了。 售后主管立刻给你出了一题：

> 我刚收到没几天，包装还在，耳机也没用过，能不能退？

> 你看了一眼知识库。
> 规则标题写的是：

```latex
签收后 7 天无理由退货
```

用户没说“签收”。
用户没说“7 天”。
用户也没说“无理由”。
他只是用自己的话描述：

```latex
刚收到没几天，包装还在，没用过。
```

关键词检索可能会卡住。
运营那边也遇到类似问题。
文档里写：

```latex
会员价不能再叠加会员券。
```

用户可能问：

```latex
我是金卡，耳机活动还能不能和券一起用？
```

如果系统只盯关键词，就会对“同一件事的不同说法”很迟钝。
这就是第 10 课的事故：

> 文档切好了，但用户不会按文档原话提问。

> ## 技术机制

### 向量检索先解决“像不像” 你现在需要的不只是“有没有某个词”。 你需要比较：

```latex
用户这句话
```

和：

```latex
每个知识 chunk
```

到底像不像。
这就是 embedding 和向量检索的直觉。
先不用把它想得很玄。
在小哲电商项目里，它解决的是：

```latex
把用户问题和知识片段都变成一串数字，然后比较它们的相似度。
```

如果用户问题和某个规则片段在“会员、优惠、叠加、结算页、降噪耳机”这些语义方向上很接近，那它们的向量距离就应该更近。
如果用户问题是“订机票”，它和小哲电商活动、售后、物流规则都不接近，就不该硬命中。
第 10 课的目标是让你第一次看清这条链路：

```latex
text -> embedding vector -> similarity score -> top_k -> threshold
```

放在 RAG 的三个环节里，这一课解决的是“检索 / 召回”问题：知识已经切好了，但用户不会照着文档原话提问，Agent 需要把语义相近的规则找出来。
embedding 之后，系统不是让模型“再猜一次哪段最相关”，而是直接计算两组向量的相似度。这里用的是 cosine similarity，你可以先理解成：不主要看两个向量数字总量有多大，而是看它们指向的语义方向是不是接近。用户问题和某个 chunk 的向量方向越接近，分数越高；分数过低，就说明这段规则不像是在回答当前问题。

### 先懂原理，再接硅基流动 embedding 你可以先用一个很朴素的玩具例子理解 embedding。 注意，这只是便于理解的简化图，不是真实 embedding 的内部结构。 假设有一组小哲电商业务方向：

```latex
会员、金卡、会员价、优惠券、叠加、结算页、降噪、耳机、退货、物流
```

你可以暂时把这些方向想成一张粗糙的业务地图。如果一段话更像是在说“会员价、优惠券、叠加、降噪耳机”，它就应该靠近活动和商品咨询区域。
用户问：

```latex
金卡会员买降噪耳机，会员价还能叠加优惠券吗？
```

这句话和“会员券叠加规则”“音频节耳机活动”应该更近。

```latex
会员券叠加规则：更近 音频节耳机活动：更近 现货商品 24 小时发货：更远
```

这个例子只是帮你理解“文本为什么可以变成向量”。正式代码不会手写业务词表，也不会自己数词，而是调用统一课程配置里的 embedding 模型，把用户问题和知识 chunk 都转成同一种向量表示：

```latex
输入文本 -> embedding 模型 -> 输出向量
```

有些 embedding 模型还支持“检索任务说明”。完整实现里会把用户 query 包成类似下面的形式：

```latex
Instruct: Given a customer-service query for XiaoZhe E-commerce, retrieve relevant policy, FAQ, shipping, after-sale, and product knowledge passages Query: 用户怎么退款？
```

这不是第 13 课要讲的“查询改写”。查询改写会把用户口语补成更贴近业务规则的检索表达，比如把“签收三天不想要了”补上“签收后 7 天无理由退货政策”。这里的 `Instruct` 只是在告诉 embedding 模型：这段 query 是客服知识检索任务，不是闲聊、翻译或摘要任务。
当前第 10 课快照没有把这段 `Instruct` 拼进真实 embedding 请求里。代码直接把用户问题和 chunk 文本交给 `Qwen/Qwen3-Embedding-4B`，先把“同一模型空间里计算相似度”跑通。以后换成明确要求 instruction 模板的 embedding 模型时，再按对应模型文档补这一层。
你可以这样区分：

| 层次 | 作用 |
| --- | --- |
| embedding instruction | 帮向量模型理解当前检索任务，影响向量空间里的相似度。

|
| query rewrite | 帮知识库命中业务术语，影响用户原话变成什么检索表达。

| 真实 embedding 里的每一维通常不能被解释成某个固定业务概念。比如一个 1024 维向量，不代表第 17 维就是“会员”、第 93 维就是“退货”。你真正依赖的是整体向量之间的相对位置：意思接近的文本，整体向量应该更接近；意思不接近的文本，整体向量应该更远。 你真正要盯住的是工程约定：

```latex
同一批知识 chunk 和用户问题，必须交给同一个 embedding 模型； 模型返回的向量，才能继续进入 similarity score、top_k 和 threshold。
```

这一步完成后，RAG 才从“关键词碰运气”进入“语义相似度检索”。

### top_k 和 threshold 是检索的两道闸 向量检索会给每个 chunk 算一个相似度分数。 分数越高，说明用户问题和这个知识片段越像。 但你不能把所有有一点相似的片段都塞回模型。所以要有两道闸。 第一道是 `score_threshold`：

```latex
分数太低，不要。
```

第二道是 `top_k`：

```latex
分数合格的里面，只取前几个。
```

这两个参数会直接影响回答质量。
阈值太低，容易带入无关片段；阈值太高，可能正确片段也进不来。`top_k` 太大，Prompt 又变重；`top_k` 太小，可能漏掉辅助信息。
这一课先不追求调到最优。
你先要把这两个位置写清楚。
真正调这两个参数时，先抓三条原则。
第一，`score_threshold` 先挡掉明显无关的 chunk。阈值不是越高越好，也不是跨模型通用标准。
第 10 课的 `SCORE_THRESHOLD = 0.28` 只是这套课程知识库、当前 embedding 模型和观察样例下的演示阈值。
它不是说“所有向量检索都应该用 0.28”。不同 embedding 模型的相似度分数分布可能完全不同，所以阈值必须跟着模型、知识库和业务问题集一起重新校准。
这一课里，`0.28` 的作用只是让你看到阈值位置：让“会员价、优惠券、降噪耳机”这种明显相关问题能进来，同时让“订机票和酒店”这种完全无关问题少混进来。它只负责把明显不像的内容挡在门外，不负责证明剩下的内容一定就是答案。
如果阈值太低，知识库会变成“什么都能命中一点”；如果阈值太高，用户稍微换个说法，正确规则也可能被挡在外面。
真正确定阈值时，不要先拍一个数字。你应该准备一小组问题：
- 正例：应该命中某条规则的问题，比如会员价能否叠加券。
- 反例：完全不属于小哲电商客服范围的问题，比如订机票。
- 边界例：说法很口语、信息不完整、可能需要追问的问题，比如“刚收到没几天还能退吗”。
然后跑检索，看这些问题和各个 chunk 的分数分布。你可以把校准过程理解成三步：

```latex
先让正例目标 chunk 留得住 再让明显负例进不来 最后把边界问题留给 top_k、后续重排和低置信兜底继续处理
```

如果正例和反例分数挤在一起，问题就不只是调阈值了，可能还要改 chunk、补 metadata、换 embedding 模型，或者在后续课程里加入重排和低置信兜底。
第二，`top_k` 先小一点，保住 Prompt 成本。这里用 `TOP_K = 2`，不是因为永远只该取两个，而是因为这一幕刚从“全量塞规则”逃出来。
第三，调参时不要只看单个分数，要看问题集里的三类现象：
- 应该命中的规则有没有进来？
- 完全无关的问题有没有被挡住？
- `top_k` 里是不是混进了很多“有点像但不能当依据”的片段？
如果第一类经常漏，阈值可能太高或 embedding 表达不够好。
如果第二类经常混进来，阈值可能太低。
如果第三类很多，`top_k` 可能太大，或者后面需要更细的排序。

## 代码落地

### 当前代码的实现入口 这一版 Agent 后端在：

```latex
code/agent-course-versions/lesson-10-embedding-retrieval/backend/
```

相比第 09 课，它继续保留 `knowledge/*.md` 作为知识原文，不把 chunk JSON 当成主数据。这一课新增的是：从 Markdown 原文构建 chunk 后，再把用户问题和每个 chunk 交给 embedding 模型。
你会看到一个参数变化：第 09 课用 `CHUNK_SIZE = 160`，这一课变成 `CHUNK_SIZE = 420`。
这不是因为 embedding 模型要求 chunk 必须更长。`chunk_size` 首先是知识颗粒度问题：一段 chunk 能不能独立说明一条规则的条件、结论和例外。
换句话说，决定 chunk 大小的不是“用了向量检索”，而是“检索命中后给模型看的这一段知识是否完整”。如果一条客服规则被切得太碎，不管后面用关键词还是向量，命中了也可能缺前提或缺边界。
第 09 课故意用较小的 `160 / 32`，是为了让你清楚看见 section 会怎样被拆成多个 chunk、metadata 怎样跟着 chunk 走。那一课的重点是“切片结构”。
第 10 课开始真正按向量相似度召回。这里更希望一个 chunk 尽量装下一条客服规则的完整条件、结论和例外口径。比如“7 天无理由退货”不能只嵌入“可以退”，却把“包装配件齐全、不影响二次销售、超过 7 天不能直接按无理由处理”切到另一个很远的片段里。
所以本课把字符级 `CHUNK_SIZE` 提到 `420`，并配 `CHUNK_OVERLAP = 80`，大致仍保留接近 20% 的重叠比例。这个数字也不是通用标准，真正决定 chunk 大小的，是知识片段能不能独立回答一个小问题，以及检索后塞回 Prompt 的成本。
核心文件是：

| 文件 | 作用 |
| --- | --- |
| `api/schemas.py` | `KnowledgeChunk`、`VectorRecord`、请求和响应结构 |
| `agents/customer_service_agent.py` | 粗意图、向量检索、模型调用和成本观察编排 |
| `rag/knowledge_base.py` | Markdown 读取、章节解析、chunk 构建和历史片段过滤 |
| `rag/vector_store.py` | 向量库构建、缓存、cosine similarity、`top_k` 召回 |
| `embeddings/client.py` | OpenAI 兼容 embedding 调用、批量向量化和文本缓存 |
| `rag/prompting.py` | 向量检索版 RAG Prompt 渲染 |
| `config/settings.py` | 路径、embedding 默认值、chunk 参数、阈值和统一课程环境 |
| `knowledge/*.md` | 活动、售后、商品、物流、订单、会员券、支付发票和投诉升级等课程案例原文 | 这一版仍然只放 Agent 后端。 小哲电商客服 Agent 调试后台只是调用方，不跟着每节课复制。

### 主链路：从用户问题到命中 chunk 这一版的关键链路是：

```latex
/chat -> load_source_documents() -> build_knowledge_chunks() -> build_vector_store(chunks) -> embed_text(user_message) -> retrieve_by_vector(query, top_k, score_threshold) -> render_vector_rag_messages(...) -> call_chat_model(messages) -> session_state.rag
```

这条链路里，前半段把知识变成可比较的向量，后半段把用户问题变成向量，再找出最相似的 chunk。

### KnowledgeChunk 和 VectorRecord：命中后要能回到原文 先看知识 chunk：

```python
class KnowledgeChunk(BaseModel): chunk_id: str title: str source_path: str section: str keywords: list[str] effective_status: str = "active" text: str
```

这是第 09 课切片结果进入检索后的形态。
每个 chunk 至少要保留稳定 ID、标题、来源文件、章节、关键词、有效状态和正文。向量检索命中以后，系统不能只拿到一串分数，还要能回到这段知识原文。
所以向量库里的记录长这样：

```python
class VectorRecord(BaseModel): chunk: KnowledgeChunk embedding: list[float]
```

`VectorRecord` 同时保存 chunk 本身和 chunk 的 embedding。这样检索命中后，系统还能拿回标题、来源、章节和正文，而不是只拿到“0.731 分”。
还有一个业务过滤边界：普通客服咨询默认只检索当前有效规则，不能把 2024 双11复盘当成今天的活动依据。只有用户明确问“历史”“复盘”“双11”“2024”这类问题时，历史片段才允许进入候选集。

### EmbeddingClient：统一把 query 和 chunk 变成向量 embedding 客户端只负责一件事：把文本交给 embedding 模型，拿回向量。

```python
def embed(self, text: str) -> list[float]: response = self._post( f"{base_url}/embeddings", json={"model": model, "input": text}, ) return [float(value) for value in response.json()["data"][0]["embedding"]]
```

这里看清三件事就够了：

```latex
配置来自统一课程环境 真正调用的是 POST /embeddings 请求里最关键的是 model 和 input
```

模型返回的是一组浮点数。后面的向量库、相似度、`top_k` 和阈值都只依赖这一组数字，不需要知道模型内部怎么编码语义。
`embed_text` 在这一课里只是一个薄薄的入口：

```python
def embed_text(text: str, embedding_client: EmbeddingClient | None = None) -> list[float]: client = embedding_client or DEFAULT_EMBEDDING_CLIENT return client.embed(text)
```

所以你读代码时，不要把注意力放在“模型平台的实现细节”。Agent 从这一行开始，把自然语言变成了可计算的向量。
`EmbeddingClient` 里还有一个轻量内存缓存：同一个 `base_url`、同一个 embedding 模型、同一段输入文本，第二次就不需要再请求模型平台。它只是课程版进程内缓存，生产里还要考虑知识版本、模型版本、缓存失效和持久化向量库。

### VectorRecord：缓存 chunk 向量

```python
def build_vector_store( chunks: list[KnowledgeChunk] | None = None, embedding_client: EmbeddingClient | None = None, ) -> list[VectorRecord]: source_chunks = chunks if chunks is not None else load_knowledge_chunks() embedding_texts = [ " ".join([chunk.title, chunk.section, " ".join(chunk.keywords), chunk.text]) for chunk in source_chunks ] embeddings = embed_texts(embedding_texts, embedding_client) return [ VectorRecord(chunk=chunk, embedding=embedding) for chunk, embedding in zip(source_chunks, embeddings) ]
```

这里把一批知识 chunk 批量交给 embedding 接口，再变成 `VectorRecord`。
注意这里没有只 embed `chunk.text`。代码会把标题、章节、关键词和正文拼在一起，让向量里带上这段知识的业务语境：

```latex
标题 / 章节：这段规则属于什么业务主题 keywords：维护文档时显式标出来的关键业务词 text：真正的规则内容
```

这不是让 metadata 代替正文。原则只有一句：只拼接能帮助定位业务语境的短字段，不把一大堆泛标签塞进去。后面回答时，模型看到的依据仍然要回到命中的 chunk 内容本身，不能把“关键词里有优惠券”当成业务结论。
真实请求进来时，系统不会每轮都重新向量化整批知识。第 10 课先用进程内懒加载缓存保存向量库：

```python
def get_vector_store(embedding_client: EmbeddingClient | None = None) -> list[VectorRecord]: client = embedding_client or DEFAULT_EMBEDDING_CLIENT if client not in _VECTOR_STORE_CACHE: _VECTOR_STORE_CACHE[client] = build_vector_store(embedding_client=client) return _VECTOR_STORE_CACHE[client]
```

第一次检索会把知识 chunk 转成向量；后面的请求只需要把用户问题转成向量，再和已经缓存好的知识向量计算相似度。这一课先讲清“不要每轮重建向量库”这个边界。至于知识文件更新后怎么识别版本、怎么重建索引、怎么让缓存失效，那是后面索引更新与 RAG 缓存要解决的问题。

### retrieve_by_vector：相似度、threshold 和 top_k 相似度函数只保留一个关键判断：

```python
def cosine_similarity(left: list[float], right: list[float]) -> float: if len(left) != len(right): raise ValueError(f"向量维度不一致：left={len(left)}, right={len(right)}")
```

余弦相似度可以先理解成：

> 两个向量方向越接近，分数越高。

> 这是一个工程边界：两个向量维度不一致时要直接报错，避免模型升级、缓存混用或索引未重建时算出假的相似度分数。
> 真正的检索入口是 `retrieve_by_vector`：

```python
def retrieve_by_vector( query: str, top_k: int = TOP_K, threshold: float = SCORE_THRESHOLD, embedding_client: EmbeddingClient | None = None, ) -> list[KnowledgeHit]: query_embedding = embed_text(query, embedding_client) hits: list[KnowledgeHit] = [] for record in get_vector_store(embedding_client=embedding_client): score = cosine_similarity(query_embedding, record.embedding) if score >= threshold: hits.append(KnowledgeHit(chunk=record.chunk, score=round(score, 3))) return sorted(hits, key=lambda hit: hit.score, reverse=True)[:top_k]
```

这就是这一课的主角。
它把用户问题转向量，遍历向量库，计算相似度，过滤低分结果，最后按分数排序取 `top_k`。
注意这里还有一层历史片段过滤：如果用户没有明确问历史活动，`retrieve_by_vector` 会跳过 `effective_status != "active"` 的 chunk。向量检索不能因为“历史规则很像”就把旧活动当成当前依据。

### session_state.rag：把检索证据留给调试后台 `session_state.rag` 会记录：

```python
"mode": "vector_retrieval", "embedding_model": read_embedding_model_name(), "top_k": TOP_K, "score_threshold": SCORE_THRESHOLD, "matched_chunk_ids": [hit.chunk.chunk_id for hit in hits], "scores": {hit.chunk.chunk_id: hit.score for hit in hits},
```

这让你能从调试后台看到：这一轮是不是走了向量检索，阈值是多少，取了几个 chunk，哪些 chunk 被命中，每个命中分数是多少。
老板要看的不是一串分数；他最终还要看到更直观的来源证据。

## 怎么验证老板能闭嘴 你可以问：

```latex
金卡会员买降噪耳机，会员价还能叠加优惠券吗？
```

这一版应该能看到：
1. `intent` 是 `promotion_consult`。
2. `session_state.rag.mode` 是 `vector_retrieval`。
3. `matched_chunk_ids` 里包含 `promotion-current-audio-offer`。
4. `scores` 里能看到该 chunk 的相似度分数。
5. 无关问题会被阈值过滤，不会硬命中。
6. 顶层响应继续保持前面已经讲过的格式，向量检索证据放在 `session_state.rag`。
这里还有一个很关键的反例：

```latex
小哲电商能帮我订机票和酒店吗？
```

这个问题和小哲电商活动、售后、物流知识都不相关。
`retrieve_by_vector` 应该返回空列表。
这比“能命中”更重要。
因为客服 Agent 不能把任何问题都硬往知识库上贴。

## 本节知识总结 Embedding 和向量检索解决的是“说法不同但意思相近”的问题。 关键词检索适合命中明确词汇，但用户不会总按文档标题提问。用户说“那个耳机活动还能不能叠券”，文档里可能写的是“2026 春季音频节会员权益限制”。这时系统需要比较文本语义，而不只是比较字面关键词。 Embedding 会把文本转换成向量，向量检索再用相似度找出语义接近的候选片段。它让 RAG 从“按词找”进入“按意思找”，但相似度不是正确性证明。相似只能说明“像”，不能说明“就是答案”。

| 知识点 | 核心概念 | 小哲项目里的落点 |
| --- | --- | --- |
| Embedding | 把文本变成可比较的语义向量，让系统处理不同说法之间的相似关系。

| 用户说口语化活动问题时，也能找回小哲知识里的正式活动规则。

|
| 向量库 | 向量库不只是存向量，还要能从命中结果回到原始知识片段。

| 命中后必须拿到 chunk 文本、标题、来源和 ID，不能只拿到一串分数。

|
| 相似度 | 相似度衡量语义接近程度，但不能直接证明命中内容就是正确依据。

| 分数高的活动规则仍可能是旧活动或相似商品活动。

|
| top_k | `top_k` 控制带回多少候选依据，要在召回和上下文成本之间取舍。

| 带回太少可能漏掉会员规则，带回太多又会让 Prompt 重新膨胀。

|
| score threshold | 阈值用来挡住弱相关内容，但要跟模型、知识库和问题集一起校准。

| 小哲不能把低分命中包装成确定客服结论，也不能把阈值设到漏掉正确规则。

|

## 向量找到了相似，也露出了证据缺口 这一版终于让 Agent 能按相似度找知识了。 但相似度跑起来以后，新的问题也跟着露出来：
- 相似度高不代表一定正确。
- `top_k` 可能带入一个相关但不是最终答案的片段。
- 老板现在看到的是命中 ID 和分数，还不是能一眼看懂的来源证据。
- 分数偏低时，系统还需要更明确地决定是回答、追问，还是交给人工核验。
- 相似片段太多时，当前排序还会把“有点像但不是最该用”的片段带进来。
所以第 10 课先解决的是：

```latex
先找到像的规则。
```

它把下一个问题推到了台前：

```latex
找到以后怎么让老板看到依据。
```

## 小哲心中隐隐的担心 老板看着调试后台里的 `matched_chunk_ids` 和分数，问：

> 所以它这次找到了活动规则？

> 你点头：

> 对，向量检索命中了当前音频节活动规则。

> 老板继续问：

> 那用户看得出来它依据的是哪条规则吗？

> 你沉默了一下。
> 现在日志里有命中 ID。
> 你能看懂。
> 调试后台也能看到一些运行状态。
> 但老板看不到完整来源证据。
> 如果他问：

> 它这句话从哪儿来的？

> 你还不能把“命中分数”当成业务证据给他看。
> 下一步，小哲电商 Agent 必须把回答来源展示出来。
