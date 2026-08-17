# 售后规则要先切开，再给每段贴标签｜文档切片与 Metadata

<img src="https://cdn.nlark.com/yuque/0/2026/png/28539630/1783396418091-a4e96581-010a-4f2e-b8e3-feee7c157c34.png" title="null" crop="0,0,1,1" id="QEL7f" class="ne-image">

## 售后主管把一整篇规则甩给你 第 08 课之后，小哲电商 Agent 已经不再每轮都背着全量规则进模型。 用户问活动，它会先找活动知识。 用户问发货，它会先找物流 FAQ。 老板觉得这个方向不错。 售后主管也觉得你终于有点靠谱，于是把售后 SOP 发给你：

> 那你把这个也接进去吧。

> 你点开文档，心里一沉。
> 这不是几句规则，而是一整篇 Markdown SOP，里面有退货、退款、质量问题、包装配件、超过 7 天、凭证核验。
> 物流同事又发来一整份 FAQ，里面还有物流承运、配送节点、发票、会员优惠和活动价。
> 第 08 课已经开始从 Markdown 原文里粗读相关章节，但它还没有真正解决“文档怎么维护、怎么切片”的问题。
> 真实知识不会天然长成适合检索的样子。
> 它会是一堆文档。
> 而 RAG 要先解决一个很土但很关键的问题：

```latex
文档要先切成 Agent 能检索的小块。
```

## 技术机制

### 一整篇文档不能直接丢给检索 你可能会想：

> 那就把 Markdown 文件读进来，当成一个知识片段。

> 这会马上出问题。
> 用户问：

> 签收七天内，耳机包装配件都在，能无理由退货吗？

> 如果你把整篇售后 SOP 当成一个片段，检索命中的可能是：

```latex
小哲电商售后规则.md
```

但这太粗了。
模型拿到的是一整篇售后文档。
里面既有 7 天无理由退货，也有质量问题售后，还有不能直接承诺赔偿。
问题只问“七天内能不能退”，你却把所有售后内容都塞回去了。
这和第二幕的 Prompt 墙没有本质区别。
只是换了一个入口而已。
所以这一课先做文档切片。
把大文档先变成业务章节，再变成检索片段：

```latex
售后规则.md -> section：签收后 7 天无理由退货 -> chunk：这一节里的可检索片段 -> section：质量问题售后 -> chunk：这一节里的可检索片段 物流发票FAQ.md -> section：物流承运与配送节点 -> chunk：这一节里的可检索片段 -> section：会员优惠与活动价 -> chunk：这一节里的可检索片段
```

这样用户问某个具体问题时，系统命中的就不再是一整篇文档，而是更接近答案的那一段。

### Metadata 是给每段知识贴标签 只切开还不够。 切出来的每段知识都要能回答几个问题：

```latex
它来自哪个文件？ 它属于哪个业务域？ 它是哪一节？ 它现在是否有效？ 它归谁维护？ 它被切成第几个 chunk？
```

这些信息就是 metadata。
你可以先把 metadata 理解成贴在知识片段上的标签。
比如售后政策文档在索引管道里会带上这类标签：

```markdown
--- title: 小哲电商公司售后政策知识库 domain: after_sale effective_status: active owner: after_sale_team tags: [售后, 退货, 退款, 换货, 规则] ---
```

