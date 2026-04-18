# RelayHub v1 control-plane release 交付说明

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-19
> source_of_truth：/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/delivery/2026-04-19-v1-control-plane-release-交付说明.md
> 项目：RelayHub
> 阶段：delivery

## 1. 本轮交付

- 为 `control-plane` 补齐 release 运行骨架
- 为 `relayhub.jingshu.cc` 补齐 `/api/control-plane/*` 同源反代入口
- 前端保留 mock 默认入口，同时允许 release trial 显式切到真实 control-plane

## 2. 本轮保持不变

- 默认 `main.tsx` 继续不改
- `/providers` 外部模型源只读链继续保留
- 不上 Docker
- 不上数据库

## 3. 当前残留

- release 机器仍需实际安装 service、环境文件和 nginx 路由
- release 侧真实页面 smoke 仍待浏览器验证
- 文件持久化仍是最小方案，后续再评估数据库化
- 权限治理、外部程序自动回传和测评计划不在本轮
