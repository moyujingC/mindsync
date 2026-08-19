# 一镜一梳解读报告生成 Runbook

> 状态：archived
> 版本：0.1.0
> owner：Engineer / Product Knowledge
> last_updated：2026-05-11
> source_of_truth：projects/aimandala/docs/archive/legacy-report-generation-2026-05-10/解读报告生成-runbook.md

> 归档说明：本文件仅供历史追溯，不再作为 active 默认入口；当前报告生成链路以 docs/specs、docs/qa、docs/runbooks 下的最新入口为准。

## 1. 目标

本 runbook 用于排查和维护 `一镜一梳 / aimandala` 的 AI 解读报告生成链路。

它不是普通长 prompt 说明，而是当前报告生成链路的 control-backed method runbook：

1. 方法层定义 stage 00-16 应该怎么走
2. 知识层提供 Markdown 真值源和运行时 knowledge pack（知识包）
3. prompt 层只负责第 13 / 14 步 Lite / Pro 正文生成
4. 控制层通过 `stage_process_package`、formal package gate（正式过程包门禁）和 generation runtime block（生成运行时阻断）限制错误链路继续执行

当前已下沉为 gate 的控制包括：

1. `package_status` 必须为 `formal`
2. payload 中不能残留 `pending_stage_runtime_replacement`
3. payload 中不能包含 `full_markdown_truth_sources`、`full_theme_knowledge_documents`、`raw_legacy_container`、`old_report_skeleton`、`old_report_plan`、`private_env_or_api_keys` 这些 forbidden input marker（禁止输入标记）

## 2. 适用范围

使用本 runbook 的典型场景：

1. Lite 或 Pro 报告生成结果偏离三圈五行方法
2. Lite / Pro 差异不符合产品定义
3. 最终报告文案看起来能生成，但无法追溯到 stage 交付物
4. `stage_process_package` 缺失、incomplete 或被 formal package gate 阻断
5. Pro 升级失败，并提示 stage 过程包未通过
6. active 链路里出现旧报告骨架、旧 prompt skeleton、旧容器或 legacy chain 关键词
7. 知识判断错误，需要区分是知识源、运行时投影、stage assembler，还是最终写作 prompt 的问题

本 runbook 不用于：

1. 重新定义三圈五行方法本身
2. 修改 Lite / Pro 产品售卖边界
3. 改写 prompt 文案
4. 改 backend 运行时代码
5. 把旧报告链路恢复为当前默认路径

## 3. 主链路

当前解读报告生成主链固定为：

1. `stage-00-input-context`
2. `stage-01-user-input-context`
3. `stage-02-circle-boundary-decision`
4. `stage-03-visual-evidence`
5. `stage-04-direct-judgment-high-hit-check`
6. `stage-05-per-circle-color-shape-element-sensing`
7. `stage-06-per-circle-element-generation-control`
8. `stage-07-per-circle-imbalance-patterns`
9. `stage-08-energy-flow-diagnosis`
10. `stage-09-evidence-consolidation`
11. `stage-10-core-thesis-selection`
12. `stage-11-user-facing-framing`
13. `stage-12-healing-direction-and-report-branching`
14. `stage-13-lite-draft`
15. `stage-14-pro-draft`
16. `stage-15-visual-assets`
17. `stage-16-final-report`

其中：

1. 第 00-12 步形成 `stage_process_package`
2. 第 13 步只基于 `stage_process_package` 生成 Lite 正文
3. 第 14 步只基于 `stage_process_package` 生成 Pro 正文
4. 第 15 步只把已有 stage 数据转成可视化资产
5. 第 16 步只做质检与组装，不新增判断

## 4. 四层分工

### 4.1 方法层

正式入口：

1. ../sources/知识库构建/三圈五行流派解读方法与步骤.md
2. ../specs/2026-05-10-三圈五行流派解读方法实施规格.md

方法层回答：

1. 每个 stage 的顺序是什么
2. 每个 stage 的输入和交付物是什么
3. 哪些步骤允许调用大模型
4. 哪些步骤必须由规则、知识库运行时或程序完成
5. Lite / Pro 是否能重新发明判断

判断报告生成链路是否走偏时，先看这里。

### 4.2 知识层

正式入口：

1. [../sources/知识库构建/README.md](../../../../README.md)
2. ../sources/知识库构建/当前正式依据与使用说明.md
3. ../sources/知识库构建/运行时知识库文件清单.md
4. ../sources/知识库构建/V2运行时映射清单.md

知识层回答：

1. 当前哪些 Markdown 是单一真值源
2. 哪些内容只是历史镜像
3. Markdown 真值源如何投影到运行时 knowledge pack
4. 某个颜色、形状、三圈、五行、直断、失衡或主题判断应该追溯到哪个知识条目

如果 stage 判断本身错，优先检查知识层和运行时投影，不要先改最终报告 prompt。

### 4.3 Prompt 层

正式入口：

1. ../sources/知识库构建/第13步Lite报告生成Prompt.md
2. ../sources/知识库构建/第14步Pro报告生成Prompt.md
3. ../sources/知识库构建/Lite报告写作规范.md
4. ../sources/知识库构建/Pro报告写作规范.md
5. `projects/aimandala/toC/app/backend/app/core/prompt/builder_v2.py`

prompt 层回答：

1. Lite / Pro 正文应该怎么组织
2. 专业术语如何翻译成用户能理解的话
3. 可视化模块数量和输入来源是什么
4. 输出 JSON 结构应该包含哪些字段

如果最终文案不顺、疗愈感不足、Lite / Pro 表达差异不清，但 stage 判断正确，优先看 prompt 层。

### 4.4 控制层

当前控制层入口：

