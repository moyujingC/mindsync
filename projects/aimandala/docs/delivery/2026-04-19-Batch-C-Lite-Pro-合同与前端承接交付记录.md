# 一镜一梳：Batch C Lite / Pro 合同与前端承接交付记录

> 状态：ready_for_commit
> 版本：1.0.0
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

截至 2026-04-19，本批已完成实现与最终验证：

1. 后端 `LiteStructuredReport` / `ProStructuredReport` 已改为 MVP 统一议题模型下的产品区块合同。
2. `topic_context` 已进入 Lite / Pro 两种报告模式，`General` 与具体主题共享同一结构。
3. 前端 shared types、flow 校验、结果页渲染与静态 fixture 已切到新字段。
4. debug payload 已新增：
   - `topic_context_trace`
   - `product_block_debug`
   - `internal_compatibility`
5. debug 面板已能展示主题路由、产品区块 trace 和内部兼容字段使用情况。

已执行的自动化验证：

1. `pytest projects/aimandala/toC/app/backend/tests/unit/test_report_contracts.py projects/aimandala/toC/app/backend/tests/unit/test_api_v2_report_contracts.py projects/aimandala/toC/app/backend/tests/unit/test_pipeline_orchestrator.py projects/aimandala/toC/app/backend/tests/unit/test_api_health.py -q`
   - 结果：`89 passed`
2. `cd projects/aimandala/toC/app/frontend && npm test -- --run shared/core/flow.test.ts shared/core/report-structure.test.ts shared/ui/shared-ui.test.tsx mobile-web/controller.test.ts mobile-web/app.test.tsx mobile-web/browser-debug-panel.test.tsx`
   - 结果：`6 passed files, 26 passed tests`
   - 备注：Vite 输出 esbuild / oxc deprecation warnings，不影响测试结果。
3. `git diff --check`
   - 结果：通过

## 4. 残留风险

当前保留风险：

1. `can_upgrade / upgrade_price` 仍保留为兼容壳字段，但产品与 UI 主语义已不再使用升级叙事。
2. 内部 prompt schema 仍是 `1.6`，旧写作骨架字段会继续存在于 prompt / compatibility / debug 层。
3. `topic_context.orientation` 当前使用静态 preset，后续可在样本验证后再决定是否进入知识 pack 管理。
4. 本批不清理未跟踪 fixture 图片；这些资产继续留给固定样本重建批次处理。

## 5. 下一步 handoff

本批结束后，默认 handoff 给：

1. Batch D 固定样本与回归验证
2. 后续合同兼容壳清理
3. 后续 prompt schema 版本升级，把内部写作槽位和产品区块命名进一步对齐
