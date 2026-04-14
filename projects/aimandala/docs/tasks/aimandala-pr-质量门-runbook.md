# Aimandala PR 质量门 Runbook

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-14
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/aimandala-pr-质量门-runbook.md
> 项目：aimandala
> 阶段：delivery
> reviewers：Engineer, Test / QA

## 1. Required Checks

- `frontend-quality`
- `backend-quality`
- `knowledge-quality`
- `workflow-quality`
- `ci-summary`

## 2. 本地复现命令

### 2.0 workflow-quality

```bash
actionlint .github/workflows/aimandala-*.yml
```

说明：

- runner 需要预装 `actionlint`
- 如果 runner 未安装 `actionlint`，该检查会直接失败并建单

### 2.1 frontend-quality

```bash
cd projects/aimandala/toC/app/frontend
npm run lint
npm run format:check
npm run test
npm run test:coverage
npm run typecheck
npm run build:mobile-web
```

### 2.2 backend-quality

```bash
ruff check --config projects/aimandala/toC/app/backend/ruff.toml projects/aimandala/toC/app/backend/app projects/aimandala/toC/app/backend/tests projects/aimandala/toC/app/backend/scripts
python3 -m pytest -q projects/aimandala/toC/app/backend/tests/unit
```

### 2.3 knowledge-quality

```bash
PYTHONPATH=projects/aimandala/toC/app/backend python3 projects/aimandala/toC/app/backend/scripts/validate_knowledge_workbench.py
PYTHONPATH=projects/aimandala/toC/app/backend python3 projects/aimandala/toC/app/backend/scripts/run_knowledge_evals.py --build-selector current
```

## 3. 失败分类

- `lint-failure`
  - 前端 lint、后端 ruff
  - `actionlint`
- `format-failure`
  - 前端 Prettier check
- `coverage-failure`
  - 前端 Vitest coverage
- `ci-test-failure`
  - Vitest、pytest、knowledge validation/evals
- `build-failure`
  - install、typecheck、build、运行时安装失败

## 4. Auto-repair 边界

### 4.1 允许自动修复

- 前端 lint
- 前端 format
- 后端 ruff

### 4.2 不允许自动修复

- coverage 失败
- knowledge eval 失败
- deploy / smoke 失败
- 需要改 secrets、runner、主机环境的问题
