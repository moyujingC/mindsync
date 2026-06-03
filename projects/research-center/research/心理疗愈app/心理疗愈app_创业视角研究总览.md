# 心理疗愈 App 研究总览：AI 产品创业视角

> 日期：2026-06-03  
> 范围：本目录 45 篇产品拆解文档 + 公开官网/可信公开页的抽样核验  
> 方法：主 agent 汇总；子 agent A 负责本地文档去重；子 agent B/C 负责外部核验方向，其中 C 未返回正文、B 仅返回执行口径，因此外部核验由主 agent 补做。  
> 口径：具体融资、用户数、定价、临床效果、合规认证，只有能从官网或可信公开来源核验时才作为事实；否则标为“待核验”。

## 1. 结论摘要

这批文档实际覆盖 **17 个唯一产品**，不是 45 个不同产品。重复最重的是：

| 产品 | 文档数 | 去重后赛道 |
| --- | ---: | --- |
| Ash / Slingshot AI | 9 | AI 心理健康伴侣 / 垂直心理学模型 |
| Noah AI | 6 | AI 情绪教练 / AI therapist |
| Rosebud AI | 5 | AI 互动日记 / 自我探索 |
| Rocky.ai | 5 | B2B AI coaching / 白标教练平台 |
| Sonia AI | 4 | 语音优先 AI 心理支持 |
| Flourish Science / Sunnie | 3 | 科学实证型 wellness buddy |
| Pi / Inflection AI | 2 | 通用高 EQ AI 伴侣 |
| Yuna Health / Yuna AI | 2 | 职场心理健康 / 企业员工福祉 |

其余 9 个产品各 1 篇：InfiHeal / Healo、CoachHub AIMY、Purpose、MoodTalker / 林间聊愈室、Layers、Betwixt、Eleos Health、星云星空、therappai。

创业判断：

1. **消费端 AI 疗愈已经拥挤**。多数产品都在讲 24/7、无评判、低成本、长期记忆、CBT/ACT/DBT（认知行为疗法 / 接纳承诺疗法 / 辩证行为疗法）。单纯做“AI 陪聊 + 情绪安慰”很难形成壁垒。
2. **更有价值的入口是“结构化场景”**：日记、职场冲突、关系复盘、睡前情绪急救、咨询前后辅助、训练营、教练方法论产品化。这些场景能给 AI 明确任务、边界和验收方式。
3. **B2B 和 B2B2C 的付费逻辑更清楚**，但门槛也高。Rocky.ai、CoachHub AIMY、Eleos Health 说明企业和临床侧愿意为工作流效率、组织发展、合规文档、ROI 付费；进入这类市场需要合规、集成、销售和服务能力。
4. **最值得借鉴的产品形态不是“AI 治疗师”，而是“人类专家能力的放大器”**。例如 Rosebud 放大反思能力，Rocky 放大教练方法论，Eleos 放大临床文档能力，Flourish 把心理科学变成日常练习。
5. **安全边界是产品成败线**。心理健康属于高敏感领域，AI 不能假装自己等同于持证治疗师。产品需要危机识别、转介、人类介入、免责声明、可审计日志、数据最小化和模型评估。

## 2. 去重后的产品地图

