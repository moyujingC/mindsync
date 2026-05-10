# RAG vs LLM Wiki（检索增强与知识编译）

## 定义

RAG 更强调“查询时取回资料并拼上下文”，LLM Wiki 更强调“先把资料编译成长期维护的知识网，再基于它工作”。

## 为什么重要

这决定了你的系统是偏临时检索，还是偏知识沉淀。

## PM 视角

如果目标是长期学习和复用，LLM Wiki 更适合作为知识资产管理方式。

## Dev 视角

需要把 raw、source、atom、wiki 分层，避免把原始材料和稳定知识混在一起。

## 相关原子

- [[../../atoms/dev/llm-wiki-uses-compiled-knowledge]]

## 相关来源

- [[../sources/karpathy-llm-wiki]]

## 待解问题

- 哪些内容应该停留在 atoms 层，哪些应该进入概念页。
