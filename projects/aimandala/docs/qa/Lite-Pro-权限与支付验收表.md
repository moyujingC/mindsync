# Aimandala Lite / Pro 权限与支付验收表

> 状态：working
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-05-31
> source_of_truth：projects/aimandala/docs/qa/Lite-Pro-权限与支付验收表.md
> 项目：aimandala
> 阶段：qa basis
> depends_on：projects/aimandala/docs/specs/MVP-上线范围与-Go-No-Go-标准.md
> depends_on：projects/aimandala/docs/qa/MVP-主流程验收表.md
> depends_on：projects/aimandala/docs/decisions/2026-05-29-Lite-Pro版本关系与内容边界决策.md
> reviewers：CEO / Orchestrator, Product Spec Lead, Engineer, Payment owner, Test / QA, Security

## 1. 验收对象

本表专项验收 Aimandala MVP 的 Lite / Pro 权限与支付状态。

验收范围：

```text
未支付 -> Lite 支付 -> Lite 报告 -> Pro 升级支付 -> Pro 权益 -> Pro 报告 / followup
```

同时覆盖：

- Pro 直接访问拦截。
- 支付失败 / 取消 / 同步中。
- 重复点击支付。
- 已购买再次进入。
- report_id / user_id 不匹配。
- 后端权限校验。
- 前端状态展示一致性。

本表不验收报告内容质量和 followup 回答质量；这些进入报告内容 smoke 与 Followup MVP 验收记录。

## 2. 原始期望

当前正式口径：

1. Lite 价格为 9.9 元。
2. Pro 是 Lite 的升级，升级价为 29 元。
3. Pro 不能独立购买。
4. 用户必须先完成对应画作的 Lite 购买与查看，才能触发 Pro 升级入口。
5. 未付费用户不能看到付费报告正文。
6. Lite 用户不能看到 Pro 完整内容。
7. Pro 用户能恢复 Pro 权益，不重复付款。
8. 后端权限校验是最终门禁，前端展示不能作为唯一依据。

## 3. 结论口径

| 结论 | 含义 |
|---|---|
| pass | 实际结果符合预期 |
| warn | 用户侧不被阻断，但存在需记录的非阻塞风险 |
| fail | 付费、权益、权限或隐私主链路存在阻断或高风险 |
| not_run | 尚未执行 |

专项总评：

- **通过**：P0 全部 pass，P1 无影响支付和权限判断的问题。
- **有条件通过**：P0 全部 pass，但 P1 存在 warn，并已记录 owner 和修复计划。
- **不通过**：任一 P0 fail。

## 4. 测试前置条件

| 项目 | 记录 |
|---|---|
| 测试环境 | 待填 |
| 前端版本 / commit | 待填 |
| 后端版本 / commit | 待填 |
| 支付环境 | sandbox / production / mock，待填 |
| 支付渠道 | 微信支付 / 其他，待填 |
| 用户 A：未支付 | 待填 |
| 用户 B：Lite 已支付 | 待填 |
| 用户 C：Pro 已升级 | 待填 |
| 用户 D：非本人访问测试 | 待填 |
| 样例 report_id | 待填 |
| Lite order_id | 待填 |
| Pro upgrade order_id | 待填 |
| 执行人 | 待填 |
| 执行时间 | 待填 |

## 5. P0 权限与支付验收矩阵

### 5.1 未支付状态

| ID | 场景 | 前置条件 | 操作 | 预期结果 | 实际结果 | 结论 | 证据 |
|---|---|---|---|---|---|---|---|
| PAY-P0-01 | 未支付用户访问 Lite 报告正文 | 用户未支付，已有 report_id 或构造 URL | 直接打开 Lite 报告 URL / API | 不展示 Lite 正文；提示需完成 Lite 支付或回到购买入口 | 待测 | not_run | 待补 |
| PAY-P0-02 | 未支付用户访问 Pro 报告正文 | 用户未支付 | 直接打开 Pro 报告 URL / API | 不展示 Pro 正文；不出现 Pro 独立购买主入口；提示先完成 Lite | 待测 | not_run | 待补 |
| PAY-P0-03 | 未支付用户发起 Pro 升级支付 | 用户未支付 Lite | 调用 Pro 升级支付入口 / API | 后端拒绝；前端提示需先完成 Lite；不创建有效 Pro 订单 | 待测 | not_run | 待补 |
| PAY-P0-04 | 未支付用户访问 followup | 用户未支付 | 调用 followup 入口 / API | 拒绝访问；不返回报告上下文，不生成回答 | 待测 | not_run | 待补 |

