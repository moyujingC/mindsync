# Aimandala PR 质量门 Runbook

> 状态：current
> 版本：0.2.0
> owner：Engineer
> last_updated：2026-05-11
> source_of_truth：projects/aimandala/docs/tasks/aimandala-pr-质量门-runbook.md
> 项目：aimandala
> 阶段：delivery
> reviewers：Engineer, Test / QA

## 1. 目标

这份 runbook 用于判断 `Aimandala` 相关改动在进入 PR、合并或部署前，应该通过哪些质量门，以及失败后应该走哪条处理链路。

它不是普通任务计划。它是一个 control-backed runbook-like delivery manual（带控制层映射的交付手册）：

1. runbook 负责说明检查顺序、失败分类和升级路径
2. GitHub Actions 负责执行一部分硬 gate
3. Paperclip 只在增强链路里负责失败建单、父子任务和评论回写

## 2. 适用范围

本 runbook 适用于：

1. `projects/aimandala/toC/**`
2. `projects/aimandala/fixtures/**`
3. `shared/tools/ci/**` 中影响 Aimandala CI/CD 的脚本
4. `.github/workflows/mvp-ci.yml`
5. `.github/workflows/aimandala-*.yml`

本 runbook 不替代：

1. 产品规格
2. 架构方案
3. 具体功能 QA baseline
4. 线上 deploy / smoke 排障 runbook

## 3. 进入条件

满足任一条件时，应进入本 runbook：

1. 准备提交或合并 Aimandala 相关改动
2. `mvp-ci` 失败
3. `aimandala-ci` 增强链路失败
4. Paperclip 中出现 Aimandala CI 子任务
5. 需要判断某个失败属于代码修复、知识库修复、workflow 修复，还是 automation / infra 排障

## 4. 当前主链与增强链路

### 4.1 MVP 可用链路

当前日常判断 `Aimandala` CI/CD 是否可用时，优先看：

- `.github/workflows/mvp-ci.yml`

`mvp-ci` 是当前最小可信主链。它使用 GitHub 托管 runner：`ubuntu-latest`。

它当前覆盖：

1. 前端 lint
2. 前端 typecheck
3. 前端 test
4. 前端 `build:mobile-web`
5. 后端 ruff
6. 后端 unit pytest
7. 手动 deploy 时的 deploy + smoke

`mvp-ci` 不做：

1. Paperclip 失败建单
2. Paperclip 评论回写
3. self-hosted runner 调度
4. nightly smoke
5. auto-repair

因此，如果目标只是确认 MVP 是否能稳定构建、测试和部署，先看 `mvp-ci`。

### 4.2 增强设计链路

增强链路入口包括：

1. `.github/workflows/aimandala-ci.yml`
2. `.github/workflows/aimandala-deploy.yml`
3. `.github/workflows/aimandala-nightly-smoke.yml`
4. `.github/workflows/aimandala-auto-repair.yml`

其中 `aimandala-ci.yml` 包含：

1. `workflow-quality`
2. `frontend-quality`
3. `backend-quality`
4. `knowledge-quality`
5. `ci-summary`

增强链路使用 self-hosted runner，并负责 Paperclip 失败建单、父子任务、job 级失败回写和后续 automation 协作。

增强链路不是当前 MVP 日常默认复杂度。收到 Paperclip CI 子任务时，应先判断它来自增强链路，不要把它直接等同于 `mvp-ci` 主链失败。

## 5. 质量门分层

### 5.1 当前硬 gate

`mvp-ci` 当前硬 gate 为：

1. 前端：
   - `npm --prefix projects/aimandala/toC/app/frontend run lint`
   - `npm --prefix projects/aimandala/toC/app/frontend run typecheck`
   - `npm --prefix projects/aimandala/toC/app/frontend test`
   - `npm --prefix projects/aimandala/toC/app/frontend run build:mobile-web`
2. 后端：
   - `ruff check`
   - `pytest -q projects/aimandala/toC/app/backend/tests/unit`

### 5.2 增强 gate

`aimandala-ci` 增强 gate 为：

1. `workflow-quality`
2. `frontend-quality`
3. `backend-quality`
4. `knowledge-quality`
5. `ci-summary`

`knowledge-quality` 当前属于增强链路。除非改动触及知识库、报告链路、知识 runtime 或相关验证脚本，否则不要把它误当成 MVP 最小日常阻断项。

## 6. 本地复现命令

### 6.1 MVP 主链复现

前端：

```bash
npm --prefix projects/aimandala/toC/app/frontend run lint
npm --prefix projects/aimandala/toC/app/frontend run typecheck
npm --prefix projects/aimandala/toC/app/frontend test
npm --prefix projects/aimandala/toC/app/frontend run build:mobile-web
```

后端：

```bash
PYTHONPATH=projects/aimandala/toC/app/backend ruff check \
  --config projects/aimandala/toC/app/backend/ruff.toml \
  projects/aimandala/toC/app/backend/app \
  projects/aimandala/toC/app/backend/tests \
  projects/aimandala/toC/app/backend/scripts

PYTHONPATH=projects/aimandala/toC/app/backend \
  python3 -m pytest -q projects/aimandala/toC/app/backend/tests/unit
```

### 6.2 增强链路复现

workflow-quality：

```bash
actionlint -config-file .github/actionlint.yaml .github/workflows/aimandala-*.yml
```

frontend-quality：

