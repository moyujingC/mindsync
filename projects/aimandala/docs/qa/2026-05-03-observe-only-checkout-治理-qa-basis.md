# Observe-only Checkout 治理 QA Basis

> 状态：historical-reference
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-05-03
> source_of_truth：projects/aimandala/docs/qa/2026-05-03-observe-only-checkout-治理-qa-basis.md
> 项目：aimandala
> 阶段：qa-basis
> depends_on：projects/aimandala/docs/specs/2026-05-03-observe-only-checkout-治理规格.md
> depends_on：projects/aimandala/docs/tasks/2026-05-03-observe-only-checkout-治理实施计划.md
> reviewers：Engineer, Test / QA

## 1. 本轮验证对象

本轮验证对象固定为：

1. observe-only checkout 边界是否清楚
2. 主镜像区与巡检区是否被要求长期干净
3. 服务器可写任务是否只允许落到 `/opt/automation/worktrees`
4. heartbeat / maintenance 遇到脏 checkout 是否 fail-fast
5. 升级动作是否不再默认依赖脏目录直接 `git pull`

## 2. 测试矩阵

### 2.1 文档一致性

必须验证：

1. spec / plan / qa / runbook 都把 `/opt/automation/app/mindsync` 定义为 observe-only
2. spec / plan / qa / runbook 都把 `/opt/automation/app/mindsync-heartbeat` 定义为 observe-only
3. spec / plan / qa / runbook 都把 `/opt/automation/worktrees` 定义为 writable execution root

### 2.2 升级前检查

必须验证：

1. runbook 明确要求升级前先检查两个 checkout 的 `git status`
2. runbook 明确要求记录：
   - branch
   - remote
   - sha
   - 最近提交
3. 脏 checkout 不得直接进入 `git pull` 升级路径

### 2.3 脏改归类

必须验证：

1. 运行时误写
2. 人工运维临时改动
3. 历史未清现场
4. 模板 / 脚本漂移

这 4 类都在计划和 runbook 中被显式列出。

### 2.4 运行链边界

必须验证：

1. `server_automation` 的可写执行目录只允许 `/opt/automation/worktrees`
2. observe-only checkout 不再被描述成可直接承接 deploy / smoke / auto-repair
3. heartbeat checkout 保持 `origin/main` 干净的目标被明确写出
4. 检查 `relayhub/dev` workflow 不被误解释成“本地巡检 checkout 也要切到 `relayhub/dev`”

### 2.5 fail-fast 边界

必须验证：

1. heartbeat 遇到脏 observe-only checkout 时，不应继续把后续自动动作当成正常路径
2. maintenance 遇到脏 observe-only checkout 时，不应继续静默清理或强行升级
3. 升级动作必须先分类现场，再决定定点覆盖、转正或重建

## 3. 阻断条件

出现任一情况，本轮不得宣称完成：

1. observe-only checkout 与 writable execution root 仍混用
2. 文档仍暗示可以在脏 checkout 上直接 `git pull`
3. 文档仍暗示巡检 checkout 需要跟着 `RelayHub` 目标分支一起切换
4. 文档没有把 checkout 脏状态上升为升级和自动动作的阻断条件

## 4. 验收条件

本轮通过条件：

1. 新文档链已落地并互相一致
2. 升级、巡检、排障三类动作都以 observe-only checkout 干净为前置条件
3. 脏 checkout 的分类与收束路径已被固定
4. 后续实现者无需再临场决定先盘点还是先清理
