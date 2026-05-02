# RelayHub v1 Claude Code 任务页一键切模型交付说明

## Summary

本轮交付把任务页补成了面向 `Claude Code` 的一键切模型入口。

## Delivery Notes

- `/tasks` 顶部新增 `Claude Code 当前模型` 专用切换区
- 该区域直接操作 `task-claude-code`
- 不新增新的 control-plane 路由
- 继续复用现有任务保存链路
