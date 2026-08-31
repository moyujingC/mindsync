8.17 直播｜从“会用 AI 写代码”到“能交付高质量工程项目”

当前播放: 8.17 直播｜从“会用 AI 写代码”到“能交付高质量工程项目”

00:17 / 56:39

高清

1.0x

关闭知识点

开启画中画

音量

网页全屏

全屏

00:00

- 00:10 Codex AI 工程交付行动营介绍
- 02:57 AI Native 的工作模式
- 06:10 四周课程内容概述
- 11:35 课程目标与成果
- 18:08 需求管理与代码质量控制

> 本文由 AI 基于讲师直播内容进行提炼与结构化整理，助你更高效地获取核心观点与关键信息。如需了解更完整的分享内容和上下文细节，请观看完整直播回放。

各位晚上好，我是袁从德，现任 AI 创业公司 CTO，也是《Codex 快速入门》一书的作者。今天给大家分享 Codex AI 工程交付行动营，核心主题：从会用 AI 写代码，走向交付高质量工程项目。整个行动营将实践 FDE 这套方法论，用 4 周时间，完成一套可运行、可验收、能够持续迭代使用的研发自动化工作台。

## 重新校准 AI‑Native 的定义

当下 AI‑Native 是行业热点，但落地实践当中，我们会遇到不少现实阻碍。大量使用 AI 工具，并不等同于实现了 AI‑Native。

有几种很常见的误区：

1. 通晓各类模型概念与技术名词，从 POM、Context、Skills，再到 Agent、Harness、Loop、Graph，对热点术语如数家珍，却依然难以端到端解决真实业务问题，只能反复试错，带来大量 Token 消耗。
2. 堆砌 Agent 与复杂流程，并不会必然产出更好的结果。
3. 凡事优先调用 AI，在 AI 能力尚有边界的现状下，缺少专业独立判断，会带来潜在风险。

以上这些，仅仅属于 AI 的使用痕迹，并不是真正的 AI‑Native。

真正的 AI‑Native，核心是顺应 AI 带来的能力变革，重构更加合理的工作模式，并且对最终业务结果负责。它包含五个核心要点：

1. 从工作本身出发。拿到需求与项目，首先厘清这项工作真正要交付的产出是什么。
2. 看清成本与能力边界。识别 AI 能够改写的工作环节，同时认清它的能力上限与使用成本。
3. 重新设计工作方式。不要被旧的工作流程束缚，旧流程不一定适配 AI 时代，需要重新求解最优实现路径。这也是 Harness 的核心价值：聚焦真实诉求与结果把控，而不是拘泥原有流程是否形式合规。
4. 放大专业判断。借助 AI 放大我们对于业务问题、用户诉求、项目风险与质量标准的理解。
5. 对最终结果负责。依靠验收标准、客观证据和反馈闭环，验证新工作模式的价值。

我们的 Codex × FDE 训练，就是带大家完整走完这套工作范式。

这里还要提到专家需要完成的认知卸载（Unlearn）：不是降低质量标准，而是放弃旧有的确定性来源。过去我们依靠过程确定性获得安全感，要求每一步操作都正确无误。但引入 AI 之后，原有过程的合理性需要重新审视。我们需要做确定性的位置迁移：从关注每一步过程正确，转变为关注终点与证据正确。

我们要先完成问题定义，建立验收与评估标准，搭建反馈闭环，形成完整证据链，以此倒逼结果确定性。这就要求专业能力完成迁移，实现可扩展的责任机制：由 Agent 完成执行与返工，按照风险等级设置人工审核。在当前阶段，人依然是整个研发链路中至关重要的决策节点。

## 课程整体设计：四周主线，解决四大落地断点

前面我们讲到，要从过程确定性转向结果确定性。在真实工程落地里，这件事会遇到四个典型断点，正好对应我们四周课程的主线。

**第一周 SPEC：把模糊需求转化为可验收任务**

业务提出的很多需求本身是试探性、模糊的。AI‑Native 的工作模式，就是要把模糊的诉求转化为确定、可验证、具备量化验收指标的任务，产出 FDE\_SPEC.md，得到版本 V0。

**第二周 Harness：从人工兜底升级为自动质量门**

搭建 Harness 质量体系，建立自动质量门禁，产出 report.json，得到版本 V1，让不合格变更自动拦截，合格变更留存完整证据。

**第三周 Loop + Graph：解决修复与协作失控问题**

