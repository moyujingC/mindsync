# Report Content Templates

这里放 `一镜一梳` 迁移期报告内容模板。

目标是把“经常会改的内容”从 `orchestrator_v2.py` 中尽量抽离出来，优先通过模板配置完成调整。

当前加载入口已经收口到：

- `report_blueprints.py` 中的 `LITE_REPORT_BLUEPRINT`
- `report_blueprints.py` 中的 `PRO_REPORT_BLUEPRINT`

`orchestrator_v2.py` 现在应优先依赖这两个 blueprint 对象，而不是继续各处维护一套零散常量。

另外，`report_blueprints.py` 现在还会产出 `BLUEPRINT_VALIDATION_ISSUES`。
正常情况下它应该是空的；如果不为空，说明模板缺少关键字段，虽然当前系统仍会尽量 fallback，但建议先修模板再继续扩展内容。

## 文件说明

### `lite_report_content.json`

主要承接 `Lite` 报告的固定内容骨架，包括：

- 起承转合连接词
- 故事章节标题
- 六段故事默认句式
- 主题洞察默认句式
- 主题 label 映射与 Lite 标题规则
- Stage 三圈含义、微观标签、Lite 仪式标题
- Lite 报告章节标题、主题区块标签、用户上下文提示句式
- Lite 总述、画面元素、情绪画像等正文骨架
- Lite 缺省故事/觉察/实验提示文案
- 三个日常小觉察标题与正文
- 六个核心洞察默认标题、摘要与 layer1 正文骨架
- fallback 小实验卡片
- 小实验步骤文案

### `pro_report_content.json`

主要承接 `Pro` 报告的固定内容骨架，包括：

- teaser 文案
- 报告标题、导语与章节标题
- 各章节缺省提示
- 第一眼直觉、能量本质、关键卡点、微观分析等正文骨架
- Pro 三圈标签、微观分析标签、表格标题与动作前缀
- Pro 报告标题与升级成功提示消息
- Pro deeper/core 根源分析默认正文与疗愈段落缺省提示
- 核心表格、失衡识别、根源探索标签
- 失衡类型选择规则
- 各类失衡类型的说明文案
- 各类失衡类型对应的疗愈建议模板

## 推荐修改方式

如果只是想改：

- 标题
- 语气
- 固定引导文案
- 某种失衡类型怎么描述
- 某种失衡类型给什么建议

优先改这两个 JSON，不要先改 `orchestrator_v2.py`。

如果只是读取这些配置，优先从 `LITE_REPORT_BLUEPRINT` / `PRO_REPORT_BLUEPRINT` 取值；当前文件里保留的模块级常量主要是兼容旧调用。

当前这套模板层已经覆盖了大部分“会频繁改的内容”。
剩余仍保留在 `orchestrator_v2.py` 里的部分，主要是：

- structured 返回字段名
- 运行时组装逻辑
- 失衡类型判定和建议选择规则

这些部分在当前阶段更接近“规则和结构”，不建议为了继续清理中文硬编码而过度拆散。

只有在以下情况，才需要再动代码：

- 新增或删除 structured 字段
- 改报告章节结构
- 改前后端字段契约
- 改失衡判断逻辑本身

## 修改后建议验证

后端：

```bash
pytest projects/aimandala/toC/app/backend/tests/unit/test_report_blueprints.py
pytest projects/aimandala/toC/app/backend/tests/unit/test_pipeline_orchestrator.py
```

如果你在本地排查模板问题，也可以直接看：

```python
from app.core.pipeline.report_blueprints import BLUEPRINT_VALIDATION_ISSUES
print(BLUEPRINT_VALIDATION_ISSUES)
```

前端：

```bash
npm run typecheck
npm run build:mobile-web
```
