# 参考材料系统每日整理 Routine SPEC

> 状态：draft
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-04-05
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/research-center/specs/2026-04-05-参考材料系统每日整理-Routine-SPEC.md
> 项目：研究中心
> 阶段：spec
> depends_on：
> - /Users/xinran/Downloads/dev/mindsync/projects/research-center/specs/2026-04-05-参考材料摄取与偏好记忆系统-SPEC.md
> - /Users/xinran/Downloads/dev/paperclip/skills/paperclip/references/routines.md

这份文档定义“参考材料系统每日整理”在 Paperclip 中的第一版 routine 设计。

目标不是立刻接好所有自动化，而是先定义稳定的 routine 语义、输入、输出和边界。

## 1. 目标

每日 routine 主要承担四件事：

1. 更新偏好记忆中的稳定模式候选
2. 对知识库做去重与重链建议
3. 对候选条目做升格或归档建议
4. 产出一份待人工确认的维护报告

## 2. routine 定位

这不是内容发现 routine，也不是内容发布 routine。

它是：

- 知识整理 routine
- 偏好记忆维护 routine
- 后台 maintenance routine

## 3. 建议 assignee

建议 assignee：

- `Research & Knowledge Lead`

原因：

- 本 routine 的主工作对象是知识库和偏好记忆
- 其核心职责属于研究中心的长期知识治理

## 4. 建议 project

建议 project：

- `研究中心`

## 5. 建议触发方式

第一版建议只开一个 `schedule` trigger。

建议运行频率：

- 每天 1 次

建议时段：

- 北京时间凌晨或清晨，避开人工高频编辑时段

示例：

- `cronExpression`: `30 5 * * *`
- `timezone`: `Asia/Shanghai`

## 6. 建议并发策略

建议：

- `concurrencyPolicy`: `coalesce_if_active`

原因：

- 知识整理不需要并发堆积
- 上一轮未处理完时，新的触发应合并，而不是继续排队

## 7. 建议 catch-up 策略

建议：

- `catchUpPolicy`: `skip_missed`

原因：

- 每日整理属于维护型任务
- 若错过一天，不需要补跑多次历史任务

## 8. 输入范围

routine 每次最少扫描：

- `/Users/xinran/Downloads/dev/mindsync/projects/research-center/kb/`
- `/Users/xinran/Downloads/dev/mindsync/projects/research-center/kb/preference-memory/`
- 近期新增的 reference review 样例或正式 review 记录

建议时间窗口：

- 过去 24 小时新增
- 必要时可回看过去 7 天用于聚类判断

## 9. 执行逻辑

每次 routine 运行时，建议按下面顺序：

1. 读取 `MEMORY.md`
2. 读取 `review-patterns.yaml`
3. 扫描最近新增的 review events
4. 扫描最近新增的知识条目
5. 运行 `knowledge-relink-maintenance`
6. 输出维护报告
7. 如有必要，创建待人工确认的 follow-up issue

## 10. 输出物

每次 routine 最小输出：

- 一份 maintenance report

建议落位：

- `projects/research-center/delivery/`

命名建议：

- `YYYY-MM-DD-参考材料系统每日整理报告.md`

## 11. 自动与人工边界

routine 当前可以自动完成：

- 扫描
- 去重建议
- 重链建议
- 升格候选识别
- 归档候选识别

routine 当前不应自动完成：

- 删除正式知识条目
- 把候选原则直接升格为正式原则
- 覆盖 `MEMORY.md` 中的 hard constraints

这些动作默认仍需人工确认。

## 12. 失败与降级策略

若 routine 运行时发现：

- 输入目录缺失
- 无新增 review 事件
- 当前无可整理条目

仍应输出最小报告，至少写清：

- 扫描范围
- 无变化原因
- 是否需要人工补样本

## 13. 第一版验收标准

这份 routine spec 达标的最小标准：

1. 明确 assignee、project、trigger、并发策略和 catch-up 策略。
2. 明确 routine 读取哪些输入。
3. 明确 routine 输出什么报告。
4. 明确哪些动作可自动执行，哪些必须人工确认。

