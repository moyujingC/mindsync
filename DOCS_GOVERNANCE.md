# 文档治理规范

> 状态：current
> 版本：0.3.0
> owner：CEO / Orchestrator
> last_updated：2026-05-06
> source_of_truth：DOCS_GOVERNANCE.md

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

### 2.2 仓库级扫描边界与排除项

仓库级文档治理、README 扫描、状态盘点与报表统计时，默认采用以下边界：

- 默认纳入治理扫描
  - 仓库根目录治理文档
  - `company/`
  - `projects/`
  - `shared/` 中承担第一方规则、机制说明、运行说明、模板职责的文档
- 默认排除
  - `node_modules/`
  - `.pytest_cache/`
  - 构建产物、缓存目录、临时输出目录
  - 第三方依赖包自带 `README`
  - vendor / generated / 镜像资料中的说明文档
- 外部资料与镜像资料
  - 可作为引用输入
  - 但不纳入第一方 `状态`、`current`、canonical 入口治理基线

这条规则的目标是避免后续做仓库级盘点时，被依赖包说明、缓存目录或第三方镜像资料干扰。

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

- [company/跨角色-Handoff-模板.md](./company/跨角色-Handoff-模板.md)

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

## 12. 文件命名与日期规则

文件名中的日期不是默认规范，而是文档类型的表达。

核心原则：

- 长期生效、唯一入口、默认应持续维护的正式文档，不应带日期前缀
- 阶段性产物、证据链、历史记录、决策记录，可以带日期前缀
- `current` 只表示当前生效，不自动等于“应该继续保留日期文件名”

### 12.1 必须使用无日期文件名的 canonical 文档

以下文档默认应使用无日期文件名，并持续维护同一份文件：

- 公司治理规则
- 项目入口 `PROJECT.md`
- 目录入口 `README.md`
- 长期维护的正式 `spec`
- 长期维护的正式 `architecture`
- 长期维护的正式 `runbook`
- 公司级机制说明、系统总览、使用说明
- 长期有效的项目定义、研究方向、方法模型、总览性母文档

判断标准：

- 它是不是默认入口
- 它是不是同一主题的唯一权威版本
- 它是不是应持续迭代，而不是完成一次窗口后封存

只要答案是“是”，就不应继续使用日期文件名滚动维护。

### 12.2 允许保留日期文件名的阶段与历史文档

以下文档默认允许保留日期前缀：

- `tasks`
- `qa`
- `delivery`
- `handoff`
- `verification`
- `research`
- `content`
- `fixtures`
- `notes`
- `decisions / ADR`
- 事故复盘、阶段纪要、窗口记录、样例输出

这类文档的职责是记录某一轮计划、验证、交付、判断和证据链，天然具有时间边界。

默认不应为了“文件名整洁”把这些阶段文档强行改成无日期名称。

### 12.3 状态与命名关系

- `current`
  - 表示当前生效，不表示必须带日期
- `working`
  - 默认允许带日期，因为通常对应当前窗口材料
- `historical-reference` / `archived` / `superseded`
  - 允许保留日期，用于追溯历史上下文

如果一份日期文档被持续当作默认入口或长期真理源使用，应将它升级为无日期 canonical 文档，而不是继续在原日期文件上长期滚动。

### 12.4 canonical 升级与兼容迁移规则

当日期文件被认定为长期单一真理源时，统一采用以下迁移模式：

1. 识别该文档已经承担长期入口职责
2. 创建无日期 canonical 文件
3. 把正式内容迁入 canonical 文件，并更新 `source_of_truth`
4. 原日期文件改为短 stub
5. 原日期文件状态设为 `superseded`，并显式指向 canonical 文件
6. 更新 `PROJECT.md`、`README.md` 和默认阅读路径中的引用

旧日期文件的 stub 至少应写明：

- 它已迁移
- 当前正式入口在哪里
- 旧路径仅保留为兼容入口

### 12.5 元数据与入口约束

- canonical 文档的 `source_of_truth` 必须指向无日期路径
- 旧日期文件可使用 `superseded_by`
- 如有必要，canonical 文档可使用 `supersedes`
- `PROJECT.md` 与目录 `README.md` 只能把无日期 canonical 文档列为默认入口
- 日期文件最多作为历史背景、前序版本或证据链引用

默认不允许同时存在两份都承担默认入口职责的同义 canonical 文档。

## 13. 路径引用规则

正式文档中默认不使用机器相关、worktree 相关或会话相关的绝对路径。

统一要求：

- 文档元数据中的 `source_of_truth`、`depends_on`、`superseded_by`
  - 默认使用 `repo-relative` 路径
- 文档正文中的文件引用
  - 默认使用相对路径或相对链接
