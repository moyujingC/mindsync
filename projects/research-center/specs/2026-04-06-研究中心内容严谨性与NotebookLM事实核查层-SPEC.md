# 研究中心内容严谨性与 NotebookLM 事实核查层 SPEC

> 状态：draft
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-04-06
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/research-center/specs/2026-04-06-研究中心内容严谨性与NotebookLM事实核查层-SPEC.md
> 项目：研究中心
> 阶段：spec
> depends_on：
> - /Users/xinran/Downloads/dev/mindsync/projects/research-center/PROJECT.md
> - /Users/xinran/Downloads/dev/mindsync/agents/research-knowledge-lead/AGENTS.md
> - /Users/xinran/Downloads/dev/mindsync/projects/research-center/skills/research-synthesis/SKILL.md

这份文档定义 `研究中心` 的内容严谨性控制方案，以及 `NotebookLM` 在其中承担的角色。

核心目标不是“让 AI 更会写”，而是防止研究中心直接产出“看起来像真的、但证据链不稳”的内容。

## 1. 目标

本方案要解决四个问题：

1. 把研究事实、推演判断、对外表达彻底分层。
2. 防止无来源的精确数字、行业数据、案例细节直接进入对外稿。
3. 为 `Content Lead` 提供“可润色”的稿子，而不是“待考证”的稿子。
4. 让人工 review 持续沉淀成质量规则，而不是一次性提醒。

## 2. 核心原则

### 2.1 严谨不是风格问题，而是流程问题

研究中心的严谨性不能靠单次 prompt，也不能靠模型“更聪明”。

必须通过固定流程约束：

- 哪些内容能写
- 哪些内容必须先核实
- 哪些内容不能发布

### 2.2 研究产物必须分三层

任何研究型任务的正式产物至少分为三层：

1. `事实层`
   - 已确认事实
   - 原始来源
   - 来源可信度
2. `判断层`
   - 模式抽象
   - 趋势判断
   - 对我司的建议
3. `表达层`
   - 面向外部读者的内容草稿

表达层不能反向伪造事实层。

### 2.3 对外稿默认不写“未经核实的精确数字”

如果研究中心没有可靠来源支持，则默认禁止直接写入：

- 市场规模
- 增长率
- API 占比
- 某类公司收入
- “某机构某年报告显示”之类的硬引用

遇到这类内容时，默认做法应是：

- 改写成趋势判断
- 明确标注为待核实
- 或直接删除

### 2.4 NotebookLM 是事实核查辅助层，不是最终裁判

`NotebookLM` 在本方案中承担的角色是：

- 基于已上传来源做问答
- 帮助定位出处
- 帮助发现“文中哪些句子没有被来源覆盖”

它不是：

- 最终事实权威
- 自动发布判定器
- 替代人工核查的终审角色

## 3. NotebookLM 在流程中的定位

当前建议把 `NotebookLM` 放在：

`research-draft` -> `NotebookLM核查` -> `machine-review` -> `creator/user review` -> `knowledge-ingest`

这里的原则不是用核查替代你的 review，而是：

- 先核查
- 核查通过后先做机器预审
- 机器预审通过后再给你 review
- review 通过后再入知识库

其职责边界如下：

### 3.1 NotebookLM 负责什么

- 基于明确来源回答问题
- 返回引用片段或来源定位
- 帮助拆分文中的事实主张
- 帮助比对“哪句话在来源里、哪句话不在”

### 3.2 NotebookLM 不负责什么

- 不负责直接定义我司策略
- 不负责生成最终可发稿
- 不负责决定某条商业判断一定成立
- 不负责替代人工做“能不能公开发布”的最终判断

## 4. 事实状态模型

研究中心后续应对关键事实主张统一打标签。

### 4.1 状态定义

- `verified`
  - 有明确来源，且来源足以支撑当前表述
- `plausible`
  - 推断合理，但没有足够来源支撑
- `needs_source`
  - 句子里有事实主张，但当前没有来源
- `do_not_publish`
  - 高风险主张，不得进入对外稿

### 4.2 适用对象

至少对以下内容打标签：

- 具体数字
- 市场规模
- 机构报告结论
- 公司案例细节
- 行业占比
- 时间趋势判断