```bash
npm --prefix projects/aimandala/toC/app/frontend ci
npm --prefix projects/aimandala/toC/app/frontend run lint
npm --prefix projects/aimandala/toC/app/frontend run format:check
npm --prefix projects/aimandala/toC/app/frontend test
npm --prefix projects/aimandala/toC/app/frontend run test:coverage
npm --prefix projects/aimandala/toC/app/frontend run typecheck
npm --prefix projects/aimandala/toC/app/frontend run build:mobile-web
```

backend-quality：

```bash
PYTHON_BIN=python bash shared/tools/ci/ensure-python-ci-venv.sh \
  projects/aimandala/toC/app/backend/requirements.release.txt \
  pytest ruff

PYTHONPATH=projects/aimandala/toC/app/backend ruff check \
  --config projects/aimandala/toC/app/backend/ruff.toml \
  projects/aimandala/toC/app/backend/app \
  projects/aimandala/toC/app/backend/tests \
  projects/aimandala/toC/app/backend/scripts

PYTHONPATH=projects/aimandala/toC/app/backend \
  python3 -m pytest -q projects/aimandala/toC/app/backend/tests/unit
```

knowledge-quality：

```bash
PYTHONPATH=projects/aimandala/toC/app/backend \
  python3 projects/aimandala/toC/app/backend/scripts/validate_knowledge_workbench.py

PYTHONPATH=projects/aimandala/toC/app/backend \
  python3 projects/aimandala/toC/app/backend/scripts/run_knowledge_evals.py --build-selector current
```

## 7. 失败分类

当前失败分类按下面口径处理：

1. `lint-failure`
   - 前端 lint
   - 后端 ruff
   - actionlint
2. `format-failure`
   - 前端 Prettier check
3. `coverage-failure`
   - 前端 Vitest coverage
4. `ci-test-failure`
   - Vitest
   - pytest
   - knowledge validation / evals
5. `build-failure`
   - 依赖安装失败
   - typecheck
   - build
   - actionlint 缺失
   - Python / Node / runner 环境不可用

## 8. 失败处理路径

### 8.1 可快速修复

下面问题可由本地快速修复或受控自动修复处理：

1. 前端 lint
2. 前端 format
3. 后端 ruff

修复后必须重新跑对应本地复现命令。

### 8.2 必须人工判断

下面问题不得自动修复：

1. coverage 失败
2. knowledge eval 失败
3. 报告链路语义变化
4. 需要调整测试期望的失败

这类失败必须先判断是实现退化、测试过期，还是规格变化。

### 8.3 进入 automation / infra 排障

下面问题不按普通业务代码修复处理：

1. deploy 失败
2. smoke 失败
3. secrets / vars 缺失
4. self-hosted runner 离线
5. 服务器 host、SSH、systemd、Docker 或网络问题

这类问题应进入 automation / infra 排障链路。

### 8.4 workflow-quality 特别口径

如果 `workflow-quality` 因缺少 `actionlint` 失败，优先判断为 runner 环境问题，不直接改业务代码。

如果 `actionlint` 已安装但规则失败，才进入 workflow 文件修复。

## 9. Auto-repair 边界

### 9.1 允许自动修复

允许自动修复：

1. 前端 lint
2. 前端 format
3. 后端 ruff

### 9.2 不允许自动修复

不允许自动修复：

1. coverage 失败
2. knowledge eval 失败
3. deploy / smoke 失败
4. secrets、runner、host、SSH、systemd、Docker 相关问题
5. 需要改产品语义、报告内容或知识库判断的问题

## 10. 完成态

本 runbook 通过的最低完成态是：

1. 若目标是 MVP 主链：
   - `mvp-ci` 对应 run 通过
   - 本地复现命令已按变更范围执行
2. 若目标是增强链路：
   - 对应 `aimandala-ci` job 通过或 Paperclip 子任务已进入正确状态
   - 不再有未解释的 `ci-summary` 失败
3. 若涉及 deploy / smoke：
   - deploy run 与 smoke 结果均有明确记录
4. 若仍失败：
   - 已明确归类为代码、知识、workflow、automation 或 infra 问题
   - 已进入对应后续处理链路

## 11. 升级路径

按失败类型选择升级路径：

1. 代码 / 测试失败
   - Engineer 本地修复
   - 跑对应本地复现命令
   - 再看 `mvp-ci` 或对应增强 job
2. 知识库 / 报告链路失败
   - 回到对应 spec / QA basis
   - 不直接改 eval 期望绕过失败
3. workflow 文件失败
   - 先确认是否缺工具
   - 再改 `.github/workflows/aimandala-*.yml`
4. Paperclip CI 子任务
   - 先确认来自增强链路
   - 按 job 名定位 `workflow-quality / frontend-quality / backend-quality / knowledge-quality`
5. automation / infra 失败
   - 转到服务器、runner、deploy 或 smoke 相关 runbook
   - 不在普通 PR 质量门里直接收口

## 12. 控制层入口

本 runbook 当前对应的控制层入口是：

1. `.github/workflows/mvp-ci.yml`
   - 当前 MVP 最小可信主链
2. `.github/workflows/aimandala-ci.yml`
   - 增强 CI 与 Paperclip 回写链路
3. `shared/tools/ci/paperclip-ci-issue.mjs`
   - Paperclip CI 失败建单与汇总入口
4. `shared/tools/ci/ensure-python-ci-venv.sh`
   - 后端 / knowledge CI Python 环境准备入口

修改这些入口时，应同步回看本 runbook。
