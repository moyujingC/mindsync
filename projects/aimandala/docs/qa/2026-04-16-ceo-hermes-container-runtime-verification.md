# CEO Hermes 容器运行时验证记录

> 状态：current
> 日期：2026-04-16
> owner：Engineer
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-16-ceo-hermes-container-runtime-verification.md
> 关联对象：一镜一梳 automation / Paperclip / CEO
> 关联任务：CEO bug

## 1. 背景

本轮排障起点是 CEO 在 Paperclip 中运行失败。

用户给出的截图显示旧报错为：

- `EACCES: permission denied, mkdir '/paperclip/instances/default/data/run-logs'`

但实际复核当前 automation 宿主与容器后，`run-logs` 目录权限正常、宿主与容器均可写，因此该报错不再构成当前主阻塞。

进一步复跑 CEO heartbeat 后，当前可稳定复现的真实错误为：

- `ModuleNotFoundError: No module named 'hermes_cli'`

## 2. 本轮验证目标

验证当前 CEO 失败是否由 Hermes 运行时安装方式错误导致，并给出可作为部署修复基线的正式结论。

## 3. 已验证事实

### 3.1 `run-logs` 权限不是当前根因

已确认：

- 宿主机 `/data/paperclip/instances/default/data/run-logs` 可写
- 容器内 `/paperclip/instances/default/data/run-logs` 可写
- 当前 `PAPERCLIP_HOME=/paperclip`
- 当前 `HOME=/paperclip`

结论：

- 截图中的 `EACCES` 更接近历史失败记录
- 它不是本轮 CEO 持续失败的当前主因

### 3.2 当前真实失败是 `hermes_cli` 缺失

通过恢复 CEO agent 并手动执行 heartbeat，当前实际错误稳定为：

- `ModuleNotFoundError: No module named 'hermes_cli'`

这说明：

- `hermes` 命令链路被找到了
- 但 Hermes 所依赖的 Python 包并未在当前解释器环境中被正确解析

### 3.3 宿主机注入 venv 存在 Python 主版本错配

已验证：

- 宿主机 `/opt/hermes-agent/venv/pyvenv.cfg` 对应 `Python 3.11`
- 宿主机 `pip show hermes-agent` 成功，版本为 `0.9.0`
- `hermes` 启动脚本 shebang 为：
  - `#!/opt/hermes-agent/venv/bin/python3`
- Paperclip 容器内执行 `/opt/hermes-agent/venv/bin/python` 实际返回：
  - `Python 3.13.5`

结论：

- 宿主机创建的 venv 进入容器后，解释器实际落到了容器自己的 Python 3.13
- 但 site-packages 仍位于宿主机 venv 的 Python 3.11 布局下
- 因此最终出现：
  - 可执行文件存在
  - 但 `import hermes_cli` 失败

## 4. 结论

当前 CEO bug 的正式根因是：

- `hermes_local` 采用了“宿主机 Python venv 注入容器”的部署方式
- 该方式在当前 automation 节点上产生了 Python 主版本不一致
- 最终导致 Hermes CLI 入口存在，但运行时依赖解析失败

因此当前正式修复方向应为：

- 采用容器原生 Hermes 安装
- 不再把宿主机 venv 作为 CEO 的默认运行时来源

## 5. 本轮修复基线

本仓库已将部署基线更新为：

- 新增 `Dockerfile.paperclip-with-hermes`
- `docker-compose.paperclip.yml` 与 `.example` 改为使用该 Dockerfile
- 停止挂载宿主机 `/opt/hermes-agent`
- 改为在 Paperclip 容器内创建 `/opt/hermes` 并安装 `hermes-agent`

## 6. 待执行验证

部署完成后，应至少补齐以下检查：

1. 容器内 `python3 --version`
2. 容器内 `command -v hermes`
3. 容器内 `hermes --version`
4. 容器内 `python3 -c 'import hermes_cli'`
5. Paperclip 面板 `CEO -> Test environment`
6. 手动触发一次 CEO heartbeat，确认不再出现 `ModuleNotFoundError: hermes_cli`

在以上检查完成前，本记录只确认：

- 根因已定位
- 部署修复口径已落文档与配置
- 最终运行恢复仍需服务器侧重建镜像并复验
