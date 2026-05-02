# 研究中心内容质量控制与 NotebookLM 接入 Handoff

> 状态：working
> 版本：0.2.0
> owner：Research & Knowledge Lead
> handoff_for：下一窗口延续执行
> last_updated：2026-04-06
> source_of_truth：projects/research-center/delivery/2026-04-06-研究中心内容质量控制与NotebookLM接入-Handoff.md
> 项目：研究中心
> 阶段：delivery

## 1. 本轮已完成

已新增三份正式文档/模板：

1. [研究中心内容严谨性与 NotebookLM 事实核查层 SPEC](projects/research-center/specs/2026-04-06-研究中心内容严谨性与NotebookLM事实核查层-SPEC.md)
2. [研究中心内容严谨性与 NotebookLM 事实核查 SOP](projects/research-center/delivery/2026-04-06-研究中心内容严谨性与NotebookLM事实核查-SOP.md)
3. [事实核查笔记模板](projects/research-center/templates/事实核查笔记模板.md)

这两份文档已经明确：

- 研究中心必须区分事实层、判断层、表达层
- `NotebookLM` 当前最适合作为“来源约束检查器 / 事实核查辅助层”
- 正式接入前先采用人工半自动流程

新增模板后，下一窗口可以直接围绕：

- `research-draft`
- 来源包
- `fact-check-note`
- review 输入稿

跑完整个最小核查闭环。

## 2. 当前判断

当前环境中：

- 没有现成 `NotebookLM` skill
- 没有现成插件
- 没有直接的 PaperClip 集成入口

因此当前最佳路线不是立即开发接入，而是：

- 先把流程固化
- 先跑人工核查
- 再决定是否值得工具化

## 3. 与历史研究任务的关系

这次历史研究任务已经回到正确轨道，但当前新产出的详细长稿仍存在高风险：

- 出现大量精确数字
- 出现很多行业规模与增长率表述
- 当前未见稳定的一手出处链

因此：

- 它已经比上一轮更可用
- 但仍不应直接视为可发布稿
- 应优先按本次新增 SOP 跑一次事实核查
- 若仓库内尚未落地 `content-draft-full` 原文，则应先把该草稿归档到正式位置，再开始核查

## 4. 当前主链路

当前应按以下顺序推进：

`research-draft` -> `fact-check` -> `review` -> `knowledge-ingest`

并遵守：

- 核查不通过：
  - 退回研究草案修改
- review 不通过：
  - 暂不进入知识库

## 5. 下一窗口建议动作

优先顺序如下：

1. 针对这次历史研究任务新出的研究草案做一轮“事实主张拆分”
2. 产出一份 `fact-check-note`
3. 基于 `fact-check-note` 回改研究草案
4. 核查通过后再提交 review
5. review 通过后再决定是否入知识库

## 6. 后续可选实现

如果后续确认这条链路高频使用，再考虑：

1. 评估是否单独做 `NotebookLM` skill / plugin
2. 评估是否需要为来源包补统一归档约定
3. 评估是否需要补正式 `review-note` 模板

## 7. 注意事项

- 当前不要把 NotebookLM 当作最终事实来源
- 当前不要让 Content Lead 承担研究中心的事实清洗工作
- 当前不要把无来源精确数字继续往 downstream handoff
