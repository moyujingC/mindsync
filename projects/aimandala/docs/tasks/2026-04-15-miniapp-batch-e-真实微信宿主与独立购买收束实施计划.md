# AI Mandala 批次 E 真实微信宿主与独立购买收束实施计划

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-15
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-15-miniapp-batch-e-真实微信宿主与独立购买收束实施计划.md
> 项目：aimandala
> 阶段：implementation-plan
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-15-miniapp-batch-e-真实微信宿主与独立购买收束规格.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-14-mvp-公开首发收口与小程序渐进并入实施计划.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-15-miniapp-batch-d-api-contract-stub-only-实施计划.md
> reviewers：CEO / Orchestrator, Architect, Engineer, Test / QA

## 1. 背景

批次 D 已把 `/api/v2/miniapp/*` 推进到 contract / stub-only，但当前仍缺两类关键收束：

1. miniapp 真实微信宿主接入
2. `Lite / Pro` 独立购买语义与历史升级残留的统一纠偏

## 2. 本轮目标

本轮固定完成：

1. miniapp 真实微信 `session / requestPayment / notify / reconcile` 闭环
2. miniapp runtime 正式接入 live API
3. `Lite = 9.9`、`Pro = 39` 的价格与订单合同统一
4. Web 与 miniapp 主路径不再把 `Lite -> Pro` 当补差价升级
5. 主干可合并、默认灰度关闭

## 3. 固定边界

本轮只做：

1. 微信小程序宿主能力
2. 独立购买语义纠偏
3. 灰度开关与环境边界
4. 与此直接相关的文档、测试和交付记录

本轮不做：

1. 多宿主抽象
2. 分享、社交裂变、客服
3. 退款与复杂售后
4. 不经灰度直接对所有环境开启 live 能力

## 4. 实现方式

### 4.1 后端

- 在 miniapp 现有合同上补真实微信 session / pay 配置解析
- `orders create` 统一按 `product_type` 直接计价
- `reconcile` 在支付成功后兑现对应 `version_purchased`
- `/upgrade` 降级为兼容壳，不再承担当前购买主路径
- 增加 miniapp live 相关环境变量与默认关闭策略

### 4.2 前端

- miniapp 从静态预览壳推进到真实 runtime shell
- 通过宿主 adapter 注入 `login / requestPayment / session restore`
- Web 与 miniapp 都去掉 `补差价升级` 的主路径语义
- `history-record-detail` 只表达版本可查看性，不表达补差价

### 4.3 文档治理

- 把 batch E 加入 `PROJECT.md` 与 `docs/tasks|qa|delivery/README.md`
- 明确当前主干允许并入，但默认灰度关闭
- 把批次 E 的收束结论纳入 `2026-04-14` 总任务链的当前状态

## 5. 执行顺序

1. 先补 `spec / task / qa / delivery`
2. 先补后端与前端 contract / runtime tests
3. 再做价格、订单、session、灰度与 runtime 改造
4. 再做 Web `upgrade` 残留降级
5. 跑完整验证
6. 回写 delivery 与主任务链

## 6. 完成标准

1. miniapp live off 时，Web 无回归
2. miniapp live on 时，真实微信联调或沙箱可走通最小闭环
3. `Lite / Pro` 价格与购买语义在文档、合同、UI、测试中一致
4. batch E 可并入 `main`，但默认灰度关闭

## 7. 灰度联调顺序与回退口径

联调固定顺序：

1. 先在后端打开：
   - `AIMANDALA_MINIAPP_LIVE_ENABLED=1`
   - `AIMANDALA_MINIAPP_WECHAT_SESSION_ENABLED=1`
   - `AIMANDALA_MINIAPP_WECHAT_PAY_ENABLED=1`
2. 再在前端 miniapp 预览宿主打开：
   - `VITE_AIMANDALA_MINIAPP_LIVE_ENABLED=1`
   - `VITE_AIMANDALA_MINIAPP_WECHAT_SESSION_ENABLED=1`
   - `VITE_AIMANDALA_MINIAPP_WECHAT_PAY_ENABLED=1`
3. 再补齐微信联调必要配置：
   - `AIMANDALA_MINIAPP_WECHAT_APP_ID`
   - `AIMANDALA_MINIAPP_WECHAT_APP_SECRET`
   - `AIMANDALA_MINIAPP_WECHAT_PAY_MCH_ID`
   - `AIMANDALA_MINIAPP_WECHAT_PAY_API_V3_KEY`
4. 按最小闭环执行：
   - `login`
   - `session exchange`
   - `create order`
   - `requestPayment`
   - `notify`
   - `reconcile`
   - `open report`

失败回退固定为：

1. 先关闭全部 miniapp live 开关
2. 确认 miniapp runtime 回退到 stub session / stub payment
3. 确认 Web 主链 `upload -> detect -> report-choice -> report -> history -> reopen` 不受影响
4. 不通过恢复 `upgrade` 主路径来规避批次 E 问题
