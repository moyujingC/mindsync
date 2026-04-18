# Docs

这里放 `一镜一梳` 的正式项目 artifact。

当前统一收敛为以下子目录：

- `specs/`
- `architecture/`
- `sources/`
- `runbooks/`
- `tasks/`
- `qa/`
- `decisions/`
- `delivery/`

这些目录按语义分层，而不是按阅读顺序编号。

其中：

- `specs/`
  - 功能定义、用户链路、页面与能力描述
- `architecture/`
  - 技术架构、信息流、模块边界
- `sources/`
  - 项目级源资料镜像、原始知识材料入口、正式依据分层与运行时映射
- `runbooks/`
  - 本地联调、运维与操作手册
- `tasks/`
  - 实施计划与阶段任务
- `qa/`
  - 验证基线与验证记录
- `decisions/`
  - 关键技术或产品决策
- `delivery/`
  - 交付记录与收口说明

使用规则：

- `sources/` 不是当前 `spec` 或 `architecture` 的替代目录
- 需要追溯知识来源、历史原文和运行时保真映射时，优先进入 [sources/README.md](sources/README.md)

当前如果要推进“报告链路保真重构”，默认从下面这组 artifact 进入：

- [specs/2026-04-18-报告链路保真重构总规格.md](specs/2026-04-18-报告链路保真重构总规格.md)
- [architecture/2026-04-18-报告链路保真重构技术方案.md](architecture/2026-04-18-报告链路保真重构技术方案.md)
- [tasks/2026-04-18-报告链路保真重构实施总计划.md](tasks/2026-04-18-报告链路保真重构实施总计划.md)
- [qa/2026-04-18-报告链路保真重构验证基线.md](qa/2026-04-18-报告链路保真重构验证基线.md)
- [delivery/2026-04-18-报告链路保真重构交付记录.md](delivery/2026-04-18-报告链路保真重构交付记录.md)

知识源追溯与运行时映射统一从这里进入：

- [sources/知识库构建/README.md](sources/知识库构建/README.md)
