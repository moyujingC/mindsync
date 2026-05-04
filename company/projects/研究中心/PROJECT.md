# 研究中心项目入口

> 状态：current
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-04-04
> source_of_truth：company/projects/研究中心/PROJECT.md
> 对应项目工作区：[projects/research-center](projects/research-center)
> 项目类型：公司级研究与知识能力项目

这份文档是 `研究中心` 在 `mindsync` 中的公司侧项目入口。

它用于把原本主要由 `Research & Knowledge Lead` 承担的持续研究、拆解、知识沉淀工作，升级成一个可以长期运行、可被派活、可跨角色协作的正式项目对象。

## 1. 这个项目是什么

`研究中心` 不是某一个产品，也不是单次调研任务集合。

它是 `墨予镜` 的长期研究基础设施。

它的研究主轴不是泛 AI 资讯跟踪，而是围绕公司当前业务线、内容线和能力建设，持续追踪、拆解和沉淀高价值对象。

当前重点应优先服务：

- 公司现有业务线
- 公司正在建设的产品方向
- `墨予镜` 个人 IP 的内容方向
- 能增强全公司 Agent 能力的研究主题

在这个前提下，它负责持续追踪、拆解和沉淀以下几类高价值对象：

- AI 相关高价值开源项目
- Agent、Multi-Agent、Harness Engineering、SDD、TDD 等方法实践
- 各大厂人与 AI 协作的最佳实践
- 同垂类优秀 AI 产品的产品设计与能力结构
- 同行 AI 博主、创作者和竞品账号的内容策略与选题打法
- 值得进入公司长期知识库的方法、模式、判断和机会线索

它最终服务的是：

- 公司知识库增强
- 各角色能力增强
- 产品方向启发
- 商业机会发现
- 内容选题与表达素材

## 2. 为什么要项目化

仅保留 `Research & Knowledge Lead` 这个角色还不够。

因为角色说明解决的是“谁负责”，而你现在需要的是：

- 有一个稳定入口来承接持续研究任务
- 有明确的研究主题、优先级和交付物
- 有跨角色协作机制，而不是让研究停留在单人脑中
- 有从研究到知识库、再到产品 / 内容 / 架构启发的闭环

因此这里采用：

- `Research & Knowledge Lead`
  - 作为 owner，主责研究质量与知识治理
- `研究中心`
  - 作为项目容器，承接任务、文档、阶段产物和长期资产

## 3. 当前研究范围

`研究中心` 当前至少覆盖 4 条主线：

1. 开源项目拆解
   - 聚焦 GitHub 上高价值、与 AI 强相关的框架、工具、Skill 库与应用
2. 人与 AI 协作实践研究
   - 聚焦各大厂工作流、Agent 编排、代码协作和工程方法
3. 源码级学习材料拆解
   - 例如 Claude Code 等能够帮助理解 Multi-Agent、Harness Engineering、SDD、TDD 的材料
4. 同垂类 AI 产品拆解
   - 聚焦与你当前业务方向相近的 AI 产品、交互范式、能力边界和商业启发
5. 同行内容与选题研究
   - 聚焦与你业务线和个人 IP 方向相近的 AI 博主、创作者、竞品账号及其代表作品

## 4. 固定必读

任何 Agent 第一次进入 `研究中心` 项目时，默认优先读取以下材料：

1. [PROJECT.md](company/projects/研究中心/PROJECT.md)
2. [研究方向与任务模型.md](company/projects/研究中心/研究方向与任务模型.md)
3. [研究入库连续产出运行方案.md](company/projects/研究中心/研究入库连续产出运行方案.md)
4. [2026-04-08-本周研究执行清单.md](company/projects/研究中心/2026-04-08-本周研究执行清单.md)
5. 对应项目工作区入口：[projects/research-center/PROJECT.md](projects/research-center/PROJECT.md)
6. [agents/research-knowledge-lead/AGENTS.md](agents/research-knowledge-lead/AGENTS.md)

如果任务明确偏技术抽象，还应补读：

7. [agents/architect/AGENTS.md](agents/architect/AGENTS.md)

如果任务明确需要转化为产品判断，还应补读：

8. [agents/product-spec-lead/AGENTS.md](agents/product-spec-lead/AGENTS.md)

## 5. 这里应该放什么

这里优先放：

- 研究中心的项目定义与边界
- 中长期研究方向
- 研究任务的归档入口
- 研究结论的结构化摘要
- 能影响全公司能力的知识资产入口

这里不优先放：

- 某个产品项目自己的实现细节
- 某个项目专属的临时讨论
- 未经过结构化整理的资料堆积

## 6. 与角色和其他项目的边界

- `Research & Knowledge Lead`
  - 负责研究质量、知识治理和长期资产收束
- `研究中心`
  - 负责承接持续研究任务与项目化运作
- 具体产品项目
  - 负责把研究输入转成产品范围、技术方案与实现动作

默认协作方式：

- 研究输入进入 `研究中心`
- 方法和模式沉淀进入知识资产
- 产品相关启发 handoff 给 `Product Spec Lead`
- 技术模式和系统抽象 handoff 给 `Architect`
- 可传播结论和专业素材 handoff 给 `Content Lead`

内容协作的默认边界：

- `研究中心`
  - 负责研究同行内容、选题背景、专业事实、方法判断和原创观点底稿
- `Content Lead`
  - 负责基于这些上游素材做表达转译、结构优化和传播化加工

因此，内容专业度默认应来自 `研究中心` 与其他上游角色提供的真实研究和真实判断，而不是由 `Content Lead` 自行拼接外部资料来“补专业”。

## 7. 当前一句话结论

从现在开始，`研究中心` 应作为 `墨予镜` 的正式项目存在。

以后凡是“值得长期追踪、拆解、沉淀并增强全公司能力”的研究任务，都优先落到这个项目，而不是只挂在某个角色身上。
