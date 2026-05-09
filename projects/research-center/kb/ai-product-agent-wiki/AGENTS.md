# AI 产品 Agent 知识库协作说明

> 状态：draft
> owner：Research & Knowledge Lead
> source_of_truth：projects/research-center/kb/ai-product-agent-wiki/AGENTS.md

这个目录用于收口 AI 产品与 Agent 开发相关的长期知识沉淀。

## 工作方式

- `raw/` 只放原始材料，不直接改写原意
- `wiki/sources/` 放单个资料源的消化页
- `atoms/` 放最小知识断言
- `wiki/` 放你当前已经消化后的稳定理解
- 新主题先落 `raw/` 或 `wiki/sources/`，再提取 `atoms/`，最后写概念页
- 重要判断要写明来源，不要只留结论

## 目录边界

- `atoms/pm/`
  - AI 产品经理视角的最小判断
- `atoms/dev/`
  - Agent 开发视角的最小技术断言
- `atoms/bridge/`
  - 产品判断到技术实现的映射断言
- `wiki/pm/`
  - 产品判断、用户问题、价值、边界、评测
- `wiki/dev/`
  - Agent loop、工具、状态、编排、eval、guardrails
- `wiki/bridge/`
  - 把产品语言翻译成技术语言
- `wiki/sources/`
  - 单个资料源的消化页

## 入库原则

- 只有稳定、可复用的结论，才适合再提炼进 `company/knowledge-base`
- 仍在学习和试验中的内容，优先留在这里
- 如果一个判断只对某个项目成立，不要直接提升为公司级知识

## Atom 规则

- 每个 atom 只表达一个判断
- atom 必须能回指一个 source、概念页或项目事实
- atom 可以是事实、模式、启发或决策
- atom 不替代概念页；概念页负责把多个 atom 组织成可读理解
