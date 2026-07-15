# 经验到系统三层 Skill 使用说明

> 状态：draft
> 版本：0.1.0
> owner：CEO / Research & Knowledge Lead
> last_updated：2026-07-15
> 项目：知行AI服务

这套机制用于把分散经验转成 `知行AI服务` 自己可执行的业务系统。

它不限定经验来源。当前阶段主要来自外部同行帖子，是因为新业务还缺少足够内部样本；以后也可以来自客户沟通、交付复盘、销售记录、会议纪要和内部项目记录。

## 1. 实现原理

整体分三层：

```text
单篇材料
  -> 单篇录入：采矿 + 初筛 + 少量补丁
  -> 纵向复盘：跨材料对比 + 模式提炼 + 候选规则
  -> system 重构：把确认后的规则写进业务系统
```

对应三个 skill：

```text
ai-service-reference-ingest
  单篇录入

experience-to-system-synthesis
  纵向复盘

system-refactor-from-synthesis
  system 重构
```

核心原则：

```text
references 负责不丢材料
synthesis 负责跨材料炼钢
system 负责当前业务执行
```

## 2. 三个目录的分工

```text
projects/ai-service-studio/references/
```

保存单篇材料：

- 原文 / OCR 原文
- 单篇参考
- 单篇 system 影响判断
- 是否进入纵向复盘的建议

```text
projects/ai-service-studio/synthesis/
```

保存阶段性纵向复盘：

- 多篇材料对比
- 反复出现的模式
- 单篇支持的信号
- 互相冲突的判断
- 可升级到 system 的规则
- 暂不升级的候选规则

```text
projects/ai-service-studio/system/
```

保存当前业务操作系统：

- 产品体系
- 获客与售前 SOP
- 报价与服务边界
- 合同条款清单
- 零案例获客与模拟案例打样
- 最快启动最小闭环

## 3. Skill 一：ai-service-reference-ingest

### 什么时候调用

自动调用条件：

- 用户给出企业 AI 服务、AI 培训、AI 工作流、获客销售、报价合同、交付案例等材料。
- 用户明确要求录入参考、补充帖子、跑 `$ai-service-reference-ingest`。

手动调用方式：

```text
/ai-service-reference-ingest
```

### 做什么

- 生成可读 Markdown 原文。
- 生成业务转译参考。
- 更新 `PROJECT.md` 链接。
- 判断 `system_update_level`。
- 必要时只做轻量 system 补丁。

### system_update_level

每篇参考必须判断：

```text
none
candidate
patch
```

`none`：

- 只留档，不改 system。
- 材料弱、重复、冲突或暂不适合当前业务。

`candidate`：

- 暂不改 system。
- 进入后续纵向复盘候选。
- 适合单篇有启发但还需要跨材料验证的内容。

`patch`：

- 立刻小幅更新 system。
- 只用于影响下一次获客、售前、报价、交付动作，或明确收紧风险边界的内容。

### 不做什么

- 不默认把每篇材料都写进 system。
- 不把单篇新鲜观点升级成稳定规则。
- 不把未核验数字、客户成果和收入结果写成承诺。

## 4. Skill 二：experience-to-system-synthesis

### 什么时候调用

需要手动调用。

推荐触发条件：

- 累计 5-8 篇新参考。
- 多篇材料都指向同一主题。
- 多个参考文档的 `system_update_level` 是 `candidate`。
- 用户觉得 system 开始变臃肿，需要纵向复盘。
- 用户明确说“放在一起看”“纵向对比”“炼钢”“阶段性总结”。

手动调用方式：

```text
/experience-to-system-synthesis
```

### 做什么

默认输出到：

```text
projects/ai-service-studio/synthesis/YYYY-MM-DD-主题纵向复盘.md
```

它回答：

- 哪些模式反复出现？
- 哪些判断只有单篇支持？
- 哪些材料互相冲突？
- 哪些判断应该升级为 system 规则？
- 哪些旧 system 规则应删除、合并或降级？
- 哪些内容适合进入 kb？

### 不做什么

- 默认不直接改 system。
- 不把单篇经验直接升级成规则。
- 不替代 `references/` 原文留存。

## 5. Skill 三：system-refactor-from-synthesis

### 什么时候调用

需要手动调用。

触发条件：

- 已经有 synthesis 纵向复盘文档。
- 用户确认复盘结论要进入 system。
- 需要集中清理、合并、重写 system。

手动调用方式：

```text
/system-refactor-from-synthesis
```

### 做什么

- 根据 synthesis 更新 `system/*.md`。
- 合并重复规则。
- 删除过时规则。
- 把候选规则升级成当前采用规则。
- 检查 system 文件之间的冲突。
- 保留来源追溯。

### 不做什么

- 不直接读单篇帖子就改 system。
- 不把参考摘要塞进 system。
- 不扩大当前服务能力边界。

## 6. 自动调用和手动调用边界

自动 / 半自动：

- `ai-service-reference-ingest`
  - 当用户给新帖子、截图、PDF、评论，并明确要求录入参考时，可以直接执行。
  - 单篇录入后必须判断 `system_update_level`。
  - 只有 `patch` 才允许立刻改 system。

必须手动：

- `experience-to-system-synthesis`
  - 因为它需要选择主题和材料范围。
  - 不应每篇材料后自动触发。

- `system-refactor-from-synthesis`
  - 因为它会重写业务系统。
  - 必须在用户确认 synthesis 结论后执行。

## 7. 推荐工作节奏

```text
每篇新材料：
  /ai-service-reference-ingest

每 5-8 篇，或某主题材料够了：
  /experience-to-system-synthesis

确认复盘结论后：
  /system-refactor-from-synthesis
```

## 8. 和 kb 的关系

`kb` 不替代这套项目工作流。

推荐分工：

```text
references/
  单篇材料和单篇业务转译

synthesis/
  阶段性纵向复盘

system/
  知行AI服务当前业务规则

projects/research-center/kb/
  跨项目、跨角色复用的稳定知识
```

只有当某个结论超出 `知行AI服务` 项目本身，具备跨项目复用价值，才建议进入 `kb`。

## 9. 质量检查

每次单篇录入检查：

- 是否有原文。
- 是否有参考。
- 是否有 `system_update_level`。
- 是否说明是否进入纵向复盘。

每次纵向复盘检查：

- 是否列出输入材料。
- 是否区分反复模式、单篇信号和冲突判断。
- 是否输出 system 重构建议。

每次 system 重构检查：

- 是否只写当前业务要执行的规则。
- 是否清理重复，而不是只追加。
- 是否保留来源追溯。
- 是否没有写入未核验承诺。