退回条件：未付费用户看到 Lite / Pro 正文、可创建 Pro 订单、可进入 followup，退回 Engineer / Security。

### 5.2 Lite 支付

| ID | 场景 | 前置条件 | 操作 | 预期结果 | 实际结果 | 结论 | 证据 |
|---|---|---|---|---|---|---|---|
| PAY-P0-05 | Lite 支付前金额确认 | 新用户准备购买 Lite | 打开 Lite 支付确认页 | 金额为 9.9 元；说明购买的是当前画作 Lite 报告 | 待测 | not_run | 待补 |
| PAY-P0-06 | Lite 支付成功 | 支付渠道可用 | 完成 Lite 支付 | 后端记录 Lite 权益；前端进入 Lite 生成 / Lite 报告状态 | 待测 | not_run | 待补 |
| PAY-P0-07 | Lite 支付失败 | 模拟失败 | 支付失败返回 | 不解锁 Lite；提示支付失败；可重新支付 | 待测 | not_run | 待补 |
| PAY-P0-08 | Lite 支付取消 | 用户取消支付 | 返回产品页 | 不解锁 Lite；提示已取消或回到支付前状态 | 待测 | not_run | 待补 |
| PAY-P0-09 | Lite 支付成功但同步中 | 模拟回调延迟 | 支付后返回页面 | 显示权益同步中；不生成重复订单；提示稍后刷新 | 待测 | not_run | 待补 |

退回条件：金额错误、支付失败仍解锁、支付成功不解锁且无兜底、同步中诱导重复支付，退回 Payment owner / Engineer。

### 5.3 Lite 已支付状态

| ID | 场景 | 前置条件 | 操作 | 预期结果 | 实际结果 | 结论 | 证据 |
|---|---|---|---|---|---|---|---|
| PAY-P0-10 | Lite 用户查看 Lite 报告 | 用户已购买 Lite | 打开对应 Lite 报告 | 可查看 Lite 正文；显示 Lite 标识；不要求再次支付 Lite | 待测 | not_run | 待补 |
| PAY-P0-11 | Lite 用户刷新恢复 | Lite 已购买，报告页打开 | 刷新 / 重新进入 | 仍保持 Lite 权益；不回到未支付状态 | 待测 | not_run | 待补 |
| PAY-P0-12 | Lite 用户看到 Pro 升级入口 | Lite 报告已完成，未升级 Pro | 滚动报告或触发入口 | 出现 Pro 升级入口；升级价 29 元；说明是当前报告升级 | 待测 | not_run | 待补 |
| PAY-P0-13 | Lite 用户访问 Pro 正文 | Lite 已支付，未升级 Pro | 打开 Pro 报告 URL / API | 不展示 Pro 完整内容；展示升级入口或权限提示 | 待测 | not_run | 待补 |
| PAY-P0-14 | Lite 用户访问 Pro followup | Lite 已支付，未升级 Pro | 调用 Pro followup | 按当前产品策略拒绝或只允许有限追问；不得返回 Pro 报告上下文 | 待测 | not_run | 待补 |

退回条件：Lite 用户丢失 Lite 权益、Lite 用户直接看到 Pro 完整内容、Lite 用户能绕过升级进入 Pro followup，退回 Engineer / Security。

### 5.4 Pro 升级支付

