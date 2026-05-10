# Docs

> 状态：current
> 版本：0.1.0
> owner：CEO / Orchestrator
> last_updated：2026-05-10
> source_of_truth：projects/aimandala/docs/README.md

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

当前如果要推进“报告生成方法 / 知识保真 / 报告重建”，默认从下面这组 artifact 进入：

- [sources/知识库构建/三圈五行流派解读方法与步骤.md](sources/知识库构建/三圈五行流派解读方法与步骤.md)
- [sources/知识库构建/README.md](sources/知识库构建/README.md)
- [sources/知识库构建/当前正式依据与使用说明.md](sources/知识库构建/当前正式依据与使用说明.md)
- [sources/知识库构建/运行时知识库文件清单.md](sources/知识库构建/运行时知识库文件清单.md)

旧报告链路文档、Batch A-H 旧链路文档和旧报告样本已从 active 入口清理，不再作为当前报告生成依据。

知识源追溯与运行时映射统一从这里进入：

- [sources/知识库构建/README.md](sources/知识库构建/README.md)
