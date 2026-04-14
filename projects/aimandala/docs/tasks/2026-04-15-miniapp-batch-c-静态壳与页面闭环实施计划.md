# AI Mandala 批次 C Miniapp 静态壳与页面闭环实施计划

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-15
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-15-miniapp-batch-c-静态壳与页面闭环实施计划.md
> 项目：aimandala
> 阶段：implementation-plan
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-14-mvp-公开首发收口与小程序渐进并入实施计划.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-14-miniapp-batch-a-shared-foundation-audit.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-14-batch-b-历史记录详情与显式报告类型实施计划.md
> reviewers：CEO / Orchestrator, Architect, Engineer, Test / QA

## 1. 背景

批次 A 已确认 shared foundation 已大体对齐，批次 B 已完成 `shared/ui + mobile-web` 的显式报告类型与历史详情收束。

当前 `miniapp/` 目录仍只有占位导出，因此批次 C 的正确目标不是接真实微信能力，而是把 miniapp channel 的静态壳、route plan 与页面闭环先正式落到仓库内。

## 2. 本轮目标

本轮固定只做：

1. `miniapp` channel 的 route plan、fixture 与 page shell
2. 基于现有 `shared/ui` 的 miniapp 静态页面闭环
3. 在现有 `frontend` 预览宿主内提供 miniapp 静态预览入口

## 3. 本轮页面范围

第一版 miniapp 静态壳固定包含：

1. `landing`
2. `upload`
3. `reportEntry`
4. `loading`
5. `report`
6. `history`
7. `historyRecordDetail`

本轮不包含：

- `reportLegacy`
- `upgrade` 的真实 Pro 运行态壳
- 登录授权页
- 支付 / 升级确认页

## 4. 实现方式

- 在 `toC/app/frontend/miniapp/` 下建立 miniapp channel 自有结构：
  - `app.tsx`
  - `routes.ts`
  - `fixtures.ts`
  - `page-shells/*`
  - `index.ts`
- miniapp 复用：
  - `shared/types`
  - `shared/core`
  - `shared/design-system`
  - `shared/ui`
- miniapp 不复用 `mobile-web/runtime.tsx`
- miniapp 的静态状态由 fixture 驱动，不调用真实 API

## 5. 预览承载

- 不新建第二套构建入口
- 复用现有前端预览宿主
- 在预览宿主中增加 miniapp channel 的静态审阅能力
- `build:mobile-web` 继续保持当前对外语义，不承诺 miniapp 可上线

## 6. 当前不做

- 不新增 `/api/v2/miniapp/*`
- 不接微信 `session / pay / native host`
- 不引入真实 upload / detect / report polling
- 不让 miniapp 成为当前 Web MVP 放行阻塞项
