AI 编程正在从“个人提效”进入“企业级落地”阶段

![](https://static001.geekbang.org/resource/image/4d/6f/4d9f92ed4e85b1124a07b4c720855a6f.png)

很多人用 AI 编程，都在踩这些坑

![](https://static001.geekbang.org/resource/image/e1/4e/e1b562b350f4e8574ef55785f92a7f4e.png)

企业真正需要的， 是能把 AI 编程做成可控、可验收、可复用工程流程的人

![](https://static001.geekbang.org/resource/image/16/49/1630eda5da73a798306f775235cc9649.png)

11 周，用 AI 编程做成企业级项目

![](https://static001.geekbang.org/resource/image/da/34/da91d15d8c0d153b10b618084dd08834.png)

一条主线，把 AI 编程工程化练透： 3 大企业级实战项目 + 1 次真实开源 PR 实战

![](https://static001.geekbang.org/resource/image/fd/ae/fd86d7f21ee65aab140d41c955ae30ae.png)
- 实战项目一：AI 智能体操作系统（从零造一个系统底座）
- 实战项目二：分布式延时投递服务（从零写自己的代码）
- 实战项目三：Dify 平台二次开发（改别人的开源代码）
- 收官挑战：开源项目实战（贡献到真实开源项目）

- ## 开篇总论
	- 第 1 周：课程学习导航
		- 照一面镜子：看清楚“会用 AI”和“驾驭 AI”的真实差距在哪。
		- 亲手跑出第一个成功体验：用 Spec-Kit 跑通一个真实任务，当天就能感受到差距。
		- 建立 10 周地图：知道每一周会学什么、每一个工具在哪一周点亮。
		- 在自己公司项目上完成第一次 Harness 四支柱起手，带着真实感受进入项目实战。
	- 知识点：
		- 第一个成功体验
			- 一个真实任务，两种姿势的对比演示。
				- 普通姿势：把需求直接扔给 AI，来回改，最后不确定能不能用。
						- 驾驭姿势：先 spec，再 plan，再 implement，每一步可控，结果可预期。
						- 演示同一个任务的两种做法，时间对比、质量对比、心理状态对比。
				- 驾驭的定义：主动权在你手里，AI 在你的框架下执行。
				- Spec-Kit 工具实战：/specify → /plan → /tasks → /implement 四阶段工作流。
				- 演示：跑一遍 Spec-Kit hello world，从一句话需求到可执行任务列表。
		- 训练营工具学习地图 + 方法论体系
			- 把 Claude Code 完整能力地图做成一个可视化的进度表。
				- 每一个工具标注在哪一周第一次用、在哪个项目里深入。
						- CLAUDE.md / AGENTS.md → 第 1 周起手，第 2 周 OryxOS 深化。
						- Skills / Slash Commands → 第 1 周配置，第 3 周 OryxOS 开发里复用。
						- Subagents / Worktrees → 第 3 周 OryxOS 开发第一周正式上手。
						- Hooks / Permission → 第 4 周 OryxOS 安全网。
						- Headless / MCP → 第 8 周 When 收尾、第 9 周 DifyPro。
						- OpenSpec / delta spec → 第 9 周 DifyPro 改造。
						- gh CLI → 第 11 周 mq9 开源贡献。
				- AI 编程工具选型：Claude Code（主用）/ Codex / OpenCode / Cursor / Copilot。
				- SDD + Harness Engineering，为什么是这两个。
				- SDD 解决“想清楚”：规格是真理，代码服务于规格。
						- Harness Engineering 解决“做对”：四支柱（System Prompt / Tools / Context / Subagents）。
						- 两者合起来：SDD 让 AI 知道做什么，Harness 让 AI 做对——这才是完整的驾驭。
				- 其他方法论（Vibe Coding / Context Engineering）的位置：Vibe Coding 是姿态，Context Engineering 是下一层。
				- Harness Engineering 四支柱简介。
		- Harness 起手
			- 在自己的项目上完成第一次 Harness 起手。
				- System Prompt：写第一份 CLAUDE.md，把项目背景、技术栈、工程规范写进去。
						- Tools：配第一个 Skill（选一个你最常重复的操作）+ 第一个 Slash Command。
						- Context：用 Plan Mode 让 AI 先规划再动手——演示一次不可逆操作前先 plan 的价值。
						- Subagents：调一次并行子代理，感受“多个 AI 同时干活”是什么感觉。
				- constitution.md 的概念引入：把工程原则变成 AI 必须遵守的硬约束。
				- CLAUDE.md vs AGENTS.md：为什么要有两个，工具中立性是什么意思。
		- 训练营路径预告
			- 四个项目的核心训练各是什么。
				- OryxOS：系统级项目全流程，从需求到上线，SDD + Harness 最完整的一次。
						- When：0→1 分布式系统，Subagents 并行实现的主场。
						- DifyPro：大型陌生项目改造，AI 反推整体逻辑的主场。
						- mq9：真实开源贡献，跨语言 Vibe Coding 的主场。
		- 学员课后任务
			- 必做：跑通 Spec-Kit hello world（选自己手边一个真实小任务，跑完 /specify → /plan → /tasks → /implement，不要用假设需求）。
				- 必做：在自己的项目里完成 Harness 四支柱起手（写 CLAUDE.md + 配一个 Skill + 用一次 Plan Mode + 调一次 Subagent）。
				- 必做：在自己机器上配好 Claude Code + Spec-Kit + OpenSpec 的完整环境。
				- 思考：跑完 Spec-Kit 之后，和你之前直接扔需求给 AI 的做法，最大的差距是什么？
				- 进阶：写自己第一份 constitution.md（基于自己当前的项目，把你最在意的工程原则写进去）。
- ## 项目一oryx-labs/oryxos：用 SDD 做 AI 智能体操作系统
- ## 项目二oryx-labs/when：用 SDD 从 0 到 1 做分布式延时投递服务
- ## 项目三oryx-labs/difypro：用 AI 反推整体逻辑给 Dify 做企业级二开
- ## 项目四mq9：跨语言开源 PR 实战 + 长期成长

戳此领取大纲

学完你将带走

![](https://static001.geekbang.org/resource/image/23/85/2385f85438c5c2e4a2e642bbd3054385.png)

深耕一线开发 10 +年，大厂技术专家带你做真实项目

![](https://static001.geekbang.org/resource/image/5d/d2/5dc5c0825dcd383443ce6bab397e41d2.png)

来自一线实干家的口碑

![](https://static001.geekbang.org/resource/image/0f/a6/0f2d3eb7f799a0f3340e85c5541e03a6.png)

适合想把 AI 编程真正用到企业项目中的工程师

![](https://static001.geekbang.org/resource/image/c7/c3/c7393c906f0dbb34afd8afc7322db0c3.png)

全方位学习服务，让你学会并学有所成

![](https://static001.geekbang.org/resource/image/47/08/477a876d3b74af5d7f00f6b184ddd308.png)

为什么选择我们？

![](https://static001.geekbang.org/resource/image/f4/f7/f4d8d5d30352d735682cb3bd088a30f7.png)

免费学习资料

![](https://static001.geekbang.org/resource/image/ec/d9/ecf9aef5df7f8181b94d30ab441c75d9.png)

戳此免费领取

** 微信咨询

![](https://static001.geekbang.org/resource/image/6e/ab/6e7ae907805333921afd857a5b41d0ab.png)

** 在线咨询

** 电话咨询

##### 联系电话：13372878317

** 微信联系我们 ![](https://static001.geekbang.org/resource/image/6e/ab/6e7ae907805333921afd857a5b41d0ab.png)

2026年7月16日

第1期已开班

2026年9月10日

第2期开放报名

**