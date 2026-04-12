# 一镜一梳 v2.2 knowledge workbench 交付记录

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-12
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-12-v22-knowledge-workbench-delivery.md
> 项目：aimandala
> 阶段：delivery
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-12-v22-knowledge-workbench-execution-plan.md, /Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-12-v22-knowledge-workbench-verification.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 本轮交付目的

本轮交付不是对外发布，而是把 `aimandala` 的知识 runtime 从“可运行”进一步推进到“可观察、可比较、可复查”的本地调试态。

重点是为 `v2.1` 生产知识包补一层 `v2.2 workbench` 能力，而不是重写当前 `To C MVP` 产品范围。

## 2. 本轮交付内容

### 2.1 后端

已交付：

- `KnowledgeWorkbench` 本地工作台能力
- `build summary / fixture preview / eval diff` 脚本入口
- debug workbench API 开关控制
- `report-debug` 的 insight / evidence / fallback 摘要扩展

### 2.2 前端

已交付：

- `browser-debug-panel` 的 workbench summary 区块
- insight context / evidence / fallback 摘要展示
- 对应 shared API types 更新

### 2.3 数据与样本

已交付：

- `fixtures/toc-mvp/` 下 5 个固定样本入口
- `toC/data/knowledge/builds/current/` 与 `candidates/test-v22/` 的 eval / quality 产物
- 若干 preview asset 与 run json 作为本地复查材料

## 3. 对应 artifact

- architecture：
  - `2026-04-10-V2知识库长期架构方案.md`
  - `2026-04-11-报告生成分层与信息流说明.md`
- task：
  - `2026-04-12-v22-knowledge-workbench-execution-plan.md`
- qa：
  - `2026-04-12-v22-knowledge-workbench-verification.md`

## 4. 验证摘要

本轮已执行：

- 后端测试：`39 passed`
- 前端测试：`11 passed`
- workbench 校验脚本：`ok: true`
- current build eval：
  - `fixture_count = 5`
  - `structured_missing_count = 0`
  - `regression_flag_count = 0`

## 5. 当前结论

当前 `v2.2 knowledge workbench` 已达到：

1. 本地可运行
2. 样本可复查
3. fallback / warning / evidence 可观察
4. 不破坏现有 `/api/v2` 与 orchestrator 基线

因此本轮可视为：

- 一个面向工程与质量的本地调试交付
- 不是新的正式用户能力发布

## 6. 残留风险

### 6.1 fallback 仍存在

当前 `current` build eval 中仍有 `2` 个 fixture 命中 fallback。

这不阻塞本轮交付，但说明 knowledge quality 仍需持续观察。

### 6.2 调试能力仍偏本地

当前 workbench 更像工程调试面板，不是已经沉淀为长期团队操作规范的运行台。

如后续多人复用，应补更正式的操作说明与 review 节点。

## 7. 后续建议

1. 继续跟踪 `fallback hotspot` 与 `warning path` 趋势
2. 为 `candidate build` 增加更正式的评审与晋升规则
3. 如果后续继续扩展 workbench，先补新的 `task / qa / delivery`，不要再只落代码不回写 artifact
