#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
创建第一篇《为什么企业 AI 项目总是在 POC 后死掉？》的输入卡片。

用法：
  python3 create_input_cards_article_01.py --dry-run   # 预演，不创建文件
  python3 create_input_cards_article_01.py             # 正式创建
"""

import argparse
import os
from pathlib import Path

BASE_DIR = Path("/Users/xinran/Downloads/dev/mindsync/projects/content-matrix/accounts/墨予镜/cards/inputs")
DATE = "2026-08-27"

CARDS = [
    {
        "filename": f"{DATE}-fde-融入工作流.md",
        "title": "POC 死掉不是模型问题，是'没融入工作流'",
        "view": "MIT NANDA 研究称约 95% 的企业 GenAI 项目回报为零；IDC 称约 88% 的 AI 概念验证项目从未进入生产。失败原因不是模型不够聪明、数据不够或招不到人，而是工具'不学习、不留存反馈、不融入现有工作流'。",
        "source": "曹犟，《03｜为什么是现在：95% 的 AI 项目卡在落地，一个人却能跑通产品闭环-FDE 业务落地实战-极客时间.md》",
        "boundary": "适用于解释'demo 惊艳、上线无声'的企业级 AI 项目；数字本身有方法论争议，宜作方向性论据而非精确结论。",
        "misuse": "不能拿 95% 去论证'AI 没用'或'模型不行'——原文明确说失败的不在模型。",
        "usage": "开篇破题的核心数据与归因框架，直接回答'为什么总在 POC 后死掉'。"
    },
    {
        "filename": f"{DATE}-fde-交付才是胜负手.md",
        "title": "写代码不再稀缺，交付才是胜负手",
        "view": "AI 把'写代码'成本打下来了，但研发瓶颈下移到评审、测试、发布、集成。外部专业团队深度交付的项目部署成功率约是企业自建的两倍，关键在于有人'把技术翻译成业务结果'。",
        "source": "曹犟，《03｜为什么是现在：95% 的 AI 项目卡在落地-FDE 业务落地实战-极客时间.md》",
        "boundary": "适用于 To B 交付、AI 落地讨论；反直觉点在于'最懂业务的内部团队反而落地更差'，因为缺一个专门盯交付的角色。",
        "misuse": "不要引申成'内部团队不该做 AI'，而是'缺交付角色谁都落不了地'。",
        "usage": "解释 POC 死亡的结构性原因——瓶颈不在生成，在交付。"
    },
    {
        "filename": f"{DATE}-fde-先定义好.md",
        "title": "先定义'好'，再写第一行 Prompt",
        "view": "评估驱动开发：传统 PRD 写法对 AI 失效，'回答要准确'无法照做，只能落成可跑的用例。正确顺序是：和客户写下'好'的标准 → 构建评估集 → 搭 Harness → 才写 Prompt。评估集不是上线前的验收工序，而是开发迭代的方向盘。",
        "source": "曹犟，《11｜评估驱动开发：AI 项目到底怎么定义'好'、怎么验收？-FDE 业务落地实战-极客时间.md》",
        "boundary": "适用于 AI/Agent 项目的方法论层；文中引用 Vaughan 归因：88% POC 未走到生产，'败因多数不在模型不够强，而在 Harness 从来没搭起来'。",
        "misuse": "不要以为评估集是开工时冻结的文档——它要随开发持续迭代、与客户共建。",
        "usage": "给出'POC 之死'的第一解法——验收标准必须在写代码之前存在。"
    },
    {
        "filename": f"{DATE}-fde-demo赢的是资格.md",
        "title": "demo 赢的是资格，不是合同",
        "view": "a16z 判断：AI 产品从 demo 到可用产品的鸿沟比传统软件更宽——模型不是稳定依赖（一升级提示词和护栏都要重验），输出非确定（demo 可以挑好样本，生产是脏数据和长尾）。三条纪律：demo 阶段主动暴露长尾和脏数据；不跳过不产生新功能的'硬化'阶段（边界、监控、压测、回滚）；警惕 demo 债务。",
        "source": "曹犟，《08｜Demo-driven：一个能跑的 demo，为什么胜过一百页方案？-FDE 业务落地实战-极客时间.md》",
        "boundary": "适用于解释'POC 演示成功≠项目成功'；跳过硬化省下的时间，通常在六个月后系统第一次真正出故障时用信任加倍还回去。",
        "misuse": "把客户在 demo 上的点头当成验收；demo 的第一作用不是让客户说'哇塞'，而是让客户说'不对'。",
        "usage": "这是'POC 后死掉'最直接的机制解释——demo 债务与硬化缺失。"
    },
    {
        "filename": f"{DATE}-fde-上线边界写成清单.md",
        "title": "能跑 ≠ 能交付——上线边界必须写成清单",
        "view": "上线前必须把判断写成边界而不是口号：上线范围、高风险边界、验收证据、回滚条件、兜底策略、非目标。离线评测是门槛，灰度观察才是真实压力。最稳的表达是'具备有限灰度上线条件'，而不是'已经可以替代售后团队'。",
        "source": "《小哲电商Agent/项目故事线/45｜老板问能不能上线，你先把边界写清楚｜生产交付与上线边界.md》",
        "boundary": "适用于 Agent 类项目的交付表达；生产交付不是把功能包装得更漂亮，而是把责任边界写清楚。",
        "misuse": "把没做的能力说成已交付；否则 Agent 一进真实流量，你就从'做项目的人'变成'背事故的人'。",
        "usage": "给'怎么不死'部分一个工程化的落地样板。"
    },
    {
        "filename": f"{DATE}-fde-poc自带停止条件.md",
        "title": "POC 本身要自带停止条件",
        "view": "聊得愉快不是推进；真正的推进必须出现负责人、数据、范围、指标和时间。POC 一页纸必须写清：业务环节与使用者、输入输出与不包含的范围、数据与权限、双方负责人、时间边界、成功指标、不成功时何时停止、达标后的下一阶段。试点梯度：数据诊断 → 离线 demo → 单环节 POC → 小范围真实使用 → 指标达标后再扩展。",
        "source": "HA7CH-AI-Native-School，《references/lessons/executive-communication/03-from-interest-to-pilot.md》",
        "boundary": "适用于乙方/FDE 与企业一号位谈试点的阶段；缺少数据、指标、负责人或时间，就还没有真正推进。",
        "misuse": "没有停止条件的 POC 会变成无限期的免费试点，热情耗光后无声死亡——这正是'POC 后死掉'的另一半故事。",
        "usage": "写'怎么设计一个不会死的 POC'的开头段——死亡往往在设计 POC 那一刻就注定了。"
    },
    {
        "filename": f"{DATE}-prod-poc与生产是两件事.md",
        "title": "POC 与生产是两件完全不同的事",
        "view": "让 Agent 在 Demo 里跑起来可能只要几百行代码，但让它在生产环境活下去是另一件事。生产事故很少表现为'系统崩溃'，更常见的是'看似一切良好，但结果已悄然偏离'——接口返回 200、监控全绿，任务实际没完成。企业拼的不是模型排行榜分数，而是能否控制边界、解释行为、承受失败。",
        "source": "李号双，《00｜Agent 跑起来之后，真正的工程才刚开始-生产级 Agent 排雷实战》",
        "boundary": "适用于能修改数据、触发交易、代替用户行动的'执行型 Agent'；纯内容生成型应用的风险等级不同。",
        "misuse": "误以为'换个更强的模型'或'监控没报警'就等于生产就绪——模型更聪明解决不了系统级缺陷，绿灯监控也看不见静默失效。",
        "usage": "文章开篇的核心论点——POC 之死不是技术失败，而是把'跑起来'误当成'能上线'。"
    },
    {
        "filename": f"{DATE}-prod-终止权在系统.md",
        "title": "终止权必须留在系统手里",
        "view": "Agent 是循环，循环必须回答'什么时候停'。模型会'幻觉终止'（没做完却说做完了）或原地空转（同一工具调 847 次）。生产系统必须在模型之外设硬边界：最大步数、最大成本、最长时间、重复行为检测，以及独立的结果裁决机制（Maker/Checker 分离，校验模型点头才算完）。",
        "source": "李号双，《00》与《01｜用十倍速制造事故：Loop Engineering 的暗面-生产级 Agent 排雷实战》",
        "boundary": "所有无人值守或少人值守的 Agent Loop；交互式 Copilot 场景约束可放宽。",
        "misuse": "在 Prompt 里写'任务完成后停止'就当有了刹车——那只是请求，不是机制。",
        "usage": "解释 POC 期'演示时人工盯着所以没事'与生产期'无人值守必炸'之间的机制差距。"
    },
    {
        "filename": f"{DATE}-prod-模型提议者系统裁判.md",
        "title": "模型只是提议者，工程系统才是裁判",
        "view": "模型只负责'提出下一步做什么'，Loop 负责'判断能不能做、要不要做'。工具执行永远不是第一步，而是层层门禁（注册表强校验、权限上下文注入、高风险审批拦截）后的最后一步。模型不知道当前用户的权限，它会为了完成任务穷举路径——会'忠诚地越权'。",
        "source": "李号双，《01｜用十倍速制造事故：Loop Engineering 的暗面-生产级 Agent 排雷实战》",
        "boundary": "任何让 Agent 调用带副作用工具的系统；纯只读问答场景可简化。",
        "misuse": "把'模型选对了工具'当作安全依据；或在 Prompt 里约束'不要调危险工具'——语言约束挡不住概率。",
        "usage": "支撑'POC 死于权责错位'——企业把本该属于工程系统的裁决权误交给了概率模型。"
    },
    {
        "filename": f"{DATE}-prod-状态机与检查点.md",
        "title": "没有状态机与检查点的循环都是玩具",
        "view": "Anthropic 的公式：Agent System = 概率模型 + 确定性循环 + 持久化状态 + 故障恢复。裸 ReAct 只有前两项。生产要求显式状态机 + 关键节点原子写 Checkpoint。Checkpoint 不等于聊天记录——存聊天记录得重头理解，存执行位置+快照才能原地续跑。",
        "source": "李号双，《01》与《08｜蒙眼狂奔的 ReAct-生产级 Agent 排雷实战》",
        "boundary": "长任务、跨系统任务、任何不允许'从头再跑一遍'的任务。",
        "misuse": "while True + messages 列表就叫 Agent；把对话历史当状态——那是叙事，不是机械状态。",
        "usage": "解释为什么 POC 期'崩了就重跑'的心态到生产就是事故——恢复能力是 POC 清单上根本不存在的一行。"
    },
    {
        "filename": f"{DATE}-prod-计划外化为数据.md",
        "title": "计划必须外化为数据，不能藏在 CoT 里",
        "view": "ReAct 模式下计划隐藏在模型临时思维里，系统看不见。某步失败时系统没有'第几步'的概念，无法回滚到断点，只能任由模型'推倒重来'。Plan 一旦生成就不是模型的口水话，而是系统的核心数据：解析成结构化对象、加版本号和状态标记，模型只能'建议修改'不能'直接改写'。",
        "source": "李号双，《08｜蒙眼狂奔的 ReAct：为什么执行前看不到计划的 Agent 最危险？-生产级 Agent 排雷实战》",
        "boundary": "多步、带副作用、跨系统的复杂任务；6 步以内的多跳问答 ReAct 仍可用。",
        "misuse": "'ReAct 是论文里的经典范式所以直接上生产'——论文基准不考核磁盘 IO 打满和生产回滚。",
        "usage": "揭示一类隐蔽的 POC 死因——架构选型停留在论文范式，没有完成'从 CoT 到执行契约'的生产化改造。"
    },
    {
        "filename": f"{DATE}-prod-rbac挡不住Agent.md",
        "title": "RBAC 挡不住 Agent——每个动作合法，组合起来是事故",
        "view": "为人设计的 RBAC 只回答'这个角色能否对这个资源做这个操作'，管不到一次取多少条、参数是否越界、数据流向哪里。Agent 拿着合法只读权限把 user_id 从 1 遍历到 10000，再合法地发邮件外发——单点全合规，组合即泄露。思路要换：把 Agent 视为概率性执行单元——凭证以分钟计、任务级最小 Scope、显式条数频次上限、出站必过 DLP、秒级熔断吊销。",
        "source": "李号双，《11｜RBAC 挡不住 Agent：如何设计一个企业级 Agent 权限系统-生产级 Agent 排雷实战》",
        "boundary": "碰真实数据、接入企业核心系统的 Agent；沙盒演示环境无此需求——这正是 POC 测不出的原因。",
        "misuse": "'给 Agent 开个只读账号就安全了'；把 Agent 当虚拟员工走人的入职授权流程。",
        "usage": "安全/合规是企业放行上线的前置关卡——POC 死在'过不了的安审'，这张卡片给出根因与新授权范式。"
    },
    {
        "filename": f"{DATE}-codex-验收用例不收敛.md",
        "title": "POC 死亡的直接原因往往是「验收用例不收敛」",
        "view": "袁从德举了一个真实失败案例——AI 赋能客服业务，业务有标准 SOP，但 SOP 随新产品持续迭代，验收用例持续变化、无法收敛，直接导致需求始终无法上线。结论是：业务前期必须对齐业务目标与对象；在单条需求范围内，验收用例必须闭环收敛。",
        "source": "袁从德（AI 创业公司 CTO），《2026-08-17-Codex AI 工程交付行动营-8.17 直播｜从'会用 AI 写代码'到'能交付高质量工程项目'.md》",
        "boundary": "适用于业务规则本身在演化、验收方与执行方分离的企业项目；不适合需求本身稳定的工具型项目。",
        "misuse": "误以为'先把 Demo 做出来，验收标准后面再补'。验收标准后置 = 项目永远处于'快完成了'状态。",
        "usage": "可作为'POC 为什么死'的核心机制解释——死亡不是发生在技术验证环节，而是发生在验收标准永远无法锁死。"
    },
    {
        "filename": f"{DATE}-codex-模糊需求转可验收任务.md",
        "title": "把模糊需求转化为可验收任务，是 POC 走向生产的第一道工序",
        "view": "业务提出的很多需求本身是试探性、模糊的。AI-Native 工作模式的第一步，是把模糊诉求转化为'确定、可验证、具备量化验收指标的任务'，沉淀为 FDE_SPEC.md（目标、非目标、功能需求、验收标准），先完成问题定义、建立验收与评估标准、搭建反馈闭环，以此倒逼结果确定性。",
        "source": "袁从德，Codex AI 工程交付行动营 8.17 直播文件；交付物清单见《Codex AI 工程交付行动营-常见问题.md》Q3。",
        "boundary": "适用于需求来自业务方、目标含混的企业场景；个人玩具项目不需要这么重。",
        "misuse": "把 Spec 当成形式主义文档，写完就扔；Spec 的价值在于它是验收的裁判，不是给领导看的 PPT。",
        "usage": "支撑'POC 与生产之间缺的不是代码，是一份双方签字的验收契约'这一论点。"
    },
    {
        "filename": f"{DATE}-codex-质量门自动拦截.md",
        "title": "质量门的本质是把「人工兜底」升级为「自动拦截 + 证据留存」",
        "view": "第二周 Harness 的核心动作：搭建 Quality Gate，先建立缺陷基线，同时校验业务结果与工程约束；变更通过则输出 report.json 质量报告，失败则阻断流程，让不合格变更自动拦截、合格变更留存完整证据。针对的痛点是'大模型改代码容易引发连锁缺陷'。",
        "source": "袁从德，Codex AI 工程交付行动营 8.17 直播文件。",
        "boundary": "适用于 AI 高频修改真实仓库、变更量超出人工 review 能力的场景；变更极少的小项目人工兜底即可。",
        "misuse": "以为质量门就是跑一遍单元测试。它还包括业务结果校验、风险汇总、审计痕迹留存，并且失败要自动生成 repair_task 而非假装成功。",
        "usage": "解释'POC 能跑'和'生产敢上'之间的鸿沟——缺的是可复现的质量证据链，report.json 式的证据才是说服业务和运维放行上线的货币。"
    },
    {
        "filename": f"{DATE}-codex-验收标准可复现.md",
        "title": "一次性 Demo 与可持续工程系统的分水岭是「验收标准是否可复现」",
        "view": "结业作品的验收标准是：可在干净环境启动、成功与失败场景均可演示、运行结果可导出、反馈样本可写入沉淀——'我们不做仅供课堂演示的一次性 Demo，目标产出可以持续扩展的工程系统'。",
        "source": "袁从德，Codex AI 工程交付行动营 8.17 直播文件。",
        "boundary": "适用于评估任何 AI 交付物是否'可交接'；不适用于探索性研究。",
        "misuse": "把'在我机器上能跑'当作交付完成；把演示视频当作验收。",
        "usage": "可直接改造为文章中的'POC 验收清单'，回答'什么样的 POC 才配谈转正'。"
    },
    {
        "filename": f"{DATE}-codex-保证质量的是体系.md",
        "title": "保证质量的不是 AI，是体系",
        "view": "Robert 明确反驳'写好 SDD 扔给 AI，一晚上搞定整个项目'的说法：做不到，至少现在做不到。这句话偷换了概念——保证代码质量的不是 AI，是体系，AI 只是体系的执行者。AI 不会主动质疑自己的安全模型、不会想到权限校验漏洞、不会考虑并发一致性。正确姿势是人来识别核心链路、划定测试边界、制定 review 策略，AI 在体系内执行。",
        "source": "Robert，《2026-04-01-Claude Code 企业级全链路开发实战/27｜AI 写代码，保证质量不靠运气，靠体系-….md》",
        "boundary": "适用于企业级项目的质量责任划分；不代表 AI 不能承担大比例执行工作（文中 80% 代码放手给 AI）。",
        "misuse": "两个极端——完全不信 AI，或完全放养 AI。Anthropic 敢让 AI 写全部代码的前提是工程师只 review 且背后有完整体系。",
        "usage": "可作为文章的核心反直觉判断：POC 死于'把体系的责任误当成了模型的能力'。"
    },
    {
        "filename": f"{DATE}-codex-sdd想清楚harness做对.md",
        "title": "SDD 解决'想清楚'，Harness 解决'做对'——两者缺一，AI 项目都无法穿越 POC",
        "view": "企业真正需要的是能把 AI 编程做成'可控、可验收、可复用工程流程'的人。两大支柱：SDD 解决'想清楚'（规格是真理，代码服务于规格），Harness Engineering 解决'做对'（System Prompt / Tools / Context / Subagents 四支柱）；constitution.md 则把工程原则变成 AI 必须遵守的硬约束。且方法论与工具解耦——各类 AI IDE 底层比拼的都是 Harness 能力。",
        "source": "《2026-07-16-年企业级AI编程实战营/极客时间训练营-企业级 AI 编程实战营.md》",
        "boundary": "适用于评估团队 AI 工程能力建设；不适用于为选工具站台。",
        "misuse": "以为买了某个工具/模型就解决了交付问题。",
        "usage": "可作为文章结尾的建设性框架——POC 不死的路径 = Spec（想清楚）+ Harness（做对）。"
    },
    {
        "filename": f"{DATE}-harness-三大失控.md",
        "title": "POC 死于'三大失控'，而不是模型不行",
        "view": "基于框架拼凑的 Agent Demo 能跑通，但进入长周期生产环境会被三类摩擦力杀死——上下文失控（工具描述稀释注意力导致降智）、状态失控（黑盒状态机里的健忘症与死循环，人类无法中途介入）、边界失控（没有物理拦截，模型一次幻觉就是灾难）。",
        "source": "Tony Bai，《从 0 开始构建 Agent Harness/00｜框架正在坍塌：像写操作系统一样，复刻 OpenClaw 的底层 Harness-…-极客时间.md》",
        "boundary": "适用于解释'为什么 Demo 能跑、生产会死'的根因分析；针对的是长周期、真实任务场景。",
        "misuse": "误以为解法是'换更强的模型'或'再改改 Prompt'——课程明确指出堆砌 Prompt 和上层框架永远无法解决这三类失控。",
        "usage": "可作为文章第一部分'POC 后死掉的病理切片'的分析框架，把'死掉'拆成三个可命名的死因。"
    },
    {
        "filename": f"{DATE}-harness-状态外部化.md",
        "title": "状态外部化——把记忆从黑盒变成肉眼可见的 Markdown",
        "view": "与其在内存里维护复杂状态机或上向量库，不如强制 Agent 把规划写进 PLAN.md、进度写进 TODO.md。换来四样东西：绝对透明可观测、零成本人机协同（人直接改文件纠偏）、断电/崩溃后的断点续传、节省 Context 内存。黑盒状态是人类无法介入的根源，文件化状态让 Agent 重启后'瞬间清醒'。",
        "source": "Tony Bai，《从 0 开始构建 Agent Harness/13｜记忆沉淀：状态外部化，基于文件系统的持久化记忆与待办管理-…-极客时间.md》",
        "boundary": "适用于长程任务与 Plan Mode；简单查询类任务强制写 PLAN.md 是浪费 Token 的'官僚主义'。",
        "misuse": "认为状态外部化=LOW/简陋；课程称这是 OpenClaw 的'神来之笔'。",
        "usage": "文章'解药'部分的核心一招——POC 项目的状态锁在黑盒里，是它无法被调试、无法被接管、无法跨会话存活的直接原因。"
    },
    {
        "filename": f"{DATE}-harness-护栏是工程硬拦截.md",
        "title": "安全不能依赖模型的理智，护栏必须是模型之外的工程硬拦截",
        "view": "安全性绝对不能依赖大模型的'理智'，也不能寄希望于 System Prompt 里的'千万别删库'。必须在工具执行前的统一拦截点（Middleware/Interceptor）做物理拦截：allow/ask/deny 三态控制，高危命令挂起协程、走人工审批。本地可 YOLO+沙箱换效率，生产环境必须上权限体系。",
        "source": "Tony Bai，《从 0 开始构建 Agent Harness/16｜防御纵深：利用 Middleware 实现高危命令拦截与飞书人工审批-…-极客时间.md》；邢云阳《Harness Agent 脚手架实战课/18｜进阶：拦截管道构建合同敏感信息的多层安全护栏-…-极客时间.md》",
        "boundary": "凡 Agent 有改变物理世界权限（写文件、执行命令、外发数据）的场景。",
        "misuse": "把护栏写成散落在各工具内部的 if 判断（污染业务逻辑）；或只做正则黑名单单层防护。",
        "usage": "回答'POC 不敢上线'的合规与安全恐惧——恐惧的解法不是不上线，而是把防线建在模型之外。"
    },
    {
        "filename": f"{DATE}-harness-评估是分水岭.md",
        "title": "评估是 Harness 与玩具的分水岭——告别'聊几句感觉还行'",
        "view": "改了压缩阈值或 AGENTS.md 后，如何向老板证明 Agent 变聪明了？'改完聊几句看看感觉'的玄学测试让引擎永远无法走向工业级。要借鉴 SWE-bench 的 Test-Driven Evaluation：Agent 说自己修好了不算数，跑验证脚本（Fail-to-Pass）才算数，再结合成本/耗时/轮数打综合分；评估应嵌入 CI/CD，每次 Prompt/工具/模型变更自动跑分对比基线。",
        "source": "Tony Bai，《从 0 开始构建 Agent Harness/20｜科学度量：如何构建 Benchmark 自动化评估脚本…-…-极客时间.md》",
        "boundary": "结果评估（pass/fail）易自动化但暴露不了效率差异；开放任务需 LLM-as-Judge/轨迹评估。",
        "misuse": "只看最终结果不看轨迹——两个 Agent 都修好了 Bug，一个走 3 步一个走 20 步，结果评估无从区分。",
        "usage": "文章最硬的一张牌——'没有评估体系，POC 的成功标准本身就是模糊的，项目自然死在说不清有没有用上'。"
    },
    {
        "filename": f"{DATE}-harness-一次性到可重复.md",
        "title": "Harness 把一次性 Prompt 变成可重复系统——操控循环四要素",
        "view": "同一个模型、同一个任务、同一句提示词，裸跑 20 分钟产出不可用，加上多 Agent Harness（规划/生成/验收）6 小时功能完全可用（Anthropic 对照实验）。Harness 的内层是操控循环：前馈（Guides）+ 行动 + 反馈（Sensors）+ 调整；缺一不可——只有反馈会重复犯错，只有前馈会草率收工。",
        "source": "徐昊《Agent 驾驭工程之美/00｜驾驭工程：Agent 时代必修课-…-极客时间.md》、《01｜操控循环：驾驭工程的核心框架-…-极客时间.md》",
        "boundary": "上下文明确的单一子任务可靠前馈+约束一次生成，不必拆 PDCA。",
        "misuse": "把 Harness 理解成'更详细的提示词'——指令子系统是优先级高于用户输入的'Agent 宪法'，是硬约束而非建议。",
        "usage": "提供文章的理论支柱：POC 是'一次性任务'的产物，生产需要'可重复系统'；Anthropic 实验是现成的引用素材。"
    },
    {
        "filename": f"{DATE}-harness-可回放是自改进地基.md",
        "title": "模型所见必须等效于日志记录——可回放是自改进与追责的地基",
        "view": "DeepSeek Harness 的铁律'Model-visible means logged'：任何进入模型请求的内容都必须能从 append-only 会话日志完整重建。一次运行就是一条可回放、可追溯的飞行轨迹，出事故能还原现场。而'AI 自进化'落到工程上不是一句'变得更聪明'，而是可观测、验证和控制的改进闭环：记录轨迹、发现异常、生成候选、评测确认、持久化生效。",
        "source": "张嘉熙《DeepSeek Harness 前沿工程实践/00｜生逢其时：AI 自进化浪潮下的 DeepSeek Harness-…-极客时间.md》",
        "boundary": "适用于需要持续运营、持续改进的 Agent 系统；一次性脚本不需要。",
        "misuse": "把'能改自己'当自进化——没有可观测与评测确认环节的自动修改是失控，不是进化。",
        "usage": "用于文章收尾部分'POC 之后的活法'：从一次性交付转向'可观测—可评估—可改进'的持续运营闭环。"
    },
]


def create_cards(dry_run: bool = False):
    BASE_DIR.mkdir(parents=True, exist_ok=True)
    created = []
    skipped = []

    for card in CARDS:
        path = BASE_DIR / card["filename"]
        content = f"""# {card['title']}

## 观点
{card['view']}

## 来源
{card['source']}

## 边界
{card['boundary']}

## 反例 / 误用
{card['misuse']}

## 对第一篇的用处
{card['usage']}
"""
        if path.exists():
            skipped.append(path.name)
            continue

        if dry_run:
            print(f"[DRY-RUN] 将创建: {path}")
        else:
            path.write_text(content, encoding="utf-8")
            created.append(path.name)

    if dry_run:
        print(f"\n预演完成。将创建 {len(CARDS) - len(skipped)} 个文件，跳过 {len(skipped)} 个已存在文件。")
    else:
        print(f"创建完成：{len(created)} 个文件")
        if skipped:
            print(f"已跳过（已存在）：{len(skipped)} 个文件")
        for name in created:
            print(f"  - {name}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="创建第一篇输入卡片")
    parser.add_argument("--dry-run", action="store_true", help="预演，不创建文件")
    args = parser.parse_args()
    create_cards(dry_run=args.dry_run)
