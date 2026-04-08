# 一镜一梳 To C MVP 第一轮纸面验收记录

> 状态：in_review
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-08
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-08-toc-mvp-first-pass-verification.md
> 项目：aimandala
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-04-toc-mvp-qa-checklist.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-04-toc-mvp-spec.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-04-toc-mvp-architecture.md
> reviewers：CEO / Orchestrator, Product Spec Lead, Engineer, Test / QA

## 1. 验收日期与方式

- 验收日期：2026-04-08
- 验收方式：文档走查 + 命令级验证 + 代码路径核对
- 验收范围：To C + `V2` + `mobile-web` 当前最小正式主线

## 2. 本轮使用依据

- spec：`2026-04-04-toc-mvp-spec.md`
- architecture：`2026-04-04-toc-mvp-architecture.md`
- qa checklist：`2026-04-04-toc-mvp-qa-checklist.md`
- 本轮整改交付：`2026-04-08-architecture-remediation-delivery.md`

## 3. 主路径走查结果

### TC-01 上传图片并创建一镜 Lite 版解读

- 结论：通过
- 依据：
  - `mobile-web` 当前已具备 upload -> reportEntry -> loading 的装配链
  - `runMobileWebLiteFlow` 已作为当前 Lite 主路径入口
  - 后端健康检查和报告契约相关测试已通过

### TC-02 获取一镜 Lite 版报告

- 结论：通过
- 依据：
  - 当前存在 Lite 报告读取与刷新路径
  - `mobile-web/runtime` 与 `browser-shell` 都能进入 Lite 报告读取链

### TC-03 进入一梳 Pro 版

- 结论：通过
- 依据：
  - 当前流程支持从 Lite 结果进入 Pro 升级读取
  - preview shell 与 runtime 都保留 `upgrade` 路由与 `version=pro` 读取逻辑

### TC-04 获取用户历史记录

- 结论：通过
- 依据：
  - history 页当前支持读取真实记录
  - 已有记录可区分 `Lite` 与 `Lite + Pro`
  - QA 清单中的“可直接打开已有 Pro 记录”已在当前代码路径中体现

### TC-05 命中已有记录

- 结论：部分通过
- 依据：
  - 当前清单与主路径定义保留了 `existing` 语义
  - 本轮没有新增一份单独的命中已有记录人工演练截图或固定样本记录

## 4. 未通过项与保留风险

1. `TC-05` 仍缺一份更直接的人工验证样本记录，目前主要依赖代码路径和既有测试推断
2. `TC-06` 到 `TC-11` 本轮未做完整逐项人工复跑，只完成了边界核对
3. 前端当前仍没有行为自动化测试，放行主要依赖构建和人工验证

## 5. 本轮命令级验证

已执行：

- `pytest projects/aimandala/toC/app/backend/tests/unit/test_report_contracts.py`
- `pytest projects/aimandala/toC/app/backend/tests/unit/test_api_health.py`
- `npm run typecheck`
- `npm run build:mobile-web`

结果：

- 全部通过

## 6. 当前结论

当前 `aimandala` 已经满足“第一轮纸面验收记录已存在”的最小要求，且 `TC-01` 到 `TC-04` 已有较明确的主路径依据。

当前暂不建议把这份记录视为最终放行证明，下一轮仍需要补：

1. `TC-05` 的样本级验证记录
2. 错误态与复用语义的更直接验证
3. 至少一层前端行为测试
