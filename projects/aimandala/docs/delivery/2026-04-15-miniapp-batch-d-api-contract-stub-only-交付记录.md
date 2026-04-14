# AI Mandala 批次 D Miniapp API Contract / Stub-Only 交付记录

> 状态：completed
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-15
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-15-miniapp-batch-d-api-contract-stub-only-交付记录.md
> 项目：aimandala
> 阶段：delivery
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-15-miniapp-batch-d-api-contract-stub-only-实施计划.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-15-miniapp-batch-d-api-contract-stub-only-验证基线.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 本轮交付目标

本轮目标是把 miniapp 批次 D 从“前端合同占位”推进到“后端 contract / stub-only 已可对齐验证”的状态：

1. 补齐 `/api/v2/miniapp/*` 5 个 stub 路由
2. 补齐独立 miniapp stub state
3. 补齐前后端 contract tests

## 2. 当前预期交付内容

- miniapp session / order / notify / reconcile stub 路由
- 独立本地 stub store
- frontend shared/api miniapp contract tests
- 对应 task / qa / delivery artifact

## 3. 当前固定口径

- 本轮只完成 miniapp API contract / stub-only
- 订单 stub 不驱动真实报告生成
- 当前不是 live miniapp
- 批次 E 的真实微信 `session / pay / native host` 仍未开始

## 4. 本轮实际交付

### 4.1 miniapp stub 路由补齐

本轮已在 `/api/v2/miniapp/*` 下补齐：

1. `POST /api/v2/miniapp/session/exchange`
2. `POST /api/v2/miniapp/orders`
3. `GET /api/v2/miniapp/orders/{order_id}`
4. `POST /api/v2/miniapp/orders/{order_id}/reconcile`
5. `POST /api/v2/miniapp/payments/wechat/notify`

其中：

- `session/exchange` 支持 `debug_canonical_user_id` 和 `code -> stub open_id`
- `orders` 按当前 pricing 快照返回 stub 金额
- `notify / reconcile` 只推进订单状态，不反写 interpretation

### 4.2 独立 stub state

- 已新增独立 miniapp stub store
- session / order stub 数据与 interpretation record 分库存放
- 测试清理逻辑已同步覆盖 miniapp stub state

### 4.3 frontend contract tests

- 已为 `shared/api/services.ts` 新增 miniapp API contract tests
- 现有 miniapp 服务签名保持不变
- miniapp 批次 C 静态壳仍未接入真实 API

## 5. 自动化结果

已执行并通过：

- `pytest -q projects/aimandala/toC/app/backend/tests/unit`
- `npm --prefix projects/aimandala/toC/app/frontend test`
- `npm --prefix projects/aimandala/toC/app/frontend run typecheck`
- `npm --prefix projects/aimandala/toC/app/frontend run build:mobile-web`

结果：

- backend unit: `213 passed`
- frontend vitest: `12` files passed, `46` tests passed
- typecheck: passed
- build:mobile-web: passed

## 6. 当前仍未纳入的边界

本轮明确未做：

- 真实微信登录换取
- 真实微信支付 host payload
- native host
- 支付完成后的真实报告兑现
- miniapp runtime 接入这些 API

当前正式口径：

- 这轮交付的是 miniapp API contract / stub-only
- 它不是可上线的小程序 live 能力
- 批次 E 仍未开始
