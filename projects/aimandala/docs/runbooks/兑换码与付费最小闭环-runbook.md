# 兑换码与付费最小闭环 runbook

> 状态：current
> 版本：0.1.0
> owner：Engineer / CEO
> last_updated：2026-05-19
> source_of_truth：projects/aimandala/docs/runbooks/兑换码与付费最小闭环-runbook.md
> 项目：aimandala
> 类型：manual runbook

本文用于支撑 `一镜一梳` 财富报告 MVP 在正式支付系统上线前的小范围内测、优惠码发放和人工收费交付。

当前实现是兑换码授权，不是订单系统。运营上可以先通过微信、转账或人工登记完成收款，再发放兑换码。产品内只判断用户是否有生成 Lite / Pro 报告的授权。

## 1. 当前边界

当前已支持：

- 用户在 `/api/wealth-reports` 请求中提交 `redeem_code`。
- 后端读取 `AIMANDALA_REDEEM_CODES`。
- 兑换码可以授权 `lite`、`pro` 或同时授权两种报告。
- 未配置兑换码、未提交兑换码、兑换码错误、Lite 码生成 Pro，都会返回 `402`。

当前不包含：

- 订单。
- 支付回调。
- 自动核销后台。
- 退款。
- 用户账户。
- 购买记录。
- 每个兑换码的自动使用次数统计。

对外表达时，应说“当前为内测兑换码 / 人工授权模式”，不要说“已经接入完整支付系统”。

## 2. 配置格式

环境变量固定使用：

```bash
AIMANDALA_REDEEM_CODES="CODE-LITE:lite;CODE-PRO:pro;CODE-ALL:lite,pro"
```

规则：

- 分号 `;` 分隔不同兑换码。
- 冒号 `:` 左侧是兑换码，右侧是授权报告类型。
- 报告类型只允许 `lite` 和 `pro`。
- 一个兑换码可以授权多个类型，用逗号 `,` 分隔。
- 后端会把用户提交的码转成大写再匹配，因此运营侧默认全部使用大写码。
- 配置里不要写真实用户姓名、手机号、微信号或付款信息。

示例：

```bash
AIMANDALA_REDEEM_CODES="JS-LITE-202605-001:lite;JS-PRO-202605-001:pro;JS-TEST-202605-ALL:lite,pro"
```

## 3. 发码策略

### 3.1 Lite 码

适用场景：

- 公开内测。
- 低价体验。
- 内容矩阵引流。
- 朋友或早期用户试用。

建议命名：

```text
JS-LITE-YYYYMM-序号
```

示例：

```text
JS-LITE-202605-001
```

授权配置：

```bash
JS-LITE-202605-001:lite
```

Lite 码不能生成 Pro 报告。

### 3.2 Pro 码

适用场景：

- 人工收费后交付。
- 深度内测。
- 样例用户人工审核。

建议命名：

```text
JS-PRO-YYYYMM-序号
```

示例：

```text
JS-PRO-202605-001
```

授权配置：

```bash
JS-PRO-202605-001:pro
```

Pro 码默认只授权 Pro。若用户需要补发 Lite，应另发 Lite 码，避免一个码承担太多运营含义。

### 3.3 测试码

适用场景：

- 本地 smoke。
- 生产发布后人工验证。
- QA 回归。

建议命名：

```text
JS-TEST-YYYYMM-ALL
```

授权配置：

```bash
JS-TEST-202605-ALL:lite,pro
```

测试码只允许内部使用，不应出现在截图、公开文档、前端代码或聊天截图里。

## 4. 发放流程

1. 确认本次用户获得的是 Lite 还是 Pro。
2. 在私有运营表中登记：日期、用户备注、报告类型、兑换码、收款状态、交付状态。
3. 按命名规则生成一个未使用过的兑换码。
4. 把兑换码加入服务器环境变量 `AIMANDALA_REDEEM_CODES`。
5. 重启或重新部署后端，使新环境变量生效。
6. 用内部测试请求验证该码能生成对应报告。
7. 把兑换码发给用户。

私有运营表不进入仓库。仓库只保存规则、模板和非真实示例。

## 5. 失效与换码

当前没有后台核销能力，因此失效靠修改环境变量完成。

需要让某个码失效时：

1. 从 `AIMANDALA_REDEEM_CODES` 中删除该码。
2. 重启或重新部署后端。
3. 用该码请求一次对应报告，确认返回 `402`。
4. 在私有运营表记录失效原因。

用户输错、泄露或需要升级时：

- 输错：优先让用户重试，不改配置。
- 泄露：删除旧码，补发新码。
- Lite 升 Pro：保留或删除旧 Lite 码都可以，但必须新发 Pro 码；不要把旧 Lite 码直接改成 Pro。

## 6. 发布与验证

### 6.1 后端环境检查

正式环境至少需要：

```bash
AIMANDALA_REDEEM_CODES="JS-LITE-202605-001:lite;JS-PRO-202605-001:pro"
```

并配好真实模型和上传存储环境变量。

### 6.2 API smoke

可使用现有脚本验证：

```bash
python3 projects/aimandala/toC/app/backend/scripts/smoke_wealth_report_api.py \
  --base-url https://web-api.jingshu.cc \
  --mode lite \
  --image-path /absolute/path/to/mandala.jpg \
  --redeem-code JS-LITE-202605-001
```

Pro 验证：

```bash
python3 projects/aimandala/toC/app/backend/scripts/smoke_wealth_report_api.py \
  --base-url https://web-api.jingshu.cc \
  --mode pro \
  --image-path /absolute/path/to/mandala.jpg \
  --redeem-code JS-PRO-202605-001
```

### 6.3 必测失败场景

上线前至少手测：

- 未传 `redeem_code` 返回 `402`。
- 错误码返回 `402`。
- Lite 码请求 Pro 返回 `402`。
- Pro 码请求 Pro 成功。
- Lite 码请求 Lite 成功。

## 7. 用户沟通口径

建议使用：

```text
当前是一镜一梳财富报告的小范围内测版。你拿到的是本次报告生成的兑换码，可以用于生成对应版本的报告。当前还没有自动支付和账户系统，后续如果开放正式支付，会再补订单、记录和售后流程。
```

避免使用：

- 已接入完整支付。
- 自动购买成功。
- 永久账户权益。
- 兑换码等同订单。

## 8. 后续支付系统边界

正式支付系统上线时，应新增独立设计，不在当前兑换码配置上继续堆功能。

后续至少需要：

- 订单模型。
- 支付网关。
- 支付回调验签。
- 订单状态机。
- 报告生成授权记录。
- 退款和人工售后规则。
- 用户可查询的购买记录。

当前 `AIMANDALA_REDEEM_CODES` 后续可以保留为：

- 内测码。
- 客服补偿码。
- 运营活动码。
- QA 测试码。

它不应升级成正式订单数据库。
