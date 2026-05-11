# Aimandala Runbook 体系优化 QA 基线

> 状态：current
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-05-11
> source_of_truth：projects/aimandala/docs/qa/2026-05-11-runbook-体系优化-QA基线.md
> 项目：aimandala
> 阶段：qa-basis
> depends_on：projects/aimandala/docs/tasks/2026-05-11-runbook-体系优化实施计划.md
> reviewers：Engineer, Test / QA

## 1. 本轮验证对象

本轮只验证 runbook 体系治理收口，不验证业务功能或执行脚本行为变化。

验证对象固定为：

1. runbook 入口是否收口
2. 当前入口与历史入口是否分开
3. task 与 runbook 的目录边界是否更清楚
4. runbook 与 control layer 的映射是否被明确表达

## 2. 测试矩阵

### 2.1 入口唯一性

必须验证：

1. `docs/runbooks/README.md` 被明确写成默认 runbook 入口
2. `docs/tasks/README.md` 不再把 runbook-like 文件混作默认任务计划入口

### 2.2 当前 / 历史分离

必须验证：

1. 当前 runbook 入口单独列出
2. `historical-reference` 文件不会继续以“当前重点入口”口径出现
3. 废弃的 phase 2 handoff 文档不会被误读为当前主路径

### 2.3 类型分层

必须验证入口文档显式区分：

1. 入口页
2. manual runbook
3. control-backed runbook

若缺少任一层定义，不应宣称体系已收口。

### 2.4 控制层映射

必须验证入口文档明确说明：

1. runbook 负责流程
2. script / gate / guard / finalizer / health check 属于控制层
3. 至少列出当前 `aimandala` 已存在的关键控制层脚本入口

### 2.5 可执行判断支持

必须验证新的入口说明至少能支持下面两类判断：

1. 这是文档入口问题，应该先改 runbook / README
2. 这是执行失配问题，应该先补脚本 / gate / guard

## 3. 通过条件

本轮通过至少满足：

1. 新 task / QA 文档已正式落地
2. `docs/runbooks/README.md` 已完成当前入口、历史入口和控制层映射收口
3. `docs/tasks/README.md` 已减少 runbook / task 混层
4. 文档没有把“改文档”误写成“已经修复执行系统”

## 4. 阻断条件

出现任一情况，本轮不得宣称完成：

1. 当前入口仍把 `historical-reference` 文件列为默认主入口
2. 仍无法区分“manual runbook”和“control-backed runbook”
3. `docs/tasks/README.md` 仍默认把 runbook 当任务计划入口
4. 文档没有明确 runbook 与 control layer 的边界
