# RelayHub v1 Claude Code 可调用的最小 dev-relay 接入交付说明

## Summary

本轮交付的目标是让 RelayHub 第一次成为 Claude Code 可直接调用的本地中转站。

交付后：

- 本地工具把请求打到 RelayHub `dev-relay`
- `dev-relay` 固定读取 `task-claude-code` 当前默认模型入口
- RelayHub 使用绑定入口的 `baseUrl + apiKey + modelId` 转发到上游
- 在任务库切换 `Claude Code Web Coding` 默认模型后，后续请求自动跟随切换

## Delivery Notes

- 新增本地 `dev-relay` 最小服务
- 只实现 `chat/completions`
- 不新增 control-plane 路由
- 配置真理源仍是 control-plane 的本地状态
- 切换动作继续放在 RelayHub 任务库中完成

