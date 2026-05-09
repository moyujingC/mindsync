# Mandala Agent Evals Check Traceability

## Claim

`MandalaInterpreterAgent` 的 eval 应检查解释是否能回指报告、`school_interpretation_chain` 或 stage refs。

## Type

- pattern

## Applies To

- bridge

## Source

- [[../../wiki/bridge/mandala-interpreter-agent-evals]]

## Notes

- 如果解释无法回指来源，就算文字顺畅也不应视为通过。
- Traceability（可追溯性）是区分“解释已有证据”和“重新编造判断”的关键。

## Related Concepts

- [[../../wiki/bridge/mandala-interpreter-agent-evals]]
- [[../../wiki/dev/evals]]
- [[../../wiki/dev/tracing]]

