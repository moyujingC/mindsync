# Source: Building with LLMs Notes

## Metadata

- type: skill
- source_url: /Users/xinran/.agents/skills/building-with-llms/SKILL.md
- date_read: 2026-05-09
- topic: building-with-llms
- status: draft

## One-line Summary

这份资料强调上下文工程、few-shot、分解任务、自我批评和评测，是把 LLM 做稳的基础方法。

## Key Claims

- 上下文工程比只改 prompt 更重要。
- 复杂任务要拆解，不要一次让模型解决全部问题。
- 评测和自检是稳定输出的前提。

## Useful For

- AI PM: 识别产品是否需要更好的上下文，而不是更“聪明”的模型
- Independent Dev: 设计 agent loop、tool use 和 eval
- Aimandala: 优化报告生成与质量控制

## Atoms Created

- [[../../atoms/dev/context-engineering-beats-prompt-tweaking]]
- [[../../atoms/dev/decompose-complex-tasks-before-generation]]
- [[../../atoms/dev/evals-are-mandatory-for-ai-products]]
- [[../../atoms/dev/tools-should-be-few-clear-and-structured]]
- [[../../atoms/dev/agent-state-explains-next-action]]
- [[../../atoms/dev/eval-tool-calls-and-decisions]]
- [[../../atoms/dev/trace-enables-agent-explainability]]
- [[../../atoms/bridge/guardrails-belong-to-product-and-technical-boundaries]]
- [[../../atoms/dev/single-agent-before-multi-agent]]
- [[../../atoms/dev/multi-agent-needs-clear-reason]]

## Concepts Updated

- [[../dev/agent-loop]]
- [[../dev/tool-design]]
- [[../dev/state-machine]]
- [[../dev/evals]]
- [[../dev/tracing]]
- [[../dev/guardrails]]
- [[../dev/single-agent-design]]
- [[../dev/multi-agent-design]]
- [[../bridge/pm-to-agent-architecture]]

## Open Questions

- 一镜一梳的哪些质量问题更适合靠上下文解决，哪些更适合靠规则解决。