大型项目中，大模型修改一处代码，很容易间接引发其他模块故障。传统依靠大规模测试集回归的手段，受限于模型上下文能力，存在局限。我们要定义修复边界，实现有界修复与可控多 Agent 协作，产出 repair\_task.json、state.json，得到版本 V2。

**第四周 Product：将 Demo 迭代为可持续运行的工作台**

把前三周形成的演示原型，升级成可以持续使用的产品化工作台，对外提供 API 与 Web 界面，得到版本 V3。

整套训练，在同一套工作台中完整跑通 SPEC - Harness ‑ Loop + Graph ‑ Product 全链路。

完成四周学习后，大家会沉淀五项可验收资产：

1. 需求结构化：需求拥有清晰目标、边界与验收标准，沉淀 FDE\_SPEC.md；
2. 质量证据化：依靠 Eval 与 Harness 输出质量报告 report.json，完成可复现验收；
3. 修复协作有边界：通过 Loop 限制修复轮次，Graph 编排协作与人审流程；
4. 过程可观测：通过 API、Web 界面追踪项目全流程状态，留存 state.json；
5. 经验可沉淀：把反馈样本归档，反哺下一轮迭代。

最终收获一套可以直接迁移到真实业务当中的工程骨架。

现实当中 AI 工具能力很强，但业务提效往往不及预期。很多研发时间并没有消耗在写代码上，而是反复对齐需求、确认边界。AI 时代最忌讳边界模糊的探索式开发：AI 可以很短时间完成一套错误需求的开发，后续反复回滚修改，会不断污染主干代码，造成项目架构混乱。

所以这套课程不只是教授 AI 编码技巧，更是要打造适配 AI 时代的研发工作流，甚至反向推动组织工作模式迭代。生产力升级的同时，生产关系也需要同步适配。

## 项目实践：研发自动化工作台

完成全部训练，你将搭建一台从需求输入一直到反馈沉淀的研发自动化工作台。链路完整流程：输入业务需求 → Spec 定义目标、约束、验收用例 → Codex 完成仓库解析、代码修改、自测、风险汇总 → Harness 执行评估复验，失败自动生成修复任务 → 人工审核、状态流转、输出反馈。

结业作品有明确验收标准：可在干净环境启动；成功、失败场景均可演示；运行结果可导出；反馈样本可写入沉淀。我们不做仅供课堂演示的一次性 Demo，目标产出可以持续扩展的工程系统。后续接到新业务需求，可以直接复用这套链路开工。

举一个过往实践案例：AI 赋能客服业务，业务有标准 SOP，但 SOP 会跟随新产品持续迭代，验收用例持续变化、无法收敛，直接导致需求始终无法上线。这件事告诉我们：业务前期，必须对齐业务目标与对象；在单条需求范围内，验收用例必须闭环收敛。Harness 体系的构建，前提就是一套明确的验收用例。

同时，人工审核不能只放在项目最终验收环节。如果等到交付阶段才发现问题，修复成本极高。我们需要全流程监控，获取中间节点反馈，多方角色提前介入。整套链路追求可验证、可追踪、可迁移。

课程重点传授可迁移的完整工作流程，而不是死记概念，也不是绑定某一套固定案例。这套流程不局限于 Codex，可以迁移到 Trae、Proauto、WorkBuddy、CloudCode 等各类 AI 开发工具。各类 AI IDE 基座模型各有强弱，但底层比拼的都是 Harness 能力；如何让流程可控、实现质量与效率平衡，这套方法论可以通用，对大型项目尤为关键。

**第一周：把需求转化为可执行任务**

本周目标：让 Codex 依据规则，完成一次可验收的代码变更。包含 4 讲内容以及项目诊所，核心解决两个问题：我们要做什么，以及怎么做才算完成。学习内容包含读懂仓库结构、运行命令、识别风险；编写 AGENTS.md 定义 Agent 行为规则；生成包含目标、约束、验收条件的 Spec 文档；执行代码变更。本周完成标准：变更可运行、基础测试通过、风险可追踪、密钥不会提交入库。

这一周的训练，本质不只是练习工具操作，更是训练需求辨别能力，倒逼上游产品、运营输出高质量 PRD。如果需求本身模糊，再强大的大模型也无法产出可靠结果。第一周，我们重点解决需求可控化的问题。

**第二周：搭建自动质量门禁**

