# ADR-0001: MVP 先聚焦引导式职业梳理对话

> 状态：current
> 版本：0.1.0
> owner：Architect
> last_updated：2026-04-02
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aicareer/decisions/ADR-0001-mvp-focus-on-guided-conversation.md
> 项目：aicareer
> 阶段：architecture

## 1. 背景

`怀瑾握瑜` 的长期想象可以扩展到职业资产管理、长期记忆、材料生成和顾问协作。

但第一版还没有代码，也没有验证真实用户是否愿意完成深度梳理。

## 2. 决策

第一版 MVP 先聚焦：

- 引导式职业梳理对话
- 时间线摘要
- 叙事主线初稿
- 用户修正确认

## 3. 备选方案

1. 先做简历生成器
2. 先做完整职业资产平台
3. 先做咨询师协作工作台

## 4. 权衡

选择当前方案的原因：

- 更贴近核心差异化价值
- 更容易验证用户是否认可“被理解”和“被准确表达”
- 更适合在没有代码基础时先定义流程和数据结构

放弃其他方案的原因：

- 简历生成器会把产品拉回红海
- 完整平台范围过大
- 咨询师工作台不适合作为第一轮验证重点

## 5. 后续影响

- 产品 spec、implementation plan 和 QA 都应围绕该 MVP 边界展开
- 后续如改变方向，应新增 ADR，而不是直接覆盖这条决策
