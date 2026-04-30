# Aimandala Local Mac Execution Host Pilot QA Basis

> 状态：current
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-21
> source_of_truth：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/qa/2026-04-21-local-mac-execution-host-pilot-qa-basis.md
> 项目：aimandala
> 阶段：qa-basis
> depends_on：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/specs/2026-04-21-local-mac-execution-host-pilot-spec.md
> depends_on：/Users/xinran/.codex/worktrees/31f1/mindsync/projects/aimandala/docs/tasks/2026-04-21-local-mac-execution-host-pilot-plan.md
> reviewers：Engineer, Test / QA

## 1. 本轮验证对象

本轮只验证本地 Mac 单机试点方案是否决策完整，不验证运行时已经接通。

本轮固定验证：

1. control plane（控制面）与 execution host（执行宿主机）是否已在文档中拆开
2. 本地 execution host 是否已明确固定为你的当前这台 Mac
3. `*_local` 是否不再默认等于 automation 服务器本地
4. 单机试点的最小 claim / checkout / 执行 / 回写合同是否完整
5. 固定样本的边界是否清楚

## 2. 测试矩阵

### 2.1 文档一致性

必须验证：

1. 新 Spec / Task / QA Basis 三者完全一致
2. 三份文档都明确：
   - control plane 在服务器
   - local execution host 在你的 Mac
   - `server_automation` 继续由服务器承接
   - `local_manual_review` 试点由你的 Mac 承接

### 2.2 宿主语义边界

必须验证文档明确写清：

1. `.paperclip.yaml` 当前的 `*_local = 服务器本地` 解释属于待修正对象
2. `company/Paperclip-Agent-模型配置总表.md` 当前的 `codex_local / claude_local` 服务器语义属于待修正对象
3. `company/服务器与基础设施入口.md` 当前“大多数 local adapter 在服务器执行”的口径属于待修正对象

### 2.3 单机试点最小闭环

必须验证方案明确包含：

1. 本地 Mac 直连远端控制面
2. 本地 claim
3. 本地 checkout
4. 本地执行
5. 本地 comment 回写
6. 状态推进

### 2.4 回写最小字段

必须验证回写字段至少包含：

1. `cwd`
2. `branch`
3. `sha`
4. 当前判断
5. 已做动作
6. 下一步动作
7. 验证结论

### 2.5 样本边界

必须验证：

1. `MIN-137`
   - 继续作为摘要任务反例
   - 不能被误接成本地试点执行目标
2. `MIN-133`
   - 继续作为 CI commit-summary 父任务反例
   - 不能被误接成本地试点执行目标
3. 至少一条真实普通研发任务
   - 作为单机试点正样本

## 3. 阻断条件

出现任一情况，本轮不得宣称完成：

1. 文档仍把 `*_local` 默认解释为 automation 服务器本地
2. 文档没有把你的 Mac 明确写成单机试点宿主
3. 文档隐含要求：
   - 多机调度
   - 本地节点注册中心
   - 修改 PaperclipAI 源码
   - 服务器 heartbeat 为本地节点离线负责

## 4. 验收条件

本轮通过条件：

1. 新 Spec / Task / QA Basis 已正式落地
2. 入口 README 已把本地 Mac 单机试点纳入当前执行分流链路
3. 下一轮实现者无需再决定：
   - 本地试点接哪套控制面
   - 由谁承接普通任务
   - 最小回写字段是什么
