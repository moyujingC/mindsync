# Aimandala Local Mac Execution Host Pilot Plan

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-21
> source_of_truth：projects/aimandala/docs/tasks/2026-04-21-local-mac-execution-host-pilot-plan.md
> 项目：aimandala
> 阶段：implementation-plan
> depends_on：projects/aimandala/docs/specs/2026-04-21-local-mac-execution-host-pilot-spec.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 本轮目标

本轮只落本地 Mac 执行节点单机试点的正式 artifact 链，不进入实现。

本轮固定完成：

1. 把“你的 Mac 作为 local execution host”的边界写成正式计划
2. 把接入顺序、配置对象和最小回写合同写死
3. 为下一轮真实接入和验证提供唯一实施入口

## 2. 本轮边界

本轮明确要做：

1. 新建 `Spec / Task / QA Basis`
2. 更新 `specs / tasks / qa README`
3. 明确单机试点的连接合同、执行合同和回写合同

本轮明确不做：

1. 不修改 `PaperclipAI` 源码
2. 不修改运行时脚本
3. 不修改远端控制面对象
4. 不补 `Verification / Delivery`
5. 不扩成多开发者共享方案

## 3. 实施顺序

下一轮进入实现时，必须按下面顺序执行：

1. 先修正文档中的宿主语义
   - `.paperclip.yaml`
   - `company/Paperclip-Agent-模型配置总表.md`
   - `company/服务器与基础设施入口.md`
2. 再补本地接入 runbook
3. 再补本地环境变量与连接配置
4. 再跑单机 claim / checkout / 执行 / 回写闭环
5. 最后补验证记录与交付说明

禁止倒序：

1. 不允许先跑本地执行，再回头定义宿主语义
2. 不允许先接多机，再回头做单机试点
3. 不允许先改 heartbeat，再回头做本地接入

## 4. 下一轮实现对象

下一轮实现只允许覆盖：

1. 治理文档中的宿主语义解释
2. 本地运行说明与接入 runbook
3. 本地环境变量与连接配置
4. 本地 claim / checkout / comment 回写步骤
5. 最小验证样本与验证记录

## 5. 单机试点最小合同

### 5.1 连接合同

必须固定为：

1. 复用现有远端 Paperclip 控制面
2. 复用现有 `host / port / company id / API key`
3. 不新建第二套控制面

### 5.2 执行合同

必须固定为：

1. 只接 `manual-review-required + local_manual_review`
2. 不接 `automation-execution + server_automation`

### 5.3 本地目录合同

必须固定为：

1. 使用你的 Mac 上的本地仓库或本地 worktree
2. 不复用 `/opt/automation/...`

### 5.4 回写合同

必须至少回写：

1. claim
2. `cwd`
3. `branch`
4. `sha`
5. 当前判断
6. 已做动作
7. 下一步动作
8. 验证结论

## 6. 固定样本

下一轮验证必须覆盖：

1. 一条真实普通研发任务
   - 作为正样本
2. `MIN-137`
   - 作为摘要任务反例
3. `MIN-133`
   - 作为 CI 父任务反例

并继续确认：

1. `localExecutionRouting`
   - 服务器侧仍只做审计
   - 不重新接回主执行链

## 7. 完成标准

只有同时满足下面条件，本轮计划链才算完整：

1. 新 Spec / Task / QA Basis 已落地
2. 入口 README 已把本地 Mac 单机试点纳入当前 execution routing 入口
3. 下一轮实现者无需再决定：
   - 普通任务本地试点的宿主是谁
   - 连接哪套控制面
   - 回写哪些最小字段
