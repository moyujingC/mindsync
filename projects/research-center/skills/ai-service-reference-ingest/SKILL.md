---
name: ai-service-reference-ingest
description: 为知行AI服务录入同行经验、帖子、评论、PDF/OCR等参考材料时使用；每次同时生成可读 Markdown 原文留存和业务转译参考文档，并在录入后同步评估、更新 ai-service-studio/system。
owner: Research & Knowledge Lead / CEO
status: draft
version: 0.2.0
skill_type: project
applies_to:
  - ai-service-studio
  - research_knowledge
when_to_use: >
  当用户给出企业 AI 服务、AI 培训、AI 工作流、获客销售、报价合同、交付案例等外部帖子、评论、截图 OCR、PDF 或粘贴文本，并要求补充到 projects/ai-service-studio/references/ 时使用。
inputs:
  - pasted text
  - attachment text
  - OCR text
  - PDF extracted text
  - external post
  - comments
  - creator note
outputs:
  - formatted source-original markdown
  - synthesized reference markdown
  - project index update
  - system impact analysis
  - updated ai-service-studio system docs
handoff_to:
  - CEO
  - Business Lead
  - Research & Knowledge Lead
---

# AI Service Reference Ingest

## 目标

把外部同行经验录入 `projects/ai-service-studio/references/`，形成一组可回看、可追溯、可迭代的参考材料。

每次录入必须同时生成两个文档：

- `YYYY-MM-DD-主题-原文.md` 或 `YYYY-MM-DD-主题-OCR原文.md`
- `YYYY-MM-DD-主题参考.md` 或语义更准确的 `YYYY-MM-DD-主题洞察.md`

原文文档保留上下文，参考文档负责转译成 `知行AI服务` 的业务判断。

完成参考录入后，必须继续评估并同步 `projects/ai-service-studio/system/`。`system/` 只沉淀已经转成 `知行AI服务` 自己可执行的方法、规则、SOP 或边界的内容，不直接搬运外部原文。

## 硬规则

- 原文必须做 Markdown 排版，不能只丢一整段原始粘贴文本。
- 原文只做结构整理，不改写事实、观点、案例、评论和语气。
- 参考文档不是摘要，而是对 `知行AI服务` 的业务转译。
- 新参考必须更新 `references/`、`PROJECT.md` 链接，并同步评估是否需要修改 `system/`。
- 默认要把参考文档中已判断采用的内容同步到 `system/`；不再等待二次确认。
- 修改 `system/` 时只能写入已经转成当前业务方法、SOP、报价边界、合同条款或能力边界的内容，不得把外部经验原文直接搬进去。
- 未核验事实、收入数字、客户成果、平台价格和案例结果不能写成稳定事实；如果进入 `system/`，必须改写成“经验信号 / 候选规则 / 待验证问题 / 边界提醒”。
- 如果材料信号很弱、明显重复、只适合留档，或和当前业务方向冲突，可以不修改 `system/`，但必须在参考文档中写清“不更新 system 的原因”。
- 文中未经外部核验的数据、政策、融资、收入、案例结果、平台规则、价格和客户成果，必须标为“未核验，只作经验信号”。
- 若材料明显重复，先比对已有 `references/` 文件；重复时优先补充旧文档，不新建平行重复文件。

## 文件命名

优先使用用户提供日期；没有日期时使用当前日期。

命名格式：

```text
projects/ai-service-studio/references/YYYY-MM-DD-短主题-原文.md
projects/ai-service-studio/references/YYYY-MM-DD-短主题参考.md
```

如果来源是截图、PDF OCR 或机器识别文本，用：

```text
YYYY-MM-DD-短主题-OCR原文.md
```

短主题应描述材料价值，不要直接复制超长标题。

## 原文文档要求

原文文档用于保留来源和上下文，必须可读。

建议结构：

```markdown
# 标题原文

> 日期：YYYY-MM-DD
> 来源：用户附件 / 用户粘贴 / OCR / PDF
> 项目：知行AI服务
> 用途：原文留存，便于后续回看上下文和再次提炼
> 关联参考：[标题参考](YYYY-MM-DD-短主题参考.md)
> 说明：仅做 Markdown 包装；正文、评论和原始表述尽量保留；未做外部事实核验。

## 原文

...

## 评论 / 补充材料

...
```

排版原则：

- 保留原文顺序。
- 给明显章节加二级标题。
- 长段落按语义拆段。
- 列表、步骤、问答、评论区要排成可扫读结构。
- 图表、流程、伪代码或难以判断结构的 OCR 片段可放进 fenced code block。
- 不为“好看”删掉原文里的争议、口语、数据或评论。
- 对明显 OCR 错字，只能做极少量不改变含义的校正；无法判断时保留原样。

## 参考文档要求

参考文档是“业务转译文档”，面向后续方法论和 SOP 迭代。

建议结构：

```markdown
# 短主题参考

> 日期：YYYY-MM-DD
> 来源：...
> 原文留存：[短主题原文](YYYY-MM-DD-短主题-原文.md)
> 项目：知行AI服务
> 用途：把外部经验转成获客、售前、报价、交付、合同和 system 迭代参考
> 可信状态：来源为用户提供材料；未核验部分只作经验信号，不作为对外事实主张

## 1. 总体判断

## 2. 可借鉴的业务模式

## 3. 产品和服务设定

## 4. 获客与销售

## 5. 售前和需求诊断

## 6. 报价、付款和商业边界

## 7. 交付、验收和复购

## 8. 合同、数据和合规边界

## 9. 能力边界判断

## 10. 不适合直接照搬的部分

## 11. 对 system 的影响判断
## 12. system 同步结果

## 13. 对当前项目文件的影响

## 14. KB 入库判断
```

