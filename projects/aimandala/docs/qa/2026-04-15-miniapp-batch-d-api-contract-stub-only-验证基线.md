# AI Mandala 批次 D Miniapp API Contract / Stub-Only 验证基线

> 状态：current
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-15
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-15-miniapp-batch-d-api-contract-stub-only-验证基线.md
> 项目：aimandala
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-15-miniapp-batch-d-api-contract-stub-only-实施计划.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 验证对象

本轮验证对象包括：

1. `/api/v2/miniapp/*` 的 5 个 stub 路由
2. miniapp session / order 的本地 stub 状态机
3. 前端 `shared/api/services.ts` 对 miniapp API 的调用合同

## 2. 目标行为

### 2.1 session exchange

- `debug_canonical_user_id` 路径返回实名 stub session
- `code` 可生成确定性 stub `open_id`
- 缺少全部输入时返回 `400`

### 2.2 order contract

- create 能创建 `pending` 订单
- unknown interpretation 返回 `404`
- `lite / pro / upgrade_diff` 金额计算正确
- notify 能推进 `paid / failed / cancelled`
- reconcile 只有在 `paid` 时返回 `fulfilled`

### 2.3 边界

- stub order 不反写 interpretation record
- miniapp 批次 C 静态壳仍不依赖真实 API
- `mobile-web` 现有测试不回归

## 3. 自动化

必须通过：

```bash
pytest -q projects/aimandala/toC/app/backend/tests/unit
npm --prefix projects/aimandala/toC/app/frontend test
npm --prefix projects/aimandala/toC/app/frontend run typecheck
npm --prefix projects/aimandala/toC/app/frontend run build:mobile-web
```

重点覆盖：

- miniapp API contract tests
- miniapp stub state persistence tests
- `shared/api/services` miniapp contract tests
- `mobile-web/controller.test.ts` 不回归

## 4. 当前不在验证范围

- 真实微信登录换取
- 真实微信支付
- native host
- miniapp 真机运行
- 支付完成后的真实报告兑现