- 命令示例中的仓库位置
  - 默认使用 `$REPO_ROOT`、`$PROJECT_ROOT` 等稳定变量表达

默认禁止：

- `/Users/...`
- `/home/...`
- 含 `worktrees/...` 的会话路径
- 其他随机器、用户名、工作树切换而失效的绝对路径

原因：

- 绝对路径会在切换 worktree、换机器、换用户名后失效
- 正式文档应表达长期有效的仓库位置，而不是当前会话环境

推荐写法：

- 元数据
  - `source_of_truth：projects/aimandala/docs/specs/2026-04-18-报告链路保真重构总规格.md`
- 正文链接
- `[架构总览](./projects/aimandala/docs/architecture/架构总览.md)`
- 命令
  - `cd "$REPO_ROOT/projects/aimandala/toC/app/frontend"`

例外：

- 聊天界面中的可点击文件引用可继续使用绝对路径，因为那属于客户端展示约束，不属于仓库文档规范

## 13.1 递进文档链接化规则

当某份正式文档正文里列出了“后续可拆分文档”“建议拆分项”或同类后续入口时，默认规则如下：

1. 这些文档在尚未落地前，可先保留纯文本占位
2. 一旦对应文档已实际创建并进入正式目录，应将上游占位项原地改写为 Markdown 链接
3. 若后续文档已升级为 canonical 入口，应优先链接到其无日期 canonical 文件
4. 若后续文档仍是阶段性材料，则链接到其当前正式文件即可

默认目的：

- 让上游文档持续充当索引
- 让读者从“建议项”直接跳到“已落地文档”
- 避免长期保留只读不跳转的旧占位文本

默认不做：

- 不要求所有建议项在创建前就强制链接
- 不把尚未落地的想法提前伪装成已有文档
- 不在链接化时改变原有文档职责，只更新导航入口

## 14. 阶段文档状态收紧规则

在第二阶段治理中，除了文件名，还必须收紧带日期阶段文档的状态语义。

核心原则：

- 带日期文档可以保留
- 但一次性计划、周清单、交付记录、纠偏说明，不应长期维持 `current`
- `current` 主要保留给长期入口、长期规则、长期 spec / architecture，以及当前正式验收基线

### 13.1 tasks

- `working`
  - 用于当前窗口仍在执行的计划、实施单、整改表、运行清单
- `historical-reference`
  - 用于已完成、仅保留追溯价值的任务计划
- `superseded`
  - 用于已被新计划替代的旧计划

默认不应：

- 把已经执行完的实施计划长期保留为 `current`

### 13.2 qa

带日期的 `qa` 文档状态规则如下：

**默认规则**
- 带日期的 `qa` 文档默认状态预算为 `historical-reference`

**例外规则**
- 只有该文档在当前窗口中明确承担正式验收基线职责时，才允许短期使用 `current`

**收束规则**
- 若一份带日期 `qa` 文档持续承担长期正式验收入口职责，必须升级为无日期 canonical 文档
- 验证记录、纸面验证、readiness check、单轮验收结论默认不应长期占用 `current`

当前验证总入口可短期为 `current` 或 `working`，但不应长期维持。

### 13.3 delivery

**默认规则**
- 带日期的 `delivery` 文档默认状态预算为 `historical-reference`

**例外规则**
- 只有该交付文档本身就是当前长期交付入口时，才允许短期使用 `current`

**收束规则**
- 若一份带日期 `delivery` 文档持续承担长期交付入口职责，必须升级为无日期 canonical 文档
- 窗口总结、阶段样例输出、试跑记录默认不应长期占用 `current`

### 13.4 handoff

- `working`
  - 当前交接窗口仍在推进时可使用
- `historical-reference`
  - 交接完成后应切换为历史参考

默认不应：

- 把已完成的 handoff 长期维持为 `current`

### 13.5 weekly plan / weekly execution

- `working`
  - 当前周窗口内的执行清单、周计划、周节奏文档
- `historical-reference`
  - 周期结束后保留追溯

默认不应：

- 把某一周的执行清单长期标为 `current`

### 13.6 一次性纠偏说明与治理说明

- 若内容已经沉淀为长期协作规则：
  - 升级为无日期 canonical 文档
  - 原日期文档改为 `superseded`
- 若只记录某一次事件纠偏：
  - 保留日期
  - 改为 `historical-reference`

### 13.7 依赖链引用规则

阶段文档引用长期真理源时：

- `depends_on` 应优先指向无日期 canonical 文件
- 正文中的默认入口链接也应优先指向无日期 canonical 文件
- 旧日期 stub 不应继续作为默认上游依赖

## 15. 目录级状态预算