| ID | 场景 | 前置条件 | 操作 | 预期结果 | 实际结果 | 结论 | 证据 |
|---|---|---|---|---|---|---|---|
| PAY-P0-15 | Pro 支付前资格校验 | Lite 已支付，未升级 Pro | 点击升级 Pro | 后端确认该 report_id 已有 Lite 权益；进入 Pro 支付确认 | 待测 | not_run | 待补 |
| PAY-P0-16 | Pro 支付前金额确认 | Pro 支付确认页打开 | 查看金额和说明 | 金额为 29 元；说明是当前 Lite 报告升级，不是独立购买 | 待测 | not_run | 待补 |
| PAY-P0-17 | Pro 支付成功 | 支付渠道可用 | 完成 Pro 支付 | 后端记录 Pro 权益；前端进入 Pro 生成 / Pro 报告状态 | 待测 | not_run | 待补 |
| PAY-P0-18 | Pro 支付失败 | 模拟失败 | 支付失败返回 | 不解锁 Pro；保留 Lite 权益；可重新发起升级 | 待测 | not_run | 待补 |
| PAY-P0-19 | Pro 支付取消 | 用户取消支付 | 返回产品页 | 不解锁 Pro；保留 Lite 权益；可重新发起升级 | 待测 | not_run | 待补 |
| PAY-P0-20 | Pro 支付成功但同步中 | 模拟回调延迟 | 支付后返回 | 显示 Pro 权益同步中；提示不要重复支付；可刷新状态 | 待测 | not_run | 待补 |

退回条件：未校验 Lite 就创建 Pro 订单、金额错误、支付失败解锁 Pro、支付成功后权益丢失或无同步提示，退回 Payment owner / Engineer。

### 5.5 重复点击与幂等

| ID | 场景 | 前置条件 | 操作 | 预期结果 | 实际结果 | 结论 | 证据 |
|---|---|---|---|---|---|---|---|
| PAY-P0-21 | Lite 支付按钮重复点击 | Lite 支付按钮可见 | 快速点击多次 | 只创建一个有效 Lite 支付单；按钮 pending / disabled | 待测 | not_run | 待补 |
| PAY-P0-22 | Pro 支付按钮重复点击 | Pro 支付按钮可见 | 快速点击多次 | 只创建一个有效 Pro 升级支付单；按钮 pending / disabled | 待测 | not_run | 待补 |
| PAY-P0-23 | 支付回调重复到达 | 已完成支付 | 重放同一支付回调或模拟重复通知 | 权益幂等更新；不重复生成权益，不重复发放 / 扣费 | 待测 | not_run | 待补 |
| PAY-P0-24 | 支付中刷新 | 支付中或刚返回 | 刷新页面 | 恢复待支付 / 同步中 / 已支付状态之一；不丢订单 | 待测 | not_run | 待补 |

退回条件：重复创建有效订单、重复扣费风险、重复回调导致状态错乱，退回 Payment owner / Engineer。

### 5.6 Pro 已升级状态

| ID | 场景 | 前置条件 | 操作 | 预期结果 | 实际结果 | 结论 | 证据 |
|---|---|---|---|---|---|---|---|
| PAY-P0-25 | Pro 用户查看 Pro 报告 | 用户已升级 Pro | 打开对应 Pro 报告 | 可查看 Pro 正文；显示已解锁；不显示主支付按钮 | 待测 | not_run | 待补 |
| PAY-P0-26 | Pro 用户刷新恢复 | Pro 已升级，页面打开 | 刷新 / 重新进入 | 仍保持 Pro 权益；不回退到 Lite 或未支付 | 待测 | not_run | 待补 |
| PAY-P0-27 | Pro 用户再次点击升级入口 | Pro 已升级 | 尝试通过旧入口或返回 Lite 页再点击升级 | 不重复发起支付；提示已解锁或直接进入 Pro | 待测 | not_run | 待补 |
| PAY-P0-28 | Pro 用户使用 followup | Pro 已升级 | 打开 followup 并提问 | 权限允许；请求绑定当前 report_id 和用户 | 待测 | not_run | 待补 |

退回条件：Pro 用户被要求再次支付、Pro 权益刷新后丢失、followup 不校验 Pro 权益，退回 Engineer / Security。

### 5.7 report_id / user_id 不匹配与越权访问

