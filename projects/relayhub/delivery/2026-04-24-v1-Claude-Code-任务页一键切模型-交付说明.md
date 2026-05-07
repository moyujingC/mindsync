# RelayHub v1 Claude Code 任务页一键切模型交付说明

> 状态：historical-reference
> 版本：0.1.0
> owner：Architect / Engineer
> last_updated：2026-05-06
> source_of_truth：projects/relayhub/delivery/2026-04-24-v1-Claude-Code-任务页一键切模型-交付说明.md

## Summary

本轮交付把任务页补成了面向 `Claude Code` 的一键切模型入口。

## Delivery Notes

- `/tasks` 顶部新增 `Claude Code 当前模型` 专用切换区
- 该区域直接操作 `task-claude-code`
- 不新增新的 control-plane 路由
- 继续复用现有任务保存链路
