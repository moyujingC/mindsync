# Aimandala Automation 与本地执行分流 Phase 2 本地接手 Spec

> 状态：superseded
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-19
> source_of_truth：projects/aimandala/docs/specs/2026-04-18-automation-and-local-execution-routing-phase2-local-handoff-spec.md
> 项目：aimandala
> 阶段：spec
> depends_on：projects/aimandala/docs/specs/2026-04-18-automation-and-local-execution-routing-spec.md
> depends_on：projects/aimandala/docs/delivery/2026-04-18-automation-and-local-execution-routing-phase1-delivery.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

> 2026-04-19 状态说明：
> 本文档已被 [2026-04-19-paperclip-native-execution-routing-spec.md](projects/aimandala/docs/specs/2026-04-19-paperclip-native-execution-routing-spec.md) 取代。
> “人工本地接手流程标准化”不再是当前主架构目标，本地执行已被重释为正式执行路径。

## 1. 问题定义

phase 1 已经把执行分流的前半段收口完成：

1. `automation-execution + server_automation` 已正式收口为服务器执行路径
2. `manual-review-required + local_manual_review` 已正式收口为服务器拒绝路径
3. heartbeat / audit 已能在 automation 节点上真实识别：
   - 活跃 Automation 漂移
   - 普通任务错路由到服务器可写路径
4. 普通任务错路由时，phase 1 已形成：
   - `blocked`
   - 标准 handoff comment
   - 服务器不再继续代跑

但 phase 1 只完成了“服务器拒绝 + 交接”，还没有把“人工本地接手后应如何执行”写成正式系统规则。

这会留下两个问题：

1. 普通任务虽然已被明确退回本地，但本地 owner 仍可能按各自习惯处理，缺少统一动作
2. 后续若没有正式 spec，容易把“人工本地接手流程”误扩张成“本机 execution node”或“需要控制面新增语义”

本 Spec 的目标是把 phase 2 明确限定为：

1. 标准化人工本地接手流程
2. 不新增 runtime 能力声明
3. 不修改 `PaperclipAI` 源码

## 2. 目标

phase 2 要固定下面四条边界：

1. 普通任务与 Automation 任务继续同等重要
   - `manual-review-required + local_manual_review` 不再被视为“例外路径”
   - 它是执行分流体系中的正式主路径之一
2. phase 2 只定义人工本地接手流程
   - claim
   - 本地 checkout / workspace 准备
   - 本地验证
   - 回写 issue 状态与 comment
3. 控制面语义继续沿用 phase 1 现有合同
   - `blocked`
   - 标准 handoff comment
   - 不新增状态
   - 不新增原因码
4. phase 2 不把用户本机纳入正式 execution node
   - 本地执行仍是人工流程规范
   - 不是 runtime 能力或节点注册能力声明

## 3. 非目标

本轮不做：

1. 不修改 `PaperclipAI` 控制面或运行时源码
2. 不把本机定义为正式 execution node
3. 不要求 automation 节点为普通任务创建本地运行态
4. 不新增“local handoff”专用状态
5. 不新增“local handoff”专用原因码
6. 不清理历史 `done` issue
7. 不让 automation 节点恢复代跑普通任务

## 4. 核心规则

### 4.1 phase 1 与 phase 2 的职责边界

执行分流后，两阶段职责固定为：

1. phase 1
   - 负责服务器拒绝普通任务的可写执行
   - 负责生成 `blocked + handoff comment`
   - 负责形成服务器到本地的交接证据
2. phase 2
   - 负责把本地 owner 的接手动作标准化
   - 负责定义本地执行与回写的最小流程
   - 不把本地流程升级成新的 runtime 能力

### 4.2 触发入口

进入本地人工接手流程的触发条件固定为：

1. issue 显式属于：
   - `task_class: manual-review-required`
   - `execution_route: local_manual_review`
2. automation 节点已明确拒绝服务器可写执行
3. issue 已处于：
   - `blocked`
4. issue comment 流中存在标准 handoff comment

phase 2 不要求重新判断该任务是否属于本地路径。

正式主依据仍然是：

1. issue 元数据中的 `task_class`
2. issue 元数据中的 `execution_route`
3. 服务器侧 handoff comment

### 4.3 人工本地接手最小动作

当本地 owner 接手 `local_manual_review` 任务时，最小动作固定为：

