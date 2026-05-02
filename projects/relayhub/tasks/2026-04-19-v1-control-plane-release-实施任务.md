# RelayHub v1 control-plane release 实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-19
> source_of_truth：projects/relayhub/tasks/2026-04-19-v1-control-plane-release-实施任务.md
> 项目：RelayHub
> 阶段：task

## 1. 本轮目标

把当前本地已实现的 `模型库 + 任务库 + 运行记录` 闭环，从“本地可跑”推进到“release 可用”。

## 2. 实施拆解

### 2.1 control-plane 运行时收口

- 增加 `RELAYHUB_CONTROL_PLANE_DATA_DIR`
- 让持久化不再依赖仓库内 `data/`
- 保持现有 `/models`、`/tasks`、`/runs`、`/overview` 语义不变
- 兼容 `/api/control-plane/*` 同源反代前缀

### 2.2 release 部署骨架

- 新增 `relayhub-control-plane.service.example`
- 新增安装 service 脚本
- 新增安装 nginx `/api/control-plane/` 反代脚本
- 更新 release runbook，写清目录、环境文件、数据目录、reload 和回滚

### 2.3 前端接线

- release trial 构建显式设置 `RELAYHUB_CONTROL_PLANE_BASE_URL=/api/control-plane`
- 默认 mock 入口保持不变
- 不修改 `main.tsx`

### 2.4 artifact 同步

- 新增本轮 spec / task / qa / delivery / 验证记录
- 更新 `specs/README.md`、`tasks/README.md`、`qa/README.md`

## 3. 明确不做

- 不切 Docker
- 不上数据库
- 不改对象模型
- 不把 `/api/models` 与 control-plane 合并
- 不新增新的 runtime seam / wrapper
