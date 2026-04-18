# RelayHub v1 control-plane release 部署与可写试用说明

> 状态：current
> 版本：0.1.0
> owner：Architect / Engineer / Ops
> last_updated：2026-04-19
> source_of_truth：/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/specs/2026-04-19-v1-control-plane-release-部署与可写试用说明.md
> 项目：RelayHub
> 阶段：spec

## 1. 本轮目标

本轮目标不是继续扩前端静态壳，而是把已经做出的 `模型库 / 任务库 / 运行记录` 最小闭环，真正部署到 `release` 上可用。

固定口径：

- 前端继续挂在 `https://relayhub.jingshu.cc/`
- control-plane 通过同源 `https://relayhub.jingshu.cc/api/control-plane/*` 提供可写 API
- 旧的 `/api/models` OpenAI-compatible 只读目录代理继续保留
- `/providers` 页面继续存在，但降级为支持模块

## 2. release 运行结构

本轮采用最小可用路线：

- 前端：静态站点
- control-plane：`Node + systemd`
- nginx：同源反代
- 持久化：宿主机文件目录

明确不做：

- 不并入 Docker
- 不引入数据库
- 不修改默认 `main.tsx`
- 不把 API Key 下发到浏览器

## 3. 后端落位规则

固定目录与职责：

- 代码目录：`/opt/aimandala-release/app/mindsync`
- 服务工作目录：`/opt/aimandala-release/app/mindsync/projects/relayhub/control-plane`
- 数据目录：`/var/lib/relayhub/control-plane`
- 日志目录：`/var/log/relayhub`
- systemd 环境文件：`/etc/default/relayhub-control-plane`

固定运行语义：

- 只监听 `127.0.0.1:<PORT>`
- 通过 `EnvironmentFile` 注入 `PORT` 与 `RELAYHUB_CONTROL_PLANE_DATA_DIR`
- 公共返回不暴露 API Key 明文

## 4. 同源路由规则

nginx 需要同时保留两类 API：

- `/api/control-plane/*`
  - 转给 RelayHub control-plane
  - 负责模型库、任务库、运行记录和 overview
- `/api/models` 等
  - 继续走外部模型源 readonly 代理
  - 不承载控制台写接口

这样前端会形成清晰边界：

- 主路径：控制台自己写自己的数据
- 支持路径：外部目录只读可见性验证

## 5. 前端启用口径

前端不新增新 seam，只收口已有变量：

- release 可写试用构建显式设置：
  - `RELAYHUB_CONTROL_PLANE_BASE_URL=/api/control-plane`
- 未设置时继续走前端 mock control-plane
- `/providers` 继续沿原 readonly real-fetch 链路

## 6. 验证口径

release 至少要完成：

- `systemd` 服务在线
- `curl http://127.0.0.1:<port>/health` 返回 `200`
- `curl -k https://relayhub.jingshu.cc/api/control-plane/health` 返回 `200`
- 首页、模型库、任务库、运行记录不再只读前端 mock
- 公共接口不暴露 API Key 明文
