# 怀瑾握瑜 MVP 技术方案

> 状态：in_review
> 版本：0.2.0
> owner：Architect
> last_updated：2026-04-03
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aicareer/specs/2026-04-02-mvp-architecture.md
> 项目：aicareer
> 阶段：architecture
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aicareer/specs/2026-04-02-mvp-spec.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 目标

为第一版 MVP 提供一个足够简单、边界清楚、可验证的实现结构。

## 2. MVP 结构边界

第一版只需要支持：

1. 用户输入基础背景
2. 多轮梳理问答
3. 结构化中间结果保存
4. 生成职业时间线摘要
5. 生成叙事主线初稿

本轮仍不包含：

- 长期记忆学习
- 多种导出格式
- 多用户协作
- 外部招聘平台集成

## 3. 模块划分

- `intake`
  - 采集用户基础背景和目标
- `conversation`
  - 负责多轮提问与回答记录
- `timeline`
  - 负责将经历整理为阶段化时间线
- `narrative`
  - 负责输出叙事主线初稿
- `review`
  - 负责用户修正与确认

推荐先按文档和逻辑模块组织，而不是过早按复杂服务拆分。

## 4. 运行主链路

建议的内部主链路：

1. `intake`
   - 收集背景、目标和当前困扰
2. `conversation`
   - 保存问答轮次和原始经历片段
3. `timeline`
   - 把原始片段整理成阶段化时间线
4. `narrative`
   - 基于时间线和目标输出叙事主线
5. `review`
   - 合并用户修正并产出最终初稿

## 5. 数据结构草案

第一版建议至少区分：

- `profile`
  - 用户目标、方向、约束、当前阶段
- `conversation_turn`
  - 每轮提问、回答、标签、时间
- `experience_item`
  - 单段经历的结构化条目
- `timeline_summary`
  - 阶段化的职业发展摘要
- `narrative_draft`
  - 当前叙事主线版本
- `review_feedback`
  - 用户修订意见
- `career_asset`
  - 最终导出的职业资产初稿

第一版 `career_asset` 输出格式默认采用 Markdown 文档，便于：

- 先验证信息结构是否成立
- 避免过早绑定前端展示形态
- 后续平滑扩展到更多导出形式

这样可以避免：

- 只有最终文本，没有过程可追踪
- 无法定位是采集问题还是生成问题
- 无法判断问题出在问答、结构化还是生成

## 6. 目录建议

如果下一步开始写实现，建议先预留：

- `projects/aicareer/app/`
  - 交互入口或原型实现
- `projects/aicareer/domain/`
  - 领域对象与流程定义
- `projects/aicareer/fixtures/`
  - 模拟履历样本
- `projects/aicareer/tests/`
  - 自动化测试

当前还没有代码，因此本轮只把目录建议写成约束，不急着落具体实现。

## 7. 阶段门

进入实现计划评审前，至少要满足：

1. MVP spec 进入 `in_review` 或 `current`
2. 数据结构草案可以支持 QA 场景
3. 主流程中每一步的输入输出已写清

进入正式实现前，至少要满足：

1. implementation plan 进入 `in_review`
2. QA 清单进入 `in_review`
3. 至少有 2 个模拟样本可用于验证

## 8. 风险点

1. 对话过长导致上下文质量下降。
2. 时间线抽取与叙事生成之间可能出现信息漂移。
3. 结构化数据如果定义不清，后续难以演进成长期资产。
4. 如果太早绑定具体技术栈，可能把讨论带偏到实现细节。

## 9. 当前建议

第一版先把流程定义和数据结构定义清楚，再决定具体技术栈与实现语言。
