# MIN-102 runner-heartbeat 阻塞分类修复验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-17-MIN-102-runner-heartbeat-阻塞分类修复验证记录.md
> 项目：aimandala
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-14-ci-cd-运行稳定化治理整改计划.md
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/architecture/CI-CD与自动修复架构.md
> reviewers：Engineer, Test / QA

## 1. 背景

`MIN-102` 线程中出现如下组合信号：

1. `runnerDiagnosis` 显示 runner 在线且 labels 匹配
2. issue 仍以 `blocked_reason=infra_missing` 挂起
3. 执行基线存在 `drift: sha_mismatch`

该组合说明当前阻塞原因存在误分类风险：`workspace_drift` 被写成了 `infra_missing`。

## 2. 本轮目标行为

1. `check-runner-heartbeat.mjs` 不再把所有 unhealthy 一律写成 `infra_missing`
2. 阻塞原因按规则细分：
   - `workspace_drift`
   - `credential_missing`
   - `infra_missing`
3. “最近成功 run 超时”不在“最新 run 已 completed”的情况下直接判定 infra 阻塞

## 3. 执行与验证

### 3.1 代码变更

已修改：

- `shared/tools/ci/check-runner-heartbeat.mjs`

核心调整：

1. 新增 `deriveBlockedReason(...)`，按执行基线 drift 与凭证状态分流 `blocked_reason`
2. 新增 `shouldTreatSuccessAgeAsUnhealthy(...)`，避免 completed run 被 stale-success 误判为 infra 阻塞
3. `syncPaperclipIssue(...)` 改为使用动态 `blockedReason`，不再写死 `infra_missing`

### 3.2 本地校验

执行：

- `node --check shared/tools/ci/check-runner-heartbeat.mjs`

结果：

- 语法检查通过

### 3.3 环境验证受限项

尝试执行：

- `bash shared/tools/ci/runner-doctor.sh`

结果：

- 当前环境缺少 `GITHUB_REPOSITORY` 与 `GITHUB_TOKEN`，无法完成在线 runner 元数据校验与真实回写验证

## 4. 结论

1. `MIN-102` 当前直接问题已收敛为“阻塞分类逻辑修复 + 执行基线漂移识别”，不是单纯 runner 缺失
2. 本轮已完成脚本侧修复，后续 heartbeat 将可输出更准确的 `blocked_reason`
3. issue 是否可从 `blocked` 解除，仍依赖在线环境复跑与新的 heartbeat 结果

## 5. 残留风险与下一步

1. 若修复未被部署到实际 heartbeat 执行目录，线上 issue 仍会延续旧分类
2. 若执行目录与目标 sha 继续漂移，`workspace_drift` 会持续触发
3. 需要在线复跑一次 `runner-heartbeat` 并确认新 issue/评论中 `blocked_reason` 与执行基线一致
