# 一镜一梳架构整改第一轮交付记录

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-08
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-08-architecture-remediation-delivery.md
> 项目：aimandala
> 阶段：delivery
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-07-架构质量整改清单.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/architecture/ToC-MVP-技术方案.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-04-toc-mvp-qa-checklist.md
> reviewers：CEO / Orchestrator, Architect, Engineer, Test / QA

## 1. 本轮交付目标

把 `aimandala` 从“已经完成第一步迁移，但架构边界和治理入口仍偏松散”的状态，推进到“关键入口可读、关键热点已开始拆薄、后续整改可以继续接力”的状态。

本轮不追求完成整套迁移，只追求把最容易继续恶化的点先收住。

## 2. 本轮已完成交付

### 2.1 文档与治理入口收口

已完成：

- To C MVP `spec / architecture / qa` 相关文档状态调整为更接近当前基线的 `in_review`
- `decisions/`、`qa/`、`tasks/` 目录入口补齐当前已沉淀索引
- 后端运行时目录补齐 `README` 与忽略规则
- 后端最小运行前提补到入口说明
- 架构整改清单正式落到 `docs/tasks/`

意义：

- 当前正式入口不再主要依赖聊天记录和 commit message
- 新协作者可以更快判断哪些是基线文档，哪些仍是迁移材料

### 2.2 后端热点一：报告契约装配层拆分

已完成：

- 从 `LayeredOrchestrator` 中抽出 structured 报告契约与 payload 装配逻辑
- 新增独立入口：
  - `toC/app/backend/app/core/pipeline/report_contracts.py`
- 为新入口补了单元测试

意义：

- 报告 schema / response 组装不再完全埋在 orchestrator 内部
- 后续调整 Lite / Pro structured 字段时，有更清晰的后端权威边界

对应提交：

- `bb604534 refactor(aimandala): 拆分报告契约装配层`

### 2.3 前端热点二：preview shell 与 runtime 边界拆分

已完成：

- 抽出 preview shell 专属 helper：
  - `toC/app/frontend/mobile-web/preview-shell-support.ts`
- 抽出上传路径解析共享 helper：
  - `toC/app/frontend/mobile-web/upload-runtime.ts`
- `browser-shell.tsx` 与 `runtime.tsx` 不再各自维护一份上传兜底逻辑
- `mobile-web/index.ts` 去掉对 `../shared` 的整体 re-export

意义：

- preview 宿主层开始从正式 runtime 装配层分离
- `mobile-web` 导出面更接近渠道层自身，而不是继续混入 shared 边界

对应提交：

- `ca2849cc refactor(aimandala): 拆分 mobile-web 预览宿主边界`

## 3. 本轮验证结果

本轮已执行的验证：

- `pytest projects/aimandala/toC/app/backend/tests/unit/test_report_contracts.py`
- `pytest projects/aimandala/toC/app/backend/tests/unit/test_api_health.py`
- `npm test`
- `npm run typecheck`
- `npm run build:mobile-web`

当前结论：

- 后端新拆出的报告契约装配层已有最小单测保护
- 前端当前已具备最小行为测试，且边界拆分在当前工作区内能通过类型检查和生产构建
- QA 文档链与 delivery 文档链已经开始闭环，但行为自动化仍偏薄

## 4. 仍保留到下一轮的风险

1. 前端虽已有最小行为测试，但页面层和样本层验证仍偏薄
2. `browser-shell.tsx` 与 `runtime.tsx` 在工作树中仍有其他在制改动，本轮提交没有一并收口
3. 当前样本验证仍主要依赖人工记录，尚未形成固定 fixture 集
4. 后端生成内容仍是迁移期实现，并非旧主线完整 AI 生成链路

## 5. 下一轮建议

1. 补第一轮纸面验收记录与样本验证记录
2. 先为前端 `shared/core` 或 `mobile-web/controller.ts` 增加最小行为测试
3. 继续把 preview 宿主层 UI 改动与 runtime 行为改动拆成独立提交
4. 视生成链路回迁情况，再决定是否继续拆 `generation_runtime` 或 prompt runtime 边界