1. 确认接手
   - 先阅读最新 handoff comment
   - 明确服务器拒绝原因与当前阻塞点
2. 本地准备工作区
   - 在本地工作区执行，不在 automation 节点执行
   - 使用本地已有项目工作区，不要求控制面分配正式本地 execution workspace
3. 本地完成任务
   - 进行需要人工判断的分析、修改、验证
   - 决定是否应提交、如何提交、是否继续推进
4. 本地回写 issue
   - 通过 comment 说明已接手、当前进展、验证结果和下一步
   - 通过现有 status 推进 issue，而不是等待服务器继续代跑

### 4.4 本地回写合同

phase 2 继续沿用现有 issue 合同，不新增控制面语义。

固定规则：

1. handoff comment 仍是服务器到本地的唯一稳定交接证据
2. 本地 owner 接手后，进展回写继续使用：
   - 现有 issue status
   - 现有 issue comments
3. 本地 owner 不得把“已经接手”理解为需要新的专用状态
4. 本地 owner 不得等待新的 `local handoff reason code` 才开始处理

phase 2 对状态流转的最低要求是：

1. `blocked`
   - 表示服务器已拒绝继续执行，等待人工接手
2. 人工接手后
   - 使用现有状态继续推进
   - 由人工依据实际进展决定何时恢复为执行中、审查中或完成

phase 2 不在本 spec 内新增更细的状态机。

### 4.5 服务器职责边界

对 `manual-review-required + local_manual_review` 任务，服务器职责继续固定为：

1. 拒绝可写执行
2. 记录审计证据
3. 生成标准 handoff 提示

服务器不负责：

1. 为普通任务在本地创建正式 runtime
2. 替用户 claim 本地任务
3. 替用户在本地 checkout
4. 替用户决定是否提交
5. 替用户继续闭环普通任务

### 4.6 本地执行的正式口径

phase 2 必须把“本地执行”的口径写死为：

1. 它是人工流程规范
2. 它不是 runtime capability
3. 它不是 execution node 注册能力
4. 它不是对控制面的新调度承诺

因此：

1. phase 2 可以标准化人工动作
2. 但不能宣称“普通任务现在已有正式本机 execution node”
3. 若后续要进入该方向，必须另立新 spec

### 4.7 对后续实现的最小接口合同

虽然 phase 2 本轮不实现，但 spec 需要为后续实现写死最小合同：

1. 路由主依据继续是：
   - `task_class`
   - `execution_route`
2. 普通任务进入本地接手流程的最小前提继续是：
   - 服务器拒绝证据已形成
   - 标准 handoff comment 已存在
3. 后续若补 runbook / 模板 / 示例，应围绕：
   - 本地如何接手
   - 本地如何验证
   - 本地如何回写
4. 后续不得在 phase 2 实现中偷偷引入：
   - 新状态
   - 新原因码
   - 本机 execution workspace
   - 本机 execution host 注册

## 5. 文档与 runbook 同步要求

本轮只写 spec，不直接实施下列同步，但要明确后续应更新的对象：

1. `projects/aimandala/deploy/paperclip-automation/README.md`
   - 保持服务器只承接 Automation
   - 不把普通任务的本地执行写成服务器责任
2. 项目级 `tasks / qa / delivery` 模板
   - 后续补“本地人工接手”的示例 comment、示例动作和示例交付口径
3. verification 文档口径
   - 后续验证重点需要从“服务器是否拒绝”扩展到“人工本地接手是否按流程闭环”

## 6. 验收标准

phase 2 spec 完成后，至少满足：

1. 与 phase 1 delivery / verification 不冲突
2. 明确说明 phase 2 只做人工本地接手流程标准化
3. 没有隐含要求：
   - 新增控制面状态
   - 新增原因码
   - 本机 execution node
4. 实现者不需要再决定：
   - 普通任务是否还允许服务器继续代跑
   - 本地接手是否属于 runtime 能力
   - 本轮是否要扩张控制面语义

## 7. 下一阶段 handoff

本 spec 只定义 phase 2 的人工本地接手规则。

若未来要继续推进，必须另立 spec 讨论：

1. 是否把用户本机纳入正式 execution node
2. 是否要为本地执行引入正式 execution workspace 语义
3. 是否要为本地接手新增专用状态或原因码
