# RelayHub v1 control-plane release 验证记录

> 状态：draft
> 版本：0.1.0
> owner：Engineer / QA
> last_updated：2026-04-19
> source_of_truth：/Users/xinran/.codex/worktrees/1b9a/mindsync/projects/relayhub/qa/2026-04-19-v1-control-plane-release-验证记录.md
> 项目：RelayHub
> 阶段：verification

## 1. 本地验证

- 已完成：
  - `cd projects/relayhub/control-plane && npm test`
    - 结果：通过，`6/6` tests passed
  - `cd projects/relayhub/console && npm test`
    - 结果：通过，`330/330` tests passed
  - `cd projects/relayhub/console && npm run build`
    - 结果：通过，production build 成功输出 `dist/`
  - `cd projects/relayhub/console && RELAYHUB_CONTROL_PLANE_BASE_URL=/api/control-plane npm run build:trial`
    - 结果：通过，trial build 成功输出 `dist/trial.html` 并落位为 `dist/index.html`

- 已验证的关键点：
  - `RELAYHUB_CONTROL_PLANE_DATA_DIR` 可驱动控制平面把状态写到外部目录
  - `GET /api/control-plane/health` 可在同源反代前缀下工作
  - 前端在 `RELAYHUB_CONTROL_PLANE_BASE_URL=/api/control-plane` 时会命中同源 control-plane 路径
  - 未设置 `RELAYHUB_CONTROL_PLANE_BASE_URL` 时前端仍回退到 mock control-plane

## 2. release 验证

- 已完成：
  - release 主 checkout `remote.origin.fetch` 仅拉 `release`
    - 结果：不能直接 `git checkout project/relayhub`
  - release 主 checkout 存在脏工作区
    - 结果：不能直接切换分支，需改用独立 `git worktree`
  - `git fetch origin refs/heads/project/relayhub:refs/remotes/origin/project/relayhub`
    - 结果：可显式拉到 RelayHub 长期分支
  - `git worktree add /opt/aimandala-release/worktrees/relayhub origin/project/relayhub`
    - 结果：独立 RelayHub worktree 已建立
  - `sudo systemctl status relayhub-control-plane --no-pager`
    - 结果：通过；服务从独立 worktree 路径启动成功
  - `curl http://127.0.0.1:4318/health`
    - 结果：通过，返回 `{"ok":true}`
  - `curl -k https://relayhub.jingshu.cc/api/control-plane/health`
    - 结果：通过，返回 `{"ok":true}`
  - `curl -k https://relayhub.jingshu.cc/api/control-plane/models`
    - 结果：通过，返回模型条目 JSON
  - `curl -k https://relayhub.jingshu.cc/api/control-plane/overview`
    - 结果：通过，返回真实 overview JSON
  - `curl -kI https://relayhub.jingshu.cc/api/control-plane/health`
    - 结果：返回 `404`
    - 说明：当前服务只实现 `GET /health`，未单独处理 `HEAD`

- release 侧实测结论：
  - RelayHub 当前应通过独立 worktree 部署，而不是直接切主 release checkout
  - `install-relayhub-control-plane-service.sh` 与 `deploy-relayhub-console-trial.sh` 在旧默认路径下不可直接复用，需显式传 `REPO_ROOT` / `WORKING_DIRECTORY` / `DIST_DIR`

## 3. 页面验证

- 待浏览器验证并记录：
  - 首页摘要是否来自真实 overview
  - 模型新增、测试连接、任务绑定、运行记录是否闭环
  - `/providers` 是否保持可打开
