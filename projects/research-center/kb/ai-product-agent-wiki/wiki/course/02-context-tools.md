# 02 上下文与工具

## 目标

理解 Agent 不是只靠 prompt 工作，而是依赖上下文、工具和领域知识。

## 关键问题

- Agent 当前任务需要哪些上下文？
- 哪些能力应该做成工具？
- 工具输出是否结构化？
- 什么时候应该补知识，而不是改 prompt？

## 来源

- [[../sources/building-with-llms-notes]]
- [[../sources/karpathy-llm-wiki]]

## 原子

- [[../../atoms/dev/context-engineering-beats-prompt-tweaking]]
- [[../../atoms/dev/llm-wiki-uses-compiled-knowledge]]
- [[../../atoms/dev/tools-should-be-few-clear-and-structured]]

## 概念

- [[../dev/rag-vs-llm-wiki]]
- [[../dev/agent-loop]]
- [[../dev/tool-design]]

## 核心笔记

上下文是 Agent 判断的燃料，工具是 Agent 执行动作的手。只改 prompt，通常只能改变表达方式；补上下文和工具，才是在改变 Agent 实际能看见什么、能做什么。

工具设计要克制。工具越多，Agent 越容易选错；工具越模糊，trace 和 eval 越难判断对错。第一版更适合保留少量高价值工具，并让每个工具都有结构化输入输出。

对一镜一梳来说，工具不应按代码模块随手暴露，而应按任务步骤定义：读输入、取证据、查知识、生成草稿、做安全检查、输出解释。

## 练习

把一镜一梳里的三圈识别、知识 runtime、报告生成、安全检查列成 Agent 可调用工具清单。
