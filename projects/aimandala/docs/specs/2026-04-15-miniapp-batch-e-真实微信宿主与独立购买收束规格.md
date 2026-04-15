# AI Mandala 批次 E 真实微信宿主与独立购买收束规格

> 状态：current
> 版本：0.1.0
> owner：Product Spec Lead
> last_updated：2026-04-15
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-15-miniapp-batch-e-真实微信宿主与独立购买收束规格.md
> 项目：aimandala
> 阶段：spec
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-04-toc-mvp-spec.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-08-Lite与Pro选择后支付与跳转规则.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-15-miniapp-batch-d-api-contract-stub-only-实施计划.md
> reviewers：CEO / Orchestrator, Architect, Engineer, Test / QA

## 1. 目标

批次 E 只解决两件必须一起收束的事情：

1. 把 miniapp 从 `stub-only` 推进到“真实微信小程序宿主可灰度接入”
2. 把 `Lite / Pro` 的当前产品语义统一收束为“独立购买”

## 2. 当前正式产品语义

当前正式语义固定为：

1. `Lite = 9.9`
2. `Pro = 39`
3. `Lite` 和 `Pro` 是两个独立商品
4. 用户选择的是“本次购买哪一种解读”
5. 已买 `Lite` 后再要 `Pro`，仍是直接购买 `Pro`
6. `补差价升级` 不是当前产品主路径

## 3. 当前适用范围

本轮覆盖：

1. 微信小程序 `login -> code -> session exchange`
2. 微信 `requestPayment`
3. `/api/v2/miniapp/*` 从 stub 到 live-ready 的合同与状态机
4. miniapp runtime 接入真实 session / order / reconcile
5. Web 侧与历史记录详情页里的独立购买语义纠偏
6. 与此直接相关的灰度开关、文案、测试与交付记录

本轮不覆盖：

1. 多宿主抽象
2. 分享、裂变、客服、消息通知
3. 退款、分账、售后等复杂支付后链路
4. 小程序之外的新渠道

## 4. 兼容残留的正式口径

当前仓库里仍存在一组历史兼容残留：

1. `upgrade_diff`
2. `/api/v2/interpretations/{id}/upgrade`
3. `can_upgrade`
4. `upgrade` route
5. `补差价 / 升级到 Pro` 文案

本轮统一口径为：

1. 这些字段和入口不再代表当前产品定义
2. 若仍保留，只能作为兼容壳或历史字段
3. 真实 miniapp 支付与当前 Web 主路径都不得再依赖它们来表达购买关系
4. 新文档、测试和页面文案统一按“独立购买”描述

## 5. 主干并入与灰度规则

批次 E 完成后允许并入 `main`，但只在下面条件全部满足时：

1. miniapp live 能力有独立灰度开关
2. 默认关闭
3. 关闭时不影响 Web MVP 主链
4. 只支持微信小程序宿主
5. `PROJECT.md`、README、task / qa / delivery 已明确记录“已并主干、默认 off”

## 6. 当前结论

批次 E 的产品收束结论固定为：

1. miniapp live 能力可以并入主干，但默认灰度关闭
2. `Lite / Pro` 当前必须统一按独立购买处理
3. 批次 E 不能继续把“补差价升级”作为当前产品真相带入实现