这些字段不是给用户看的客服话术。
它们是给系统、调试和后续质量排查用的。
还有一个容易忽略的前提：这里的 Markdown 知识文件，应该被当成“小哲电商公司已经发布给 Agent 使用的知识版本”，不是运营随手写的草稿，也不是临时塞进 Prompt 的指令。
完整业务里通常会有知识后台、审核发布、版本回滚和灰度流程。当前版本先用 `knowledge/*.md` 承载“小哲电商公司已发布给 Agent 使用的知识”。但写法要从一开始就像正式 SOP：说明适用场景、业务规则、处理流程、需要查询的系统和风险边界，而不是写成“模型你要记住”“一定要这么回答”。
生产里还会做一层轻量的知识增强表达。它不是把原始规则改掉，而是在入库时补上更容易检索的业务字段和关键词。
这一步在本课先作为索引管道的概念边界出现，不是说当前代码已经做完了完整的知识增强。当前代码里能直接看到的是文件级、章节级 metadata 推断；更完整的增强通常会在知识入库、审核发布或索引构建阶段完成。
比如原文写“退货时需保证主商品、配件、包装和赠品完整”，知识库可以保留这句原文，同时在 metadata 或检索文本里补充：`主商品=手机`、`赠品=手机充电器`、`配件=数据线/说明书`、`关键词=手机退货/充电器赠品/配件缺失`。这样用户问“充电器少了还能退吗”时，系统更容易命中正确规则，但最终回答仍然回到已发布原文和 citation，不能把增强词当成新的业务承诺。
后面系统做得更完整时，metadata 还会继续参与更多工程动作。
比如按 `domain` 过滤知识，按 `effective_status` 排除过期规则，按 `owner` 找到负责维护的团队，按 `source_path` 和 `section` 回到原文排查事故。
先分清两层：本课代码已经能看到 `domain`、`source_type`、`risk_level`、`effective_status`、`owner`、`tags`、`scene_key` 和 `keywords` 这类基础字段；下面这些是生产系统继续扩展时常见的治理字段。

| 字段 | 解决什么 |
| --- | --- |
| `scene_key` | 区分未发货退款、签收后退货、质量问题换货这类相似场景。

|
| `risk_level` | 标记售后、退款、补偿等高风险知识，方便更保守地回答。

|
| `policy_version` / `updated_at` | 追踪回答引用的是哪一版规则，方便回滚和事故复盘。

|
| `visibility` / `permission` | 生产环境里区分客户可见知识和内部 SOP。

|
| `source_type` | 区分 policy、FAQ、product guide、SOP 等来源类型。

| 所以 metadata 不只是展示字段。 它会慢慢变成过滤、追溯、权限和过期控制的基础。 当 Agent 答错时，你要能问：

- 它命中的规则来自哪里？
- 这段规则是不是当前有效？
- 它是活动规则，还是历史复盘？
- 是运营维护，还是售后维护？
没有 metadata，后面排查 RAG 问题会很痛苦。

### section 和 chunk 不是一回事 这里要先把两个词分开。 `section` 是业务语义上的章节。 它通常来自 Markdown 的二级标题：

```markdown
## 签收后 7 天无理由退货
```

这个标题下面的整段内容，都属于同一个 section。
section 回答的是：

```latex
这段知识属于哪个业务主题？
```

比如“签收后 7 天无理由退货”“质量问题售后”“物流承运与配送节点”，都是小哲电商同事能理解、能维护的业务章节。
`chunk` 是检索执行时真正拿来匹配和塞进模型的小片段。
一个 section 不一定只对应一个 chunk。
如果 section 很短，它可以只生成 1 个 chunk。
如果 section 很长，它会继续按 `chunk_size` 和 `chunk_overlap` 切成多个 chunk。
所以它们的关系是：

```latex
document：after_sale_policy.md -> section：签收后 7 天无理由退货 -> chunk 1：适用场景和业务规则开头 -> chunk 2：带 overlap 的业务规则后半段 -> chunk 3：处理流程和需要查询的系统 -> chunk 4：风险边界
```

也就是说，不是每个 section 都会拆成多个 chunk。
在本课当前知识里，我们直接复用了 `code/agent-backend/knowledge/` 里的生产形状知识库。
这些知识不是每节两三句话的小样本，而是包含“适用场景、业务规则、处理流程、需要查询的系统、风险边界”的结构化 SOP。
所以很多 section 在默认 `160 / 32` 下都会自然拆成多个 chunk。
你可以这样记：

```latex
section 是人维护知识时看的业务边界。 chunk 是系统检索知识时用的执行颗粒度。
```

调试后台里的 `matched_sections` 告诉你“命中了哪个业务章节”。
`matched_chunk_ids` 告诉你“具体拿了这个章节里的哪几个片段给模型看”。

