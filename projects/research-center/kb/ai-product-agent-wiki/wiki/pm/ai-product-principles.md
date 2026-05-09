# AI 产品原则

## 定义

AI 产品原则是一组帮助产品经理判断“该不该用 AI、用到什么程度、失败时怎么办”的基本规则。

## 为什么重要

AI 产品不是把模型接进产品就结束。产品经理需要决定用户问题、人机边界、质量标准和失败兜底。

## 产品经理视角

先判断用户问题，再判断产品形态。常见形态包括普通生成、copilot、workflow 和 agent。Agent 只适合那些需要多步执行、状态推进、工具调用和一定自主判断的场景。

AI 产品经理还要明确：

- 哪些判断交给 AI
- 哪些判断保留给人
- 失败时用户看到什么
- 如何用评测和反馈循环改进系统

## 开发视角

产品原则需要落到技术结构里。人机边界会变成状态机、工具权限、人工介入点、降级策略和评测标准。

## 相关 Atom

- [[../../atoms/pm/start-with-problem-not-ai]]
- [[../../atoms/pm/define-human-ai-boundary]]
- [[../../atoms/bridge/agent-design-should-encode-failure-handling]]

## 相关来源

- [[../sources/ai-product-strategy-notes]]

## 待澄清问题

- 一镜一梳报告链路里，哪些失败场景应该直接阻断，哪些可以保守输出。

