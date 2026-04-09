# 一镜一梳 To C MVP 第一轮样本验证记录

> 状态：in_review
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-08
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-08-toc-mvp-sample-validation.md
> 项目：aimandala
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-04-toc-mvp-qa-checklist.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/fixtures/README.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/toC/data/README.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 记录目的

这份记录先满足“样本验证已存在”的最小要求，不追求这一轮就把样本体系完全自动化。

当前样本记录采用“样本类型 + 运行结果 + 复查入口”的方式沉淀，后续再逐步补固定 fixture 文件。

## 2. 样本来源说明

当前仓库内已明确：

- `fixtures/` 用于可重复验证的固定样本入口
- `toC/data/` 用于可复用结构化样本或示例输出
- `toC/app/backend/data/interpretations/` 与 `uploads/` 属于运行时目录，不作为正式样本目录

本轮已补第一批固定样本描述文件，但真实脱敏图片资产与截图仍待继续补齐。

## 3. 第一轮样本记录

### 样本 A：正常上传并生成 Lite

- fixture_id：`toc-mvp-sample-a-lite-general`
- fixture_path：`/Users/xinran/Downloads/dev/mindsync/projects/aimandala/fixtures/toc-mvp/sample-a-lite-general.yaml`

- 样本类型：单张正常曼陀罗图片，主题为 `general`
- 目标：覆盖 `TC-01` 与 `TC-02`
- 观察结果：
  - Lite 创建链路存在
  - Lite 报告读取链路存在
  - 当前报告内容仍属于迁移期实现，但契约结构已能被读取
- 复查入口：
  - `runMobileWebLiteFlow`
  - `refreshMobileWebReport`
  - `report_contracts.py`

### 样本 B：Lite 成功后升级到 Pro

- fixture_id：`toc-mvp-sample-b-lite-to-pro-career`
- fixture_path：`/Users/xinran/Downloads/dev/mindsync/projects/aimandala/fixtures/toc-mvp/sample-b-lite-to-pro-career.yaml`

- 样本类型：已生成 Lite 的记录继续进入 Pro 升级
- 目标：覆盖 `TC-03`
- 观察结果：
  - 当前存在 `upgrade` 路由
  - 可继续读取 `version=pro` 报告
  - preview shell 与 runtime 都保留 Pro 升级装配链
- 复查入口：
  - `openMobileWebUpgradeEntry`
  - `refreshMobileWebProReport`
  - history 打开已有 Pro 记录逻辑

### 样本 C：命中已有记录并复用

- fixture_id：`toc-mvp-sample-c-existing-reuse`
- fixture_path：`/Users/xinran/Downloads/dev/mindsync/projects/aimandala/fixtures/toc-mvp/sample-c-existing-reuse.yaml`

- 样本类型：同一用户、相同输入再次发起解读
- 目标：覆盖 `TC-04` 与 `TC-05`
- 观察结果：
  - 当前代码与 QA 口径保留了 `existing` 语义
  - 本轮未补固定脱敏样本文件，也未形成一份单独的命中复用截图记录
- 结论：
  - 视为“已确认存在目标语义，但验证证据仍偏弱”

## 4. 本轮样本验证结论

当前已经有了第一轮样本验证记录和固定样本描述文件，但还不算完整样本资产。它的作用主要是：

1. 让 QA 文档不再只停留在“建议覆盖哪些样本”
2. 明确区分正式样本目录与运行时目录
3. 为下一轮补固定 fixture 和自动化测试提供命名与口径基础
4. 当前可用 `python3 /Users/xinran/Downloads/dev/mindsync/projects/aimandala/scripts/validate_fixtures.py` 做最小一致性校验

## 5. 下一步建议

1. 为现有 fixture 补真实脱敏图片或截图资产
2. 为命中已有记录场景补更直接的复查证据
3. 把 fixture 清单继续接到自动化验证脚本
