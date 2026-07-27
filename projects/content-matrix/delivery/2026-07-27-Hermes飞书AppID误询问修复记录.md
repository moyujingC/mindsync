# Hermes 飞书 App ID 误询问修复记录

> 状态：authorization-pending
> 日期：2026-07-27
> 触发：Hermes 在博主追踪流程中要求用户提供飞书 App ID 和身份策略。

## 结论

这不是正常交互。内容系统使用服务器上的 `lark-cli` 用户身份访问既有多维表格；聊天用户不应提供 App ID、App Secret 或身份策略。

## 已确认原因

1. release 部署配置的 `as` 被设置为 `bot`，与现有用户身份表格写入路径不一致。
2. release 服务器的 `lark-cli` 缺少 `base:record:read` 用户授权，读取“博主账号”表时返回 `need_user_authorization`。
3. Hermes 在命令失败后错误进入了通用飞书绑定流程，向用户索取了 App ID。

## 修复

- 将部署配置改回 `as: user`。
- Hermes 主角色增加硬规则：不向用户询问 App ID / App Secret；授权缺失时仅提示服务器管理员重新授权 `lark-cli` 的 `base` 权限。
- 需要一次服务器侧的飞书设备授权；完成后用只读表格访问验证，再恢复博主追踪聊天复测。

## 会话状态清理

授权完成后，旧的飞书私聊仍重复询问 App ID。原因不是授权失败，而是 Hermes 的 `gateway_routing` SQLite（轻量数据库）索引仍将该聊天 ID 映射到旧会话；旧会话内保留了错误的“绑定 App ID”上下文。

处理方式：停止 Gateway，备份 `state.db` 与 `sessions.json`，删除该聊天对应的路由索引和镜像条目，再启动 Gateway。不会删除飞书表、博主记录、内容证据或互动快照。

处理后确认：路由条目数量为 `0`，Gateway 为 `active` 并重新连接飞书。下一条聊天消息将创建新会话并加载当前角色规则。
