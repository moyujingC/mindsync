# 一镜一梳报告内容迭代指南

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-04
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-04-report-content-iteration-guide.md

## 1. 这份指南是给谁用的

这份文档服务于后续持续调整 `Lite / Pro` 报告内容时的协作。

目标是把“改报告内容”尽量变成：

- 改模板文件
- 少改后端流程代码
- 不影响 mobile-web 当前真实联调主路径

## 2. 现在应该优先改哪里

### 2.1 只改文案、标题、章节名

优先改这里：

- [lite_report_content.json](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/toC/app/backend/app/core/pipeline/templates/lite_report_content.json)
- [pro_report_content.json](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/toC/app/backend/app/core/pipeline/templates/pro_report_content.json)
- [templates/README.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/toC/app/backend/app/core/pipeline/templates/README.md)

适合改的内容：

- Lite 起承转合连接词
- Lite 三个日常小觉察标题
- Lite 小实验固定步骤文案
- Pro teaser 文案
- Pro 表格标签
- Pro 失衡识别标签
- Pro 根源探索标签

这类修改不应该先去改 `orchestrator_v2.py`。

当前后端读取入口已经统一收口到：

- [report_blueprints.py](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/toC/app/backend/app/core/pipeline/report_blueprints.py) 里的 `LITE_REPORT_BLUEPRINT`
- [report_blueprints.py](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/toC/app/backend/app/core/pipeline/report_blueprints.py) 里的 `PRO_REPORT_BLUEPRINT`

如果只是想看“当前模板最终会被后端怎样读取”，优先看这两个 blueprint 对象，不用再顺着一堆分散常量找。

另外现在还有一个辅助排查入口：

- [report_blueprints.py](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/toC/app/backend/app/core/pipeline/report_blueprints.py) 里的 `BLUEPRINT_VALIDATION_ISSUES`

它会汇总当前模板是否缺关键字段。正常情况下应为空。
如果这里已经报出问题，优先先修 JSON 模板，而不是继续往下改编排代码。

### 2.2 改报告章节结构或字段

如果你想：

- 新增一个章节
- 删除一个章节
- 改变 structured 字段名字
- 改变前端卡片顺序

需要同时改这几层：

- [orchestrator_v2.py](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/toC/app/backend/app/core/pipeline/orchestrator_v2.py)
- [report-structure.ts](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/toC/app/frontend/shared/core/report-structure.ts)
- [report-cards.tsx](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/toC/app/frontend/mobile-web/components/report-cards.tsx)
- [api.ts](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/toC/app/frontend/shared/types/api.ts)

### 2.3 改失衡类型判定和建议逻辑

如果你想：

- 调整“什么情况下判成哪种失衡类型”
- 新增一种失衡类型
- 修改失衡类型和建议的映射

优先改：

- [orchestrator_v2.py](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/toC/app/backend/app/core/pipeline/orchestrator_v2.py)

重点函数目前包括：

- `_build_pro_imbalance_profile`
- `_build_pro_healing_suggestions`
- `_build_pro_block_point`

当前如果只是想调“哪种条件落到哪种失衡类型”，优先改：

- [pro_report_content.json](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/toC/app/backend/app/core/pipeline/templates/pro_report_content.json)

其中：

- `imbalance_selection_rules` 控制阈值和主题匹配规则
- `imbalance_profiles` 控制每种失衡类型的说明文案
- `healing_suggestion_templates` 控制每种失衡类型的建议骨架

## 3. 推荐迭代顺序

以后每次想改报告，建议按这个顺序判断：

1. 这是“改文案”还是“改结构”还是“改判断逻辑”？
2. 如果只是改表达，先改 `templates/*.json`
3. 如果改结构，再同步后端 structured 和前端渲染
4. 如果改判断逻辑，补对应测试

## 4. 当前模板驱动边界

目前已经模板化的内容：

- Lite 固定连接词
- Lite 故事章节标题
- Lite 日常小觉察标题
- Lite 主题 label 映射与标题规则
- Lite Layer0 三圈含义、微观标签、仪式标题
- Lite 报告章节标题、主题区块标签、用户上下文提示句式
- Lite 六个核心洞察默认标题与默认摘要
- Lite 六段故事默认句式
- Lite 主题洞察默认句式
- Lite 总述、画面元素、情绪画像、圆环节奏说明
- Lite 缺省故事/觉察/实验提示文案
- Lite 三个日常小觉察正文
- Lite 六个核心洞察在 layer1 阶段的默认正文骨架
- Lite fallback 小实验卡片
- Lite 小实验固定步骤文案
- Pro teaser 文案
- Pro 报告标题、导语与章节标题
- Pro 各章节缺省提示文案
- Pro 表格标签
- Pro 失衡识别标签
- Pro 根源探索标签
- Pro 各类失衡类型的说明文案
- Pro 各类失衡类型对应的疗愈建议模板
- Pro 失衡类型选择规则阈值
- Pro 第一眼直觉、能量本质、关键卡点、三圈解读、微观分析、表层根源默认正文骨架
- Pro deeper/core 根源分析默认正文与疗愈段落缺省提示
- Pro 三圈标签、微观分析标签、表格标题与动作前缀
- Pro 报告标题与升级成功提示消息

目前这些模板值会先被 `report_blueprints.py` 标准化，再由 `orchestrator_v2.py` 消费。
这一步的意义是：

- 模板缺键时能统一回退默认值
- `Lite / Pro` 配置入口更清晰
- 后续继续迁正文时，不需要再往编排文件里堆更多常量

目前还没有完全模板化的内容：

- Lite / Pro 具体分析正文
- 失衡类型判定规则
- 每种失衡类型对应的建议逻辑

这些内容当前仍主要在 `orchestrator_v2.py` 中。

## 5. 每次改完建议验证

后端：

```bash
pytest projects/aimandala/toC/app/backend/tests/unit/test_pipeline_orchestrator.py
```

如果是模板改动，建议再加一条：

```bash
pytest projects/aimandala/toC/app/backend/tests/unit/test_report_blueprints.py
```

前端：

```bash
npm run typecheck
npm run build:mobile-web
```

## 6. 后续建议

下一阶段更理想的方向是：

1. 继续把 Lite / Pro 的正文骨架迁到模板文件
2. 在 blueprint 层继续补 schema / validation
3. 把 structured schema 单独收口
4. 再决定是否把旧 Prompt 驱动链路逐步迁回

这样以后改报告内容时，会越来越接近“改模板和规则”，而不是“改业务代码”。

## 7. 当前收口判断

截至当前这轮迁移，这条“报告内容外置”主线已经接近可视为收口完成。

已经基本收口的部分：

- Lite / Pro 大部分固定文案、章节标题、提示语、结构标签
- Lite 主题 label、标题规则、主题区块 fallback
- Pro 升级成功提示、三圈/微观/表格展示标签
- blueprint 校验与缺键 fallback 机制

当前仍然保留在 `orchestrator_v2.py` 中、且暂时合理的部分：

- structured 返回里的稳定字段名
- `core_insight_table` 里的字段 key
- Layer0 / Layer1 / Layer3 的结构装配
- 失衡类型判定规则本身
- 各种基于 `record`、`circles`、`theme` 的运行时拼装逻辑

如果下一步目标仍然是“迁移完前的主功能优先”，建议不要继续为“把所有中文都清零”而继续拆。
更值得优先的方向会是：

1. 确认 Lite / Pro 真实链路内容是否满足当前产品定义
2. 继续补真实数据联调和部署前必需项
3. 最后再决定是否需要把 Prompt 驱动内容重新接回
