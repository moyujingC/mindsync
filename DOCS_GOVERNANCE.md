# 文档治理规范

> 状态：current
> 版本：0.1.0
> owner：CEO / Orchestrator
> last_updated：2026-04-02
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/DOCS_GOVERNANCE.md

这份文档定义 `墨予镜` 在 `mindsync` Monorepo 中如何落实 `Harness Engineering`、`SDD`、`TDD` 与 `Docs As System`。

## 1. 目标

这套治理不是为了多写文档，而是为了保证：

- 每类信息都有唯一权威位置
- 每个重要阶段都有可交接 artifact
- 文档有状态、有版本、有 owner
- 项目可以从研究走到实现，再走到验证和复盘

## 2. 文档元数据要求

所有正式文档都应在开头写明最少元数据。

最低要求：

- `状态`
- `版本`
- `owner`
- `last_updated`
- `source_of_truth`

按需增加：

- `项目`
- `阶段`
- `depends_on`
- `supersedes`
- `reviewers`

## 3. 状态约定

正式文档统一使用以下状态之一：

- `draft`
  - 正在编写或尚未评审
- `in_review`
  - 已提交审阅，等待确认
- `current`
  - 当前生效的正式版本
- `archived`
  - 保留历史记录，但不再作为默认入口
- `superseded`
  - 已被新文档替代

## 4. 版本约定

正式文档采用轻量语义版本：

- `0.x`
  - 仍在快速迭代
- `1.x`
  - 结构稳定，可长期引用

版本更新建议：

- 结构或结论大改：升次版本，如 `0.2.0 -> 0.3.0`
- 明显补充或修订：升小版本，如 `0.2.0 -> 0.2.1`

## 5. 权威位置约定

- 公司规则
  - 放在 `company/` 或仓库根目录治理文件
- 项目定义
  - 放在 `projects/<project-slug>/PROJECT.md`
- 公司视角项目结论
  - 放在 `company/projects/<项目名>/`
- 正式 spec
  - 放在 `projects/<project-slug>/specs/`
- 技术决策
  - 放在 `projects/<project-slug>/decisions/`
- 执行计划
  - 放在 `projects/<project-slug>/tasks/`
- 验收与测试
  - 放在 `projects/<project-slug>/qa/`
- 交付记录
  - 放在 `projects/<project-slug>/delivery/`
- 临时笔记
  - 放在 `projects/<project-slug>/notes/`

## 6. Harness Engineering 最小检查项

每次重要工作都要检查：

1. 结构是否清晰
2. 边界是否明确
3. artifact 是否有唯一入口
4. 文档是否能支持下一棒 handoff
5. 变更是否可追溯
6. 是否避免了隐藏依赖和隐含约定

## 7. SDD 阶段门

默认阶段如下：

1. `problem-framing`
2. `research`
3. `spec`
4. `architecture`
5. `implementation-plan`
6. `implementation`
7. `verification`
8. `delivery`

每一阶段进入下一阶段前，至少要有对应 artifact：

- `problem-framing`
  - 问题定义或项目背景
- `research`
  - 研究摘要或约束输入
- `spec`
  - 产品 spec
- `architecture`
  - 技术方案或结构说明
- `implementation-plan`
  - 任务拆解
- `verification`
  - 验收标准和测试记录
- `delivery`
  - 交付说明或发布记录

## 8. TDD 落地要求

在进入实现前，必须先写出：

1. 目标行为
2. 验收标准
3. 边界情况
4. 验证方式

如果当前阶段还没有代码，也不能跳过这一步，而应先产出：

- 人工验证清单
- 未来自动化测试切入点

## 9. 变更同步规则

以下变更必须同步更新相关文档：

- 项目定位变化
  - 更新 `PROJECT.md`
- 产品范围变化
  - 更新 `specs/`
- 技术边界变化
  - 更新 `decisions/` 或技术方案
- 任务推进变化
  - 更新 `tasks/` 或 `delivery/`
- 验收结论变化
  - 更新 `qa/`

## 10. 当前执行要求

从现在开始，`怀瑾握瑜` 作为第一批完整按该流程运行的项目。

在它跑顺之前：

- 不急着迁入 `一镜一梳`
- 不跳过 `spec -> plan -> qa`
- 不让聊天记录替代正式 artifact