### 这一版到底用了哪种分块方式 小哲电商当前采用的是一种很朴素、但很适合观察的分块方式：

```latex
Markdown 标题识别业务 section -> section 内按字符长度切 chunk -> 相邻 chunk 保留 overlap -> 每个 chunk 带回 source、section、domain 等 metadata
```

它不是把整篇文档从第一个字开始每 160 个字符硬切一次。真正优先保住的是业务章节边界：签收后退货、质量问题售后、物流承运、会员优惠，这些先不能混在一起。
你可以把几种做法放到小哲现场里比较：

| 分块方式 | 看起来的好处 | 在小哲客服里的问题 |
| --- | --- | --- |
| 整篇文档一个 chunk | 最简单，不会切断句子。

| 命中一次就把整篇 SOP 塞回模型，Prompt 墙换了个入口。

|
| 全文固定长度硬切 | 实现简单、块大小稳定。

| 可能把“适用条件”和“风险边界”切到不同业务上下文里。

|
| 先按 Markdown section，再按长度兜底 | 先保住业务章节，再控制 chunk 大小。

| 需要知识文档本身有清晰标题和稳定结构。

|
| 语义分块 | 更可能贴近自然语义边界。

| 要额外模型或相似度阈值，调试成本更高，不适合一开始就掩盖 section/chunk/metadata 的关系。

| 所以当前这版先选第三种：先靠 Markdown 标题保住小哲电商的业务结构，再用 `chunk_size=160` 和 `chunk_overlap=32` 把较长 section 切成能检索的小片段。 这个选择不是因为它最先进，而是因为它最容易排查。调试后台能直接回答三件事：

```latex
命中了哪个业务章节？ 具体给模型的是哪几个 chunk？ 这些 chunk 是否带着正确的来源和 metadata？
```

等你看到一次错误命中时，也能先判断：是文档章节边界写错了，是 chunk 太碎了，还是 metadata 没把业务域贴清楚。

### chunk size 和 overlap 解决什么 切片还有两个很容易被忽略的参数：

```latex
chunk_size chunk_overlap
```

`chunk_size` 决定每个片段最多多长。
太大，片段里会混进太多无关内容，模型又开始被干扰。
太小，一条完整规则可能被切断，模型看不到条件和结论。
`chunk_overlap` 决定相邻片段之间保留多少重叠文字。
为什么要重叠？因为规则经常跨句。
例如，小哲电商公司售后知识库里的“签收后 7 天无理由退货”这一节，不只是一个结论，还包含适用场景、业务规则、处理流程、需要查询的系统和风险边界：

```latex
适用场景：用户签收后想退货。 业务规则：7 天内、商品完好、配件包装齐全，通常可以申请退货。 处理流程：先确认签收时间、商品状态、配件包装和赠品。 风险边界：不能直接承诺退款到账或赔偿。
```

它明显超过了本课默认的 `chunk_size = 160`，所以会被切成多个 chunk。
第 1 个 chunk 可能覆盖适用场景和业务规则开头，后面的 chunk 会继续覆盖处理流程和风险边界。overlap 的作用，就是在朴素字符切片可能切断一句话时，把边界附近的一点上下文带回来。
第 09 课代码用的是很朴素的字符切片：

```latex
chunk_size = 160 chunk_overlap = 32
```

