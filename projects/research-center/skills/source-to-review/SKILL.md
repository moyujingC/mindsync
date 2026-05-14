---
name: source-to-review
description: 将新书籍、课程、培训材料、案例集或长文从原始材料处理到研究母库 draft 产物，并准备进入人工 review。
owner: Research & Knowledge Lead
status: draft
version: 0.1.0
skill_type: shared
applies_to:
  - research_knowledge
  - ceo
when_to_use: >
  当用户新增一份书籍、课程、培训材料、疗愈师手册、案例集、访谈稿或长篇材料，希望把它系统处理进研究母库，并一路推进到“等待人工 review”阶段时使用。
inputs:
  - 原始材料路径或外部来源
  - 主题归属
  - 用户处理意图
  - 当前项目锚点
outputs:
  - source directory
  - chapter index
  - chapter summary
  - draft atoms
  - research wiki draft
  - source boundary note
  - cross-source comparison note
  - review handoff note
handoff_to:
  - Research & Knowledge Lead
  - Human Reviewer
---

# Source To Review

## 目标

把一份新材料从“刚加入”处理到“可以人工 review”的研究母库状态。

本 skill 覆盖：

```text
原始材料
  -> 来源登记
  -> Markdown 转写/拆分
  -> 章节索引
  -> 章节摘要与主题标注
  -> 第一批 atoms
  -> wiki 草稿
  -> 来源评估与使用边界
  -> 附录/语录/案例主题索引
  -> 防漏检查与后续批次 atoms
  -> 跨来源对照记录
  -> review handoff
```

本 skill 不负责完成真正的人工 review，也不负责把内容正式推进到产品化知识库。

## 适用场景

- 新上传一本书、EPUB、PDF、DOCX 或课程讲义。
- 新增疗愈流派培训材料。
- 新增访谈稿、案例集、专家手册。
- 需要把长材料整理进 `projects/research-center/kb`。
- 需要为后续疗愈体系知识库准备可追溯研究输入。

## 不适用场景

- 只是保存链接或外部素材，先用 `external-knowledge-intake`。
- 只是判断一份材料值不值得处理，先用 `reference-intake-routing`。
- 已经完成 fact-check 和人工 review，准备正式长期入库时，用 `knowledge-ingest`。
- 要把内容直接写进产品化知识库，本 skill 不能越过 review。

## 必读上下文

1. `projects/research-center/kb/README.md`
2. `projects/research-center/kb/AGENTS.md`
3. `projects/research-center/kb/atom提取标准与防漏检查清单.md`
4. `projects/research-center/kb/templates/来源模板.md`
5. `projects/research-center/kb/templates/原子知识模板.md`
6. `projects/research-center/kb/templates/wiki模板.md`
7. 当前材料所在目录或用户提供的原始文件

## 执行步骤

### 1. 判断材料类型和主题目录

先判断材料属于：

- 书籍
- 课程材料
- 培训手册
- 访谈稿
- 案例集
- 长篇文章
- 其他

再判断主题目录：

- `sources/healing`
- `sources/ai`
- 其他未来主题

如果主题不明确，先给出建议归类，不要随意新建顶层主题。

### 2. 保留原始材料

原始材料优先保留在：

```text
projects/research-center/kb/sources/<topic>/
```

不要把原始材料直接放进产品化知识库。

如果材料已经在别处，先确认是否需要复制到研究母库。不要删除用户原文件。

### 3. 建 source directory

为材料建立同名目录，例如：

```text
sources/healing/对财富说是/
```

至少包含：

- `00-来源登记.md`
- `01-章节索引.md`

长材料应继续按章节拆分。

### 4. 转写和拆分

根据格式选择处理方式：

- EPUB：转成按目录拆分的 Markdown。
- PDF：先确认可提取文本质量，再拆章。
- DOCX：必要时使用 DOCX 处理工具保留结构。
- 纯 Markdown：按标题层级拆分。
- 案例集：按案例或议题拆分。

拆分目标是让每个文件能被 AI 单独读取和处理，不要保留一个过长的单文件。

### 编号约定

source directory 内建议固定使用：

```text
00-来源登记.md
01-章节索引.md
02-89：原文转写、章节、附录正文
90-章节摘要与主题标注.md
91-来源评估与使用边界.md
92-附录/语录/案例/练习主题索引.md
93-跨来源对照记录.md
99-review-handoff.md
```

`90+` 表示研究处理产物，避免因不同书籍章节数量不同而让摘要、边界和 handoff 的编号跳来跳去。

### 5. 写章节摘要与主题标注

新增：

```text
90-章节摘要与主题标注.md
```

至少包含：

