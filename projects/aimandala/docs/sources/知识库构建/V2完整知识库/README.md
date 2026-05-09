# Aimandala V2 完整知识库快照

> 状态：current
> 日期：2026-05-09
> owner：Product / Knowledge Base
> source_of_truth：`projects/aimandala/docs/sources/知识库构建/V2完整知识库/README.md`
> 原始来源：`/Users/xinran/Downloads/dev/ai-mandala`

## 定位

本文档目录完整保留旧项目 `ai-mandala` 中 V2 知识库的内容，用于后续恢复知识密度、校准报告生成逻辑和做运行时保真对照。

这里的 V2 知识库不是 `knowledge_base_v3`，也不是当前 `packs/v2.1` YAML 运行时投影。旧 V2 的主体由两部分组成：

- `00_kb_md/`：面向人阅读的 V2 知识库 Markdown 说明层。
- `app_core_knowledge/`：旧项目 `app/core/knowledge/` 下的 Python 结构化知识模块。

## 目录内容

### 1. Markdown 说明层

目录：[00_kb_md](00_kb_md)

| 文件 | 内容 |
| --- | --- |
| [00_index.md](00_kb_md/00_index.md) | V2 知识库总索引，说明四步解读方法论和模块导航。 |
| [01_five_elements.md](00_kb_md/01_five_elements.md) | 五行基础、颜色映射、相生相克基础。 |
| [02_three_circles.md](00_kb_md/02_three_circles.md) | 三圈结构、三圈语义、能量流动模型。 |
| [03_color_meanings.md](00_kb_md/03_color_meanings.md) | 颜色深度解读、色阶、颜色别名、特殊色和颜色组合。 |
| [04_shape_meanings.md](00_kb_md/04_shape_meanings.md) | 形状五行映射、基础形状、曼陀罗特有形状和冲突处理。 |
| [05_direct_judgments.md](00_kb_md/05_direct_judgments.md) | 直断特征、颜色深度判断、留白分析。 |
| [06_interpretation_methods.md](00_kb_md/06_interpretation_methods.md) | V2 四步解读方法论。 |
| [07_five_elements_advanced.md](00_kb_md/07_five_elements_advanced.md) | 五行生克乘侮、生多为克、20 种失衡类型。 |
| [08_healing_programs.md](00_kb_md/08_healing_programs.md) | 21 天疗愈方案和任务类型。 |
| [09_theme_knowledge_base.md](00_kb_md/09_theme_knowledge_base.md) | 七大主题特化解读知识库。 |

### 2. Python 结构化知识层

目录：[app_core_knowledge](app_core_knowledge)

| 文件 | 内容 |
| --- | --- |
| [five_elements.py](app_core_knowledge/five_elements.py) | 五行属性、相生、相克、相乘、相侮、生多为克。 |
| [three_circles.py](app_core_knowledge/three_circles.py) | 三圈语义、圈间能量流向、能量流动质量。 |
| [color_meanings.py](app_core_knowledge/color_meanings.py) | 颜色别名、颜色五行映射、颜色深浅和三圈含义。 |
| [shape_meanings.py](app_core_knowledge/shape_meanings.py) | 形状五行、形状含义、曼陀罗特有形状、形状组合。 |
| [direct_judgments.py](app_core_knowledge/direct_judgments.py) | 直断模式、颜色深度规则、留白分析。 |
| [imbalance_types.py](app_core_knowledge/imbalance_types.py) | 失衡类型体系和 To C / To B 支持边界。 |
| [interpretation_methods.py](app_core_knowledge/interpretation_methods.py) | V2 解读步骤、直断匹配、生克分析和冲突处理。 |
| [query_engine.py](app_core_knowledge/query_engine.py) | 旧 V2 查询入口。 |
| [themes/](app_core_knowledge/themes) | 七大主题的主题配置、颜色含义、互动关系、洞察模板、失衡映射和疗愈建议。 |

## 使用规则

- 本目录用于完整保留 V2 原始知识密度，不做摘要、不做删减。
- 当前报告生成方法仍以外层 [三圈五行流派解读方法与步骤.md](../三圈五行流派解读方法与步骤.md) 为流程入口。
- 若外层单一真值源内容过薄，应优先回到本目录逐项补全，而不是直接让模型自由发挥。
- 若当前 `packs/v2.1` 与本目录内容不一致，应标记为运行时投影缺口，再决定是否重建 YAML pack。
- 本目录不是生产运行时代码目录，不能被后端直接 import。

## 与当前知识库的关系

当前外层 Markdown 真值源负责定义新的 AI 报告流水线和最终报告生成约束；本目录负责提供旧 V2 的完整知识内容。后续重建知识库时，应把本目录中的细粒度知识逐步整理成当前可维护的单一真值源，再投影到运行时 YAML。