这两个值不是要你死记，它们只是这份小哲电商知识库里的起点。
这里还有一个细节：本课的 `chunk_size = 160` 指的是字符数，不是 token 数，因为当前版本用的是 `len(normalized)` 做字符级切片。生产环境里经常会按 token 数、句子边界或语义边界来切。
这一课先用字符切片，是为了让你看清 section、chunk、metadata 的关系，不是说生产系统一定也这么切。
真正设置 `chunk_size` 和 `chunk_overlap` 时，先记三条原则。
第一，先按业务语义切，再用长度兜底。Markdown 里的 `## 签收后 7 天无理由退货`、`## 质量问题售后` 本身就是业务边界。不要一上来只按固定字数硬切，否则一条售后规则可能被拆得七零八落。
第二，`chunk_size` 要尽量装下一条完整规则。一条客服规则通常不只有结论，还会带着适用条件、限制条件和例外口径。
第三，`chunk_overlap` 只补跨边界上下文，不负责重复整段知识。它太小，条件和结论可能被切断；它太大，相邻 chunk 会大量重复，检索结果看起来很多，其实都是同一段规则在反复占 Prompt。
调参时可以拿几条代表性问题手工检查：
- 命中的 chunk 是否包含必要条件和结论？
- 是否夹带了太多无关规则？
- 相邻 chunk 是否重复到浪费 Prompt？
- 用户换一种说法时，相关章节还能不能被命中？
这一步调的是知识入库前的颗粒度，不是在追求一个神奇参数。文档标题层级、章节边界、有效状态和维护责任也要同步整理，否则切片参数再漂亮，检索质量也会被脏文档拖垮。

## 代码落地

### 当前代码的实现入口 这一版 Agent 后端在：

```latex
code/agent-course-versions/lesson-09-document-chunking/backend/
```

相比第 08 课，它不再使用短小的课程样例，而是直接复用生产形状知识库：

| 文件 | 作用 |
| --- | --- |
| `knowledge/after_sale_policy.md` | 小哲电商公司售后政策知识库 |
| `knowledge/product_guide.md` | 小哲电商公司产品与推荐知识库 |
| `knowledge/shipping_faq.md` | 小哲电商公司物流、发票与 FAQ 知识库 |
| `main.py` | 应用启动和路由挂载 |
| `api/schemas.py` | `SourceDocument`、`KnowledgeSection`、`KnowledgeChunk`、请求和响应结构 |
| `api/routes.py` | `/health`、`/capabilities`、`/chat` |
| `agents/customer_service_agent.py` | 启动时构建 chunks，聊天时复用 chunks |
| `rag/knowledge_base.py` | 文档读取、metadata 推断、章节切分、chunk 检索、Prompt 渲染 |
| `models/llm_client.py` | OpenAI 兼容聊天模型调用 |
| `cost/observer.py` | token 与成本趋势估算 |
| `config/settings.py` | 路径、chunk 参数、统一课程环境和能力声明读取 | 这一版仍然只放 Agent 后端。 小哲电商客服 Agent 调试后台、商城、电商后端都只是调用方，不进入本课快照。

### 核心代码拆解 这一版关键链路是：

```latex
Agent 启动 -> load_source_documents() -> parse_sections(markdown) -> split_into_chunks(section_text) /chat -> ChatRequest -> retrieve_chunks(user_message, chunks) -> render_chunked_rag_messages(...) -> call_chat_model(messages) -> ChatResponse
```

先看文档读取。`load_source_documents` 会读取 `backend/knowledge/*.md`，并做两个动作。
第一，`parse_front_matter` 兼容带 front matter 的 Markdown。
第二，`infer_document_metadata` 承担索引管道补标签的职责。比如看到 `after_sale_policy.md`，代码会补出：

```latex
domain: after_sale source_type: policy risk_level: high tags: [售后, 退货, 退款, 换货, 规则]
```

再根据 section 标题补章节级信息：

```latex
section_id: return-after-delivery scene_key: return_after_delivery keywords: [签收, 7天, 七天, 退货, 无理由, 配件]
```

也就是说，文档级 metadata 说明“这篇文档属于哪个业务域”，章节级 metadata 说明“这一段规则对应哪个稳定业务场景”。
注意，这里的 `infer_document_metadata` 和 `infer_section_metadata` 是本课为了把 metadata 形状讲清楚而保留的占位实现。真正的生产系统更常见的是从知识后台、数据库字段、Markdown front matter 或发布流水线读取这些标签，而不是把大量 if/elif 固化在业务代码里。
再看章节切分：

```python
def parse_sections(document: SourceDocument) -> list[KnowledgeSection]: ... if line.startswith("## "): flush_section() current_title = line.removeprefix("## ").strip()
```

