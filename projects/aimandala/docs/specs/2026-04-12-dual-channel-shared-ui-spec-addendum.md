# 一镜一梳 To C 双端共享 UI 补充 Spec

> 状态：current
> 版本：0.1.0
> owner：Product Spec Lead
> last_updated：2026-04-12
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-12-dual-channel-shared-ui-spec-addendum.md
> 项目：aimandala
> 阶段：spec
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/ToC-MVP-产品规范.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/architecture/ToC-MVP-技术方案.md
> reviewers：CEO / Orchestrator, Architect, Engineer, Test / QA

## 1. 当前目标

在不推倒当前 `mobile-web` 主线的前提下，把 `一镜一梳 To C` 升级为：

1. Web 与小程序同步开发
2. UI 尽早开始共享
3. 平台强依赖行为继续保留在渠道壳

当前不是直接追求“一套页面代码 100% 跑双端”，而是先把：

- 设计令牌
- 展示组件
- 报告主体
- 历史主体

提升为可共享资产。

## 2. 双端范围

当前双端第一批正式范围：

1. `Lite / Pro` 选择页主体
2. 生成中页主体
3. 报告结果页主体
4. 历史记录页主体
5. 检测确认页主体

当前明确不在第一批共享：

1. 文件上传入口
2. 登录态换取
3. 支付发起
4. 分享拉起
5. 路由容器
6. 小程序生命周期细节

## 3. 统一产品口径

当前双端补充口径如下：

1. Web 与小程序使用统一用户身份
2. 历史记录、报告读取、购买状态在双端保持一致
3. 共享层只承接“业务语义”和“展示主体”
4. 渠道层只承接“平台行为”和“页面装配”

## 4. 页面矩阵

| 页面 | shared/core | shared/ui | mobile-web shell | miniapp shell |
|---|---|---|---|---|
| 选择页 | 是 | 是 | 是 | 是 |
| 生成中页 | 是 | 是 | 是 | 是 |
| 报告页 | 是 | 是 | 是 | 是 |
| 历史页 | 是 | 是 | 是 | 是 |
| 检测确认页 | 是 | 部分 | 是 | 是 |
| 上传页 | 是 | 部分 | 是 | 是 |

## 5. 当前非范围

这轮补充 spec 不直接定义：

1. 小程序真实审核材料的最终文案
2. 微信支付流程细节
3. 小程序专属增长能力
4. App 端实现

这些内容后续需要在 `task / qa / delivery` 中继续细化。
