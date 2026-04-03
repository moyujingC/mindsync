# AI-Mandala 迁移范围与工作区草案

> 状态：draft
> 版本：0.1.0
> owner：CEO / Orchestrator
> last_updated：2026-04-04
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/company/projects/一镜一梳/AI-Mandala-迁移范围与工作区草案.md
> 项目：aimandala
> 阶段：problem-framing
> depends_on：/Users/xinran/Downloads/dev/mindsync/company/projects/一镜一梳/PROJECT.md
> reviewers：Architect, Engineer, Test / QA

## 1. 背景

`AI-Mandala` 当前仍停留在历史仓库中，已经影响继续开发。

问题不只是代码位置分散，而是：

- 当前主开发入口不在 `mindsync`
- 旧结构不利于继续落实 `Harness Engineering`
- 如果在旧结构里继续推进，实现、文档和协作边界会继续变乱

因此本轮迁移的目标，不是一次性把全部历史内容并入 Monorepo，而是先把最需要继续开发的主线迁入一个可治理、可持续演进的工作区。

## 2. 本轮迁移目标

本轮只解决三件事：

1. 让 `AI-Mandala` 在 `mindsync` 中恢复为可继续开发的正式项目工作区。
2. 明确当前真正要承接的产品主线与实现边界。
3. 让后续 Codex / Claude Code 可以直接在新工作区推进，而不必等待 Paperclip 面板工作流先跑通。

本轮不要求：

- 立即接入 Paperclip 面板作为主开发入口
- 一次性迁完所有历史代码、脚本和资产
- 为暂不推进的产品线提前设计完整目录

## 3. 当前迁移口径

当前口径明确拆成两层：

1. `迁入 mindsync`
   - 为了恢复受治理的直接开发
2. `接入 Paperclip 面板`
   - 作为后续流程成熟后的下一步

两者不绑定同时发生。

当前阶段默认开发方式是：

- 在 `projects/aimandala/` 中维护项目结构
- 使用 Codex / Claude Code 直接协作开发
- 暂不把 `AI-Mandala` 当作 Paperclip 面板试点项目

## 4. 迁入范围

本轮迁入范围限定为：

1. To C 主产品
2. 支撑 To C 主产品所必需的 `V2` 生产级能力
3. 对应的正式项目文档、运行说明、测试入口和最小实现

这里的关键判断标准不是“历史仓库里是否存在”，而是“是否属于当前继续开发所必须的稳定主线”。

## 5. 暂不迁入范围

以下内容默认暂不迁入：

1. To B 产品
2. Studio 相关产品或工作台
3. `V3` 实验级 API
4. 内部工具
5. 与当前 To C 主产品无直接依赖的历史脚本和实验资产

这些内容不是被否定，而是暂时不进入本轮 Monorepo 主线，以避免把多产品线、多 API 版本和内部运维语义混入第一批工作区。

## 6. 迁移原则

本轮迁移默认遵守以下原则：

1. 先迁边界，再迁实现。
2. 先迁当前主线，再迁旁支能力。
3. 先承接稳定能力，不把实验线直接并入正式工作区。
4. 先保证可继续开发，不追求一次性迁全。
5. 迁入 `mindsync` 不等于立即切换到 Paperclip 面板开发。

## 7. 推荐工作区结构

`AI-Mandala` 当前不建议整仓照搬历史结构，也不建议为未来所有产品线先铺空目录。

推荐先采用以下最小结构：

```text
projects/aimandala/
  PROJECT.md
  README.md
  docs/
    specs/
    tasks/
    qa/
    decisions/
    delivery/
  toC/
    app/
    domain/
    tests/
    data/
  fixtures/
  notes/
```

说明：

- `docs/`
  - 承接正式 artifact，避免和实现目录并排散落
- `toC/`
  - 当前只承接 To C 主产品主线
- `fixtures/`
  - 放模拟样本、验收样例和测试输入
- `notes/`
  - 放临时笔记，不替代正式 artifact

当前不预建：

- `business/`
- `studio/`
- `internal/`
- `v3/`

如果未来这些方向需要进入 Monorepo，应基于新的项目边界再决定是扩展 `aimandala`，还是拆成独立对象。

## 8. 迁移顺序建议

建议按以下顺序执行：

1. 补齐 `projects/aimandala/PROJECT.md`
   - 写清当前开发方式、固定必读和迁移范围
2. 建立最小目录骨架
   - 先建 `docs/`、`toC/`、`fixtures/`、`notes/`
3. 从历史仓库筛出 To C 主产品相关文档
   - 先迁项目定义、核心流程说明、运行说明
4. 再迁最小实现
   - 只迁当前继续开发必需的代码和测试
5. 最后补 QA 与 delivery 记录
   - 确保后续 handoff 可追溯

## 9. 当前未决问题

以下问题暂时保留，不阻塞第一批迁移：

1. `V2` 生产级能力在目录中是内嵌于 `toC/`，还是后续单独抽象。
2. To B / Studio 后续是作为 `aimandala` 子线存在，还是拆成新对象。
3. `V3` 实验线未来是归档、继续并行，还是转成独立实验工作区。

这些问题都应在第一批主线迁移完成后再处理，不应反向阻塞当前恢复开发。
