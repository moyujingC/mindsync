# AI Mandala 批次 C Miniapp 静态壳与页面闭环交付记录

> 状态：completed
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-15
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-15-miniapp-batch-c-静态壳与页面闭环交付记录.md
> 项目：aimandala
> 阶段：delivery
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-15-miniapp-batch-c-静态壳与页面闭环实施计划.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-15-miniapp-batch-c-静态壳与页面闭环验证基线.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 本轮交付目标

本轮目标是把 miniapp 批次 C 从目录占位推进到可审阅的静态壳闭环：

1. miniapp 自有 route / fixture / page shell 正式落盘
2. 前端预览宿主内可切换到 miniapp 静态审阅
3. 保持当前实现边界不越过真实微信能力

## 2. 预期交付内容

- `miniapp` channel 自有 app / routes / fixtures / page-shells
- landing -> history-detail 的完整静态闭环
- 预览宿主内 miniapp 入口
- 对应 task / qa / delivery artifact

## 3. 本轮实际交付

### 3.1 Miniapp 静态壳正式落盘

- `miniapp/` 不再只有占位导出
- 已新增 miniapp channel 自有结构：
  - `app.tsx`
  - `routes.ts`
  - `fixtures.ts`
  - `page-shells/`
  - `index.ts`
- miniapp 当前通过本地 fixture 装配静态页面状态，不调用真实 API

### 3.2 页面闭环范围

本轮 miniapp 静态壳已覆盖：

1. `landing`
2. `upload`
3. `reportEntry`
4. `loading`
5. `report`
6. `history`
7. `historyRecordDetail`

其中：

- `reportEntry` 保持“新解读前版本选择”语义
- `history` 点击记录进入 `historyRecordDetail`
- `historyRecordDetail` 已可区分：
  - 仅 Lite
  - Lite + Pro
  - Pro 生成中

### 3.3 预览承载方式

- 本轮没有新建独立 miniapp build 入口
- 已复用现有前端 preview 宿主
- 当前本地 browser shell 已可切换：
  - `mobile-web`
  - `miniapp`
- miniapp 预览只用于结构审阅，不代表真实宿主运行时

## 4. 自动化结果

已执行并通过：

- `npm --prefix projects/aimandala/toC/app/frontend run typecheck`
- `npm --prefix projects/aimandala/toC/app/frontend test`
- `npm --prefix projects/aimandala/toC/app/frontend run build:mobile-web`

结果：

- `typecheck`: passed
- `vitest`: `11` files passed, `41` tests passed
- `build:mobile-web`: passed

## 5. 当前仍未纳入的边界

本轮明确未做：

- `/api/v2/miniapp/*`
- 微信 `session / pay / native host`
- 真实 upload / detect / report polling
- 真机小程序运行
- `upgrade` 的真实 Pro 运行壳

当前正式口径：

- 这轮交付的是 miniapp 静态壳
- 它不是可上线的小程序
- 批次 D/E 仍未开始

## 6. 与后续批次关系

- 批次 C 解决的是“channel 壳与完整页面闭环预览”
- 批次 D 才进入 `/api/v2/miniapp/*` contract / stub-only 能力
- 批次 E 才进入真实微信 live 能力
