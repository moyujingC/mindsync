# 怀瑾握瑜 MVP 验收与测试清单

> 状态：in_review
> 版本：0.2.0
> owner：Test / QA
> last_updated：2026-04-03
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aicareer/qa/2026-04-02-mvp-qa-checklist.md
> 项目：aicareer
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aicareer/specs/MVP产品规范.md
> reviewers：CEO / Orchestrator, Product Spec Lead, Engineer

## 1. 目标行为

1. 系统能够引导用户完成复杂履历梳理。
2. 系统能够输出职业时间线摘要。
3. 系统能够输出叙事主线初稿。
4. 用户能够对输出结果进行修正确认。

## 2. 验收标准

1. 梳理流程有明确步骤和输入输出定义。
2. 时间线摘要不丢失关键阶段信息。
3. 叙事主线不夸大、不失真。
4. 用户修正动作能回写到最终结果。
5. 每个阶段的中间结果可被追踪，而不是只剩最终输出。
6. 最终 `career_asset` 至少包含目标、时间线、叙事主线和待补信息四部分。

## 3. 关键路径

1. 首次进入并提交背景信息
2. 多轮梳理问答
3. 生成时间线摘要
4. 生成叙事主线
5. 用户修正并确认

## 4. 边界情况

1. 用户经历跨行业且阶段很多
2. 用户存在空档期或失败经历
3. 用户输入模糊、不完整或顺序混乱
4. 用户对叙事结果强烈不同意

## 5. 验证方法

当前阶段采用人工验证为主：

1. 走查一条完整流程
2. 使用 2 到 3 个复杂履历样本做模拟
3. 对比原始输入、时间线摘要和叙事输出之间是否失真

建议样本至少覆盖：

1. 跨行业转型样本
2. 有空档期样本
3. 有失败项目但仍要重建叙事的样本

未来自动化测试切入点：

- 输入结构校验
- 时间线抽取逻辑
- 结果结构完整性检查

## 6. 测试用例清单

1. `TC-01 首次 intake 完整输入`
   - 期望：生成初始 profile
2. `TC-02 用户经历顺序混乱`
   - 期望：仍可整理为时间线草稿
3. `TC-03 用户存在空档期`
   - 期望：系统不跳过空档信息
4. `TC-04 用户否定叙事初稿`
   - 期望：系统允许修订并保留反馈
5. `TC-05 用户信息明显不足`
   - 期望：输出 follow-up questions，而不是强行编造
6. `TC-06 导出职业资产初稿`
   - 期望：输出 Markdown 结构化文档，且包含约定的四部分

## 7. 放行条件

进入正式实现前，至少要求：

1. `TC-01` 到 `TC-05` 都有明确的人工验证方法
2. spec 与 architecture 中的输入输出定义一致
3. 团队确认第一轮验证优先使用模拟样本

## 8. 结果记录

当前状态：

- QA 条目已补齐到 review 版
- 纸面验证已完成，详见：
  [2026-04-03-paper-validation-report.md](/Users/xinran/Downloads/dev/mindsync/projects/aicareer/qa/2026-04-03-paper-validation-report.md)
