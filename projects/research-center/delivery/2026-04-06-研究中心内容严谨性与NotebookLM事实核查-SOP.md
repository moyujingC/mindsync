# 研究中心内容严谨性与 NotebookLM 事实核查 SOP

> 状态：draft
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-04-06
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/research-center/delivery/2026-04-06-研究中心内容严谨性与NotebookLM事实核查-SOP.md
> 项目：研究中心

这份 SOP 用于指导 `研究中心` 在实际任务中如何把 `NotebookLM` 作为事实核查辅助层使用。

默认服务于以下主链路：

`research-draft` -> `fact-check` -> `machine-review` -> `review` -> `knowledge-ingest`

其中：

- 核查不通过：
  - 退回研究草案修改
- 核查通过：
  - 才进入机器预审
- 机器预审不通过：
  - 退回研究草案修改
- review 不通过：
  - 不入知识库

适用对象：

- `Research & Knowledge Lead`
- `Content Lead`
- `Test / QA`
- 需要审阅研究型内容的 board/user

## 1. 适用场景

当任务同时满足以下条件时，进入本 SOP：

- 任务已有 `research-synthesis`
- 准备生成或已经生成对外内容稿
- 文中包含数字、案例、市场判断、行业趋势等事实主张

## 2. 不适用场景

- 纯内部 brainstorming
- 只做观点梳理，不准备对外发布
- 还没有形成正式 `research-synthesis`

## 3. 最小输入

执行前至少准备：

1. 当前 issue 的 `research-synthesis`
2. 当前 issue 的原始来源材料
3. 若已有，则附上准备给你 review 的研究草案

## 4. 执行步骤

### 第一步：整理来源包

由 `Research & Knowledge Lead` 准备一份来源包，至少包括：

- 原始链接
- 原始网页/PDF/文档文本
- 若有评论纠偏，也附上关键评论
- 当前 `research-synthesis`

要求：

- 不要只上传对外草稿
- 必须把原始来源与综合结论一起放入

### 第二步：在 NotebookLM 建立核查用 notebook

新建一个专门用于本任务核查的 notebook。

命名建议：

- `历史任务-fact-check`
- 或 `2026-04-06-agent-software-data-asset-check`

只上传与本轮任务直接相关的材料。

### 第三步：先问来源覆盖，而不是先让它润色

在 NotebookLM 中优先问以下问题：

1. 这份综合结论里有哪些明确的事实主张？
2. 每条事实主张分别由哪些来源支撑？
3. 哪些句子在现有来源中找不到直接支撑？
4. 哪些数字、比例、市场规模属于高风险表述？
5. 哪些内容更适合改写成趋势判断，而不是硬事实？

### 第四步：产出 fact-check note

将 NotebookLM 的结果人工整理为一份 `fact-check-note`。

建议直接复用：

- [事实核查笔记模板](/Users/xinran/Downloads/dev/mindsync/projects/research-center/templates/事实核查笔记模板.md)

最少要有四栏：

- 事实主张
- 当前状态
  - `verified / plausible / needs_source / do_not_publish`
- 依据来源
- 处理动作
  - `保留 / 改写 / 删除 / 待补证据`

### 第五步：回写研究草案

基于 `fact-check-note` 回改研究草案。

回改规则：

- `verified`
  - 可保留
- `plausible`
  - 改成判断或趋势表达
- `needs_source`
  - 优先删掉，或改成更弱表述
- `do_not_publish`
  - 必须删除

### 第六步：判断是否通过核查

核查结论只分三种：

1. 通过
2. 有条件通过
3. 不通过

判断标准：

- `通过`
  - 可以进入你的 review
- `有条件通过`
  - 先按 `fact-check-note` 完成指定修改，再进入你的 review
- `不通过`
  - 退回研究草案继续修改，本轮不进入你的 review

### 第七步：生成 machine-review note

在这一阶段，基于：

- `fact-check-note`
- 当前回改后的研究草案

生成一份 `machine-review-note`。

机器预审结论只分三种：

1. `pass`
2. `pass_with_conditions`
3. `fail`

处理规则：

- `pass`
  - 允许进入你的 review
- `pass_with_conditions`
  - 先完成指定修改，再重跑本步
- `fail`
  - 退回研究草案继续修改

### 第八步：交给你 review

只有在以下条件成立时，才进入你的 review：

- 高风险硬数字已清理
- 事实主张状态已明确
- 稿子已经完成核查回写
- 当前版本适合判断“是否值得入知识库”
- `machine-review-note` 结论为 `pass`

### 第九步：review 后再决定是否入知识库

只有在你的 review 明确通过时，才允许进入 `knowledge-ingest`。

如果你的 review 结论是否定或要求继续修改，则：

- 返回研究草案
- 暂不入知识库

## 5. NotebookLM 提问模板

以下模板可直接复用：

### 模板 A：事实主张盘点

```text
请基于我上传的来源材料和这份 research synthesis，列出其中所有明确的事实主张。

对每条主张输出：
1. 主张原文
2. 属于事实、判断还是推测
3. 是否能被当前来源直接支撑
4. 如果能支撑，请指出对应来源
5. 如果不能支撑，请标记为 needs_source
```

### 模板 B：高风险句子清单

```text
请找出这份内容草稿里所有高风险表述，重点关注：
- 精确数字
- 市场规模
- 增长率
- 公司案例细节
- “某机构报告显示”类句子

请按以下格式输出：
- 句子
- 风险原因
- 建议动作：保留 / 改写 / 删除
```

### 模板 C：弱化改写建议

```text
对于 cannot verify 或 needs_source 的句子，
请不要补编新事实，而是把它们改写成：
- 趋势判断
- 经验判断
- 范围更保守的表达

要求：
- 不引入新数字
- 不引入新机构
- 不伪造出处
```

## 6. 常见错误

### 错误 1：把 NotebookLM 当成事实来源本身

NotebookLM 只能基于你上传的材料做整理和引用。

它不能替代：

- 原始报告
- 官方文档
- 一手网页

### 错误 2：只上传草稿，不上传来源

这样得到的只会是“自洽”，不是核查。

### 错误 3：核查后不回写

如果只做核查，不修改稿子，流程等于没完成。

### 错误 4：Content Lead 接到的仍是待考证稿

这会让内容阶段承担研究清洗工作，角色边界会继续混乱。

## 7. 最小验收标准

执行完本 SOP 后，一份内容稿至少要达到：

1. 文中不再出现明显无出处硬数字
2. 关键事实都有状态标记
3. 高风险句子已删除或降级改写
4. 可以安全进入你的 review，而不是把事实排雷压到 review 阶段

## 8. 当前阶段的执行方式

在正式接入 API 或插件前，默认采用人工半自动方式：

1. 人工上传来源到 NotebookLM
2. 人工复制提问模板
3. 人工整理成 `fact-check-note`
4. 人工回写研究草案
5. 通过后再提交 review

先把流程跑顺，再决定是否工具化。
