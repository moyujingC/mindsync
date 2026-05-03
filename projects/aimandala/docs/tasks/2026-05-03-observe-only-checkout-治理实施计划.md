# Observe-only Checkout 治理实施计划

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-03
> source_of_truth：projects/aimandala/docs/tasks/2026-05-03-observe-only-checkout-治理实施计划.md
> 项目：aimandala
> 阶段：implementation-plan
> depends_on：projects/aimandala/docs/specs/2026-05-03-observe-only-checkout-治理规格.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 本轮目标

本轮不是“把线上脏目录一次清光”，而是建立可持续升级的 observe-only checkout 治理路径。

本轮固定完成：

1. 基线盘点
2. 现场归类
3. 收束策略
4. 日常值班 runbook

## 2. 实施顺序

顺序固定如下，不允许跳步：

1. 先盘点
2. 再归类
3. 再决定转正 / 备份 / 重建 / 定点覆盖
4. 最后再执行后续升级或巡检动作

## 3. 基线盘点

先分别盘点两个 observe-only checkout：

1. `/opt/automation/app/mindsync`
2. `/opt/automation/app/mindsync-heartbeat`

每个 checkout 固定记录：

1. `git status --short`
2. `git branch --show-current`
3. `git remote -v`
4. `git rev-parse HEAD`
5. 最近 10 条提交
6. 是否存在未进仓的现场补丁
7. 是否有明确需要保留的运维证据

## 4. 治理归类

盘点后必须把每一类脏改归到下面 4 类之一：

1. 运行时误写
   - 本不该落到 observe-only checkout 的真实执行写入
2. 人工运维临时改动
   - 为排障临时改过 unit、env、脚本或注释
3. 历史未清现场
   - 过去已经完成的临时补丁、测试文件或样本残留
4. 模板 / 脚本漂移
   - 仓库模板已经更新，但节点上还留着旧版或定制版

每类都要给出处理结论：

1. 转正进仓库
2. 单独备份
3. 移出 observe-only checkout
4. 重建 checkout

## 5. 收束策略

### 5.1 主镜像区

`/opt/automation/app/mindsync` 默认目标：

1. 保持干净
2. 只做共享脚本源和排障参考
3. 不再承接 agent 写入

处理顺序固定为：

1. 先识别脏改是否有保留价值
2. 有价值的改动：
   - 转正进仓库或备份留档
3. 无价值的改动：
   - 在确认来源后清理
4. 若来源混乱无法安全清理：
   - 重建 checkout

### 5.2 巡检区

`/opt/automation/app/mindsync-heartbeat` 默认目标：

1. 固定跟 `origin/main`
2. 长期干净
3. 只承接 heartbeat、runner-doctor、maintenance 这类 observe-only 巡检

处理顺序固定为：

1. 先确认是否残留现场补丁
2. 若补丁已进仓：
   - 重建或快进到干净状态
3. 若补丁仍未进仓但有价值：
   - 先转正，再恢复干净 checkout

### 5.3 后续升级

未来节点升级默认分两种路径：

1. observe-only checkout 干净
   - 允许正常同步
2. observe-only checkout 不干净
   - 不允许直接升级
   - 先按 runbook 分类
   - 再决定定点覆盖或重建

## 6. 运行链联动

本轮要把下面三类动作统一纳入同一口径：

1. heartbeat
2. maintenance
3. 手工升级

固定要求：

1. 任一 observe-only checkout 脏时
   - heartbeat / maintenance 必须能显式报错或停在前置检查
2. 升级动作不能再把“checkout 脏”只当提示
3. 巡检区即使要检查 `relayhub/dev` 的 workflow，也不需要把本地 checkout 切到 `relayhub/dev`

## 7. 完成标准

只有同时满足下面条件，本轮才算完成：

1. spec / plan / qa / runbook 已落地
2. 主镜像区与巡检区的目标状态被明确固定
3. 脏 checkout 的分类、保留、转正、重建顺序被明确固定
4. 后续升级不再依赖脏目录直接 `git pull`