可按材料内容删减小节，但必须保留：

- 总体判断
- 对当前项目的启发
- 不适合直接照搬的部分
- 对 system 的影响判断
- system 同步结果
- KB 入库判断

## 参考文档写法

参考文档要回答这些问题：

- 这份材料对 `知行AI服务` 最有价值的判断是什么？
- 它支持哪类服务：企业 AI 服务、个人 AI 服务、培训、工作坊、诊断、小实验、定制交付，还是合作方生态？
- 它对产品设定有什么影响：卖什么、先卖什么、不卖什么？
- 它对获客与销售有什么影响：内容、公域、私域、熟人、资源方、转介绍、跟单 SOP？
- 它对售前有什么影响：怎么筛人、怎么问需求、怎么拆流程、什么时候报价？
- 它对报价和合同有什么影响：价格锚点、付款节点、交付范围、不包含事项、验收标准？
- 它对交付有什么影响：资料输入、演示视频、培训、复盘、转介绍、后续维护？
- 哪些说法只是对方经验，不适合当前阶段照搬？
- 哪些事实需要外部核验后才能对外引用？
- 哪些内容应该同步到 `system/`？
- 本次实际更新了哪些 `system/` 文件？
- 哪些建议暂不进入 `system/`，为什么？
- 哪些内容可以进入 `kb/`，哪些还只是单一来源观察？

## system 同步规则

参考文档中的 `## 对 system 的影响判断` 要先写清材料对 `system/` 的影响，再实际同步到 `projects/ai-service-studio/system/`。

推荐格式：

```markdown
## 对 system 的影响判断

本次需要同步 `system/`。同步范围：

- `system/获客与售前SOP-v0.1.md`：...
- `system/AI服务产品体系-v0.1.md`：...
- `system/报价与服务边界-v0.1.md`：...
- `system/合同条款清单-v0.1.md`：...

不进入 `system/` 的内容：

- ...：原因是 ...

## system 同步结果

已同步：

- `system/...`：新增 / 修改 ...

未同步：

- ...：原因是 ...
```

若本次没有任何内容适合进入 `system/`，也必须写：

```markdown
## 对 system 的影响判断

本次不更新 `system/`。

原因：

- ...

## system 同步结果

未修改 `system/`。
```

### system 文件选择

优先修改现有文件：

- `system/AI服务产品体系-v0.1.md`
  - 产品路径、服务层级、卖什么 / 不卖什么、能力与合作边界。
- `system/获客与售前SOP-v0.1.md`
  - 获客渠道、邀约方式、案例激发、访谈问题、需求诊断、跟单规则。
- `system/报价与服务边界-v0.1.md`
  - 报价原则、价格带、交付物、维护边界、不承诺事项。
- `system/合同条款清单-v0.1.md`
  - 客户输入、数据安全、保密、验收、责任限制、同行复用、合作方。
- `system/零案例获客与模拟案例打样-v0.1.md`
  - 没有真实案例时的 demo、模拟案例、公域内容和样板构建。
- `system/最快启动最小闭环-v0.1.md`
  - 7 天最小行动、触达、样本沟通、外部反馈闭环。
- `system/README.md`
  - 只有新增 system 文件或模块定位变化时才改。

如果确实需要新增 system 文件，必须满足：

- 现有文件无法容纳。
- 该主题会持续迭代。
- `system/README.md` 同步加入入口。

### system 写法约束

- 只写 `知行AI服务` 自己要采用的规则，不写“某帖子说”式摘录。
- 单一来源但有价值的内容，写成“候选规则”“当前采用口径”“待验证问题”，不要写成已验证事实。
- 多个来源反复支持且符合当前方向的内容，可以写成当前规则。
- 所有涉及结果、收入、价格、客户成果的内容，必须保留边界，不得承诺。
- 不得因为外部材料夸张，就扩大当前业务承诺。

## PROJECT.md 更新

录入完成后，把两个文档都加入 `projects/ai-service-studio/PROJECT.md` 的“当前直接编辑入口”。

顺序建议：

- 参考文档在前
- 原文 / OCR 原文在后

示例：

```markdown
- [短主题参考](references/YYYY-MM-DD-短主题参考.md)
- [短主题原文](references/YYYY-MM-DD-短主题-原文.md)
```

## 质量检查

提交前检查：

- 两个文档是否都存在。
- 原文是否可读，而不是一整段纯文本。
- 参考文档是否有原文留存链接。
- 原文文档是否有反向关联参考链接。
- `PROJECT.md` 是否链接两个文档。
- 未核验事实是否标明边界。
- 参考文档是否写清 `system` 影响判断。
- 是否已经按判断同步 `system/`，或写清不更新原因。
- `system/` 修改是否只落在相关文件。
- `system/` 是否没有写入未核验结果承诺。
- `git diff --check` 是否通过。

提交前建议运行：

```bash
git diff --check -- projects/ai-service-studio
git diff --check -- projects/research-center/skills/ai-service-reference-ingest/SKILL.md
```