| ID | 场景 | 前置条件 | 操作 | 预期结果 | 实际结果 | 结论 | 证据 |
|---|---|---|---|---|---|---|---|
| PAY-P0-29 | 用户 A 访问用户 B 的 Lite 报告 | 用户 A 登录，用户 B 有 Lite | 构造 B 的 report_id 访问 Lite | 拒绝访问；不返回报告正文或支付状态细节 | 待测 | not_run | 待补 |
| PAY-P0-30 | 用户 A 访问用户 B 的 Pro 报告 | 用户 A 登录，用户 B 有 Pro | 构造 B 的 report_id 访问 Pro | 拒绝访问；不返回 Pro 正文或上下文 | 待测 | not_run | 待补 |
| PAY-P0-31 | 用户 A 使用用户 B 的 report_id 发起 Pro 升级 | 用户 A 未拥有 B 的 Lite | 调用 Pro 升级支付 | 后端拒绝；不创建订单 | 待测 | not_run | 待补 |
| PAY-P0-32 | 用户 A 使用用户 B 的 report_id 发起 followup | 用户 B 有 Pro | 调用 followup API | 拒绝访问；不泄露上下文；不生成回答 | 待测 | not_run | 待补 |
| PAY-P0-33 | 不存在 report_id | 构造不存在 report_id | 访问报告 / 升级 / followup | 返回 404 或用户化不存在提示；不创建订单，不生成回答 | 待测 | not_run | 待补 |

退回条件：跨用户读取报告、跨用户升级、跨用户 followup、错误信息泄露他人支付状态，退回 Security / Engineer。

### 5.8 后端权限校验

| ID | 场景 | 前置条件 | 操作 | 预期结果 | 实际结果 | 结论 | 证据 |
|---|---|---|---|---|---|---|---|
| PAY-P0-34 | 绕过前端访问 Lite API | 未支付用户 | 直接调用 Lite 报告 API | 后端拒绝；不返回正文 | 待测 | not_run | 待补 |
| PAY-P0-35 | 绕过前端访问 Pro API | Lite 用户未升级 Pro | 直接调用 Pro 报告 API | 后端拒绝；不返回 Pro 正文 | 待测 | not_run | 待补 |
| PAY-P0-36 | 绕过前端创建 Pro 订单 | 未购买 Lite 用户 | 直接调用 Pro 订单 / upgrade API | 后端拒绝；不创建有效订单 | 待测 | not_run | 待补 |
| PAY-P0-37 | 绕过前端调用 followup | 未升级 Pro 用户 | 直接调用 followup API | 后端拒绝或按产品策略限制；不得返回 Pro context | 待测 | not_run | 待补 |
| PAY-P0-38 | 伪造前端状态 | 修改 localStorage / query / client state | 访问 Pro 内容 | 后端仍以真实权益为准；前端伪状态无效 | 待测 | not_run | 待补 |

退回条件：任一付费内容只靠前端判断，退回 Engineer / Security。

## 6. P1 前端状态一致性检查

| ID | 场景 | 检查点 | 预期结果 | 实际结果 | 结论 | Owner |
|---|---|---|---|---|---|---|
| PAY-P1-01 | Lite 支付前页面 | 金额、权益说明、按钮 | 9.9 元；说明 Lite 报告；按钮文案明确 | 待测 | not_run | UI / Product |
| PAY-P1-02 | Lite 已支付页面 | 状态标签、按钮 | 显示 Lite 已解锁 / 已生成；不显示重复购买 Lite | 待测 | not_run | UI / Engineer |
| PAY-P1-03 | Pro 升级卡片 | 金额、价值、边界 | 29 元；说明升级当前报告；不制造焦虑 | 待测 | not_run | UI / Product |
| PAY-P1-04 | 支付中 | loading、按钮禁用 | 显示支付处理中；按钮 disabled；不允许重复点击 | 待测 | not_run | UI / Engineer |
| PAY-P1-05 | 支付同步中 | 文案与动作 | 提示支付已完成、权益同步中、不要重复支付；提供刷新状态 | 待测 | not_run | UI / Engineer |
| PAY-P1-06 | 支付失败 / 取消 | 文案与动作 | 区分失败和取消；保留原权益；提供重试或返回 | 待测 | not_run | UI / Product |
| PAY-P1-07 | Pro 已解锁 | 状态标签、按钮 | 显示 Pro 已解锁；不显示主支付按钮；可进入 Pro 报告 | 待测 | not_run | UI / Engineer |
| PAY-P1-08 | 权限不足 | 错误展示 | 说明当前无法访问；引导回到正确入口；不暴露技术错误 | 待测 | not_run | UI / Engineer |

