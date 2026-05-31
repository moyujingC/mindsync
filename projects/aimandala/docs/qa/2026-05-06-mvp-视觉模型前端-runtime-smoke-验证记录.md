# MVP 视觉模型前端 runtime smoke 验证记录

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-05-06
> source_of_truth：projects/aimandala/docs/qa/2026-05-06-mvp-视觉模型前端-runtime-smoke-验证记录.md
> 项目：aimandala
> 阶段：verification
> depends_on：projects/aimandala/docs/qa/2026-05-06-mvp-视觉模型端到端-smoke-验证记录.md

这份记录保存 `mobile-web` 浏览器 runtime smoke 结果。

本轮目标不是继续评测模型，而是确认前端在 `preview=0` 的真实运行时中，能消费同一条 V2 API 主链：上传图片、触发视觉三圈识别、生成 Lite 报告，并通过本地 miniapp stub 支付链路打开 Pro 报告。

## 1. 执行信息

- 执行日期：`2026-05-06`
- 前端地址：`http://127.0.0.1:4173/upload?preview=0&controls=1&userId=vision-runtime-smoke-20260506`
- 后端地址：`http://127.0.0.1:8000`
- 浏览器工具：`playwright-cli`
- 前端模式：`runtime`
- 后端编排：真实 Qwen 视觉检测 + 本地 deterministic / knowledge 报告生成
- 默认视觉模型：`qwen-vl-max-latest`

## 2. 验证链路

浏览器页面中确认：

- 页面顶部显示 `当前为联调运行时`。
- 本地知识工作台显示 `模式 runtime`。
- Lite 报告页出现 `画面依据`，且正文包含内圈 / 中圈 / 外圈依据。
- 调试面板显示 `vision model: qwen-vl-max-latest`。
- Pro 路径最终显示 `一梳 Pro 版报告`，不是占位正文。

网络请求证据：

| 顺序 | 请求 | 结果 |
| --- | --- | --- |
| 1 | `POST /api/v2/upload-image` | `200` |
| 2 | `POST /api/v2/detect-circles` | `200` |
| 3 | `POST /api/v2/interpretations` | `200` |
| 4 | `GET /api/v2/interpretations/{id}/status` | `200` |
| 5 | `GET /api/v2/interpretations/{id}/report?version=lite` | `200` |
| 6 | `POST /api/v2/miniapp/orders` | `200` |
| 7 | `POST /api/v2/miniapp/payments/wechat/notify` | `200` |
| 8 | `POST /api/v2/miniapp/orders/{order_id}/reconcile` | `200` |
| 9 | `GET /api/v2/interpretations/{id}/report?version=pro` | `200` |

## 3. 本轮修复

前端 runtime 原本在进入 Pro 时只轮询 `report?version=pro`，没有先走本地 miniapp stub 支付和 reconcile，导致页面进入 Pro 容器但正文仍是占位。

本轮修复后，runtime 在请求 Pro 报告前会先：

1. 创建 `miniapp` stub 订单。
2. 发送 `paid` 支付通知。
3. 调用 reconcile 开通 Pro 权限。
4. 再请求 `report?version=pro`。

## 4. 结论

前端 runtime smoke 通过：

- `mobile-web` 可在 runtime 模式下走真实 V2 API，不是 preview 假数据。
- 视觉检测从浏览器上传路径进入真实 `detect-circles`。
- Lite `visual_basis` 能在用户可见报告页展示。
- Pro 路径已补齐本地 stub 购买 / 支付 / 对账 / Pro report 闭环。

残留说明：

- 开发控制台的 knowledge build summary 请求返回 `404`，属于调试面板接口缺口，不影响用户主链。
- 本轮浏览器验证使用 dev shell 的测试图入口完成前端接线验证；正式 3 张代表图的后端 V2 API smoke 已由上一份后端记录覆盖。
