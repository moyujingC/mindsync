# 解读 Agent 只解释已有证据

## 断言

解读 Agent 的第一职责是解释已有证据链，而不是新增底层判断。

## 类型

- decision

## 适用范围

- bridge

## 来源

- [[../../wiki/bridge/mandala-interpreter-agent-design]]

## 备注

- 对一镜一梳来说，`MandalaInterpreterAgent` 应解释 Lite / Pro 报告和 stage 引用，不重新识别三圈或改写底层判断。
- 这能避免把“用户可读解释”误做成新的报告生成链路。

## 相关概念

- [[../../wiki/bridge/mandala-interpreter-agent-design]]
- [[../../wiki/bridge/aimandala-agent-mapping]]
