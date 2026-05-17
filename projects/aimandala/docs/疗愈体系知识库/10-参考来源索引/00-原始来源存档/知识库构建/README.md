# Aimandala 知识库构建资料入口

> 状态：current
> 版本：0.1.0
> owner：Research & Knowledge Lead / Architect
> last_updated：2026-05-09
> 项目：aimandala
> 阶段：current
> source_of_truth：projects/aimandala/docs/疗愈体系知识库/10-参考来源索引/00-原始来源存档/知识库构建/README.md
这份索引用于收口 `一镜一梳 / aimandala` 当前已经迁入工作区的“知识库构建”源资料。

这里存放的是：

- 旧仓库 `知识库构建` 目录的项目级镜像资料
- 当前第一方对这些资料的分层说明
- 源资料与当前 `V2 knowledge runtime` 之间的映射清单

它是 `aimandala` 项目专属资料入口，不是公司级知识库入口。

## 0. 当前唯一方法入口

当前 AI 解读报告生成只允许以 [三圈五行流派解读方法与步骤.md](三圈五行流派解读方法与步骤.md) 作为方法入口，并按 `stage-00-input-context` 到 `stage-16-final-report` 的交付物流转。

旧报告链路、旧报告样本和 Batch A-H 旧链路文档已经从 active 运行路径和 active 文档口径中清理，不得再作为后续 AI 生成报告或改造报告链路的依据。若在归档区或历史样本中看到旧链路名词，只能按历史证据理解，不得回灌到默认生成、测试或 QA 样本中。

## 1. 当前目录分工

- [V2完整知识库](V2完整知识库)
  - 旧项目 `ai-mandala` 中 V2 知识库的完整快照
  - 包含 `00_kb_md` Markdown 说明层和 `app/core/knowledge` Python 结构化知识层
  - 用于恢复知识密度、做保真对照和重建当前单一真值源
- [主题知识](主题知识)
  - 当前主题知识的“一主题一文档”真值源目录
  - 每个主题文档完整承接旧 V2 对应 Python 主题模块
  - 用于后续报告链路引用和 YAML 运行时投影重建
- [V2主题知识迁移映射.md](V2主题知识迁移映射.md)
  - 记录旧 V2 主题 Python 文件、新主题 Markdown 真值源、`packs/v2.1` 旧兼容投影和 `packs/v2.2` Markdown 投影之间的对应关系
- [原始镜像](原始镜像)
  - 旧仓库 `知识库构建` 目录的原始镜像层
  - 默认不直接等同于当前正式规则入口
- [当前正式依据与使用说明.md](当前正式依据与使用说明.md)
  - 解释哪些源资料当前可作为正式依据，哪些只作支撑或历史样本
- [最小必读知识源清单.md](最小必读知识源清单.md)
  - 服务后续报告链路整改和知识保真排查，给出最短阅读路径
- [直断法高命中模式.md](直断法高命中模式.md)
  - 当前直断法 Markdown 单一真值源
- [原始解读案例篇11例.md](原始解读案例篇11例.md)
  - 从原始手册中单独抽出的 11 个解读案例，供 AI 学习描述方式与案例表达节奏
- [第03步视觉证据提取Prompt.md](第03步视觉证据提取Prompt.md)
  - `stage-03-visual-evidence` 的视觉大模型观察 prompt
- [第04步直断命中检查Prompt.md](第04步直断命中检查Prompt.md)
  - `stage-04-direct-judgment-high-hit-check` 的直断命中检查 prompt
- [第05步颜色形状五行感知映射规范.md](第05步颜色形状五行感知映射规范.md)
  - `stage-05-per-circle-color-shape-element-sensing` 的规则映射规范
- [第06步五行生克与主题映射规范.md](第06步五行生克与主题映射规范.md)
  - `stage-06-per-circle-element-generation-control` 的五行生克和主题映射规范
- [第07步失衡模式浮现规范.md](第07步失衡模式浮现规范.md)
  - `stage-07-per-circle-imbalance-patterns` 的失衡候选收束规范