| 产品 | 外部核验状态 | 当前可确认定位 | 创业可学点 | 主要风险 |
| --- | --- | --- | --- | --- |
| Ash / Slingshot AI | 高：官网可访问 | Slingshot AI 自称 mental health research lab，建设 psychology foundation model，旗舰产品 Ash | 用“垂直模型 + 研究实验室”建立高端叙事；适合资本驱动型路径 | 临床效果、融资数字、模型训练数据细节需谨慎引用 |
| Rosebud AI | 高：官网可访问 | AI journaling app，写/说想法，发现 patterns，获得 personalized reflection prompts | 把模糊情绪输入转成结构化反思，低风险、易留存 | 记忆和洞察易被通用模型复制，需要内容/习惯/社区护城河 |
| Rocky.ai | 高：官网可访问 | AI coaching platform for employees/students，含 app builder、organization、coach 场景 | 白标 + 企业/教练方法论产品化，商业闭环较清晰 | 销售周期、客户成功、教练质量控制复杂 |
| CoachHub AIMY | 高：官网可访问 | always-on AI coach，面向员工，科学基础，24/7 | 嵌入成熟人类教练网络，AI 作为扩展层 | 新创业公司难复制 CoachHub 分销与客户关系 |
| Eleos Health | 高：官网可访问 | community-based care 机构的 AI system of action | 选择临床工作流的刚性痛点，而非泛陪伴 | 合规、EHR 集成、医疗销售门槛高 |
| Flourish Science / Sunnie | 高：官网可访问 | AI-driven mental health app，well-being、motivation、personal growth，官网有 health plans/schools 入口 | 科学背书 + 日常化练习 + B2B2C 渠道 | “wellness”与“medical”边界要清晰 |
| Pi / Inflection AI | 中：官网受访问限制但公开存在 | 通用 personal AI，强项是高 EQ 对话 | 情绪语气和对话节奏可作为 UX 标杆 | 非心理健康专用，不能直接类比治疗产品 |
| Sonia AI | 中：需进一步核验官网/App Store/YC | 文档称其为语音优先 AI therapist / emotional support | 语音会话适合模拟咨询体验 | HIPAA、临床效果、创始团队、价格需逐项核验 |
| Noah AI | 中低：本地文档一致，但外部核验需补 | 文档称其为 AI therapist / emotional coach | “实时语音 + 加密记忆 + 情绪报告”是完整 C 端体验 | 官网、公司、定价、专业背书存在待核验点 |
| Yuna Health | 中低：需补官网/LinkedIn/产品页 | 文档称其为职场心理健康 AI | 企业 HR dashboard + 匿名聚合数据是 B2B 切入点 | 心理隐私与雇主数据边界很敏感 |
| InfiHeal / Healo | 中：需核验当前产品状态 | AI 伴侣 + 真人治疗师衔接 | 混合式 care path 更稳健 | 供给侧治疗师质量与成本 |
| Betwixt | 中：可作为形态研究 | 叙事/互动冒险式疗愈 | 把干预隐藏在故事体验里，适合低防御用户 | 市场规模与复购频率不确定 |
| Purpose | 中低：需核验 Mark Manson/Fermi 公开页 | 文档称其为挑战型 AI life coach | IP + 方法论 + 反讨好型 AI，是强定位 | 高度依赖名人 IP，新团队难复制 |
| Layers | 中低：官网需进一步核验 | 文档称其为 AI life coach & voice journal | 语音日记 + 长期记忆是轻量 MVP 方向 | 与 Rosebud 高度相似 |
| MoodTalker / 林间聊愈室 | 低：需中文公开资料核验 | 文档称其为 Z 世代多模态心理陪伴 | 萌系 IP + 多模态情绪输入适合年轻用户 | 技术数据、备案、规模数字不可直接引用 |
| 星云星空 | 低：需中文公开资料核验 | 文档称其为 PsyLLM 心理聊愈系统 | 国内合规 + 训练营 + 真人咨询导流值得关注 | “心理大模型备案”等表述需确认 |
| therappai | 低：疑似趋势推演或信息不足 | 文档称其为 AI 视频疗愈应用 | 视频 avatar 可能增强临场感 | “世界首款”等强表述未核验，不建议作为竞品事实引用 |

## 3. 赛道分层

### 3.1 消费端：AI 陪伴 / 疗愈 / 教练

代表产品：Ash、Noah、Sonia、Pi、Purpose、Yuna 的个人版。

核心用户痛点：

- 真人咨询贵、预约慢、深夜不可得。
- 用户想表达，但不想被评判。
- 用户需要即时情绪调节，不一定需要完整医疗治疗。

创业机会：

- 不要泛做“AI therapist”。更稳的是“明确场景 + 明确边界”，例如睡前情绪急救、关系冲突复盘、工作压力复盘、咨询前准备、咨询后作业陪跑。
- 语音交互会提升真实感，但也会提高安全风险和成本。
- 长期记忆是核心体验，但不是天然护城河；记忆必须变成有用的洞察、练习和行动。

### 3.2 AI 日记 / 自我探索

代表产品：Rosebud、Layers、Betwixt 的部分体验。

核心用户痛点：

- 传统日记难坚持，记录后没有反馈。
- 用户不知道如何从情绪描述走向认知洞察。
- 用户需要一个低压的自我探索入口。

创业机会：

- 这是最适合小团队切入的方向。它避开“治疗师替代”的高监管叙事，也能形成日常使用频率。
- 关键不是生成鸡汤，而是把输入结构化：事件、情绪、身体反应、自动想法、需求、行动。
- 可把心理学技术做成模板和流程，例如 CBT thought record、ACT values clarification、关系沟通复盘。

### 3.3 B2B AI coaching / 企业员工发展

代表产品：Rocky.ai、CoachHub AIMY、Yuna、Flourish 的 schools / health plans。

核心买方痛点：

- 人类教练贵，无法覆盖所有员工。
- 培训项目难持续，学习后行为改变难证明。
- HR/管理者需要匿名聚合洞察，但不能接触个体隐私。

创业机会：

- 企业客户不只买聊天，买的是管理动作：评估、训练、跟踪、报告、ROI。
- 可以从“教练/培训师白标工具”切入，让已有专家把方法论变成 AI 产品。
- 个人数据与组织数据必须隔离。匿名聚合数据的边界要写进产品机制，而不是只写进隐私政策。

### 3.4 临床 / 行为健康工作流

代表产品：Eleos Health。

核心买方痛点：

- 行为健康机构的临床文档、合规、审计、EHR 工作流负担重。
- 治疗师时间被文书消耗，机构需要提升吞吐和质量。