P1 warn 不单独阻塞上线，但必须进入 Conditional Go 风险清单。

## 7. 证据记录要求

每个执行批次至少保存：

- user_id / openid。
- report_id / interpretation_id。
- Lite order_id。
- Pro upgrade order_id。
- 支付状态记录。
- 权益状态记录。
- API 请求和响应摘要。
- 关键页面截图或录屏。
- 后端日志关键错误 ID。

建议证据目录：

```text
projects/aimandala/docs/qa/model-evals/<date>-lite-pro-payment-auth-smoke/
```

如使用支付 sandbox 或 mock，应在证据中明确标注，不得冒充真实支付环境。

## 8. 当前风险与回归点

### 8.1 P0 风险

| 风险 | 影响 | 回归点 | Owner |
|---|---|---|---|
| Pro 从旧独立购买切换为 Lite 后升级 | 老入口、旧 URL、旧按钮可能绕过资格校验 | Pro 直达 URL、upgrade API、历史用户 | Product / Engineer |
| 支付同步延迟 | 用户可能重复支付或投诉 | 支付后返回页、轮询、手动刷新 | Payment owner / Engineer |
| 幂等不足 | 重复订单、重复回调、重复权益更新 | 订单创建、回调处理、按钮 pending | Payment owner / Engineer |
| 权限只在前端判断 | 付费内容泄露 | 直接调用 API、伪造前端状态 | Engineer / Security |
| report_id / user_id 不匹配 | 串用户、隐私泄露 | 报告 API、upgrade API、followup API | Security / Engineer |

### 8.2 P1 风险

| 风险 | 影响 | 处理方式 | Owner |
|---|---|---|---|
| 支付失败和取消文案不区分 | 用户不确定是否扣费 | UI 最后一轮优化补齐 | UI / Product |
| Pro 升级卡片过度强调价格 | 转化体验变硬 | 改为内容勾起好奇 | Product / UI |
| 同步中状态没有刷新动作 | 用户焦虑 | 增加刷新状态 / 稍后查看 | UI / Engineer |
| 历史用户口径不清 | 老用户困惑 | 补历史用户提示 | Product / Support |

## 9. 退回条件

出现以下任一情况，本专项验收直接不通过：

1. 未付费用户能看到 Lite 或 Pro 正文。
2. 未完成 Lite 的用户能创建 Pro 订单或进入 Pro 报告。
3. Lite 用户能绕过升级看到 Pro 完整内容。
4. Pro 支付成功后不能恢复 Pro 权益。
5. 支付失败或取消后错误解锁。
6. 已购买用户被引导重复付款。
7. 重复点击或重复回调导致重复有效订单、重复扣费风险或权益错乱。
8. 用户 A 能访问用户 B 的报告、支付状态或 followup context。
9. 伪造前端状态能绕过后端权限。
10. 权限错误直接泄露技术细节或他人状态。

## 10. 当前评审结论占位

> 当前结论：not_run。

执行后补充：

| 项目 | 结果 |
|---|---|
| P0 pass 数 | 待填 |
| P0 warn 数 | 待填 |
| P0 fail 数 | 待填 |
| P1 warn 数 | 待填 |
| 阻塞项 | 待填 |
| 非阻塞风险 | 待填 |
| 建议结论 | 待填 |
| 退回 owner | 待填 |
| 下一步 handoff | 待填 |

## 11. 下一步

1. Engineer / QA 按本表执行权限与支付专项 smoke。
2. 任何 P0 fail 必须先退回 Engineer / Payment owner / Security，不进入 UI 最后一轮优化。
3. P1 warn 进入 UI 最后一轮优化输入。
4. 支付与权限专项通过后，继续执行 `Lite / Pro 报告内容 Smoke Test 记录`。
5. 所有专项记录完成后，汇总进入 `MVP 上线 Go / No-Go Review`。
