# 一镜一梳：Batch C Lite / Pro 合同与前端承接交付记录

> 状态：working
> 版本：0.1.0
> owner：Engineer / Product Spec Lead
> last_updated：2026-04-19
> 项目：aimandala
> 阶段：delivery
> source_of_truth：projects/aimandala/docs/delivery/2026-04-19-Batch-C-Lite-Pro-合同与前端承接交付记录.md
> depends_on：projects/aimandala/docs/tasks/2026-04-19-Batch-C-Lite-Pro-报告合同与前端承接重构实施计划.md
> depends_on：projects/aimandala/docs/qa/2026-04-19-Batch-C-Lite-Pro-合同与前端承接验证记录.md
> reviewers：CEO / Orchestrator, Engineer, Product Spec Lead, Test / QA

## 1. 本批交付范围

本批交付只覆盖：

1. Lite / Pro 正式合同重写
2. API 模型与 shared types 对齐
3. 结果页和 debug 面板承接
4. Batch C 自动化验证与风险记录

## 2. 当前目标状态

本批完成后应满足：

1. `Lite / Pro` 固定为报告模式
2. `General / 主题` 固定为议题 SKU
3. 所有议题在同一 `Lite / Pro` 模式下共用同一合同结构
4. 主结果只保留产品区块字段
5. 内部写作骨架与兼容派生字段退到 debug / compatibility 层

## 3. 当前结果

待 Batch C 实现、验证与提交后回填。

## 4. 残留风险

当前预期重点观察：

1. 旧 projection / compatibility 字段是否仍被主结果页误消费
2. `topic_context.orientation` 是否在 `General` 之外写得过重
3. debug drilldown 是否足够支持后续 drift / fidelity 检查

## 5. 下一步 handoff

本批结束后，默认 handoff 给：

1. Batch D 固定样本与回归验证
2. 后续合同兼容壳清理
