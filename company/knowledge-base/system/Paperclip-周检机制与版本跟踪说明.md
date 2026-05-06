# Paperclip 周检机制与版本跟踪说明

> 状态：current
> 版本：0.1.0
> owner：Research & Knowledge Lead, Engineer
> last_updated：2026-04-27
> source_of_truth：company/knowledge-base/system/Paperclip-周检机制与版本跟踪说明.md

这份文档用于定义 `墨予镜` 如何持续跟踪 `Paperclip` 上游更新，并把“看到更新”收束成“对 `MindSync` 有什么影响、该不该升级、下一步怎么迭代”的正式机制。

它不是单次分析记录，而是长期运行规则。

## 1. 为什么需要这套机制

`Paperclip` 当前仍处于快速迭代阶段。

对 `墨予镜` 来说，它不是一个可随便延后关注的外围依赖，而是：

- 公司控制面
- 任务与协作总线
- Agent 运行时入口
- `Automation Platform` 的上游基础

因此如果只在“出问题时”才看上游更新，会出现三类风险：

1. 安全修复晚于攻击窗口
2. 上游已经提供更合适的原生能力，但本地还在靠文档约定或补丁脚本硬撑
3. 本地治理规则已经与上游能力发生漂移，却没有形成升级判断

## 2. 周检目标

每周至少一次完成下面四个判断：

1. 上游这周到底更新了什么
2. 这些更新对 `MindSync` 是否有实质影响
3. 当前应该升级到哪个 `Paperclip` 版本
4. `MindSync` 自己下一步该补哪些治理、运行时或部署动作

## 3. 默认信息源

默认只优先使用官方或一手来源：

1. `Paperclip` 官方 GitHub Releases
2. `Paperclip` 官方 GitHub Security Advisories
3. `Paperclip` 官方仓库近期开启或合入的高影响变更

如需补充背景说明，再看：

- 官方文档
- 官方讨论区

默认不应把第三方转述当成版本决策依据。

## 4. 周检范围

每次周检，至少覆盖下面四层。

### 4.1 安全层

检查是否出现：

- 新的安全通告
- 已披露但本地仍未升级的高危版本区间
- 默认配置变化导致的暴露面变化

### 4.2 运行时能力层

检查是否出现：

- `approval / review` 原生能力变化
- `issue dependency / blockedBy` 能力变化
- `execution workspace`、`git worktree`、materialization 相关变化
- `project env`、workspace env 继承相关变化
- adapter、plugin、MCP 接入相关变化

### 4.3 部署与运维层

检查是否影响：

- 认证模式
- 本地执行器与服务器执行器的边界
- Docker / systemd 部署口径
- 本地与远端环境变量约定
- 观测、health check、heartbeat、maintenance

### 4.4 治理与协作层

检查是否影响：

- `type:*`、`review:*` 这类派生语义是否还需要继续靠本地规则维持
- 某些本地规则是否可被上游原生能力替代
- 任务模板、审阅流、handoff 结构是否应随之调整

## 5. 与 MindSync 的对照入口

做影响判断时，默认至少对照这些本地入口：

1. [.paperclip.yaml](../.paperclip.yaml)
2. [Paperclip-Agent-模型配置总表.md](../../Paperclip-Agent-模型配置总表.md)
3. [Paperclip任务系统优化方案.md](../../Paperclip任务系统优化方案.md)
4. [任务审阅与状态流转规范.md](../../任务审阅与状态流转规范.md)
5. [任务类型与标签规范.md](../../任务类型与标签规范.md)
6. [任务创建模板.md](../../任务创建模板.md)
7. [Automation入口.md](../../projects/Automation/PROJECT.md)
8. [服务器与基础设施入口.md](../../服务器与基础设施入口.md)
9. [paperclip-automation README.md](../../../projects/aimandala/deploy/paperclip-automation/README.md)

若周检结论已经形成稳定治理口径，应继续把结论回写到正式入口，而不是只停留在周检归档里。

当前最常见的回写目标包括：

1. 项目级版本基线与升级回归清单
   - [paperclip-automation README.md](../../../projects/aimandala/deploy/paperclip-automation/README.md)