1. `projects/aimandala/toC/app/backend/app/core/pipeline/stage_process_package.py`
   - 负责组装第 00-12 步 `stage_process_package`
2. `projects/aimandala/toC/app/backend/app/core/stage_process_contracts.py`
   - 负责校验 formal stage process package（正式 stage 过程包）、pending marker 和 forbidden input marker
3. `projects/aimandala/toC/app/backend/app/core/pipeline/generation_runtime.py`
   - 负责在生成 Lite / Pro 前阻断 incomplete stage package
4. `projects/aimandala/toC/app/backend/app/core/prompt/builder_v2.py`
   - 负责强制 Lite / Pro prompt 接收 `stage_process_package`
5. `projects/aimandala/toC/app/backend/app/core/pipeline/report_lifecycle.py`
   - 负责 Pro 升级、失败状态和阻断提示

控制层回答：

1. 哪些错误会被程序阻断
2. 哪些 stage package 可以进入正式生成
3. Pro 升级失败时是业务状态问题，还是 stage package gate 问题
4. prompt 是否仍可能绕过 `stage_process_package`
5. payload 是否把完整真值源、完整主题知识、旧容器、旧报告骨架或敏感信息标记带进正式生成

如果运行时没有拦住错误链路，应该补控制层，而不是只补本文档。

## 5. 排查顺序

### 5.1 最终文案错，但 stage 正确

先看：

1. 第 13 / 14 步 prompt
2. Lite / Pro 写作规范
3. `builder_v2.py`
4. `report_draft_assembler.py`
5. `report_placeholder_assembler.py`

不要先改知识源。

典型判断：

1. 画面依据、五行判断、失衡候选都在 stage 里正确存在
2. 只是最终语言太机械、太短、术语没解释或 Lite / Pro 差异弱
3. 这类问题属于 prompt / report assembly 层

### 5.2 stage 判断错

先看：

1. `stage_process_package.py`
2. `knowledge_runtime` 相关服务
3. Markdown 真值源与运行时投影
4. `test_v2_knowledge.py`
5. `test_knowledge_runtime_v22.py`

不要直接改第 13 / 14 步 prompt。

典型判断：

1. 颜色映射到错误五行
2. 某圈 dominant element（主导五行）错误
3. 失衡候选来自错误规则
4. 主题映射引用错了主题知识

### 5.3 Pro 被阻断

先看：

1. `validate_formal_stage_process_package()`
2. `process_contract.package_status`
3. `process_contract.blocking_reasons`
4. `report_lifecycle.py`
5. `generation_runtime.py`

典型判断：

1. `stage_process_package` 缺失
2. package status 是 `incomplete`
3. 仍存在 `pending_stage_runtime_replacement`
4. 第 03 / 04 步视觉证据没有完成

### 5.4 旧链路混入

先跑 ../qa/2026-05-10-三圈五行流派解读方法实施QA基线.md 里的 legacy keyword gate（旧链路关键词门禁）。

预期结果：除 QA 基线明确允许的例外文件外，active 默认路径无命中。

如果有命中，先判断它是否属于 QA 基线允许的例外。不要把旧容器、旧骨架或旧 prompt skeleton 重新接回 active 默认链路。

## 6. 禁止动作

1. 禁止把完整 Markdown 真值源直接塞进 Lite / Pro prompt
2. 禁止把完整主题知识文档直接塞进 Lite / Pro prompt
3. 禁止让第 13 / 14 步重新看图
4. 禁止让第 13 / 14 步重新查知识库
5. 禁止让第 13 / 14 步重新选择核心主轴
6. 禁止在最终报告阶段新增前面 stage 没有出现过的画面事实、知识判断或失衡结论
7. 禁止把旧报告骨架、旧 prompt skeleton、旧容器回灌到 active 链路
8. 禁止只因为最终文案不好，就直接改知识源
9. 禁止只因为 Pro 升级失败，就绕过 formal package gate

## 7. 本地验证命令

报告生成链路的最低回归命令来自 QA 基线：

```bash
PYTHONPATH=projects/aimandala/toC/app/backend pytest -q \
  projects/aimandala/toC/app/backend/tests/unit/test_pipeline_data_models.py \
  projects/aimandala/toC/app/backend/tests/unit/test_api_v2_report_contracts.py \
  projects/aimandala/toC/app/backend/tests/unit/test_pipeline_orchestrator.py \
  projects/aimandala/toC/app/backend/tests/unit/test_v2_knowledge.py \
  projects/aimandala/toC/app/backend/tests/unit/test_knowledge_runtime_v21.py \
  projects/aimandala/toC/app/backend/tests/unit/test_report_contracts.py \
  projects/aimandala/toC/app/backend/tests/unit/test_run_vision_e2e_smoke.py \
  projects/aimandala/toC/app/backend/tests/unit/test_prompt_builder.py
```

如果本轮只改 runbook，可以只做文档一致性检查和 `git diff --check`。不要把“文档已收口”写成“运行时已新增控制”。

## 8. 完成态

一次报告生成排查或整改完成时，至少要能回答：

1. 问题发生在方法层、知识层、prompt 层，还是控制层
2. 相关 stage 是否存在并可追溯
3. `stage_process_package` 是否为 formal
4. Lite / Pro 是否只基于第 00-12 步交付物生成正文
5. 是否跑过对应 QA 基线或说明为什么本轮只做文档检查
6. 是否避免把旧链路重新接回 active 默认路径

## 9. 相关入口

1. 方法真值源：../sources/知识库构建/三圈五行流派解读方法与步骤.md
2. 实施规格：../specs/2026-05-10-三圈五行流派解读方法实施规格.md
3. QA 基线：../qa/2026-05-10-三圈五行流派解读方法实施QA基线.md
4. 知识资料入口：[../sources/知识库构建/README.md](../../../../README.md)