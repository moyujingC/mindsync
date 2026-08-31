DeepSeek Harness 前沿工程实践

穿透 dsh 内核，跑通规则自进化闭环

飙升榜 第3名

专栏

未完结·共 24 讲·已更新 3 讲·每周一/三/五更新

|

427 人已学

|

收藏

## 专栏交流群

购课后，欢迎加入课程交流群， [\> 戳此加入 <](http://gk.link/a/12Lwx)

## 你将获得

- Cordis 组合机制与插件生命周期原理剖析
- 工具流水线、会话日志与 Agent Loop 源码详解
- Goal、Subagent、Workflow 与 Ralph 编排实战
- 异常检测、候选规则生成、评测与自进化闭环

## AI 导学

Agent 真正能“自进化”的关键，不在于让它随意改写自己，而在于构建一条受控闭环：记录轨迹、发现异常、生成候选、评测确认、持久生效。DeepSeek Harness（dsh）为此提供了两大工程基石——基于 Cordis 内核的插件化架构，让模型、工具、沙箱等组件可动态组合与替换；Append-Only 会话日志机制，确保每次运行全程可追溯、可回放。课程深入剖析工具流水线、Agent Loop 与多 Subagent 编排逻辑，并通过构建规则自进化的防火墙 Agent 实战，帮助你理解如何将异常检测、候选规则生成与评测验证串联成闭环。学完可建立对 AI 自进化系统底层运行机制的认知，掌握可落地的插件化与可观测性设计方法。

## 课程介绍

AI 正从“辅助人写代码”，走向参与实验、评测和系统改进。

但所谓“AI 自进化”，并不是让 Agent 随意修改自己。真正能够落地的自进化系统，必须形成一条受控闭环： **记录运行轨迹 → 发现异常 → 生成候选方案 → 评测确认 → 持久化生效。**

DeepSeek 开源的 DeepSeek Harness（dsh），为这条闭环提供了两块关键地基。

![](https://static001.geekbang.org/resource/image/ee/ed/eee12978d767e277888987790e34eaed.png?wh=2666x1294)

**第一，一切皆插件。** 模型、工具、技能、会话、沙箱、存储、循环和调度都可以替换、组合，由 Cordis 内核管理生命周期与依赖关系。Agent 不再被锁在固定的执行框架里，而是可以按任务需要动态重组。

**第二，每次运行都可追溯。** 系统提示、上下文注入、工具调用、执行结果和 Subagent 调度都会写入 Append-Only 会话日志。Agent 做过什么、为什么出错、改进是否有效，都有轨迹可以回放和验证。

一个让系统能改，一个让系统能看。二者结合，才有资格讨论 AI 自进化。  
《DeepSeek Harness 前沿工程实践》不是一门 API 调用课，也不只是教你安装插件。课程将用 4 个篇章、21 讲，带你从底层内核走到完整系统：

- 基础篇：理解 Cordis、Effect、依赖注入、事件分发与插件生命周期；
- 核心篇：拆解工具流水线、进程沙箱和 Append-Only 会话日志；
- 编排篇：深入 Agent Loop、Goal、Subagent、Workflow 与多 Agent 协作；
- 实战篇：亲手构建一个规则可演化的防火墙 Agent。

![](https://static001.geekbang.org/resource/image/c5/1c/c528d2a0133ffc3d5b70d2f8f7cffe1c.png?wh=2496x3639)

在最终实战中，系统会识别异常请求、分析运行轨迹、生成候选规则，再经过评测和确认持久化生效。你完成的不是一个只能演示的 Agent Demo，而是一套可观测、可评测、可控制的规则自进化闭环。

学完课程，你将获得三层能力：

1. 看懂 Agent 运行时和插件架构；
2. 理解工具、会话、沙箱、日志与多 Agent 编排如何协作；
3. 独立实现一个受控的自进化系统。

这门课适合已经具备开发基础，关注 Agent、Coding Agent、运行时架构和 AI 自进化的工程师。如果你只想调用 DeepSeek API，官方文档已经足够；如果你想从“使用 Agent”走向“理解并改造 Agent”，这门课值得学习。

需要说明的是，DeepSeek Harness 目前仍处于开发者预览阶段，接口可能变化。课程真正有长期价值的，不是某个版本的 API，而是插件化、可追溯运行和受控改进背后的工程方法。

## 课程目录

![](https://static001.geekbang.org/resource/image/79/9b/79e904c6e67b32466025f06b7a5b959b.jpg?wh=3125x8711)

查看更多

## 适合人群

- AI 应用 /Agent 研发工程师：不满足于直接使用 dsh 标准模式或创造 dsh 简单插件，希望掌握框架底层，具备复杂 Agent 架构设计能力的开发者。
- 资深前端 / 后端 / 架构师：希望切入 AI 赛道，将已有系统能力与新一代自进化 Agent 框架深度融合的工程师。
- 前沿技术探索者：对智能体自进化有好奇心，希望用工程代码落地前沿 AI 趋势的极客。

## 订阅须知

1. 订阅成功后，推荐通过“极客时间”App 端、Web 端学习。
2. 本专栏为虚拟商品，交付形式为图文 + 音频，一经订阅，概不退款。
3. 订阅后分享海报，每邀一位好友订阅有现金返现。
4. 戳此查看 [最新课表](https://time.geekbang.org/activity/promo?page_name=page_249) 、 [极客时间 VIP](https://time.geekbang.org/hybrid/next/svip/home) 超值福利，掌握前沿趋势。
5. 企业采购推荐使用“ [极客时间企业版](https://b.geekbang.org/?utm_source=geektime&utm_medium=columnintro&utm_campaign=newregister&gk_source=2021020901_gkcolumnintro_newregister) ”便捷安排员工学习计划，掌握团队学习仪表盘。
6. 戳此 [申请学生认证](https://time.geekbang.com/activity/promo?page_name=page_3471768093) ，订阅课程享受原价 5 折优惠。
7. 价格说明：划线价、订阅价为商品或服务的参考价，并非原价，该价格仅供参考。未划线价格为商品或服务的实时标价，具体成交价格根据商品或服务参加优惠活动，或使用优惠券、礼券、赠币等不同情形发生变化，最终实际成交价格以订单结算页价格为准。

![](https://static001.geekbang.org/static/time/img/ai.chat.ec0dcd23.gif)