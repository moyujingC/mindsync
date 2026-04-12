# 文档治理规范

> 状态：current
> 版本：0.1.0
> owner：CEO / Orchestrator
> last_updated：2026-04-04
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/DOCS_GOVERNANCE.md

这份文档定义 `墨予镜` 在 `mindsync` Monorepo 中如何落实 `Harness Engineering`、`SDD`、`TDD` 与 `Docs As System`。
它只负责定义正式文档如何写、如何分类、如何进入 handoff，不负责维护公司对象清单或目录结构主数据。

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

### 2.1 适用边界

- 第一方正式文档
  - 默认指仓库根目录治理文档、`company/`、`projects/`、`shared/` 中承担规则、项目入口、执行计划、验证、交付、决策职责的文档
  - 应遵守本规范并补齐最少元数据
- 外部参考资料
  - 例如 `external/` 或明确标注为外部来源镜像的资料
  - 可不强制补齐全部元数据，但不应被当成第一方当前规则入口

## 3. 状态约定

正式文档统一使用以下状态之一：

- `draft`
  - 正在编写或尚未评审
- `in_review`
  - 已提交审阅，等待确认
- `working`
  - 当前窗口中的操作文档或执行中材料，可用于推进，但不应默认视为长期规则
- `current`
  - 当前生效的正式版本
- `historical-reference`
  - 历史案例、复盘或纠偏材料，可参考，但不应默认当前化
- `archived`
  - 保留历史记录，但不再作为默认入口
- `superseded`
  - 已被新文档替代

### 3.1 状态使用约束

- `current`
  - 只用于当前生效的规则、入口、结论或项目定义
- `working`
  - 只用于当前阶段的操作文档、整改表、试跑说明或窗口材料
- `historical-reference`
  - 只用于历史纪要、案例复盘、单任务纠偏记录

默认不应：

- 把一次性整改表标成 `current`
- 把历史复盘文档放进固定必读入口
- 把仍在执行中的操作文档冒充长期规则

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
- 公司对象注册表
  - 放在 `company/项目注册表.yaml`
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

对象类型、对象状态、入口路径和历史来源不在这里维护；
这些主数据统一以 `company/项目注册表.yaml` 为准。

## 6. Harness Engineering 最小检查项

每次重要工作都要检查：

1. 结构是否清晰
2. 边界是否明确
3. artifact 是否有唯一入口
4. 文档是否能支持下一棒 handoff
5. 变更是否可追溯
6. 是否避免了隐藏依赖和隐含约定

### 6.1 handoff artifact 的最小约束字段

凡是要交给下一角色继续推进的正式 artifact，除了目标和产物外，还应尽量写清：

- 本次任务级别：`全局定义` / `局部实验` / `执行落地`
- 继承的项目假设、已有分析和未决问题
- 本轮允许变化的范围
- 本轮禁止改写的范围
- 如反对上游结论，反对依据与反证材料

如果这些字段缺失，下游角色很容易把局部探索误做成全局重定义。

推荐直接复用：

- [company/跨角色-Handoff-模板.md](/Users/xinran/Downloads/dev/mindsync/company/跨角色-Handoff-模板.md)

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

如果某个阶段只是为了验证局部假设，而不是改写整个项目定位，对应 artifact 必须显式写出“局部实验”属性；
否则默认视为沿用现有上游分析与项目假设，而不是允许下游静默改写目标用户、人群年龄层或产品初衷。

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

- 对象新增、停用、改名、改类型
  - 更新 `company/项目注册表.yaml`
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

## 11. 文档清理与归档

- 当前入口文档不应继续使用“迁移中”“旧仓库仍为主入口”之类的当前态表述
- 历史计划、阶段交付、迁移纪要应改为 `historical-reference`、`archived` 或 `superseded`
- 被归档文档应显式写明“仅供历史追溯，不再更新”
- 删除文档前，应先确认：
  - 内容已被正式文档覆盖
  - 不再承载关键决策证据
  - 仓库内不存在仍依赖它的默认入口引用
