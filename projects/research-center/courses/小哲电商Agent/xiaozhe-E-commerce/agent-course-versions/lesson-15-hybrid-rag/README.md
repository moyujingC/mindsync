# 第 15 课代码：Hybrid RAG

这一版代码把 RAG 检索拆成两层：`pre_retrieval_plan` 先判断知识场景并限制召回范围，`retrieve_knowledge` 再组合向量召回和关键词召回。它解决的是长尾售后词、规则关键词和相似场景混在一起时，单靠向量相似度不够稳的问题。

本课的 `vector_retrieve` 已经使用 OpenAI 兼容 embedding 和 cosine similarity；`keyword_retrieve` 保留轻量 BM25 直觉实现，用来抓“赠品”“包装盒”“压坏”这类边界词。

## 核心链路

```text
/chat
  -> classify_intent(user_message)
  -> pre_retrieval_plan(ChatRequest, intent)
  -> vector_retrieve(plan)
  -> keyword_retrieve(plan)
  -> merge_hybrid_hits(plan, vector_hits, keyword_hits)
  -> build_citations(reliable_hits)
  -> generate_stable_rag_answer(messages)
  -> ChatResponse
```

## 模块结构

```text
backend/
  main.py                       # FastAPI 应用启动，显式导出课程测试用符号
  api/
    routes.py                   # /health、/capabilities、/chat 路由
    schemas.py                  # RetrievalPlan、KnowledgeHit、Citation 等结构
  agents/
    customer_service_agent.py   # pre-retrieval -> Hybrid RAG -> citations/回答
  embeddings/
    client.py                   # OpenAI 兼容 embedding 客户端和文本向量缓存
  rag/
    knowledge_base.py           # knowledge_chunks.json 读取
    planning.py                 # 场景识别、allowed_topics、keyword_terms
    hybrid_retrieval.py         # vector_retrieve、keyword_retrieve、merge_hybrid_hits
    prompting.py                # Hybrid RAG Prompt 和 citations
  models/
    llm_client.py               # 稳定知识 RAG 回答模型适配器
  config/
    settings.py                 # 路径、top_k、embedding 默认配置、低置信阈值和课程环境
  knowledge_chunks.json         # 本课检索知识片段
```

第 15 课新增能力主要在 `rag/planning.py` 和 `rag/hybrid_retrieval.py`：先决定“去哪类知识里找”，再把向量召回和关键词召回合并。

## 当前边界

- 为了聚焦 Hybrid RAG，`intent` 先沿用轻量规则分类；第 04 课的小模型兜底分类和后续 RoutePlan 机制不在本课展开。这里的 `scene` 是检索场景，不是完整业务决策。
- Hybrid RAG 只处理稳定知识检索，不查实时订单、物流、库存或退款进度。
- 关键词召回只是轻量 BM25 直觉实现，不是完整搜索引擎；生产环境通常交给 Elasticsearch、OpenSearch 或专门 lexical retriever。
- 不做 RAG Fusion、多知识库或权限过滤，它们只是后续增强方向。
- 不做工作流、Memory、Trace、HITL 或完整 Eval 平台。
- `/capabilities` 只服务调试后台适配。

## 启动后端

```bash
cd code/agent-course-versions/lesson-15-hybrid-rag/backend
python main.py
```

## 截图对照

![调试后台显示 Hybrid RAG 的向量召回和关键词召回](screenshots/hybrid-rag-panel.png)

这张图重点看 `检索场景`、`允许主题`、`向量命中` 和 `关键词命中`。长尾售后词出现时，系统先限制知识场景，再把向量召回和关键词召回合并，避免单一路径漏掉关键规则。

## 发布包说明

本目录只保留运行当前课所需的代码、场景材料和说明。请按课程正文里的场景和发布包根目录下的 `docs/运行手册.md` 启动当前版本，并用调试后台、curl 或课程给出的业务问题观察响应结构。