状态治理不只看文档类型，也看目录职责。

默认预算如下：

### 14.1 `company/` 根级治理文档

- 默认允许 `current`
- 若带日期且仍承担长期维护职责，必须 canonical 化
- 不应把一次性纪要、窗口材料长期放在根治理入口

### 14.2 `company/projects/*/`

- `PROJECT.md`、长期规则、长期运行机制可为 `current`
- 周计划、周执行、纠偏纪要默认不应长期为 `current`
- 若某份日期文档持续承担项目默认入口，应升级为无日期 canonical

### 14.3 `projects/*/specs/`

- 母文档、长期 addendum、当前正式 spec 可为 `current`
- readiness check 不应长期为 `current`
- 旧阶段 spec 补充说明若仍只服务某次窗口，应保留日期并降级状态

### 14.4 `projects/*/architecture/`

- 总览、长期架构、当前正式结构说明可为 `current`
- 历史对比稿、过渡方案、一次性整改记录默认不应长期为 `current`

### 14.5 `projects/*/runbooks/`

- 长期联调入口、长期运维入口可为 `current`
- 一次性操作记录、迁移操作纪要、临时排障记录默认应为 `working` 或 `historical-reference`

### 14.6 `projects/*/tasks/`

- 默认状态预算为 `working`
- 只有当前唯一执行母计划才允许短期为 `current`
- 其他已完成计划应改为 `historical-reference` 或 `superseded`

### 14.7 `projects/*/qa/`

- 只有当前正式验收基线可为 `current`
- 当前验证总入口可短期为 `current` 或 `working`
- 验证记录、纸面验证、readiness check 默认应为 `historical-reference`

### 14.8 `projects/*/delivery/`

- 默认状态预算为 `historical-reference`
- 只有该文档本身被明确维护为当前长期交付入口时，才允许为 `current`
- 一次性交付记录、发布记录、阶段总结不应大面积长期占用 `current`

### 14.9 `projects/*/handoff/`

- 默认状态预算为 `working` 或 `historical-reference`
- 当前交接窗口结束后，应尽快从 `working` 切到 `historical-reference`

### 14.10 `projects/*/decisions/`

- `current` 允许保留
- ADR 的“当前有效”语义成立，因此可存在多份当前有效决策
- 但应避免把普通阶段纪要放进 `decisions/` 冒充 ADR

### 14.11 `projects/*/templates/`

- 默认允许 `current`
- 模板本身承担长期复用职责，应维护为少量稳定入口

### 14.12 `projects/*/kb/`

- 当前仍作为长期知识资产使用的条目可为 `current`
- 候选条目、过时版本、临时摘录应使用更保守状态，不应默认全部 `current`

## 16. 入口文档模板

### 15.1 `PROJECT.md`

项目入口默认应明确写出：

- 项目是什么
- 当前阶段
- 长期 canonical 文档
- 当前窗口材料
- 历史资料入口

如有必要，可补充：

- 少量当前默认跳转
- 极少量关键协作约束

`PROJECT.md` 的职责不是罗列所有文件，而是把默认阅读路径分成“长期规则”“当前窗口”“历史追溯”三层。

减法原则：

- 默认只保留少量类别跳转，不展开长串 10+ 文件清单
- 不重复下一级目录 `README.md` 已承担的详细阅读顺序
- 不在同一份 `PROJECT.md` 中重复列出同一组 canonical 文档
- 公司侧 `company/projects/*/PROJECT.md` 只保留公司视角定位、边界、项目工作区跳转、内容资产入口与历史入口
- 项目工作区 `projects/*/PROJECT.md` 只保留项目骨架入口，不承担目录级详细索引

如果某个项目暂时没有成熟的下一级目录入口，才允许 `PROJECT.md` 暂时保留少量直链。

### 15.2 目录 `README.md`

目录入口默认应明确写出：

- 这个目录放什么
- 这个目录不放什么
- 当前 canonical 文档
- 当前阶段性文档
- 历史资料入口
- 默认阅读顺序

如果一个目录天然会有很多日期文件，`README.md` 还应解释：

- 为什么这些文件保留日期
- 为什么它们不应全部标为 `current`

### 15.3 canonical 母文档

长期 canonical 文档默认应明确写出：

- 目标
- 边界
- 当前正式口径
- 与其他文档的关系
- 后续变更同步规则

canonical 母文档的职责是承接长期真理源，不应退化成阶段流水账。

## 17. 依赖链清扫完成定义

文档依赖链治理完成，不以“全仓没有旧文件名出现”为标准，而以“默认入口和长期依赖已切到 canonical”为标准。

完成定义如下：