创业机会：

- 这是支付意愿最高、壁垒最强的方向之一。
- 对小团队来说，不适合直接从医疗主链路切入；可先做低风险辅助工具，例如咨询师会前资料整理、个案复盘模板、督导材料生成。

## 4. 对“AI 产品创业”的启发

### 4.1 起点要从问题出发

心理疗愈领域很容易被“AI 很会共情”带偏。更好的创业起点是问：

- 用户现在用什么替代方案？朋友倾诉、日记、短视频、冥想 App、心理咨询、宗教/灵性社群、运动、睡觉。
- 哪个场景用户会反复出现，并愿意付费解决？
- AI 的工作边界是什么？倾听、提问、结构化、练习陪跑、风险识别、转介；不要默认承担诊断和治疗责任。

### 4.2 最小可行产品建议

如果要从这批竞品里抽一个更适合创业试验的方向，建议优先做：

**“AI 反思日记 + 关系/职场情绪复盘 + 人类咨询/教练协同”**

原因：

- 比“AI 治疗师”低风险。
- 比泛陪伴更有结构和留存。
- 可以沉淀用户自己的长期上下文。
- 可向真人咨询师、教练、训练营扩展，形成混合服务。

MVP 形态：

1. 用户用文字或语音记录一个困扰事件。
2. AI 按结构抽取：事件、情绪、身体感受、自动想法、价值需求、下一步行动。
3. AI 提出 1-3 个高质量追问，而不是无限陪聊。
4. 每周生成模式报告：触发源、关系主题、反复想法、已尝试行动。
5. 遇到自伤、他伤、精神病性症状、严重危机时，转入危机资源和人类支持路径。

### 4.3 数据和护城河

不要把“我们有用户数据”直接当护城河。更可持续的护城河来自：

- 结构化心理流程：同样的大模型，放进更好的流程会更稳定。
- 专家知识库：咨询师、教练、疗愈师的方法论可以被产品化。
- 评估体系：对话质量、安全边界、干预有效性、用户行动完成率都要可测。
- 分发入口：内容 IP、咨询师/教练社群、训练营、企业福利、学校渠道。
- 人机协作闭环：AI 做高频陪跑，人类专家做低频关键判断。

## 5. 必须谨慎处理的事实

以下内容在本地文档中出现，但本次未完成强核验，后续正式引用前要查官网、新闻稿、App Store、Google Play、Crunchbase/YC、监管或论文来源：

- Ash 的具体融资金额、训练数据小时数、临床效果数据、安全检测准确率。
- Noah AI 的公司主体、官网、治疗师团队、价格、EAP 计划。
- Sonia AI 的 HIPAA 合规、创始团队、YC 批次、定价。
- Rosebud 的融资金额、活跃用户、转化率。
- Yuna 的创始人、Harvard 背书、SOC 2 / HIPAA 声明。
- MoodTalker 的数据规模、模型来源、产品主体。
- 星云星空的 PsyLLM 备案、电话/视频能力、一体机商业化。
- therappai 是否真实存在，以及“世界首款 AI 视频疗愈应用”的说法。

## 6. 外部核验来源

已抽样访问并用于判断的公开来源：

- [Slingshot AI](https://slingshotai.com/)：官网描述其为 mental health research lab，并链接旗舰产品 Ash。
- [Ash](https://www.talktoash.com/)：Slingshot 官网链接到的旗舰产品入口。
- [Rosebud](https://www.rosebud.app/)：官网描述其为 AI journaling app，支持写/说、发现 patterns、personalized reflection prompts。
- [Rocky.ai](https://www.rocky.ai/)：官网描述其为 AI coaching platform，覆盖 employees、students、organizations、coaches。
- [CoachHub AIMY](https://www.coachhub.com/aimy/)：官网描述 AIMY 为 always-on AI coach，面向员工，24/7，grounded in science。
- [Eleos Health](https://eleos.health/)：官网定位为 community-based care orgs 的 AI platform / system of action。
- [Flourish Science](https://www.myflourish.ai/)：官网描述 AI-driven mental health app，并有 Sunnie AI、health plans、schools、science、privacy/safety 等入口。
- [Pi](https://pi.ai/)：官网存在但当前访问受限；仅作为产品存在性参考，不用于断言心理健康专属能力。

## 7. 建议下一步

1. 把 45 篇文档按上面的 17 个产品归档，避免后续分析重复计算。
2. 对低置信度产品做一次“存在性核验”：官网、App Store、Google Play、LinkedIn、YC/Crunchbase、新闻稿。
3. 为每个高置信度产品补一张统一卡片：定位、目标用户、核心流程、收费方式、证据来源、创业可学点、不可学点。
4. 若目标是孵化自己的产品，先做一个 2 周原型：AI 反思日记 + 情绪复盘 + 危机转介，而不是直接做“AI 心理治疗师”。
