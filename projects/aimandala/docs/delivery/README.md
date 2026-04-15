# Delivery

这里放 `一镜一梳` 的交付说明、发布记录、阶段总结和对外可交接的交付结论。

`delivery` 不是实现前置文档，而是实现、验证之后的正式交付产物。
这个目录天然会保留很多带日期文件，因为交付记录本身属于窗口证据链；
但它们默认不应全部长期维持 `current`。

## 放什么

- 每一轮实现完成后的交付记录
- 阶段发布说明
- 灰度、回退、上线、收口总结
- 与特定任务或验证基线对应的交付结论

## 不放什么

- 长期产品范围定义
- 长期技术架构方案
- 当前唯一任务母计划
- 当前 QA 母基线

这些内容应分别放在 `specs/`、`architecture/`、`tasks/`、`qa/`。

## 当前 canonical 文档

阅读本目录前，先对齐这些长期入口：

- [ToC-MVP-产品规范.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/ToC-MVP-产品规范.md)
- [ToC-MVP-技术方案.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/architecture/ToC-MVP-技术方案.md)
- [开发与联调总入口.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/runbooks/开发与联调总入口.md)
- [本项目 PROJECT.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/PROJECT.md)

## 当前阶段性文档

当前窗口默认优先阅读：

- [2026-04-15-min77-frontend-quality-main-delivery.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-15-min77-frontend-quality-main-delivery.md)
- [2026-04-14-mvp-公开首发收口与小程序渐进并入交付记录.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-14-mvp-公开首发收口与小程序渐进并入交付记录.md)
- [2026-04-15-miniapp-batch-e-真实微信宿主与独立购买收束交付记录.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-15-miniapp-batch-e-真实微信宿主与独立购买收束交付记录.md)
- [2026-04-13-miniapp-native-gray-delivery.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-13-miniapp-native-gray-delivery.md)
- [2026-04-13-miniapp-wechatpay-live-delivery.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-13-miniapp-wechatpay-live-delivery.md)
- [2026-04-12-ci-cd-与自动修复交付记录.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-12-ci-cd-与自动修复交付记录.md)

说明：

- `2026-04-15-min77-frontend-quality-main-delivery.md` 记录本轮前端质量最小修复与线上观察口径。
- `2026-04-14` 与 `2026-04-15 batch E` 组成当前 Web 首发与 miniapp 渐进并入窗口的主交付链。
- `2026-04-13` 的 miniapp gray / wechatpay live 文档仍可作为当前灰度与回退参考，但更接近专项交付记录，不代表长期默认入口。
- `2026-04-12-ci-cd-与自动修复交付记录.md` 仍服务当前基础设施主线，因此继续作为当前专项交付入口保留。

## 历史资料入口

以下文档主要用于追溯背景，不再作为当前默认入口：

- [2026-04-14-miniapp-batch-a-shared-foundation-audit-delivery.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-14-miniapp-batch-a-shared-foundation-audit-delivery.md)
- [2026-04-14-batch-b-历史记录详情与显式报告类型交付记录.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-14-batch-b-历史记录详情与显式报告类型交付记录.md)
- [2026-04-15-miniapp-batch-c-静态壳与页面闭环交付记录.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-15-miniapp-batch-c-静态壳与页面闭环交付记录.md)
- [2026-04-15-miniapp-batch-d-api-contract-stub-only-交付记录.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-15-miniapp-batch-d-api-contract-stub-only-交付记录.md)
- [2026-04-12-迁移收官与正式版收口交付记录.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-12-迁移收官与正式版收口交付记录.md)
- [2026-04-12-v22-knowledge-workbench-delivery.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-12-v22-knowledge-workbench-delivery.md)
- [2026-04-10-开发测试机初始化与部署记录.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-10-开发测试机初始化与部署记录.md)
- [2026-04-04-frontend-baseline-delivery.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-04-frontend-baseline-delivery.md)
- [2026-04-04-mobile-web-interaction-baseline.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-04-mobile-web-interaction-baseline.md)
- [2026-04-04-report-content-iteration-guide.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-04-report-content-iteration-guide.md)
- [2026-04-08-architecture-remediation-delivery.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-08-architecture-remediation-delivery.md)

## 默认阅读顺序

1. 先读长期 canonical 文档，确认当前产品与架构真相。
2. 再读当前窗口交付链，确认这一轮到底交付了什么。
3. 如需追溯背景，再回看历史交付记录。