- 总体判断。
- 章节摘要表。
- 可提炼 atoms 候选。
- 适合进入长期体系的方向。
- 风险边界。
- 下一步建议。

### 6. 提取第一批 atoms

第一批只抓主干，不追求穷尽。

优先提取：

- 核心观点。
- 明显方法。
- 关键风险边界。
- 会被 wiki 使用的基础判断。
- 多场景可复用的议题线索。

atom 写入：

```text
projects/research-center/kb/atoms/<topic>/
```

每条 atom 必须有：

- 一句话判断。
- 类型。
- 来源定位。
- 适用场景。
- 不适用场景。
- 可信状态。

心理疗愈类内容默认使用低确定性表达，例如“可能”“可作为线索”“需要验证”。

### 7. 建 wiki 草稿

把第一批 atoms 组织成研究层框架，写入：

```text
projects/research-center/kb/wiki/<topic>/
```

wiki 必须写清：

- 当前结论。
- 核心结构。
- atoms 依据。
- sources 依据。
- 边界。
- 待更新。

wiki 不等于产品知识条款。若来源单一，必须显式写明。

### 8. 写来源评估与使用边界

新增：

```text
91-来源评估与使用边界.md
```

至少写清：

- 来源定位。
- 作者/机构/课程语境。
- 可用内容类型。
- 不适合直接使用的内容。
- 当前可信状态。
- 后续核查清单。

### 9. 处理附录、语录、案例或练习索引

如果材料包含附录、语录、案例、练习或工具表，新增主题索引文件，例如：

```text
92-附录语录主题索引.md
92-案例主题索引.md
92-练习方法索引.md
```

索引应以转述和归类为主，不大量摘录原文。

### 10. 防漏检查并补后续批次 atoms

按 `atom提取标准与防漏检查清单.md` 做检查。

多批次规则：

- 第一批：抓主干。
- 第二批：补漏、补方法、补边界。
- 第三批及以后：由跨来源对照、产品场景、评估问题或人工 review 触发。

不要为了“完整”制造大量低价值 atom。

### 11. 建跨来源对照记录

跨来源对照是 review 前的必备步骤，不能省略。

在当前 source directory 中新增：

```text
93-跨来源对照记录.md
```

如果当前只有一份来源，也必须创建该文件，并明确写成：

- 当前可对照来源不足。
- 本材料暂不能代表完整议题。
- 哪些观点只能保留为单一来源观点。
- 后续需要补哪些来源类型。
- 是否建议进入人工 review。

如果已经有多个来源，至少对照：

- 共同支持的观点。
- 相互冲突的观点。
- 只能降级为探索线索的观点。
- 需要补 fact-check 的观点。
- 可进入产品化候选的观点。

跨来源对照记录不等于人工 review，也不能写成 `approve_for_ingest`。

### 12. 准备 review handoff

在当前 source directory 中新增 review handoff，例如：

```text
99-review-handoff.md
```

至少包含：

- 原始材料路径。
- 已完成产物列表。
- 当前 atoms 数量。
- wiki 草稿路径。
- 跨来源对照记录路径。
- 主要结论。
- 高风险观点。
- 需要人工判断的问题。
- 是否建议进入人工 review。
- 明确状态：等待人工 review。

### 13. 停止在 review 前

到这里必须停止。

不能自动：

- 声称 review 已通过。
- 写 `approve_for_ingest`。
- 推进到产品化疗愈体系知识库。
- 调用 `knowledge-ingest` 生成长期正式条目。

## 输出格式

最终回复至少说明：

- 原始材料保留位置。
- source directory 路径。
- 章节摘要路径。
- atoms 数量和路径。
- wiki 草稿路径。
- 来源评估路径。
- 跨来源对照记录路径。
- review handoff 路径。
- 当前状态：等待人工 review。

## 质量检查项

- 是否保留原始材料。
- 是否有来源登记。
- 是否有章节索引。
- 是否避免单个 Markdown 过长。
- 是否有章节摘要和主题标注。
- atom 是否可追溯、有适用和不适用场景。
- wiki 是否只写研究层判断。
- 是否写明来源单一或可信状态不足。
- 是否有来源使用边界。
- 是否有跨来源对照记录；即使来源不足，也要有“待对照”记录。
- 是否准备了 review handoff。
- 是否没有越过人工 review。

## Handoff 规则

- 如果需要事实核查，交给 `fact-check-gate`。
- 如果需要更完整的跨来源综合，交给 `research-synthesis`，但本 skill 内仍必须保留一份最小跨来源对照记录。
- 如果人工 review 给出修改意见，更新 source / atoms / wiki 后再生成新的 handoff。
- 只有人工 review 明确通过后，才可考虑 `knowledge-ingest` 或产品化知识库入口。