2. `codex_local` 等关键 adapter 的正式安全边界
   - [Paperclip-Agent-模型配置总表.md](../../Paperclip-Agent-模型配置总表.md)
   - [服务器与基础设施入口.md](../../服务器与基础设施入口.md)
3. execution policy 与本地治理语义的原则级映射
   - [任务审阅与状态流转规范.md](../../任务审阅与状态流转规范.md)
   - [任务类型与标签规范.md](../../任务类型与标签规范.md)

## 6. 标准输出问题

每次周检产出都应明确回答下面问题，而不是只罗列 changelog（更新日志）：

1. 本次最重要的上游变化是什么
2. 哪些变化对 `MindSync` 无影响或低影响
3. 哪些变化是高优先级，尤其是安全和执行语义
4. 当前推荐升级到哪个精确版本
5. 为什么不是更低版本，也为什么暂时不是更高版本
6. 升级前需要补哪些前置检查
7. 升级后需要回归验证哪些关键链路
8. 若暂不升级，当前接受的风险是什么

## 7. 推荐结论结构

默认把结论分成三档：

- `must`
  - 不做会有明显安全、稳定性或错误执行风险
- `should`
  - 会明显改善系统质量，且改动成本可控
- `optional`
  - 值得跟踪，但当前不是主路径瓶颈

## 8. 推荐升级判断口径

当前不建议采用“永远追最新”的粗糙策略。

更稳的判断方式是：

1. 若出现安全通告，优先升级到首个已修复版本或更高稳定版本
2. 若没有安全问题，默认优先推荐最新正式 `release`（正式发布版）
3. 若上游功能虽新，但会明显冲击现有执行链，先列为 `should`，不急着同周切换
4. 默认不建议 `canary`（预发布试跑版）；只有当正式版明显不能覆盖已命中的关键痛点时，才允许把更激进路径列入 `optional`
5. 若本地已有重度定制部署，例如自定义 Dockerfile、Hermes、`pi` provider、自建本地执行器，则升级建议必须附带回归清单

## 9. 当前自动化口径

当前已经建立一个每周自动运行的自动化任务：

- 名称：`Paperclip Weekly Review`
- 默认频率：每周一次
- 默认目标：输出 inbox 可直接阅读的版本与影响判断

这条自动化的职责是：

- 持续巡检上游变化
- 给出本周建议
- 输出 inbox（收件箱）可直接阅读的判断结果
- 明确说明本周是否建议再归档到周检历史目录

它不直接承担：

- 自动升级远端 `Paperclip`
- 自动修改部署文件
- 自动重写治理文档
- 自动创建后续实施任务
- 默认每周把结果双写进仓库归档

当前固定策略是：

- 自动化范围：`判断 + 建议`
- 升级策略：`稳定优先`
- 输出形态：`Inbox 为主`

如果周检结论触发重要工作，应再创建独立任务进入：

1. `spec / problem framing`
2. `implementation plan`
3. `verification`
4. `delivery`

## 10. 交付模板

每次正式周检输出，优先复用：

- [templates/Paperclip-周检报告模板.md](../../../company/knowledge-base/system/templates/Paperclip-周检报告模板.md)

如果某周结论值得长期追溯，建议再归档到：

- [paperclip-weekly-reviews/README.md](../../../company/knowledge-base/system/paperclip-weekly-reviews/README.md)

默认只有满足下面任一条件时，才建议归档，而不是每周固定落盘：

1. 出现新的安全通告
2. 推荐升级版本相对上周发生变化
3. 对任务流、审批流或 `execution workspace`（执行工作区）有明确结构性建议
4. 出现值得保留的风险接受记录

## 11. 当前建议

如果某周没有时间做深入升级，也不应跳过下面最小动作：

1. 看 release 与 security advisory
2. 判断是否存在必须升级的版本
3. 记录“本周不升级”的理由
4. 记录当前已知风险是否继续接受

这样至少不会失去版本判断连续性。

## 12. 表达要求

周检输出默认应：

1. 优先写判断和动作，不抄长段 `changelog`（更新日志）
2. 带精确版本号和日期
3. 明确写出“为什么是这个版本、为什么不是更低版本、为什么暂时不是更高版本”
4. 英文专有词首次出现时，用括号补一句简短中文解释
