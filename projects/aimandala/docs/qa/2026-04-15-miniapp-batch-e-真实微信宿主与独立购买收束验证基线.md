# AI Mandala 批次 E 真实微信宿主与独立购买收束验证基线

> 状态：current
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-15
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-15-miniapp-batch-e-真实微信宿主与独立购买收束验证基线.md
> 项目：aimandala
> 阶段：qa-basis
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-15-miniapp-batch-e-真实微信宿主与独立购买收束规格.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-15-miniapp-batch-e-真实微信宿主与独立购买收束实施计划.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 目标行为

本轮验证固定覆盖：

1. miniapp live off 时，Web 与现有前端主链不回归
2. miniapp live on 时，真实微信 session / requestPayment / notify / reconcile 最小闭环成立
3. `Lite / Pro` 在合同、价格和页面文案上都按独立购买表现
4. `upgrade` 相关旧入口不再代表当前主路径

## 2. 核心检查项

### 2.1 后端

- `session/exchange` 支持真实 code 路径
- dev/debug fallback 仍可用
- `orders create`：
  - `lite = 9.9`
  - `pro = 39`
  - 已有 Lite 再买 Pro 仍为 `39`
- `notify / reconcile`：
  - `paid -> fulfilled`
  - `failed / cancelled` 不错误兑现
- `upgrade` 兼容端点不再驱动当前购买主路径

### 2.2 前端

- miniapp runtime 可接入：
  - `login`
  - `session restore`
  - `create order`
  - `requestPayment`
  - `notify / reconcile`
- Web 不再以 `upgrade` route 作为当前 Pro 购买主路径
- `history-record-detail` 不再展示 `补差价`
- `report-choice` 仍只表达这次选择 `Lite / Pro`

### 2.3 文档

- batch E 的 `spec / task / qa / delivery` 已落盘
- `PROJECT.md` 与 README 已加入 batch E 入口
- 所有新文档价格口径统一为 `Lite 9.9 / Pro 39`

## 3. 自动化命令

必须通过：

```bash
pytest -q projects/aimandala/toC/app/backend/tests/unit
npm --prefix projects/aimandala/toC/app/frontend test
npm --prefix projects/aimandala/toC/app/frontend run typecheck
npm --prefix projects/aimandala/toC/app/frontend run build:mobile-web
```

## 4. 人工与联调记录

必须补记录：

1. miniapp live off：Web 主链 smoke
2. miniapp live on：微信联调或沙箱最小支付闭环
3. 历史记录详情页在 Lite-only / Lite+Pro / Pro 处理中三种状态下的表现

联调记录至少写清：

1. 打开的灰度开关与环境变量集合
2. 使用的是微信开发者工具、真机还是宿主注入联调
3. `requestPayment` 是真实拉起还是 dry-run
4. 若失败，失败点位于：
   - login
   - session exchange
   - create order
   - requestPayment
   - notify
   - reconcile
   - open report
5. 回退后 `miniapp live off` 的 Web smoke 是否仍通过

## 5. 当前不在本轮验证范围

1. 分享、裂变、客服
2. 售后与退款
3. 多宿主支持
