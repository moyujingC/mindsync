# Aimandala Self-Hosted Runner

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-12
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/deploy/github-runner/README.md
> 项目：aimandala
> 阶段：ops-runbook

本目录用于收口 `aimandala` 第一阶段自托管 GitHub runner 的最小落地方式。

当前主推荐宿主机已收口为新增的 `automation` 节点：

- 规格：`4核 / 4G / 40G`
- 角色：Paperclip + runner + auto-fix
- 调度策略：单 runner、串行执行

## 1. 当前角色

第一阶段只定义一个 runner 角色：

- 名称：`mindsync-ci`
- 标签：
  - `self-hosted`
  - `linux`
  - `mindsync-ci`
  - `aimandala`

默认要求：

- 不与正式 `prod` 容器混跑
- 不直接承载业务服务
- 仅用于 `ci / deploy / nightly-smoke / auto-repair`
- 推荐与 `/Users/xinran/Downloads/dev/mindsync/projects/aimandala/deploy/paperclip-automation/README.md` 一起部署

## 2. 推荐目录

推荐在 Linux 主机上落到：

```bash
/opt/mindsync-ci/actions-runner
```

## 3. 最小依赖

runner 主机至少应具备：

- `git`
- `curl`
- `jq`
- `nodejs`
- `npm`
- `python3`
- `python3-venv`
- `docker`（仅当需要在同机联调构建）

GitHub Actions 里的 `actions/setup-node` 和 `actions/setup-python` 仍会继续负责版本对齐；
这里要求的是系统级最小运行前提。

## 4. 初始化步骤

1. 在 GitHub 仓库里创建 self-hosted runner registration token
2. 在主机上下载对应平台的 `actions-runner`
3. 配置 runner 名称为 `mindsync-ci`
4. 配置 labels 为：

```text
self-hosted,linux,mindsync-ci,aimandala
```

5. 使用本目录的 systemd service 示例注册常驻服务

## 5. systemd

参考文件：

- `/Users/xinran/Downloads/dev/mindsync/projects/aimandala/deploy/github-runner/mindsync-ci-runner.service.example`

## 6. Watchdog

runner 宕机时，GitHub 上会直接表现为 job 卡在 `Queued` / `Waiting for a runner to pick up this job`。

为了把这类问题同步到 Paperclip，第一阶段先接受在同一台 `automation` 节点上定时执行：

```bash
node /Users/xinran/Downloads/dev/mindsync/shared/tools/ci/check-runner-heartbeat.mjs \
  --repository moyujingC/mindsync \
  --workflow-file aimandala-ci.yml \
  --branch main
```

需要人工深挖时，统一先跑：

```bash
GITHUB_REPOSITORY=moyujingC/mindsync \
GITHUB_TOKEN=<token> \
bash /Users/xinran/Downloads/dev/mindsync/shared/tools/ci/runner-doctor.sh --strict
```

`runner-doctor.sh` 会同时输出：

- `mindsync-ci-runner.service`
- `paperclip-heartbeat.service / timer`
- 当前仓库基线（cwd / branch / sha / dirty）
- GitHub workflow 最新状态
- GitHub runner 注册状态、在线状态与 labels 对账

建议频率：

- 每 15 分钟一次

注意：

- 这种做法能覆盖大多数“runner 卡住或长期无成功运行”的异常
- 但不能覆盖整台 `automation` 节点完全宕机
- 整机宕机时，仍应以 GitHub 上的 `Waiting for a runner` 为最终兜底信号

### 6.1 `queued` 超时的固定判定

当 `ci` 长时间停在 `Queued / Waiting for a runner to pick up this job` 时，统一按基础设施故障处理：

- 直接归类为 `infra-runner-failure`
- 不再混用成 `build-failure` 或 `ci-test-failure`
- 先检查 runner 在线状态、labels、heartbeat token 权限，再看代码层问题