这段代码按 Markdown 二级标题切章节。`## 签收后 7 天无理由退货` 会变成一个 section，`## 质量问题售后` 会变成另一个 section。
section 会保留来源、标题、章节名和章节序号：

```python
"source_path": document.source_path, "document_title": document.title, "section": current_title, "section_index": section_index,
```

然后是切 chunk：

```python
def split_into_chunks(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]: normalized = "\n".join(line.strip() for line in text.splitlines() if line.strip()) if len(normalized) <= chunk_size: return [normalized] step = max(1, chunk_size - overlap)
```

如果 section 不长，就保持一个 chunk；如果 section 太长，就按 `chunk_size` 切开，并用 `overlap` 保留相邻上下文。
最后生成 `KnowledgeChunk`。这个对象至少要带这些字段：

```latex
chunk_id section_id source_path document_title section chunk_index metadata
```

这里要分清两个 ID。
`section_id` 是章节级稳定标识，比如：

```latex
return-after-delivery
```

`chunk_id` 是在 `section_id` 后面加上 chunk 序号：

```latex
return-after-delivery-c1 return-after-delivery-c2 return-after-delivery-c3
```

稳定 ID 的意义是：

```latex
同一段知识更新前后，系统还能知道它大致是谁。
```

完整工程里经常会用来源文件、章节 slug、版本号或内容 hash 来生成 ID。本课先用章节 metadata 里的 `section_id` 加上 `chunk_index`，让你看到：chunk 不是临时字符串，而是后续引用来源、调试记录和事故排查要追溯的对象。
再看本轮回答。`retrieve_chunks` 仍然是轻量检索：

```python
hits = retrieve_chunks(request.user_message, chunks) messages = render_chunked_rag_messages(request, intent_result, hits)
```

第 09 课代码里有一个临时词表 `QUERY_TERMS`。它不是生产级搜索引擎，只是为了说明“切片后的知识如何被命中”而保留的关键词触发器。

```python
QUERY_TERMS = ['金卡', '会员', '会员价', '优惠', '优惠券', '叠加', '结算页', '降噪', '耳机', '退货', '退款', '签收', '7天', '七天', '无理由', '包装', '配件', '发货', '物流', '预售', '48小时']
```

`retrieve_chunks` 会先从用户问题里找出这些词，再去 chunk 的可搜索文本里匹配。可搜索文本不只看 chunk 正文，还会看标题、章节和 metadata：

```latex
document_title section chunk.text metadata.tags metadata.keywords metadata.domain
```

这样用户说“优惠券”时，不一定非要正文里出现这个词；section 标题或 tags 也可能帮系统命中相关片段。
但这个方案有明显短板。
如果用户问：

```latex
我刚买的东西想退
```

这句话里没有命中当前 `QUERY_TERMS` 里的“退货”“退款”“签收”“无理由”等词，系统就可能什么 chunk 都找不到。
这不是文档切片错了。
这是关键词检索本身太弱。
这类问题不能靠继续往 `QUERY_TERMS` 里补词来根治。下一课会换一种方式解决：让系统判断“这句话”和哪段规则更像。
第 09 课暂时保留 `QUERY_TERMS`，是为了把注意力放在：

```latex
知识先被整理成 section 和 chunk，检索命中后能追溯来源。
```

这就是第 09 课和下一课之间的边界。
`session_state.rag` 会记录：

```python
"document_count": len(self._source_documents), "chunk_count": len(chunks), "chunk_size": CHUNK_SIZE, "chunk_overlap": CHUNK_OVERLAP, "matched_chunk_ids": [hit.chunk.chunk_id for hit in hits], "matched_sections": [hit.chunk.section for hit in hits],
```

这些字段让你能看到：

> 文档到底被切成了多少个 chunk，这次具体命中了哪个 section。

> ## 怎么验证老板能闭嘴 你可以问：

```latex
签收七天内，耳机包装配件都在，能无理由退货吗？
```

