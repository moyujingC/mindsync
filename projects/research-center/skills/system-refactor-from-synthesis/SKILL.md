---
name: system-refactor-from-synthesis
description: 根据知行AI服务纵向复盘结果，集中重构 projects/ai-service-studio/system，合并重复、删除过时规则、升级候选规则，并保持来源可追溯。
owner: Research & Knowledge Lead / CEO
status: draft
version: 0.1.0
skill_type: project
applies_to:
  - ai-service-studio
  - business_system
when_to_use: >
  当用户已经确认某篇 synthesis 纵向复盘结论，需要把其中的候选规则集中写入、合并或重构 projects/ai-service-studio/system/*.md 时调用。
inputs:
  - synthesis markdown
  - current system docs
  - related references links
outputs:
  - updated system docs
  - update summary
  - source traceability notes
handoff_to:
  - CEO
  - Business Lead
  - Research & Knowledge Lead
---

# System Refactor From Synthesis

## 目标

把纵向复盘中已经确认的模式和规则，写回 `projects/ai-service-studio/system/`，让 `system` 保持“当前业务操作系统”的定位。

本 skill 负责：

- 合并重复条目。
- 删除过时规则。
- 把候选规则升级成当前规则。
- 把松散段落整理成 SOP。
- 检查 system 文档之间是否冲突。
- 保留来源链接，方便追溯。

## 适用场景

- 已有 `projects/ai-service-studio/synthesis/*.md`。
- 用户明确同意按复盘结果更新 `system`。
- 当前 `system/` 已经出现重复、冲突、臃肿或需要结构调整。
- 需要把阶段性结论从“候选”升级成“当前采用口径”。

## 不适用场景

- 只有单篇新材料，尚未做纵向复盘。
- 用户只是要录入参考。
- 复盘结论尚未确认。
- 需要进入 `kb`，而不是更新项目 `system`。

## 必读上下文

1. 指定的 `projects/ai-service-studio/synthesis/*.md`
2. `projects/ai-service-studio/system/README.md`
3. 相关 `projects/ai-service-studio/system/*.md`
4. synthesis 中引用的 `references/*.md`
5. `projects/ai-service-studio/PROJECT.md`

## 执行步骤

1. 读取 synthesis，提取：
   - 可升级为 system 的规则
   - 暂不升级的候选规则
   - 应删除 / 合并 / 降级的旧内容
   - 相关来源链接
2. 读取当前 system，判断规则应落在哪些文件。
3. 对每个 system 文件执行：
   - 合并重复表达
   - 删除过时或被复盘推翻的内容
   - 把候选规则改写成当前业务可执行规则
   - 补足边界、触发条件和不包含事项
4. 检查 system 文件之间是否冲突。
5. 必要时更新 `system/README.md`。
6. 必要时更新 `PROJECT.md` 链接到 synthesis 文档。

## 写法约束

- 不把参考摘要塞进 `system`。
- 不写“某帖子说”。
- 不写未核验结果承诺。
- 不把单一来源经验写成稳定事实。
- 每条重要规则要能追溯到 synthesis 或 references。
- 优先删除和合并，不只追加。

## 输出格式

最终响应或交付说明需写清：

```markdown
## system refactor 结果

已更新：

- `system/...`：...

已合并 / 删除 / 降级：

- ...

未采纳：

- ...：原因

来源追溯：

- `synthesis/...`
- `references/...`
```

## 质量检查项

- 是否只修改 `system/`、必要的 `PROJECT.md` 和必要的 synthesis 链接。
- 是否保留来源追溯。
- 是否删除或合并重复内容，而不是继续堆叠。
- 是否没有写入未核验数字和结果承诺。
- 是否没有扩大当前服务能力边界。
- `git diff --check -- projects/ai-service-studio` 是否通过。

## Handoff 规则

完成后：

- 如果 system 规则已稳定且跨项目复用，可建议进入 `kb`，但不默认执行。
- 如果复盘发现材料不足，回到 `experience-to-system-synthesis` 或 `ai-service-reference-ingest`。
