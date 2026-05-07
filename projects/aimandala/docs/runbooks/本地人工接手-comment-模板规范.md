# 一镜一梳本地人工接手 Comment 模板规范

> 状态：superseded
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-19
> source_of_truth：projects/aimandala/docs/runbooks/本地人工接手-comment-模板规范.md

> 2026-04-19 状态说明：
> 本文档保留为旧 phase 2 手工 handoff 流程的历史模板。
> 当前 execution routing 主路径已改为直接路由到本地执行节点，不再以 handoff comment 作为普通任务默认合同。

这份文档用于固定 `execution routing phase 2` 下的三类本地人工接手 comment 模板。

适用范围固定为：

1. `manual-review-required`
2. `local_manual_review`
3. 已被 phase 1 handoff comment 交回本地的 issue

这份模板文档不是全项目通用 comment 规范，也不是控制面 schema。

## 1. 使用规则

所有模板共同遵守：

1. 字段顺序固定
2. 措辞风格固定
3. 先描述事实，再描述动作
4. 不新增控制面语义
5. 不把模板当作新的状态机

## 2. 接手 Comment 模板

用途：

1. 表示已阅读 handoff comment
2. 表示由谁在本地接手
3. 表示将在何处处理
4. 表示下一步动作

固定模板：

```text
本地接手时间：<ISO 时间>
- 已读 handoff：是
- 本地接手人：<姓名 / 角色>
- 本地工作区：<本地路径或工作区标识>
- 当前判断：<一句话说明当前理解>
- 下一步动作：<一句话说明接下来要做什么>
```

最低字段要求：

1. `本地接手时间`
2. `已读 handoff`
3. `本地接手人`
4. `本地工作区`
5. `当前判断`
6. `下一步动作`

## 3. 验证 / 进展 Comment 模板

用途：

1. 记录当前判断
2. 记录已完成验证
3. 记录剩余阻塞
4. 记录下一步决定

固定模板：

```text
本地进展时间：<ISO 时间>
- 当前判断：<一句话说明最新判断>
- 已完成验证：<列出已做验证>
- 剩余阻塞：<若无则写“无”>
- 下一步决定：<继续推进 / 回退 / 保持 blocked>
```

最低字段要求：

1. `本地进展时间`
2. `当前判断`
3. `已完成验证`
4. `剩余阻塞`
5. `下一步决定`

使用说明：

1. 若继续保持 `blocked`，必须在 `下一步决定` 中明确写出
2. 若恢复推进，也必须写清下一步是进入 `in_progress` 还是进入审核

## 4. 完成 / 交付 Comment 模板

用途：

1. 记录本地完成结果
2. 记录验证结论
3. 记录是否已提交
4. 记录是否进入人工审核
5. 记录是否仍需 follow-up

固定模板：

```text
本地完成时间：<ISO 时间>
- 完成结果：<一句话说明做完了什么>
- 验证结论：<通过 / 未通过 / 条件通过>
- 是否已提交：<是 / 否 / 不适用>
- 是否进入人工审核：<是 / 否 / 不适用>
- 是否仍需 follow-up：<否，或写明后续事项>
```

最低字段要求：

1. `本地完成时间`
2. `完成结果`
3. `验证结论`
4. `是否已提交`
5. `是否进入人工审核`
6. `是否仍需 follow-up`

## 5. 模板与状态路径关系

模板与推荐状态路径的关系固定为：

1. 接手 comment
   - 通常对应从 `blocked` 进入 `in_progress`
2. 验证 / 进展 comment
   - 可对应继续保持 `blocked`
   - 也可对应继续推进到 `in_progress` 或 `in_review`
3. 完成 / 交付 comment
   - 通常对应 `in_review` 或 `done`

补充说明：

1. 模板不强制状态推进
2. 状态仍由人工按实际情况判断
3. 但 comment 必须与状态保持一致，不得互相冲突

## 6. 非目标

这份模板规范不做：

1. 不定义控制面新字段
2. 不定义控制面新状态
3. 不定义控制面新原因码
4. 不升级为全项目通用 comment 标准

## 7. 关联文档

1. 本地人工接手 runbook：
   - [本地人工接手-runbook.md](./本地人工接手-runbook.md)
2. phase 2 spec：
   - [../specs/2026-04-18-automation-and-local-execution-routing-phase2-local-handoff-spec.md](../specs/2026-04-18-automation-and-local-execution-routing-phase2-local-handoff-spec.md)