- [第10-12步报告整合Prompt.md](第10-12步报告整合Prompt.md)
  - `stage-10-core-thesis-selection`、`stage-11-user-facing-framing`、`stage-12-healing-direction-and-report-branching` 的一次性报告整合 prompt
- [报告语言风格规范.md](报告语言风格规范.md)
  - Lite / Pro 报告共同的疗愈感语言规范
- [报告可视化规范.md](报告可视化规范.md)
  - Lite / Pro 报告中的可视化模块数量、用途、输入来源和边界
- [Lite报告写作规范.md](Lite报告写作规范.md)
  - `stage-13-lite-draft` 的 Lite 报告写作规格
- [Pro报告写作规范.md](Pro报告写作规范.md)
  - `stage-14-pro-draft` 的 Pro 报告写作规格
- [第13步Lite报告生成Prompt.md](第13步Lite报告生成Prompt.md)
  - `stage-13-lite-draft` 的 Lite 报告生成 prompt
- [第14步Pro报告生成Prompt.md](第14步Pro报告生成Prompt.md)
  - `stage-14-pro-draft` 的 Pro 报告生成 prompt
- [三圈语义与能量流动.md](三圈语义与能量流动.md)
  - 当前三圈语义和能量流动 Markdown 单一真值源
- [颜色五行感知规则.md](颜色五行感知规则.md)
  - 当前颜色五行感知 Markdown 单一真值源
- [形状五行感知规则.md](形状五行感知规则.md)
  - 当前形状五行感知 Markdown 单一真值源
- [五行生克与失衡模式.md](五行生克与失衡模式.md)
  - 当前五行生克和失衡模式 Markdown 单一真值源
- [主题知识与疗愈映射.md](主题知识与疗愈映射.md)
  - 当前主题知识和疗愈映射 Markdown 单一真值源
- [运行时知识库文件清单.md](运行时知识库文件清单.md)
  - 说明 `toC/data/knowledge` 下的 pack、build 和 eval 文件用途
- [V2运行时映射清单.md](V2运行时映射清单.md)
  - 把原始流派资料与当前 workspace 的运行时资产对齐到同一张表里；它只说明运行时投影位置，不定义报告生成方法

## 2. 使用规则

当前默认不要直接把 [原始镜像](原始镜像) 整体当成 `spec`、`architecture` 或运行时规则入口。

当前采用“三层知识源治理”：

- `单一真值源`：用于定义当前方法、规则和流派逻辑。
- `运行时投影`：由单一真值源整理成 `pack / index / runtime` 可消费的数据。
- `历史镜像`：保留来源和迁移过程，只作追溯，不直接指导当前报告生成。

正式引用时应遵循：

1. 先读 [三圈五行流派解读方法与步骤.md](三圈五行流派解读方法与步骤.md)，确认当前 stage 00-16 流程。
2. 再从 [当前正式依据与使用说明.md](当前正式依据与使用说明.md) 确认资料分层。
3. 如果当前任务是报告整改或保真排查，继续看 [最小必读知识源清单.md](最小必读知识源清单.md)。
4. 再进入对应原始资料查看具体内容。
5. 如果要判断当前运行时是否保真，对照 [运行时知识库文件清单.md](运行时知识库文件清单.md) 和 [V2运行时映射清单.md](V2运行时映射清单.md)。

## 3. 适合回答的问题

- 旧版 `AI-Mandala` 的流派资料到底有哪些正式来源
- 三圈五行、直断法、主题特化、失衡体系的原始材料现在收在什么位置
- 当前 `V2 knowledge runtime` 用到的资产能追溯到哪些源资料
- 当前哪些内容已经被明确视为正式依据，哪些还只是支撑参考或历史比较样本

## 4. 不适合直接在这里做的事

- 不在这里直接改 `spec`、`task`、`qa` 结论
- 不把原始镜像层当成当前运行时 pack 的自动真理源
- 不在这里混入一次性的排障纪要或执行计划

如果某项结论已经升级为当前项目正式规则，应继续落回：

- 当前方法与知识规则：本目录的 Markdown 真值源。
- 运行时消费格式：`projects/aimandala/toC/data/knowledge/`。
- 验证记录：`projects/aimandala/docs/qa/`，且必须明确样本是否遵循 stage 00-16。
