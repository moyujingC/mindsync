# RelayHub v1 Codex 线路临时停用与 Claude Code 优先交付说明

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-27
> source_of_truth：projects/relayhub/delivery/2026-04-27-v1-Codex-线路临时停用与-Claude-Code-优先-交付说明.md
> 项目：RelayHub
> 阶段：delivery

## 1. 本轮交付结论

本轮没有继续扩 `Codex -> RelayHub` 主链路，而是先把它临时停用，避免继续干扰日常 `Codex` 使用。

当前默认口径改为：

- `Codex` 先不要再走 RelayHub
- `Claude Code` 继续作为当前优先开发线路
- `Codex` 相关实现基础保留，后续可恢复继续开发

## 2. 交付内容

- `dev-relay` 的 `Codex` 入口默认返回停用提示
- 任务页顶部撤掉 `Codex 当前模型` 快捷区与切后即验入口
- 新增本轮 `task / qa / delivery` artifact，明确这次停线意图

## 3. 验证结果

本轮应至少完成：

- `projects/relayhub/dev-relay`
  - `npm test`
- `projects/relayhub/console`
  - `npm test`
  - `npm run build`

## 4. 当前价值

这轮交付的价值不是“Codex 更强了”，而是：

- 当前 RelayHub 不再继续抢占你日常 `Codex` 使用路径
- 当前可以集中精力把 `Claude Code` 先跑稳
- 后续再回头恢复 `Codex` 线路时，不需要从零重做

## 5. 下一步建议

- 下一轮优先只做 `Claude Code` 相关主路径
- 等 `Claude Code` 跑稳后，再决定是否恢复 `RELAYHUB_ENABLE_CODEX_RELAY=1` 继续开发 `Codex`