这一版应该能看到：
1. `intent` 是 `refund_request`。
2. `session_state.rag.mode` 是 `markdown_chunking`。
3. `document_count` 是当前知识文档数量。
4. `chunk_count` 是切片后的知识片段数量。
5. `matched_sections` 包含 `签收后 7 天无理由退货`。
6. 顶层响应继续保持前面已经讲过的格式，切片证据放在 `session_state.rag`。
老板和售后主管能在调试后台看到的，不只是最终回答。
这一轮运行证据会确认：
- chunk 保留 `domain=promotion` 这类 metadata。
- `source_path` 能指回原始 Markdown。
- `chunk_size` 和 `chunk_overlap` 被写进 metadata。
这证明第 09 课真正解决的是：

```latex
知识不是随便丢给模型，而是先整理成可检索、可追溯的小片段。
```

## 本节知识总结 文档切片是 RAG 质量的地基。 很多人一开始会以为检索质量主要靠 embedding 模型或向量库。其实在模型和向量库之前，知识原文怎么写、怎么拆、怎么标注，已经决定了后面能不能找准。 切片不是机械地每隔多少字切一刀。好的 chunk 应该能相对独立地回答一个小问题，同时保留必要条件、适用范围和例外情况。否则检索命中了也没用：命中的片段可能缺前提、缺结论、缺来源，模型只能继续猜。

| 知识点 | 核心概念 | 小哲项目里的落点 |
| --- | --- | --- |
| Markdown 规范化 | 知识库要先长成可维护文档，标题、段落和标签都会影响检索质量。

| 售后、商品、物流 FAQ 先整理成小哲电商自己的知识原文。

|
| Section | section 是按业务语义划出来的章节，方便维护、追溯和判断命中了哪个主题。

| “签收后退货”“活动叠券”“发票开具”等成为可追踪章节。

|
| 文档切片 | 切片要把文档拆成能独立回答小问题的知识单元。

| 每个 chunk 尽量保留规则条件、结论和边界，而不是只截半句话。

|
| Metadata | metadata 让系统能按来源、业务域、状态、责任人、有效期等过滤和追溯。

| 小哲后面可以按业务域、风险级别和有效状态筛选知识。

|
| chunk id | chunk 要有相对稳定 ID，方便引用、缓存、调试和事故排查。

| citation、命中记录和调试后台都能回到同一个知识片段。

|
| chunk size | chunk 大小决定一段知识是否完整，也决定进入 Prompt 的成本。

| 本课用字符数演示，后续可以按 token、句子或语义边界优化。

|
| overlap | overlap 用来保护切片边缘上下文，但太多会制造重复和噪声。

| 售后规则跨段时需要少量重叠，避免条件和结论被切开。

|
| 关键词词表 | 关键词只是早期触发器，后续要结合业务问法、metadata、标注和事故复盘维护。

| `QUERY_TERMS` 是当前版本的早期方案，后面会升级到向量检索和混合检索。

|

## 切片之后，检索短板露出来了 这版把知识整理得像样了，但检索短板也露出来了。 现在你能清楚看到几个问题：
- 仍然主要靠关键词命中。
- 用户换一种说法时，可能找不到正确 chunk。
- 相似问题之间还缺少更稳定的“像不像”判断。
- 老板现在只能看到命中的章节摘要，还看不到更清楚的来源卡片。
- 切片后的效果还需要一组固定问题来反复验证。
这版做的是 RAG 的“资料入库前整理”。
如果这一步做不好，后面的向量检索也会在脏知识上打转。

## 小哲心中隐隐的担心 售后主管看着命中的章节，终于点了点头：

> 这次至少知道它看的是哪一段规则。

> 老板也觉得方向对：

> 文档切开了，那用户怎么问都能找到吧？

> 你没有马上点头。
> 因为你知道，真实用户不会总按文档标题提问。
> 文档里写的是：

```latex
签收后 7 天无理由退货
```

用户可能会问：

```latex
我刚收到没几天，包装还在，能不能退？
```

这句话里不一定有“签收”“7 天”“无理由”这些完整关键词。
下一步，你不能只靠关键词。
你要让系统理解：

> 用户问什么，就找最像的规则。
> >