## 5. 标准工作流

### 5.1 研究草案阶段

`Research & Knowledge Lead` 完成：

- 研究综合结论
- 初步模式抽象
- 初步可入库观点草案

但此时仍不应默认进入知识库。

### 5.2 事实核查阶段

将以下材料送入 `NotebookLM`：

- 来源网页/PDF/文档
- 研究综合结论
- 待发布草稿（若已有）

要求 `NotebookLM` 输出：

- 关键事实主张清单
- 每条主张对应的来源覆盖情况
- 缺来源句子清单
- 高风险硬数字清单

### 5.3 Machine Review 阶段

在这一阶段，`NotebookLM` 或其接入层负责产出一份机器预审结论。

机器预审的目标不是替代你的判断，而是进一步收束：

- 当前草案是否还有明显高风险事实问题
- 当前草案是否已经达到“值得交给人审”的程度
- 当前草案是否应继续回改，而不是提前进入人工 review

机器预审结论分为：

- `pass`
- `pass_with_conditions`
- `fail`

如果机器预审不是 `pass`，则：

- 返回研究草案继续修改
- 暂不进入人工 review

### 5.4 Review 阶段

只有当以下条件满足时，才允许把研究草案交给你 review：

- 高风险句子已删除或改写
- 关键事实已标明来源状态
- 不存在明显“像真的但无出处”的硬数据
- 机器预审结论为 `pass`

你的 review 结论分为：

- 可入库
- 有条件入库
- 不入库

### 5.5 知识入库阶段

只有在以下条件同时满足时，才允许进入 `knowledge-ingest`：

- `fact-check-note` 已完成
- `machine-review-note` 已完成
- 机器预审结论为 `pass`
- 你的 review 已明确允许入库

如果 review 未通过，则：

- 返回研究草案继续修改
- 暂不进入知识库

## 6. 产物要求

本方案落地后，研究中心针对研究型内容任务，至少应产出以下对象：

1. `research-draft`
   - 研究草案、结论与判断
2. `fact-check-note`
   - 事实核查笔记
3. `machine-review-note`
   - 机器预审结论
4. `review-note`
   - 创作者 / 用户 review 结论
5. `knowledge-entry`
   - 已确认可入库的结构化条目

## 7. 对现阶段系统的最小落地方式

在还没有正式接入 `NotebookLM Enterprise API` 之前，先采用“人工触发 + 文档回填”的轻量模式。

### 7.1 当前最小方案

1. 研究中心产出 `research-synthesis`
2. 人工把来源材料与综合结论放入 `NotebookLM`
3. 人工拿回核查结果
4. 将核查结果整理成 `fact-check-note`
5. 核查不通过则退回研究草案修改
6. 核查通过后生成 `machine-review-note`
7. 机器预审不通过则继续回改
8. 机器预审通过后再进入创作者 / 用户 review
9. review 通过后再进入 `knowledge-ingest`

### 7.2 为什么先这样做

- 当前环境没有现成的 `NotebookLM` skill 或插件
- 先验证工作流价值，再考虑 API/插件接入
- 避免过早为了自动化而引入新的复杂度

## 8. 后续接入方向

如果后续决定正式系统化接入，可按以下优先级推进：

1. 先沉淀固定 prompt / 核查模板
2. 将 `fact-check-note` 文档模板纳入默认流程入口
3. 再考虑单独做 `NotebookLM` 插件或 skill
4. 最后再考虑接入 `PaperClip` 任务流自动化

## 9. 成功标准

本方案是否有效，至少看以下信号：

1. `Content Lead` 拿到稿件后，不再需要替研究中心做大规模事实清洗
2. 对外稿中的高风险精确数字明显减少
3. 研究中心开始稳定区分“事实”与“判断”
4. 你的 review 不再反复集中在“这句话像编的”“这个数字哪来的”
5. 未经 review 通过的内容不会直接进入知识库

## 10. 当前结论

对于 `研究中心` 来说，`NotebookLM` 当前最适合的角色不是内容生产器，而是：

- 来源约束检查器
- 事实核查辅助层
- QA gate 的上游输入

这也是让研究中心“从根上更严谨”的最现实路径。
