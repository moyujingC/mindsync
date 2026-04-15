# AI Mandala 批次 E 真实微信宿主与独立购买收束交付记录

> 状态：working
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-15
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-15-miniapp-batch-e-真实微信宿主与独立购买收束交付记录.md
> 项目：aimandala
> 阶段：delivery
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-15-miniapp-batch-e-真实微信宿主与独立购买收束实施计划.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-15-miniapp-batch-e-真实微信宿主与独立购买收束验证基线.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 本轮交付目标

本轮目标是把 miniapp 从批次 D 的 `contract / stub-only` 推进到：

1. 真实微信小程序宿主可灰度接入
2. `Lite / Pro` 独立购买语义在文档、合同、UI 和测试中统一
3. 主干可合并，但默认灰度关闭

## 2. 当前预期交付内容

- batch E `spec / task / qa / delivery`
- miniapp live-gray session / payment / reconcile 能力
- Web `upgrade` 主路径降级或移除
- 价格与订单合同统一为 `Lite 9.9 / Pro 39`
- 对应自动化与联调记录

## 3. 当前固定口径

- 当前只支持微信小程序宿主
- 当前正式产品语义是独立购买，不是补差价升级
- 批次 E 完成后允许并入 `main`
- 并入后默认仍为灰度关闭

## 4. 实际交付

本轮已完成：

1. 正式新增 batch E 的 `spec / task / qa / delivery`，并把 `PROJECT.md`、`docs/tasks/README.md`、`docs/qa/README.md`、`docs/delivery/README.md` 收束到当前入口。
2. 后端 `/api/v2/miniapp/*` 从 batch D 的 `stub-only` 推进到 `live-ready`：
   - `session/exchange` 支持灰度下真实微信 `code -> session` 路径
   - `orders` 按独立购买语义统一为 `Lite 9.9 / Pro 39`
   - `payments/wechat/notify + reconcile` 可兑现对应版本可见性
   - 新增 miniapp live gray config，默认关闭
3. Web / mobile-web 主链去掉“补差价升级”为当前真相的表达：
   - `report` 成为唯一报告承载页
   - Pro 通过显式 `reportType` 与 `report.version` 打开
   - `upgrade` route 从当前主路径移除
   - 历史详情页保留历史兼容记录展示，但不再把其当作当前购买语义
4. miniapp 前端从纯静态壳推进到最小 live runtime：
   - 新增 miniapp host adapter、session persistence、runtime 组件
   - 支持 `session -> create order -> requestPayment -> notify -> reconcile -> open report` 最小闭环
   - 在现有前端工程和 dev shell 中可联调，不新开第二套宿主工程
5. `/api/v2/interpretations/{id}/upgrade` 已降级为兼容壳：
   - 返回 `disabled`
   - 明确提示当前正式产品语义是 `Lite / Pro` 独立购买

当前并入主干口径：

1. batch E 代码已达到“可并入 `main`、默认灰度关闭”的目标
2. miniapp live 相关能力必须在明确环境下打开，不作为当前 Web MVP 放行阻塞项
3. 当前只支持微信小程序宿主，不支持多宿主抽象

截至 `2026-04-15` 的当前状态补充：

1. batch E 主线能力已实际并入 `main`
2. `miniapp-native` 灰度壳、灰度配置样例与 `2026-04-13` gray 文档链也已摘入 `main`
3. 这些能力当前都按“已并主干、默认灰度关闭”处理，不代表小程序已正式上线
4. 后续继续开发与分批摘入时，Aimandala 只保留 `codex/aimandala-dual-channel-ui` 作为并行来源分支

## 5. 自动化结果

已通过：

1. `pytest -q projects/aimandala/toC/app/backend/tests/unit`
   - 结果：`215 passed`
2. `npm --prefix projects/aimandala/toC/app/frontend test`
   - 结果：`12 passed / 46 passed`
3. `npm --prefix projects/aimandala/toC/app/frontend run typecheck`
   - 结果：通过
4. `npm --prefix projects/aimandala/toC/app/frontend run build:mobile-web`
   - 结果：通过

本轮未完成的环境侧验证：

1. 真实微信小程序宿主联调
2. 真实微信 `requestPayment` 沙箱或灰度环境闭环
3. miniapp live `on` 时的人工最小验收

## 6. 当前残留风险

1. `upgrade_diff / can_upgrade / upgrade_history / /upgrade` 仍作为兼容残留存在于合同和历史数据中，尚未完全退役；当前已不再作为真实购买主路径。
2. miniapp live runtime 已可联调，但真实微信宿主能力仍缺少本轮人工联调记录，因此不能宣称“已完成线上可用验证”。
3. 当前前端 dev shell 复用同一宿主承载 miniapp runtime，适合并主干和联调，不等于已经形成独立可发布的小程序工程。
4. 当前自动化验证证明“默认灰度关闭时不影响 Web 主链”；打开灰度后的真实风险仍需在微信环境中单独确认。

## 7. 联调与回退 runbook

联调前置条件：

1. 后端显式打开：
   - `AIMANDALA_MINIAPP_LIVE_ENABLED=1`
   - `AIMANDALA_MINIAPP_WECHAT_SESSION_ENABLED=1`
   - `AIMANDALA_MINIAPP_WECHAT_PAY_ENABLED=1`
2. 前端显式打开：
   - `VITE_AIMANDALA_MINIAPP_LIVE_ENABLED=1`
   - `VITE_AIMANDALA_MINIAPP_WECHAT_SESSION_ENABLED=1`
   - `VITE_AIMANDALA_MINIAPP_WECHAT_PAY_ENABLED=1`
3. 微信配置齐备：
   - `AIMANDALA_MINIAPP_WECHAT_APP_ID`
   - `AIMANDALA_MINIAPP_WECHAT_APP_SECRET`
   - `AIMANDALA_MINIAPP_WECHAT_PAY_MCH_ID`
   - `AIMANDALA_MINIAPP_WECHAT_PAY_API_V3_KEY`

联调顺序：

1. 先确认 miniapp runtime 环境标识从“灰度关闭联调”变为“live 联调”
2. 执行 `login -> session exchange`
3. 执行 `create order -> requestPayment`
4. 执行 `notify -> reconcile`
5. 确认目标报告可打开，且历史记录详情页反映对应版本可查看性

失败回退：

1. 关闭全部 miniapp live / session / pay 开关
2. 确认 miniapp runtime 回到 stub session / stub payment
3. 复跑 Web 主链 smoke，确认 Web MVP 不受影响
4. 在 delivery 中记录失败点和回退结果，不通过恢复 `upgrade` 入口规避问题

补充纪律：

1. 若后续继续做真实微信联调，应直接沿本交付记录与 batch E `task / qa / delivery` 链回写
2. 不再为同一条 miniapp live-ready 主线重开第二套平级总线计划
