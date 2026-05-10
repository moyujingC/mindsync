# AI 产品 Agent 知识库

> 状态：historical-reference
> 负责人：Research & Knowledge Lead
> 适用范围：AI 产品经理学习、Agent 开发学习、与项目实践的桥接沉淀
> last_updated：2026-05-10
> source_of_truth：projects/research-center/kb/ai-product-agent-wiki/README.md
> superseded_by：projects/research-center/kb/conversation-knowledge-wiki/README.md

## 归档说明

这个目录是一次有效的知识库形态实验，但早期存在大量 AI 连续生成内容，质量和来源稳定性不足。

从 2026-05-10 起，本目录不再作为研究中心当前默认知识库入口。新的默认入口是：

- [对话知识库](../conversation-knowledge-wiki/README.md)

本目录内容默认不可直接引用、不可批量迁移。只有通过迁移 review 的结构、模板或条目，才能进入新知识库。

这是一个边学边沉淀的活知识库，用来整理：

- AI 产品经理需要理解的判断框架
- 独立开发 Agent 需要掌握的实现知识
- 你在项目实践里得到的可复用结论
- 公开资料的结构化消化结果

## 知识流转

```text
raw/ -> wiki/sources/ -> atoms/ -> wiki/
```

其中：

- `raw/`
  - 原始材料，不改写
- `wiki/sources/`
  - 单个资料源的消化页
- `atoms/`
  - 最小知识断言
- `wiki/`
  - 汇总后的可读概念页

## 收录内容

- 原始资料摘录和链接
- 你已经消化后的概念页
- 产品判断和技术实现之间的桥接页
- 可复用的项目映射页

## 不收录内容

- 单次聊天的未整理结论
- 只服务某个临时任务的短期笔记
- 还没想清楚边界的杂项内容

## 目录约定

- `raw/`
  - 原始资料，不做改写
- `wiki/`
  - 当前理解后的结构化知识
- `atoms/`
  - 最小知识断言，按 pm/dev/bridge 分类
- `wiki/sources/`
  - 每个资料源对应的消化页
- `wiki/pm/`
  - AI 产品经理视角
- `wiki/dev/`
  - 独立开发视角
- `wiki/bridge/`
  - 产品到技术的翻译层

## 维护原则

1. 先收原始资料，再写理解页
2. 理解页只写当前已消化的结论
3. 重要判断要能回指来源
4. 主题可以分开，不要混成一锅
5. 稳定后再把可复用结论提炼到公司知识库
6. `atoms/` 只写单一判断，不写长篇解释

## 首批主题

- Karpathy 的 LLM Wiki 模式
- AI 产品经理需要懂的 Agent 判断框架
- Agent 开发最小闭环
- 一镜一梳的 Agent 化映射
