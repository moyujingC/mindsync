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

- 待 release 机执行并记录：
  - `sudo systemctl status relayhub-control-plane --no-pager`
  - `curl http://127.0.0.1:<port>/health`
  - `curl -k https://relayhub.jingshu.cc/api/control-plane/health`
  - `curl -k https://relayhub.jingshu.cc/api/control-plane/models`

## 3. 页面验证

- 待浏览器验证并记录：
  - 首页摘要是否来自真实 overview
  - 模型新增、测试连接、任务绑定、运行记录是否闭环
  - `/providers` 是否保持可打开
