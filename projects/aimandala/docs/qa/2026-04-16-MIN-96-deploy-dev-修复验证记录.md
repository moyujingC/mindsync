# MIN-96 deploy-dev 修复验证记录

> 状态：working
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-16-MIN-96-deploy-dev-修复验证记录.md
> 项目：aimandala
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/architecture/CI-CD与自动修复架构.md
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-12-ci-cd-实施计划.md
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-14-ci-cd-运行稳定化治理整改计划.md
> reviewers：Engineer, Test / QA

## 1. 背景

`MIN-96` 为 `deploy-dev` 失败处理任务（issue 当前状态：`in_review`，priority：`critical`）。

针对现有 `deploy` workflow 的排查结果：

1. `Prepare SSH Key` 仅校验了 `AIMANDALA_DEV_SSH_KEY` 与 `AIMANDALA_DEV_HOST`，未提前校验 `AIMANDALA_DEV_USER`。
2. 若 `AIMANDALA_DEV_USER` 缺失，会在远端 SSH 步骤才失败，日志语义偏弱，不利于快速定位为凭据配置问题。
3. `prod` 路径存在同类风险（`AIMANDALA_PROD_USER`）。

## 2. 本轮变更

变更文件：

- `/Users/xinran/Downloads/dev/mindsync/.github/workflows/aimandala-deploy.yml`

关键修复：

1. 在 `deploy-dev` 的 `Prepare SSH Key` 中新增 `AIMANDALA_DEV_USER` 预检，缺失时显式失败并写入 `deploy-dev-prepare.log`。
2. 在 `deploy-prod` 的 `Prepare SSH Key` 中新增 `AIMANDALA_PROD_USER` 预检，保持对称行为。
3. `deploy-dev` 与 `deploy-prod` 的远端 SSH 命令统一增加：
   - `-o BatchMode=yes`
   - `-o IdentitiesOnly=yes`
   - `-o StrictHostKeyChecking=yes`

## 3. 验证结果

本地静态验证（`2026-04-16`）：

1. workflow YAML 解析通过：
   - 命令：`python3 -c "import yaml; yaml.safe_load(open('.github/workflows/aimandala-deploy.yml'))"`
   - 结果：`YAML_OK`
2. 新增凭据预检字段存在：
   - `AIMANDALA_DEV_USER`
   - `AIMANDALA_PROD_USER`
3. 远端 SSH 参数存在：
   - `BatchMode=yes`
   - `IdentitiesOnly=yes`
   - `StrictHostKeyChecking=yes`

## 4. 结论与剩余风险

结论：

- 本轮将 `deploy-dev`（及 `deploy-prod`）的一类高频凭据缺失问题前移到 `Prepare SSH Key` 阶段，失败信号更早、更明确。

剩余风险：

1. 当前环境没有 GitHub Actions 线上 secrets 与 runner 上下文，无法在本地完成真实远端部署链路验证。
2. 仍需下一次在线 `deploy-dev` run 对照 `MIN-96` 观察：
   - 若 secrets 完整，应进入远端部署与 smoke；
   - 若 `AIMANDALA_DEV_USER` 缺失，应在 `Prepare SSH Key` 明确失败并给出稳定日志。