解决大模型改代码容易引发连锁缺陷的痛点：自动拦截不合格变更，合格变更完整留存审计痕迹。我们会搭建一套本地、远程环境复用的质量入口，也就是 Quality Gate 质量门。先建立缺陷基线，同时校验业务结果与工程约束；变更通过则输出 Harness 报告，失败则阻断流程，从源头把控代码质量。第一周搞定需求，第二周完成代码质量自动化管控。

**第三周：驾驭多 Agent，实现可控协作**

多 Agent 协同会遇到一系列现实问题：并行修改是否产生写入冲突？失败是否留存证据？什么场景必须触发人工审核？边界优先于并行。

1. 并行处理（PARALLEL）：仅在写集互不重叠的前提下开启并行。不同 Agent 分别做测试补全、风险审查，由主 Agent 汇总结果；一旦出现写入冲突，切换为串行执行。
2. 修复循环（REPAIR LOOP）：只针对失败项执行修复，定义失败标准，生成 repair\_task.json 修复任务，交由 Codex 执行，再交由 Eval 复验；设置最大修复轮次，避免无限循环消耗 Token；无进展、Token 或时间耗尽时安全退出，不强行宣称任务成功。
3. 人工闸门（HUMAN GATE）：写入冲突、高风险改动、迭代无进展、预算耗尽，都必须进入人工审核。由人批准或者打回、缩小范围，审核结论写入 state.json。

简单总结：并行依靠写入边界约束；循环依靠 Eval 评估实现停止；高风险决策交给人兜底。Graph 承担路由调度的职责，综合写入边界、Eval 结果、Token 预算，决定下一步动作。

**第四周：链路产品化，交付可用工作台**

把代码仓库升级为可演示、可持续迭代的工作台。实现 API 提交任务、查询状态；Web 界面可视化展示阶段、失败原因、报告产出；数据持久化保证重启后状态可查询；支持证据导出、样本沉淀反馈。完成从代码仓库到可演示产品的跃迁。

课程会以电商 ERP 作为贯穿全程的实践项目。很多人认为 ERP 只是简单 CRUD 增删改查，实际上 CRUD 只是实现手段，ERP 核心价值是把业务理解转化成可落地、可验证的管理流程。我们课程聚焦电商进销存与账务模块。每周的学习，不是单纯看直播听课，而是交付一个可验收版本。每一周我们只聚焦三件事：解决什么问题，沉淀什么资产，过关标准是什么。

课程全部配套资产会沉淀进项目仓库，包含 workbench 工作台源码、规则文档、质量评估套件、多 Agent 协作骨架、服务化部署代码，配套还有目标卡、命令卡、验收卡、错误清单、V0‑V3 版本标签。

大模型工具、各类技术名词会持续迭代淘汰，但研发的基础流程短时间不会发生大的变化。模型只是发动机，生产级 Agent，需要五层完整系统支撑：

1. Context 可读层：仓库内版本化知识，包含 AGENTS.md、Spec、Schema、计划，保障 Agent 可以检索业务与代码背景；
2. Execution 执行层：仓库理解、代码修改、自测验证、委托子 Agent 执行；
3. Control 可控层：定义成功标准、阻断失败、限制迭代轮次、保留人工决策，由 Eval、Harness、Loop、Graph 实现；
4. Connection 对接层：资源、提示词、工具做权限与授权隔离，对接 MCP 各类资源；
5. Observability 可观测层：状态、失败原因、消耗成本全部可查询复盘，依靠日志、链路追踪、指标、状态文件实现。

同时形成 FDE 飞轮：现场反馈沉淀为仓库规则与评估用例，持续迭代产品能力。

整套训练营不只是 16 节精讲视频，是完整训练机制：同一个项目持续递进；精讲搭配实战任务；开设项目诊所直播纠偏；提供配套视频、社群答疑、完整代码仓库，形成课前‑课中‑课后完整学习闭环。

## 谁适合参与行动营

课程适配的核心不是岗位，而是交付责任。

- 研发、测试、架构人员：AI 已经可以修改真实仓库，但质量高度依赖人工审核。课程学习 Spec、Eval、Harness，实现变更可复验、自动阻断风险，可携带自己的真实仓库参与训练。
- 产品、解决方案人员：可以用 AI 快速产出 Demo，但缺少交付证据。课程打通需求‑编码‑验证完整交付链路，要求具备读改代码能力，可以亲自验收项目。
- 独立开发者、创业者：能够完成单点功能，但难以持续迭代维护。通过 Loop、Graph、API/Web 打造持续运行的工作台，完成四周完整作品迭代。

**共同前提：** 愿意动手运行命令、阅读失败报告、严格按照验收标准推进，不只是收藏 Prompt。

