# QA

这里放 `一镜一梳` 当前主链路的验收清单、验证记录与样本验证文档。

当前 QA 目录主要服务一件事：

- 验证新的 `上传 -> 三圈识别 -> Lite / Pro 选择 -> loading -> 结果页` 主链路是否成立

## 当前阅读顺序

建议按下面顺序阅读：

1. `2026-04-04-toc-mvp-qa-checklist.md`
2. `2026-04-08-toc-mvp-first-pass-verification.md`
3. `2026-04-08-toc-mvp-sample-validation.md`
4. `2026-04-12-v22-knowledge-workbench-verification.md`
5. `2026-04-12-迁移收官与正式版收口验证记录.md`

## 各文档作用

### `2026-04-04-toc-mvp-qa-checklist.md`

主清单文件。

适合确认：

- 当前主链路的标准验证步骤
- 价格、跳转、结果页是否与 spec 一致
- 异常与回退状态是否被覆盖

### `2026-04-08-toc-mvp-first-pass-verification.md`

第一轮人工验证记录。

适合确认：

- 当前版本已经实际走通过哪些路径
- 还有哪些页面和状态只是 spec 成立、尚未充分验证

### `2026-04-08-toc-mvp-sample-validation.md`

样本级验证文件。

适合确认：

- 不同样本输入会落到哪些已知页面
- 历史记录打开与已有报告复用是否成立

### `2026-04-12-v22-knowledge-workbench-verification.md`

`v2.2 knowledge workbench` 的专项验证记录。

适合确认：

- 本地 debug workbench 是否真的可运行
- `report-debug` 的 insight / evidence / fallback 摘要是否可读
- 当前 build eval 是否仍维持在可接受风险内

### `2026-04-12-迁移收官与正式版收口验证记录.md`

`aimandala` 迁移收官与正式版收口的专项验证记录。

适合确认：

- 新生成 Lite / Pro 是否已走正式主链
- structured schema、upload contract、部署口径是否真正收口
- 本轮本地验证与线上 smoke check 到了什么程度

## 当前验证重点

- 不再按“先 Lite 再 Pro”的旧链路验证
- 重点验证用户主动选择 `Lite / Pro` 的新链路
- `Lite = 9.9`，`Pro = 39`
- loading 页只承接等待，不承担再次分流
- 结果页 CTA 只写 MVP 当前能走通的动作
