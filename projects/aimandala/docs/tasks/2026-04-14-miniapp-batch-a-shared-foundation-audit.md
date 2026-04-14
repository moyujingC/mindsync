# AI Mandala 小程序渐进并入批次 A 共享基础层审计与收束计划

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-14
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-14-miniapp-batch-a-shared-foundation-audit.md
> 项目：aimandala
> 阶段：implementation-plan
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-14-mvp-公开首发收口与小程序渐进并入实施计划.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/decisions/2026-04-12-dual-channel-shared-ui-architecture-decision.md
> reviewers：CEO / Orchestrator, Architect, Engineer, Test / QA

## 1. 背景

`2026-04-14` 主任务已经把小程序渐进并入拆为批次 A-E，其中批次 A 的定义固定为：

- `shared/types`
- `shared/core`
- `shared/design-system`

当前手机端人工验收被明确延后，因此本轮不再假装首发验证已经完全闭环，而是转向推进一个不依赖真机的并行项：

- 先对 `codex/aimandala-dual-channel-ui` 与 `main` 之间的批次 A 差异做正式审计
- 明确当前是否已经具备“批次 A 可摘入”条件
- 如果基础层已大体对齐，就把结论正式落盘，避免后续重复判断

## 2. 审计范围

本轮只审计批次 A 对应的共享基础层，不扩展到 `shared/ui`、`miniapp shell`、`/api/v2/miniapp/*`、支付、微信身份或 native host。

固定检查对象：

1. `toC/app/frontend/shared/types`
2. `toC/app/frontend/shared/core`
3. `toC/app/frontend/shared/design-system`
4. 与批次 A 直接相关的 task / qa / delivery artifact

## 3. 审计结论

### 3.1 已确认对齐

当前 `main` 与 `codex/aimandala-dual-channel-ui` 之间，下列批次 A 关键文件已无实际 diff：

- `toC/app/frontend/shared/types/api.ts`
- `toC/app/frontend/shared/types/identity.ts`
- `toC/app/frontend/shared/types/index.ts`
- `toC/app/frontend/shared/core/identity.ts`
- `toC/app/frontend/shared/core/identity.test.ts`
- `toC/app/frontend/shared/core/index.ts`
- `toC/app/frontend/shared/design-system/README.md`
- `toC/app/frontend/shared/design-system/index.ts`
- `toC/app/frontend/shared/design-system/tokens.ts`

这意味着：

- 批次 A 的共享基础层并不是“尚未进入 main”
- 至少在核心 shared foundation 层面，`main` 已经吸收了较大部分 worktree 成果
- 当前最需要的是正式收束审计口径，而不是机械地再做一次“整批摘入”

### 3.2 当前边界问题

虽然批次 A 关键文件已经对齐，但当前 `shared/types` 边界并不完全纯净：

- `shared/types/api.ts` 已包含 `miniapp order / wechat pay / reconcile / payment notify` 等后续批次类型
- `shared/types/identity.ts` 已包含 `MiniappSessionExchangeRequest / Response`

这说明：

- 历史上小程序 worktree 的一部分内容已经以增量方式提前流入 `main`
- 批次 A 实际落地状态更接近“基础层大体对齐，但边界已部分前移”
- 后续继续推进批次 B/C/D/E 时，不能再假设 `main` 处于纯 Web-only 的干净起点

## 4. 当前动作

本轮只做正式审计与收束，不直接执行新的批次 A 代码摘入。

原因：

1. 批次 A 关键文件已无 diff，重复摘入没有信息增量
2. 真实剩余差异已经集中到 `shared/ui`、`miniapp shell`、identity/session runtime、支付与 native host
3. 当前主线更需要把“已对齐什么、未对齐什么”写清，而不是制造一笔语义含混的“批次 A merge”提交

## 5. 下一步建议

当前建议把后续重点转向批次 B 准备，但要先保留两个约束：

1. 手机端人工主路径验收补齐前，不把 `2026-04-14` 首发线宣称为完全闭环
2. 批次 B 开始前，先明确哪些 shared UI 仍依赖 `mobile-web` 私有样式或运行时约束

更具体地说，下一步应优先做：

1. 为批次 B 建立独立 `task / qa / delivery`
2. 审计 `shared/ui + mobile-web` 真实差异面
3. 明确哪些 miniapp/session/payment 类型应在后续批次继续保留，哪些需要重新收束边界

## 6. 不在本轮

- 不执行真实批次 B 代码并入
- 不修改 `/api/v2/miniapp/*`
- 不启动微信 session / wechat pay / native host
- 不把手机端人工验收缺口伪装成已完成
