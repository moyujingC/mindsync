# Interpreter Agent Explains Existing Evidence

## Claim

解读 Agent 的第一职责是解释已有证据链，而不是新增底层判断。

## Type

- decision

## Applies To

- bridge

## Source

- [[../../wiki/bridge/mandala-interpreter-agent-design]]

## Notes

- 对一镜一梳来说，`MandalaInterpreterAgent` 应解释 Lite / Pro 报告和 stage 引用，不重新识别三圈或改写底层判断。
- 这能避免把“用户可读解释”误做成新的报告生成链路。

## Related Concepts

- [[../../wiki/bridge/mandala-interpreter-agent-design]]
- [[../../wiki/bridge/aimandala-agent-mapping]]

