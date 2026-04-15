# QA

这里放 `一镜一梳` 当前主链路的验收清单、验证记录与样本验证文档。

当前 QA 目录主要服务一件事：

- 验证新的 `上传 -> 三圈识别 -> Lite / Pro 选择 -> loading -> 结果页` 主链路是否成立

这个目录天然也会保留很多带日期文件，因为验证材料需要保留证据链；
但按治理规则，只有当前正式验收基线才应长期保留 `current`。

## 放什么

- QA baseline
- 验证记录
- 纸面验证与样本验证
- smoke、专项验证、回归检查

## 不放什么

- 长期产品范围定义
- 长期技术方案
- 交付总结
- 当前唯一执行计划

## 当前 canonical 文档

进入本目录前，先对齐这些长期入口：

- [ToC-MVP-产品规范.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/ToC-MVP-产品规范.md)
- [ToC-MVP-技术方案.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/architecture/ToC-MVP-技术方案.md)
- [本项目 PROJECT.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/PROJECT.md)

## 当前阶段性文档

当前默认优先区分两类文档：

- `qa basis`
  - 定义本轮目标行为、质量门和验证矩阵
- `verification record`
  - 记录某一轮已经执行过的自动化、smoke 和人工验收结果

当前优先阅读：

- [2026-04-14-mvp-公开首发收口与小程序渐进并入验证基线.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-14-mvp-公开首发收口与小程序渐进并入验证基线.md)
- [2026-04-14-mvp-公开首发收口与小程序渐进并入验证记录.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-14-mvp-公开首发收口与小程序渐进并入验证记录.md)
- [2026-04-15-miniapp-batch-e-真实微信宿主与独立购买收束验证基线.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-15-miniapp-batch-e-真实微信宿主与独立购买收束验证基线.md)
- [2026-04-13-miniapp-native-gray-verification.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-13-miniapp-native-gray-verification.md)
- [2026-04-13-miniapp-wechatpay-live-verification.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-13-miniapp-wechatpay-live-verification.md)
- [2026-04-12-ci-cd-验证记录.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-12-ci-cd-验证记录.md)

说明：

- `2026-04-14-mvp-公开首发收口与小程序渐进并入验证基线.md` 仍是当前 Web 首发窗口的正式 QA baseline。
- `2026-04-14-mvp-公开首发收口与小程序渐进并入验证记录.md` 是与之配套的当前验证总入口。
- `2026-04-15 batch E` 和 `2026-04-13` gray 系列主要服务 miniapp 渐进并入，不取代 Web 默认质量门。

## 历史资料入口

以下文档主要用于追溯背景，不再作为当前首轮入口：

- [2026-04-14-miniapp-batch-a-shared-foundation-audit-verification.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-14-miniapp-batch-a-shared-foundation-audit-verification.md)
- [2026-04-14-batch-b-历史记录详情与显式报告类型验证基线.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-14-batch-b-历史记录详情与显式报告类型验证基线.md)
- [2026-04-15-miniapp-batch-c-静态壳与页面闭环验证基线.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-15-miniapp-batch-c-静态壳与页面闭环验证基线.md)
- [2026-04-15-miniapp-batch-d-api-contract-stub-only-验证基线.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-15-miniapp-batch-d-api-contract-stub-only-验证基线.md)
- [2026-04-12-迁移收官与正式版收口验证记录.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-12-迁移收官与正式版收口验证记录.md)
- [2026-04-12-v22-knowledge-workbench-verification.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-12-v22-knowledge-workbench-verification.md)
- [2026-04-13-paperclip-automation-节点验证记录.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-13-paperclip-automation-节点验证记录.md)
- [2026-04-04-toc-mvp-qa-checklist.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-04-toc-mvp-qa-checklist.md)
- [2026-04-08-toc-mvp-first-pass-verification.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-08-toc-mvp-first-pass-verification.md)
- [2026-04-08-toc-mvp-sample-validation.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-08-toc-mvp-sample-validation.md)

## 默认阅读顺序

1. 先看当前 QA baseline，确认质量门。
2. 再看与之配套的验证记录，确认实际执行结果。
3. 最后按专项主题回看历史验证链。
