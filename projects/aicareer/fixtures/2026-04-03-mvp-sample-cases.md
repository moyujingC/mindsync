# 怀瑾握瑜 MVP 模拟样本清单

> 状态：in_review
> 版本：0.1.0
> owner：Product Spec Lead
> last_updated：2026-04-03
> source_of_truth：projects/aicareer/fixtures/2026-04-03-mvp-sample-cases.md
> 项目：aicareer
> 阶段：verification-prep
> depends_on：projects/aicareer/specs/MVP产品规范.md
> reviewers：CEO / Orchestrator, Test / QA

这份文档定义 `aicareer` 第一轮纸面验证使用的模拟样本。

## 1. 目标

为 MVP 流程提供最小但足够有代表性的验证输入，确保 spec、architecture 和 QA 不是只停留在抽象描述。

## 2. 样本选择原则

样本至少要覆盖：

1. 跨行业转型
2. 空档期或职业断裂
3. 失败项目或复杂情绪负担

## 3. 样本一：跨行业转型

- 年龄段：39
- 背景：互联网运营转向职业教育内容策划
- 特征：
  - 过往经历较多，岗位名称不统一
  - 想做转型，但说不清自己核心优势
- 用途：
  - 验证时间线整理能力
  - 验证叙事主线是否能把“转型”说清楚

## 4. 样本二：存在空档期

- 年龄段：43
- 背景：传统制造业中层，离职照顾家庭后尝试重返职场
- 特征：
  - 有 2 年以上空档期
  - 对如何解释空档感到压力很大
- 用途：
  - 验证系统是否保留而非掩盖空档信息
  - 验证 follow-up questions 是否能继续追问真实约束

## 5. 样本三：失败项目后重建叙事

- 年龄段：37
- 背景：创业失败后重新求职的产品经理
- 特征：
  - 对失败经历敏感
  - 容易在表达时回避关键事实
- 用途：
  - 验证系统是否避免过度美化
  - 验证 review 环节是否允许用户逐步修正

## 6. 使用方法

第一轮纸面验证时，每个样本都应至少走一次：

1. intake
2. exploration
3. structuring
4. review
5. export

每轮走查都要记录：

- 原始输入是否足够
- 中间结果是否失真
- follow-up questions 是否合理
- narrative draft 是否忠实且可用

## 7. 下一步

如果这 3 个样本都能支持纸面验证，再进入第一版实现任务定义。

默认验证输出形式：

- `career_asset` 采用 Markdown 结构化文档
