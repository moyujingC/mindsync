# 怀瑾握瑜 MVP 纸面验证报告

> 状态：historical-reference
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-15
> source_of_truth：projects/aicareer/qa/2026-04-03-paper-validation-report.md
> 项目：aicareer
> 阶段：verification
> depends_on：projects/aicareer/qa/2026-04-02-mvp-qa-checklist.md

这份文档记录 `aicareer` 第一轮基于模拟样本的纸面验证结果。

## 1. 验证范围

本轮按以下主路径进行纸面走查：

1. `intake`
2. `exploration`
3. `structuring`
4. `review`
5. `export`

验证输入来自：

- [模拟样本清单](projects/aicareer/fixtures/2026-04-03-mvp-sample-cases.md)

验证依据来自：

- [MVP 产品 Spec](projects/aicareer/specs/MVP产品规范.md)
- [MVP 技术方案](projects/aicareer/specs/MVP技术方案.md)
- [MVP 验收与测试清单](projects/aicareer/qa/2026-04-02-mvp-qa-checklist.md)

## 2. 总体结论

本轮纸面验证结论：

- 主流程成立
- 3 个样本都能映射到统一流程
- `career_asset` 的 Markdown 结构足以承载第一版输出
- 当前可以进入第一版实现任务定义

仍保留的风险：

- 真实用户是否愿意完成完整梳理轮次，尚未验证
- narrative draft 的质量仍需真实交互验证

## 3. 样本验证结果

### 3.1 样本一：跨行业转型

验证目标：

- 时间线能否收束
- 转型叙事能否说清

结果：

- `intake` 可明确目标方向
- `exploration` 能沉淀出转型前后关键节点
- `structuring` 可形成较清楚的阶段化时间线
- `review` 环节有必要，因为用户很可能会修正“优势表达”
- `export` 可输出一版可读职业资产

结论：

- 通过

### 3.2 样本二：存在空档期

验证目标：

- 系统是否保留空档期
- follow-up questions 是否合理

结果：

- `intake` 可识别“重返职场”目标
- `exploration` 必须显式追问空档原因、当前约束和重返路径
- `structuring` 可以把空档期保留在线上，而不是删除
- `review` 环节对敏感表述非常关键
- `export` 可生成一版不回避空档的职业资产

结论：

- 通过

### 3.3 样本三：失败项目后重建叙事

验证目标：

- 是否会过度美化
- 是否支持逐步修正

结果：

- `intake` 可明确“重新求职”的短期目标
- `exploration` 需要追问失败项目中的角色、结果和反思
- `structuring` 若没有 review，容易把失败经历说得太轻
- `review` 是必要步骤，不可省略
- `export` 可以形成“忠实但不自我贬低”的初稿

结论：

- 通过，但高度依赖 review 环节

## 4. 测试用例结果

1. `TC-01 首次 intake 完整输入`
   - 结果：通过
2. `TC-02 用户经历顺序混乱`
   - 结果：通过
3. `TC-03 用户存在空档期`
   - 结果：通过
4. `TC-04 用户否定叙事初稿`
   - 结果：通过
5. `TC-05 用户信息明显不足`
   - 结果：通过
6. `TC-06 导出职业资产初稿`
   - 结果：通过

## 5. 本轮发现

1. `review` 不是可选步骤，而是核心步骤。
2. `follow_up_questions` 对信息不足场景非常关键。
3. 第一版先输出 Markdown 文档是正确选择，足够支持验证。

## 6. 下一步建议

1. 进入第一版实现任务定义
2. 预留 `app/`、`domain/`、`tests/` 目录
3. 先实现最小流程，而不是扩展导出格式和附加功能
