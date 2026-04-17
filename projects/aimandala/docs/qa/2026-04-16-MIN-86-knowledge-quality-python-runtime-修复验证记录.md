# MIN-86 knowledge-quality Python Runtime 修复验证记录

> 状态：working
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-16-MIN-86-knowledge-quality-python-runtime-修复验证记录.md
> 项目：aimandala
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/architecture/CI-CD与自动修复架构.md
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-14-ci-cd-运行稳定化治理整改计划.md
> reviewers：Engineer, Test / QA

## 1. 背景

`MIN-86` 在 `2026-04-15T18:55:23Z` 的评论中确认：

- run: `https://github.com/moyujingC/mindsync/actions/runs/24471801293`
- 汇总：`knowledge-quality=failure`
- 失败 step：`Verify Python Runtime`

本轮目标是最小修复该运行时不稳定点，避免 self-hosted runner 在 `actions/setup-python` 输出异常或路径不稳定时直接失败。

## 2. 本轮变更

变更文件：

- `/Users/xinran/Downloads/dev/mindsync/.github/workflows/aimandala-ci.yml`

关键修复：

1. `backend-quality` 与 `knowledge-quality` 的 `Verify Python Runtime` 统一改为三段式 Python 定位：
   - 优先 `setup-python` 的 `python-path`
   - 回退 `command -v python`
   - 再回退 `command -v python3`
2. 若三段都不可用，显式报错并退出，保留清晰失败信号。
3. 将最终可执行路径写入 step output：`python_bin`。
4. `Install Backend Dependencies` 与 `Install Knowledge Dependencies` 改为消费 `steps.*_python.outputs.python_bin`，保证后续安装使用同一解释器。

## 3. 验证结果

本地验证（`2026-04-16`）：

1. workflow YAML 解析通过：
   - 命令：`python3 -c "import yaml; yaml.safe_load(open('.github/workflows/aimandala-ci.yml'))"`
   - 结果：`YAML_OK`
2. 关键字段存在：
   - `backend_python.outputs.python_bin`
   - `knowledge_python.outputs.python_bin`
3. 由于当前环境未配置可用 `GH_TOKEN`，无法直接拉取 `run 24471801293` 的 job 日志做二次对账；在线最终验证需由下一次 CI run 补齐。

## 4. 结论与剩余风险

结论：

- 本轮已把 `Verify Python Runtime` 从“单点路径依赖”收敛为“可回退解析 + 同路径传递”，满足最小稳健性目标。

剩余风险：

1. 若 self-hosted runner 本机不存在任何 Python 可执行文件，job 仍会失败（符合预期，且错误信息更清晰）。
2. 仍需下一次在线 `ci` run 验证 `knowledge-quality` 绿色通过后，才能将本记录从 `working` 升级为 `current` 或 `historical-reference`。
