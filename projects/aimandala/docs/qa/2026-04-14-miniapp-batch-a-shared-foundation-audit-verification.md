# AI Mandala 小程序渐进并入批次 A 共享基础层审计验证记录

> 状态：current
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-14
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-14-miniapp-batch-a-shared-foundation-audit-verification.md
> 项目：aimandala
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-14-miniapp-batch-a-shared-foundation-audit.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 验证对象

本次验证不验证“批次 A 新代码是否已并入”，而是验证下面这个审计结论是否成立：

- `main` 与 `codex/aimandala-dual-channel-ui` 在批次 A 关键 shared foundation 文件上已经大体对齐
- 当前真正需要记录的是“边界已部分前移”，而不是重复执行不存在实际差异的代码摘入

## 2. 验证方法

### 2.1 文件级差异检查

执行：

```bash
git -C /Users/xinran/Downloads/dev/mindsync diff --name-only main..codex/aimandala-dual-channel-ui -- \
  projects/aimandala/toC/app/frontend/shared/types/api.ts \
  projects/aimandala/toC/app/frontend/shared/types/identity.ts \
  projects/aimandala/toC/app/frontend/shared/types/index.ts \
  projects/aimandala/toC/app/frontend/shared/core/identity.ts \
  projects/aimandala/toC/app/frontend/shared/core/identity.test.ts \
  projects/aimandala/toC/app/frontend/shared/core/index.ts \
  projects/aimandala/toC/app/frontend/shared/design-system/README.md \
  projects/aimandala/toC/app/frontend/shared/design-system/index.ts \
  projects/aimandala/toC/app/frontend/shared/design-system/tokens.ts
```

结果：

- 无输出

解释：

- 这组批次 A 关键文件在两个分支之间没有实际 diff

### 2.2 边界污染检查

执行：

```bash
rg -n "Miniapp|WechatPay|miniapp|payment|session" \
  /Users/xinran/Downloads/dev/mindsync/projects/aimandala/toC/app/frontend/shared/types/api.ts \
  /Users/xinran/Downloads/dev/mindsync/projects/aimandala/toC/app/frontend/shared/types/identity.ts
```

结果：

- `shared/types/api.ts` 中已存在：
  - `CreateMiniappOrderRequest`
  - `MiniappOrderResponse`
  - `NotifyMiniappWechatPaymentRequest`
  - `MiniappWechatPayPayload`
- `shared/types/identity.ts` 中已存在：
  - `MiniappSessionExchangeRequest`
  - `MiniappSessionExchangeResponse`

解释：

- 当前 `main` 的 shared foundation 虽然与 worktree 对齐，但已经包含后续批次语义
- 因此不能再把批次 A 理解成完全纯净、未前移的 shared 基础层

## 3. 当前结论

- 审计结论成立：批次 A 关键 shared foundation 文件已大体对齐
- 当前不需要再做一笔“批次 A 重复摘入”提交
- 后续应把重心转向批次 B 审计与收束
- 同时在文档中保留一个明确提醒：shared boundary 已经部分前移

## 4. 当前不验证

- `shared/ui` 是否已准备好并入
- `miniapp shell` 是否可并入
- `/api/v2/miniapp/*` 合同是否可放行
- 微信 session / wechat pay / native host
