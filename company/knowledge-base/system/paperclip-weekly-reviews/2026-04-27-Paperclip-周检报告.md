# Paperclip 周检报告

> 状态：historical-reference
> 版本：0.1.0
> owner：Research & Knowledge Lead, Engineer
> last_updated：2026-04-27
> source_of_truth：company/knowledge-base/system/paperclip-weekly-reviews/2026-04-27-Paperclip-周检报告.md

## 1. 本次周检基本信息

- 周检日期：`2026-04-27`
- 覆盖时间窗：`2026-04-17` 至 `2026-04-27`
- 检查人 / 执行链：Codex 本地检查 + 官方 GitHub 一手来源核对
- 主要官方来源：
  - `Paperclip` GitHub Releases
  - `Paperclip` GitHub Security Advisory `GHSA-68qg-g8mg-6pr7`

## 2. 本周最重要结论

- 一句话结论：`MindSync` 当前服务器运行版本已高于安全修复线，但仍建议把 `Paperclip` 服务端基线从当前 `canary/v2026.411.0...` 收正到 `v2026.416.0` 正式版，并补齐“主仓版本如何钉住和核验”的部署口径。
- 当前推荐升级版本：`v2026.416.0`
- 当前是否建议立刻升级：`是`
- 若不立刻升级，主要原因：当前运行版本已过安全下限，短期风险从“严重未修复”下降为“版本收口不规范 + 未对齐最新正式版”；若本周排期更紧，可以先把升级列为近期高优先级而不是紧急停机动作。

## 3. 上游关键变化

### 3.1 安全与稳定性

- 变更：官方披露 `authenticated`（认证模式）网络可达实例的未认证远程代码执行漏洞
- 日期：`2026-04-10`
- 版本：受影响 `< 2026.410.0`，修复版本 `2026.410.0`
- 为什么重要：`MindSync` 当前明确把 `Paperclip` 作为远程认证控制面使用，且背后连着 agent、automation、worktree、仓库挂载和执行链，一旦中招，影响不是“看板被入侵”，而是执行底座可能一起失守

### 3.2 运行时能力

- 变更：`v2026.416.0` 引入 execution policies（执行审批策略）、blocker dependencies（阻塞依赖）、issue chat thread（聊天式任务线程）等能力
- 日期：`2026-04-16`
- 版本：`v2026.416.0`
- 为什么重要：这些能力与 `MindSync` 当前靠 `type:*`、`review:*`、状态流规范、handoff 文档维持的任务语义高度相关，已经开始碰到“本地规则可否被上游原生能力替代”的判断点

### 3.3 部署与生态

- 变更：`v2026.403.0` 明确了 execution workspaces（执行工作区）相关跟随问题默认继承逻辑，并引入 app-side telemetry（应用侧遥测，可关闭）
- 日期：`2026-04-03`
- 版本：`v2026.403.0`
- 为什么重要：`MindSync` 当前对 `execution workspace`、`git worktree`、materialization（工作区实例化）和本地/服务器执行链分流已经有较重治理，任何继承逻辑变化都可能影响 issue 派生和运行时 cwd 语义

## 4. 对 MindSync 的影响判断

### 4.1 高影响

- 影响项：安全基线已确认，但版本基线仍需收正
- 命中的本地系统层：
  - [.paperclip.yaml](.paperclip.yaml) 中的远程认证实例口径
  - [company/projects/Automation/PROJECT.md](company/projects/Automation/PROJECT.md) 中的控制面 / 执行底座分层
  - [projects/aimandala/deploy/paperclip-automation/README.md](projects/aimandala/deploy/paperclip-automation/README.md) 中的部署与运维主链
- 若不处理的风险：当前虽然已不落在已知严重漏洞区间，但继续停留在 `canary` 基线且不显式钉版本，会让后续升级、排障和审计都更不稳定

- 影响项：版本管理口径仍不够显式
- 命中的本地系统层：
  - 部署目录中的 `docker-compose.paperclip.yml` 只钉了 `HERMES_GIT_REF`
  - [Dockerfile.paperclip-with-hermes](projects/aimandala/deploy/paperclip-automation/Dockerfile.paperclip-with-hermes) 构建的是服务器上的 `/opt/paperclip/app/paperclip` checkout
- 若不处理的风险：仓库内无法直接判断服务器 Paperclip 主仓代码是否已经升级，后续很容易出现“文档以为已升级、运行时其实没升级”的漂移

### 4.2 中影响

- 影响项：execution policies 可能逐步替代一部分本地 `review` 约定
- 命中的本地系统层：
  - [company/任务审阅与状态流转规范.md](company/任务审阅与状态流转规范.md)
  - [company/Paperclip任务系统优化方案.md](company/Paperclip任务系统优化方案.md)
- 建议处理窗口：完成安全升级和版本收正后，再开一个独立 spec 评估“哪些 review 流应该下沉为上游原生审批策略”

- 影响项：blocker dependencies 可能替代一部分手工 blocked / wake 逻辑
- 命中的本地系统层：
  - 任务状态流规范
  - 任务创建模板
  - 后续 issue 路由自动化
- 建议处理窗口：与 execution policies 一并评估，不建议和安全升级同窗强绑定上线

### 4.3 低影响或暂不影响

- 变化：聊天式线程、移动端与 inbox 体验改进
- 为什么当前可暂不处理：会改善使用体验，但不会直接改变 `MindSync` 当前控制面、执行链和文档治理结构

