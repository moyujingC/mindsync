# 一镜一梳：Batch A Runtime Evidence 交付记录

> 状态：working
> 版本：0.1.0
> owner：Engineer / Architect
> last_updated：2026-04-19
> 项目：aimandala
> 阶段：delivery
> source_of_truth：projects/aimandala/docs/delivery/2026-04-19-Batch-A-runtime-evidence-交付记录.md
> depends_on：projects/aimandala/docs/tasks/2026-04-19-Batch-A-源资料到-runtime-evidence-保真重构实施计划.md
> depends_on：projects/aimandala/docs/qa/2026-04-19-Batch-A-runtime-evidence-验证记录.md
> depends_on：projects/aimandala/docs/delivery/2026-04-18-报告链路保真重构交付记录.md
> reviewers：CEO / Orchestrator, Architect, Engineer, Test / QA

## 1. 本批交付目标

Batch A 的交付目标不是调整用户主报告合同，而是把 `Source Basis -> Runtime Evidence` 这段链路正式收成 evidence-first。

本批固定交付点：

1. `Layer0Raw` evidence 结构定型
2. `ImbalanceService` 全量 trace 落地
3. `transition-overload` 与真正 fallback 分离
4. debug / workbench 能消费新 evidence

## 2. 本批不交付

本批不交付：

1. narrative / prompt 重构
2. Lite / Pro 结果合同改造
3. 前端结果页承接
4. fixture 重建

这些内容分别留给 Batch B、Batch C、Batch D。

## 3. 实现窗口记录

### 3.1 提交 1

文档与治理：

1. Batch A Task 文档
2. Batch A QA 文档
3. Batch A Delivery 文档
4. README 入口挂接

### 3.2 提交 2

runtime evidence / rule engine / 单测：

待实现完成后回写。

### 3.3 提交 3

debug / workbench / 验证：

待实现完成后回写。

## 4. 验证结果

待本批实现完成后回写：

1. 自动化测试结果
2. 样本验证结果
3. 是否允许进入 Batch B

## 5. 当前风险

当前预设风险固定为：

1. evidence 结构变更需要兼容旧读取点
2. `transition-overload` 语义收紧后，旧测试会有一轮调整
3. narrative / prompt 仍是 projection-first，需留待 Batch B 继续处理

## 6. 下一步

本批完成后，默认下一步为：

1. 回写总 Delivery 中的 Batch A 状态
2. 基于新 evidence 结构进入 Batch B 子计划