### 基础门槛

不需要提前掌握 Agent 相关知识，但是需要：

- 可以阅读、修改小型代码片段；
- 会使用命令行与 Git；
- Python3.10+ 环境，搭配 Codex（或其他同类 AI 客户端）；
- 课前自测：克隆仓库、修改一行代码、运行测试、提交 Git。
- 测试、CI/CD 可以跟着模板学习；企业代理、私有 CI 环境的特殊问题，会在项目诊所个案处理。

### 报名前确认三个现实问题

1. 基础能否跟上？大模型抹平了很多传统知识壁垒，这套方法论核心考验逻辑与描述能力，能讲清楚业务目标、讲清楚验收标准即可，不需要精通底层实现。课前自测可以帮大家确认适配度。
2. 每周如何完成学习？围绕电商 ERP 统一项目持续迭代，每周有明确任务与版本验收，核心要求动手实操，只看视频无法获得收益。
3. 企业环境能否运行？全部代码开源，企业私有环境遇到的网络、权限问题，个案处理。

> 不适合只想收集 Prompt，不愿动手执行命令、拒绝验收标准的同学。

## 常见问答

**Q：课程可以做多智能体项目吗？**

A：课程会带着大家完整完成基于多智能体的 ERP 项目，全部配套动手实践，脱离实操空谈概念没有意义。

**Q：这套 AI 方法论会不会过时？Codex 工具会不会过时？**

A：底层研发流程方法论具备长期价值，近 1‑2 年不会发生本质改变；但具体工具会迭代更替，Codex 未来也有可能被其他产品替代。我们课程训练的是需求拆解、目标定义、验收、边界管控这些通用工程能力，不绑定某一款工具。

**Q：和《Codex 快速入门》书籍有什么区别？**

A：书籍偏向企业级大团队协同，Codex 相关内容扎实，方法论可以迁移到各类 AI 开发平台。课程是实战训练营，完整走完从需求到交付全流程，产出可运行的项目作品。现在行业各类 AI 开发工具底层能力比拼的核心就是 Harness 体系，这也是课程重点训练内容。

**Q：ERP 范围很大，课程聚焦哪些模块？**

A：聚焦电商进销存与账务财务模块。不侧重基础 CRUD 写法，重点训练需求评估、验证集构建、边界管控、Loop 与 Graph 落地。课程重心是 FDE 整套工程范式，不会花大量时间讲解 Codex 软件按钮操作。

**Q：可以适配 DeepSeek Harness 这类工具吗？**

A：方法论和具体工具解耦。无论使用 Codex、Cursor、Cline 还是 DeepSeek Harness，都需要做需求拆解。工具只影响开发效率，不改变整套研发流程；最终效果更多取决于基座模型本身的能力上限，同时也要考量实际业务的 ROI。

**Q：学习完是否可以求职 AI 产品经理、智能体相关岗位？**

A：求职结果受企业需求、个人主观能动性、面试环境多重因素影响，无法给出绝对保证。AI 相关岗位非常看重项目作品。建议把课程产出的工作台项目整理到简历，公开沉淀，以作品作为求职筹码。同时可以通过面试持续补齐自身短板。

**Q：对电脑硬件、服务器有什么要求？**

A：不需要本地运行大模型，普通电脑即可。仅做 Demo 演示不需要服务器；如果想要完整部署 ERP 上线，则需要服务器保障数据库高可用。课程会讲解部署流程，但课程 Demo 不等同于开箱即用的企业级生产系统，企业落地还需要额外做高可用、领域适配。代码全部开源，可以本地直接运行。

**Q：课程最终交付物是什么？**

A：两套核心产出：一是可迁移的完整研发自动化工作台；二是贯穿课程的电商 ERP 项目，覆盖进销存、账务业务，用来完整落地整套方法论。拒绝纯纸上谈兵，全部依靠项目实践完成训练。

**Q：后端代码审查怎么做？**

A：一方面在规则文档中写入模块约束，每个子模块配套基础测试与入口校验，通过回归测试校验改动是否偏离主干链路。另一方面，回归测试无法覆盖全部分支场景，所以我们强制约束最小范围改动原则。把改动控制在最小范围，再叠加回归测试，共同完成代码审查。

## 附件

(1)

Codex AI 工程交付行动营\_8.17.pptx

5.82MB

下载

### 讨论区

![ai](data:image/png;base64,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)

**

班主任

**

附件  
下载

**

上节

**

返回  
顶部