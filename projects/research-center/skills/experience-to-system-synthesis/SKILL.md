---
name: experience-to-system-synthesis
description: 为知行AI服务做阶段性纵向复盘时使用；把多篇 references 参考材料放在一起对比，提炼反复模式、冲突判断、候选规则和 system 重构建议。
owner: Research & Knowledge Lead / CEO
status: draft
version: 0.1.0
skill_type: project
applies_to:
  - ai-service-studio
  - research_knowledge
when_to_use: >
  当 projects/ai-service-studio/references/ 已累计 5-8 篇新材料，或某个主题下已有足够案例，需要从单篇参考进入跨案例纵向复盘、模式提炼和 system 候选规则整理时调用。
inputs:
  - references markdown files
  - current system docs
  - optional kb atoms/wiki
outputs:
  - synthesis markdown
  - repeated patterns
  - candidate system rules
  - stale/conflicting system notes
  - optional kb atom/wiki suggestions
handoff_to:
  - CEO
  - Business Lead
  - Research & Knowledge Lead
  - system-refactor-from-synthesis
---

# Experience To System Synthesis

## 目标

把多篇单篇参考从“材料堆”炼成“可比较的业务模式和候选规则”。

本 skill 不以单篇文章为单位阅读，而是围绕一个主题纵向穿刺：

```text
多篇 references
  -> 反复出现的模式
  -> 单篇支持的信号
  -> 互相冲突的判断
  -> 可升级为 system 的规则
  -> 仍需观察的候选规则
  -> system 重构建议
```

## 适用场景

- `ai-service-reference-ingest` 已录入多篇材料。
- 某个主题已经出现多次，例如第一单路径、售前认知 gap、报价边界、交付坑点。
- `system/` 开始变臃肿，需要先复盘再重构。
- 用户明确要求“纵向复盘”“放在一起看”“炼钢”“阶段性总结”。
- 单篇参考里多个 `system_update_level: candidate` 指向同一主题。

## 不适用场景

- 只有一篇材料。
- 用户只是要求录入新参考。
- 用户已经确认具体 system 改法，此时应进入 `system-refactor-from-synthesis`。
- 当前缺少原文或参考文档，只能先回到 `ai-service-reference-ingest`。

## 必读上下文

1. `projects/ai-service-studio/PROJECT.md`
2. 本次选定的 `projects/ai-service-studio/references/*参考.md`
3. 相关 `projects/ai-service-studio/system/*.md`
4. 可选：相关 `projects/research-center/kb/wiki/ai/*.md`

## 执行步骤

1. 明确本次复盘主题。
2. 列出输入材料清单。
3. 从每篇材料提取：
   - 支持的主题
   - 新增信号
   - 反复支持的旧判断
   - 冲突或反例
   - 不适合照搬的原因
4. 跨材料比较：
   - 哪些模式反复出现
   - 哪些只被单篇支持
   - 哪些互相冲突
   - 哪些和当前 `system/` 不一致
5. 输出候选规则：
   - 可升级为 `system` 当前规则
   - 暂不升级的候选规则
   - 应删除、合并、降级的旧 `system` 内容
6. 判断是否需要进入 `kb`：
   - 是否跨项目可复用
   - 是否需要 atoms
   - 是否需要 wiki 专题

## 输出位置

默认输出到：

```text
projects/ai-service-studio/synthesis/YYYY-MM-DD-主题纵向复盘.md
```

如果目录不存在，可以创建：

```text
projects/ai-service-studio/synthesis/
```

## 输出格式

```markdown
# 主题纵向复盘

> 日期：YYYY-MM-DD
> 项目：知行AI服务
> 输入材料：
> 关联 system：
> 用途：跨材料对比，不直接等同于最终业务规则

## 1. 本次复盘问题

## 2. 输入材料清单

## 3. 反复出现的模式

## 4. 只有单篇支持的信号

## 5. 互相冲突的判断

## 6. 可以升级为 system 的规则

## 7. 暂不升级的候选规则

## 8. 应删除 / 合并 / 降级的旧 system 内容

## 9. 建议进入 kb 的 atoms / wiki

## 10. 下一步 system refactor 建议
```

## system 规则

默认不直接修改 `system/`。

本 skill 的主要产物是纵向复盘文档和 system 重构建议。只有用户明确要求“同时按复盘结果更新 system”，才可以继续修改 `system/`；否则应把修改交给 `system-refactor-from-synthesis`。

## KB 规则

可以建议进入 `kb`，但不默认写入 `kb`。

进入 `kb` 的候选必须满足：

- 不只是 `知行AI服务` 单项目临时判断。
- 至少有多个来源支持，或具备跨项目复用价值。
- 边界清楚，未核验事实不写成稳定事实。

## 质量检查项

- 是否列出了输入材料。
- 是否区分了反复模式、单篇信号和冲突判断。
- 是否避免把单篇经验直接升级为规则。
- 是否明确哪些内容可以进入 `system`，哪些暂不进入。
- 是否指出了需要删除、合并或降级的旧 system 内容。
- 是否写清下一步 handoff 给谁。
- `git diff --check -- projects/ai-service-studio` 是否通过。

## Handoff 规则

完成后可进入：

- `system-refactor-from-synthesis`：用户确认要重构 `system`。
- `knowledge-ingest`：用户确认要把部分结论进入 `kb`。
- `ai-service-reference-ingest`：发现缺少关键单篇原文或参考。
