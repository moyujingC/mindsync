# QA

这里放 `一镜一梳` 当前主链路的验收清单、验证记录与样本验证文档。

当前 QA 目录主要服务一件事：

- 验证新的 `上传 -> 三圈识别 -> Lite / Pro 选择 -> loading -> 结果页` 主链路是否成立

## 当前默认入口

当前默认优先区分两类文档：

- `qa basis`
  - 定义本轮目标行为、质量门和验证矩阵
- `verification record`
  - 记录某一轮已经执行过的自动化、smoke 和人工验收结果

## 当前阅读顺序

建议按下面顺序阅读：

1. `2026-04-14-mvp-公开首发收口与小程序渐进并入验证基线.md`
2. `2026-04-14-mvp-公开首发收口与小程序渐进并入验证记录.md`
3. `2026-04-14-miniapp-batch-a-shared-foundation-audit-verification.md`
4. `2026-04-14-batch-b-历史记录详情与显式报告类型验证基线.md`
5. `2026-04-15-miniapp-batch-c-静态壳与页面闭环验证基线.md`
6. `2026-04-12-迁移收官与正式版收口验证记录.md`
7. `2026-04-12-v22-knowledge-workbench-verification.md`
8. `2026-04-12-ci-cd-验证记录.md`
9. `2026-04-13-paperclip-automation-节点验证记录.md`

`2026-04-08-toc-mvp-first-pass-verification.md` 与 `2026-04-08-toc-mvp-sample-validation.md` 仍可用于追溯早期验证背景，但默认不再作为当前首轮入口。

## 各文档作用

### `2026-04-14-mvp-公开首发收口与小程序渐进并入验证基线.md`

本轮 `qa basis`。

适合确认：

- 当前公开首发质量门
- 小程序渐进并入的批次验证口径
- 本轮 artifact 治理检查项

### `2026-04-14-mvp-公开首发收口与小程序渐进并入验证记录.md`

本轮当前 `verification record`。

适合确认：

- 当前自动化质量门是否已经通过
- `dev / prod smoke` 和 `prod` 深烟测是否已经落盘
- 手机端人工主路径验收还缺什么、应如何执行

### `2026-04-14-miniapp-batch-a-shared-foundation-audit-verification.md`

批次 A 审计验证记录。

适合确认：

- `main` 与小程序 worktree 在 shared foundation 上是否已大体对齐
- 当前 shared boundary 是否已经包含后续批次语义
- 为什么当前不需要再做一笔“批次 A 重复摘入”提交

### `2026-04-14-batch-b-历史记录详情与显式报告类型验证基线.md`

批次 B 当前验证基线。

适合确认：

- 报告读取接口是否已强制显式 report type
- history / reopen 是否已切到 detail -> report 模型
- 新解读主链路是否仍保持当前产品语义

### `2026-04-12-迁移收官与正式版收口验证记录.md`

当前正式主链收口的专项验证记录。

适合确认：

- 新生成 Lite / Pro 是否已走正式主链
- structured schema、upload contract、部署口径是否真正收口
- 本地验证与线上 smoke check 到了什么程度

### `2026-04-12-v22-knowledge-workbench-verification.md`

`v2.2 knowledge workbench` 的专项验证记录。

适合确认：

- 本地 debug workbench 是否真的可运行
- `report-debug` 的 insight / evidence / fallback 摘要是否可读
- 当前 build eval 是否仍维持在可接受风险内

### `2026-04-12-ci-cd-验证记录.md`

CI/CD、nightly smoke 与自动修复基础设施验证记录。

适合确认：

- 当前 smoke 脚本与 workflow 的实际验证口径
- deploy / smoke / auto-repair 的基础闭环是否成立

### `2026-04-04-toc-mvp-qa-checklist.md`

主清单文件。

适合确认：

- 当前主链路的标准验证步骤
- 价格、跳转、结果页是否与 spec 一致
- 异常与回退状态是否被覆盖

## 当前验证重点

- 不再按“先 Lite 再 Pro”的旧链路验证
- 重点验证用户主动选择 `Lite / Pro` 的新链路
- `Lite = 9.9`，`Pro = 39`
- loading 页只承接等待，不承担再次分流
- 结果页 CTA 只写 MVP 当前能走通的动作
- 当前公开首发前，优先关注 `fallback / smoke / 主路径人工验收`