- 阶段文档的 `depends_on` 若引用长期真理源，必须指向 canonical
- 正文中的默认母文档链接必须指向 canonical
- `PROJECT.md` 与目录 `README.md` 不再把 stub 当默认入口
- stub 自己保留 `source_of_truth`、`superseded_by`、兼容跳转说明，不算异常

以下情况默认不要求继续清扫：

- stub 自己的元数据
- 纯历史叙述中对旧文件名的回顾
- 工作树路径、证据快照路径、临时输出路径等非治理主路径引用

## 18. 审计清单与迁移批次

文档治理不应只靠一次性整改。

后续盘点、收口和复查时，应统一参照：

- [company/文档治理审计清单.md](./company/文档治理审计清单.md)

### 17.1 迁移批次定义

默认按以下批次推进，而不是全仓同时重写：

1. 批次 A：最明显的 `current` 误用
   - `delivery/` 下的一次性交付记录
   - `weekly plan / weekly execution`
   - readiness check
   - 已完成 handoff
2. 批次 B：当前正式验收基线收束
   - 每个项目只保留真正当前的 QA baseline 和验证总入口
   - 其余验证记录降为 `historical-reference`
3. 批次 C：当前执行母计划收束
   - `tasks/` 中只保留当前唯一执行母计划为 `current` 或 `working`
   - 其他已完成计划改为 `historical-reference` 或 `superseded`

### 17.2 审计问题清单

每次治理至少检查：

- 当前 `current` 是否过量
- 是否仍有长期真理源带日期
- 默认入口是否仍指向 stub
- `PROJECT.md` / `README.md` 是否缺少 canonical 清单
- 周计划、交付记录、readiness check 是否长期占用 `current`
- vendor / generated / 第三方 README 是否被误纳入治理视野

## 19. AI-Ready 文档特征

本规范定义的文档系统最终服务于 AI 协作。一份 AI-Ready 的文档应满足以下六个特征：

| 特征 | 含义 |
|------|------|
| **不冗余** | 一个事实只在一处，过程与结论分离 |
| **不重复** | 每个文件职责清晰，不交叉描述同一件事 |
| **不矛盾** | 有明确的权威链，以最新/current 版本为准 |
| **可执行** | 有明确的验收条件和边界约束 |
| **有边界** | 声明依赖和上下文，不让 AI 猜 |
| **可发现** | 有 AI 专用导航索引，不让 AI 翻目录 |

### 19.1 权威链

当文档之间存在矛盾时，按以下权威链解决：

```
1. 实际代码          → 真相之源
2. specs/           → 模块契约（由代码验证）
3. progress.md      → 当前状态摘要
4. decisions/       → 为什么这么做的理由
5. README           → 入门指南
6. research/        → 参考材料（可能有偏差）
```

### 19.2 冗余检查要点

文档中的冗余通常表现为：

- 同一主题的多次讨论、修改记录、备选方案堆叠
- 带 TODO、计划、考虑中 超过 3 个月的文档未决策
- 过长的 sprint log、变更历史未移入 archive
- 划掉的内容保留过多

### 19.3 AI 导航索引

关键入口文档应提供 AI 专用导航索引，例如：

```markdown
# AI 导航索引

## 执行任务前必读
- [progress.md](progress.md) — 当前状态总览

## 模块操作
- 添加新模块 → [specs/README.md](specs/README.md)
- 修改现有模块 → 对应的 specs/xxx.md

## 不要读（会误导）
- archive/ 下的文件是历史记录，不代表当前状态
```

## 20. 治理执行层

本规范定义"规则层"，配套的"执行层"由 `doc-governance` skill 负责。

| 层次 | 文件 | 职责 |
|------|------|------|
| 规则层 | `DOCS_GOVERNANCE.md` | 定义"应该怎样" |
| 执行层 | `doc-governance` skill | "怎么检查并修复" |

### 20.1 治理触发机制

治理采用事件驱动，不强制定时：

| 触发时机 | 动作 |
|---------|------|
| 发现文档矛盾 | 调用 `doc-governance` 诊断并修复 |
| 代码重大变更 | 调用 `doc-governance` 同步检查 spec |
| 新决策确定 | 调用 `doc-governance` 更新 decisions |
| 每周/每月 | 人工手动调用 `doc-governance` 做健康检查（可选） |

### 20.2 扫描工具

辅助扫描脚本位于：

```
projects/research-center/skills/doc-governance/scripts/scan.py
```

脚本可检查：
- 链接失效
- 状态字段缺失
- 冗余关键词
- 重复标题

### 20.3 治理报告

治理完成后应生成报告，使用模板：

```
projects/research-center/skills/doc-governance/templates/治理报告-模板.md
```