- 变化：app-side telemetry
- 为什么当前可暂不处理：对本地治理的核心问题不是主路径瓶颈；如后续有隐私或噪音顾虑，再考虑显式关闭

## 5. 推荐升级版本判断

- 当前本地运行版本或可确认基线：
  - 仓库内可确认的是：`Hermes` 被钉在 `v2026.4.13`
  - 服务器实际运行的 `Paperclip` 主仓代码已核验为 `a692e37f`
  - `git describe` 显示为 `canary/v2026.411.0-canary.7-3-ga692e37f`
  - 当前部署口径仍更接近“构建服务器 checkout 的当前状态”，而不是“显式钉住某个 `Paperclip` release tag”
- 推荐升级目标：`v2026.416.0`
- 选择这个版本的原因：
  - 它高于安全修复下限 `2026.410.0`
  - 它是截至 `2026-04-27` 可确认的官方最新 release
  - 它同时覆盖了安全修复与后续对 `MindSync` 有中高价值的任务流能力增强
- 为什么不是更低版本：
  - 任何 `< 2026.410.0` 都不满足当前安全要求
  - 即便是 `2026.410.0` 到 `2026.415.x` 区间，也不如直接对齐当前最新稳定 release 简洁
- 为什么暂时不是更高版本：
  - 截至 `2026-04-27`，官方可确认最新版本就是 `v2026.416.0`

## 6. 本周建议动作

### 6.1 must

- 动作：把服务器侧 `Paperclip` 主仓代码从当前 `canary/v2026.411.0...` 收正到 `v2026.416.0` 并重建容器
- owner：Engineer
- 验证方式：升级后执行最小回归清单，并保留升级前后版本记录

- 动作：把“Paperclip 主仓版本如何钉住和核验”补成显式部署口径
- owner：Engineer
- 验证方式：更新部署文档后，下次任何人只看仓库就能知道服务端应该跑哪个版本

### 6.2 should

- 动作：补一个独立 spec，评估 `execution policies` 是否应取代一部分本地 `review:*` 规则
- owner：CEO / Orchestrator, Product Spec Lead, Engineer
- 验证方式：形成一份明确的“保留本地规则 / 下沉为上游原生能力 / 暂缓”的对照表

- 动作：评估 `blockedByIssueIds` 是否适合接入当前父子任务与 blocked 流
- owner：CEO / Orchestrator, Engineer
- 验证方式：挑一个低风险项目流试跑，不直接全局切换

### 6.3 optional

- 动作：评估是否显式关闭或保留 app-side telemetry
- owner：Engineer
- 备注：只有在确认 telemetry 对隐私、噪音或公司偏好有影响时再处理

## 7. 若执行升级，最小回归清单

- `Paperclip` UI / 登录与认证是否正常
- `CEO`、`Engineer`、`Test / QA` 是否还能正常起任务
- `local_manual_review` 是否仍落到本地 Mac
- `server_automation` 是否仍落到 automation 节点
- execution workspace / `git worktree` 是否正常 materialize
- 任务评论回写、`adapter / host` 标注是否正常
- heartbeat、maintenance、执行健康巡检是否正常
- `aimandala` 项目部署目录是否仍可构建和启动

## 8. 需要同步更新的本地 artifact

- 文档：
  - [projects/aimandala/deploy/paperclip-automation/README.md](projects/aimandala/deploy/paperclip-automation/README.md)
  - [projects/aimandala/docs/tasks/2026-04-10-服务器部署与运维手册.md](projects/aimandala/docs/tasks/2026-04-10-服务器部署与运维手册.md)
  - 需要时补到 [company/Paperclip-Agent-模型配置总表.md](company/Paperclip-Agent-模型配置总表.md) 或系统知识库
- 配置：
  - 如后续决定显式版本钉住，需要补充 `Paperclip` 主仓 tag / ref 口径
- 部署：
  - 服务器 `/opt/paperclip/app/paperclip` 的拉取、切 tag、重建流程
- 脚本：
  - 当前无必须立刻改的本地脚本，但版本核验脚本后续值得补

## 9. 风险接受记录

- 本周明确接受但未处理的风险：服务器当前已高于安全修复线，但仍运行在 `v2026.411.0` 附近的 `canary` 基线，且部署文档尚未把 `Paperclip` 主仓版本钉住为显式 release
- 接受理由：本周已完成真实版本核验，确认不是严重未修复状态；下一步重点从“紧急安全确认”转为“版本收正 + 文档收口”
- 下次周检前的观察点：
  - 是否已完成 `v2026.416.0` 升级
  - 是否已把版本钉住策略写入正式部署文档

## 10. 下轮建议关注

- 需要继续观察的上游方向：
  - execution policies
  - blocker dependencies
  - execution workspace 继承与 materialization 行为
  - adapter / plugin / MCP 生态变化
- 可能在下轮升为 `must` 的信号：
  - 新的安全通告
  - 官方再次改动认证、导入、执行工作区或审批语义
  - 本地开始正式接入原生审批流或 blocker 依赖

## 11. 备注

本报告是 `Paperclip` 周检机制建立后的首份基线样本。

它的主要价值不是“证明已经升级完成”，而是先把下面四件事固定下来：

1. 版本判断口径
2. 官方信息源边界
3. 对 `MindSync` 的影响框架
4. 后续升级与沉淀的最小闭环
