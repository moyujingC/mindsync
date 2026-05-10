# Mandala Agent 的 eval 要检查可追溯性

## 断言

`MandalaInterpreterAgent` 的 eval 应检查解释是否能回指报告、`school_interpretation_chain` 或 stage refs。

## 类型

- pattern

## 适用范围

- bridge

## 来源

- [[../../wiki/bridge/mandala-interpreter-agent-evals]]

## 备注

- 如果解释无法回指来源，就算文字顺畅也不应视为通过。
- Traceability（可追溯性）是区分“解释已有证据”和“重新编造判断”的关键。

## 相关概念

- [[../../wiki/bridge/mandala-interpreter-agent-evals]]
- [[../../wiki/dev/evals]]
- [[../../wiki/dev/tracing]]
