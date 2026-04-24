# RelayHub v1 Claude Code 任务页切后即验交付说明

## Summary

本轮交付让任务页在切完 `Claude Code` 当前模型后，可以直接做一次本地真链路验证。

## Delivery Notes

- `TasksPage` 新增 `验证 Claude Code 当前模型`
- 前端直接请求本地 `dev-relay`
- 成功与失败结果都在当前页面直接反馈
