# Idea Clarifier 运行时缺失排查与修复说明

> 状态：draft
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-14
> source_of_truth：projects/research-center/delivery/2026-04-14-Idea-Clarifier-运行时缺失排查与修复说明.md
> 项目：研究中心
> 阶段：delivery

## 1. 问题现象

新增的 `Idea Clarifier` 已存在于仓库治理源：

- [.paperclip.yaml](../../../.paperclip.yaml)
- [agents/idea-clarifier/AGENTS.md](../../../agents/idea-clarifier/AGENTS.md)

但在 Paperclip 面板上看不到。

## 2. 根因

排查结果表明，这不是 `Pi` adapter 不支持显示，而是当前本机 Paperclip 运行时公司实例里根本没有创建 `Idea Clarifier` 这条 agent 记录。

已确认：

- 仓库侧 `.paperclip.yaml` 配置的是 10 个 agent
- 当前本机运行时目录只存在 9 个 agent instructions 目录
- 本机备份里的 `agents` 表对应该公司也只有 9 条记录
- 缺失项正是 `Idea Clarifier`

## 3. 为什么原脚本没有修好

[shared/tools/sync-agents.sh](../../../shared/tools/sync-agents.sh) 只负责：

- 在仓库与运行时之间同步已有 agent 的 instructions 文件

它不会：

- 创建缺失的 runtime agent 实体
- 把 `.paperclip.yaml` 里的新增 agent 自动导入到 Paperclip 数据库

因此新增角色时会出现：

- 仓库里已经有 agent 定义
- 运行时仍然停留在旧的 9-agent 组织
- 面板上看不到新增 agent

## 4. 新增修复工具

已新增：

- [shared/tools/sync-paperclip-runtime-agents.sh](../../../shared/tools/sync-paperclip-runtime-agents.sh)

用途：

- 对账 `.paperclip.yaml` 与运行时 agent 清单
- 显示哪些 agent 只存在于仓库、不存在于运行时
- 在 API 可用时补建缺失的 runtime agent

建议顺序：

1. `bash shared/tools/sync-paperclip-runtime-agents.sh status`
2. `bash shared/tools/sync-paperclip-runtime-agents.sh create-missing`
3. `bash shared/tools/sync-agents.sh import`

## 5. 当前限制

本次提交时，本机 `Paperclip API` 端口不可连接，因此未在当前会话中直接完成运行时补建。

这意味着：

- 仓库侧修复已完成
- 运行时补建动作需要在 `Paperclip` 服务恢复后执行

## 6. 一句话结论

`Idea Clarifier` 看不到，不是因为 `Pi` adapter，而是因为当前运行时公司实例仍是旧的 9-agent 数据；服务恢复后，用新脚本补建缺失 agent，再导入 instructions 即可。
