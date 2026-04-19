# RelayHub v1 control-plane release 验证记录

> 状态：current
> 版本：0.1.1
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
  - `ssh -i /Users/xinran/.ssh/mandala_prod_ed25519 ubuntu@42.192.65.145 'git -C /opt/aimandala-release/worktrees/relayhub branch --show-current; curl -sS http://127.0.0.1:4318/health; systemctl is-active relayhub-control-plane'`
    - 结果：通过，依次返回：
      - `project/relayhub`
      - `{"ok":true}`
      - `active`

- release 侧实测结论：
  - RelayHub 当前应通过独立 worktree 部署，而不是直接切主 release checkout
  - `install-relayhub-control-plane-service.sh` 与 `deploy-relayhub-console-trial.sh` 在旧默认路径下不可直接复用，需显式传 `REPO_ROOT` / `WORKING_DIRECTORY` / `DIST_DIR`
  - release 机当前真实运行口径已经收口为：
    - worktree：`/opt/aimandala-release/worktrees/relayhub`
    - 公网入口：`https://relayhub.jingshu.cc/`
    - 同源可写 API：`https://relayhub.jingshu.cc/api/control-plane/*`

## 3. 页面验证

- 已完成的浏览器 smoke：
  - `https://relayhub.jingshu.cc/dashboard`
    - 结果：通过
    - 观察：
      - 首页标题与主路径语义已切到“模型库 / 任务库 / 运行记录”
      - 概览数值与 `GET /api/control-plane/overview` 一致：
        - 模型条目 `4 -> 5`
        - 已激活模型 `0 -> 1`
        - 已绑定任务 `2 -> 3`
        - 运行记录 `3 -> 4`
      - “第一步 / 第二步 / 第三步”入口可正常导航到 `/models`、`/tasks`、`/runs`
  - `https://relayhub.jingshu.cc/models`
    - 结果：通过
    - 交互：
      - 新增自定义模型 `Smoke 模型 2026-04-19`
      - 编辑并修正该条目的名称与 `baseUrl`
      - 触发“测试连接”后状态从 `待测试` 变为 `已激活`
    - 对应服务端结果：
      - `GET /api/control-plane/models` 返回新增条目
      - 脱敏密钥仍为 `sk-smo...0419`
      - `statusNote` 为“连接测试通过，可以绑定到任务默认模型。”
  - `https://relayhub.jingshu.cc/tasks`
    - 结果：通过
    - 交互：
      - 新增自定义任务 `Smoke 任务 2026-04-19`
      - 默认模型绑定为 `Smoke 模型 2026-04-19`
    - 页面结果：
      - 自定义任务表格中可见默认模型绑定
  - `https://relayhub.jingshu.cc/runs`
    - 结果：通过
    - 交互：
      - 为 `Smoke 任务 2026-04-19` 录入 1 条运行记录
      - 模型选择为 `Smoke 模型 2026-04-19`
      - 结果等级为 `优秀`
    - 页面结果：
      - 治理概览中的“运行记录”从 `3` 刷新为 `4`
      - 最近运行记录中出现新增样本
      - 切换到 `Smoke 任务 2026-04-19` tab 后，任务统计可显示：
        - `当前共有 1 条记录`
        - `涉及 1 个模型`
        - 平均成本 `¥0.5`
        - 平均耗时 `320 ms`
  - `https://relayhub.jingshu.cc/providers`
    - 结果：通过
    - 观察：
      - 外部模型源只读支持页保持可打开
      - 页面仍显示 OpenAI-compatible 模型目录试用语义，未被 control-plane 可写链路破坏

## 4. 本轮通过项

- 通过：独立 worktree + systemd + nginx 反代的 release 试用部署已跑通
- 通过：`/api/control-plane/health`、`/models`、`/overview` 可从公网同源入口返回真实 JSON
- 通过：Dashboard、模型库、任务库、运行记录四条主页面路径均可交互
- 通过：模型新增 -> 测试连接 -> 任务绑定 -> 运行记录录入 的最小业务闭环已成立
- 通过：`/providers` 支持页仍可访问
- 通过：公共返回未暴露 API Key 明文

## 5. 本轮未纳入问题

- `HEAD /api/control-plane/health` 返回 `404`
  - 结论：已记录为接口语义差异，不视为当前 release 部署失败
- `/api/models` 真实 readonly upstream 仍是独立支持能力
  - 结论：本轮不要求把只读目录验证扩成 control-plane 主路径
