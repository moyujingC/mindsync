从 0 开始构建 Agent Harness

打破黑盒困境，复刻 OpenClaw 引擎

新课榜 第5名

专栏

已完结·共 26 讲

|

8105 人已学

|

收藏

## 你将获得

- 可运行，从 0 到 1 实现工业级 OS 底层引擎
- 可掌控，突破长程上下文、死循环等 20+ 工程卡点
- 可观测，集成 Tracing、Benchmark 评估的科学度量体系
- 可二开，从 Framework 到 Harness 的硬核工程落地方案

## AI 导学

Agent 为何总在关键时刻“翻车”？不是提示词不够好，而是黑盒框架把状态藏得太深，让你对长上下文、死循环和危险命令束手无策。这门课直击工业级 AI Agent 的核心痛点，教你用 Go 从零构建轻量 Harness 引擎——将大模型视为 CPU，上下文当作内存，工具调用类比外设操作。你将掌握上下文阶梯压缩与状态外部化机制，有效突破 Token 限制并实现断点续传；通过 Middleware 拦截高危指令、结合飞书人工审批筑牢安全防线；并集成 Tracing 与 Benchmark 构建可观测性体系，科学评估 Agent 行为。最终交付的 go-tiny-claw 引擎，已在 CLI 与 ChatOps 场景中验证其工业可用性。

## 课程介绍

你是不是也遇到过这些“AI 翻车”现场？

- Agent 读个 3000 行日志，直接报 Token 超限；
- 修编译错误时，同一个错误命令连跑 10 遍，原地鬼打墙；
- 差点执行 rm -rf./，你手抖着按下了 Ctrl+C。

这不是你 Prompt 写得不好，而是那些“调包框架”（LangChain、AutoGen 等）本身就是黑盒。它们塞给模型几十个工具描述，把状态藏在内存里，你根本插不上手。框架越重，失控越狠。

如今大模型自己就会规划和调用工具了。它们不再需要这些框架“管家”，它们需要的是 **“缰绳”——Harness** 。

简单说，Harness 就是给大模型写一个微型操作系统。

- 大模型 = CPU（负责思考）
- 上下文窗口 = RAM（极其金贵的内存）
- 本地操作 = 外设（硬盘、网卡）

Harness 不教模型怎么想，它主要干内存回收、硬件调度、系统中断这些“脏活”。 **如果你想构建工业级、长周期、可控的 AI Agent，肯定绕不开 Harness。** 因为三个最大的坑，Harness 刚好全填上了。

![](https://static001.geekbang.org/resource/image/b5/10/b5905bf37a28cb55af9827ca120b4d10.png?wh=1838x580)

学 Harness = 给 AI 套上缰绳，跑得快又不翻车。

### 课程交付什么？

用 Go 吸收顶级开源项目 OpenClaw 的极简哲学，从零构建工业级 Harness 引擎 —— go-tiny-claw。

你会拿到：

- 完整源码（ReAct 循环、多模型适配、上下文压缩、死循环检测、链路追踪…）
- 搞懂“框架坍塌，Harness 崛起”这条行业暗线
- 具备设计工业级 AI Agent “物理躯体”的真本事

### 怎么学？

课程按工程开发顺序分为六个章节，共 24 讲：

**第一章：认知与核心引擎**

我们将抛弃黑盒，纯手写大模型原生的 ReAct 循环。设计优雅的多模型适配层（接入 Claude 与 OpenAI 兼容 API 模型），并前瞻性地引入独立的“慢思考（Thinking）”机制，极大提升复杂任务的规划成功率。

**第二章：极简工具与物理交互**

打造强扩展性的 Tool Registry。深刻贯彻极简工具哲学，手写支持多级模糊匹配的健壮 Edit 工具，并利用 Go 的并发特性压榨出并行工具执行的性能极限。

**第三章：上下文工程体系**

这是决定 Agent 智商的生命线。我们将实现系统提示词的动态组装、超长文本的阶梯降级压缩（Compaction）；更重要的是，摒弃复杂的内部状态机，把“记忆”与“待办”完全外部化为本地的文件系统。

**第四章：稳定性控制与多智能体**

让 Agent 走向生产环境。实现运行时提醒（Reminders）斩断死循环；通过 Middleware 拦截危险操作，在飞书中弹出卡片等待人类审批（Human-in-the-loop）；引入 Subagent 隔离复杂任务。

**第五章：可观测性与科学度量**

这是高级工程师的分水岭。为引擎引入链路追踪（Tracing）、成本审计，并搭建自动化 Benchmark 评估脚本，科学量化引擎的每一次进步。

**第六章：端到端实战串讲**

全要素组装，最终打造出一个强悍的 CLI 工具，以及一个能在飞书群里随时被召唤、具备安全底线的 AgentOps 运维自动化助手。

未来已来，就藏在极简的架构哲学里。带上键盘，我们敲起来。

![](https://static001.geekbang.org/resource/image/fd/cb/fd3bb464713398d8a80354f010b598cb.png?wh=5978x3152)

## 课程目录

![](https://static001.geekbang.org/resource/image/a3/93/a35ff889027e10c3c1bee0f8b4f60393.jpg?wh=1563x6081)

查看更多

## 适合人群

- 寻求构建轻量可控 Agent 引擎的 AI 应用架构师与开发者；
- 希望将 AI 能力融入现有工作流的后端 / 云原生工程师；
- 想要打造安全 ChatOps 机器人的 DevOps/SRE 工程师；
- 为技术负责人与顾问提供 AI 工程化解决方案。

## 订阅须知

1. 订阅成功后，推荐通过“极客时间”App 端、Web 端学习。
2. 本专栏为虚拟商品，交付形式为图文 + 音频，一经订阅，概不退款。
3. 订阅后分享海报，每邀一位好友订阅有现金返现。
4. 戳此查看 [最新课表](https://time.geekbang.org/activity/promo?page_name=page_249) 、 [极客时间 VIP](https://time.geekbang.org/hybrid/next/svip/home) 超值福利，掌握前沿趋势。
5. 企业采购推荐使用“ [极客时间企业版](https://b.geekbang.org/?utm_source=geektime&utm_medium=columnintro&utm_campaign=newregister&gk_source=2021020901_gkcolumnintro_newregister) ”便捷安排员工学习计划，掌握团队学习仪表盘。
6. 戳此 [申请学生认证](https://time.geekbang.com/activity/promo?page_name=page_3471768093) ，订阅课程享受原价 5 折优惠。
7. 价格说明：划线价、订阅价为商品或服务的参考价，并非原价，该价格仅供参考。未划线价格为商品或服务的实时标价，具体成交价格根据商品或服务参加优惠活动，或使用优惠券、礼券、赠币等不同情形发生变化，最终实际成交价格以订单结算页价格为准。

![](https://static001.geekbang.org/static/time/img/ai.chat.ec0dcd23.gif)