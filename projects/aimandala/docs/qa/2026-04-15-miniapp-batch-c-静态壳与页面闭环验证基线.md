# AI Mandala 批次 C Miniapp 静态壳与页面闭环验证基线

> 状态：historical-reference
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-15
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-15-miniapp-batch-c-静态壳与页面闭环验证基线.md
> 项目：aimandala
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-15-miniapp-batch-c-静态壳与页面闭环实施计划.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 验证对象

本轮验证对象包括：

1. miniapp channel 的静态 route plan 与页面壳
2. miniapp 对 `shared/ui` 的消费
3. 前端预览宿主内的 miniapp 静态审阅入口

## 2. 目标行为

### 2.1 页面闭环

- miniapp route plan 能装配：
  - `landing`
  - `upload`
  - `reportEntry`
  - `loading`
  - `report`
  - `history`
  - `historyRecordDetail`

### 2.2 产品语义

- `reportEntry` 只表达“新解读前版本选择”
- `history` 点击记录进入 `historyRecordDetail`
- `historyRecordDetail` 明确区分：
  - 仅 Lite
  - Lite + Pro
  - Pro 生成中

### 2.3 边界

- miniapp 静态壳不调用真实 API
- miniapp 静态壳不依赖真实 user session
- miniapp 静态壳不引入真实 controller / polling
- `mobile-web` 现有测试不回归

## 3. 自动化

必须通过：

```bash
npm --prefix projects/aimandala/toC/app/frontend test
npm --prefix projects/aimandala/toC/app/frontend run typecheck
npm --prefix projects/aimandala/toC/app/frontend run build:mobile-web
```

重点覆盖：

- miniapp fixtures / route 装配测试
- miniapp app / page-shell 渲染测试
- shared/ui 在 miniapp 下的消费不回归
- mobile-web 现有测试继续通过

## 4. 当前不在验证范围

- 微信宿主
- `/api/v2/miniapp/*`
- 支付 / 升级能力
- 真机小程序运行
