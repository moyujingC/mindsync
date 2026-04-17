# MIN-86 knowledge-quality Python Runtime 修复交付记录

> 状态：working
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-16-MIN-86-knowledge-quality-python-runtime-修复交付记录.md
> 项目：aimandala
> 阶段：delivery
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-16-MIN-86-knowledge-quality-python-runtime-修复验证记录.md
> reviewers：Engineer, Test / QA

## 1. 本轮交付内容

面向 `MIN-86` 的 `knowledge-quality` 失败项，本轮完成：

1. 修复 `.github/workflows/aimandala-ci.yml` 中 Python 运行时探测逻辑，避免单点依赖 `setup-python` 输出路径。
2. 统一后续依赖安装步骤的 Python 来源，避免“探测用一个解释器、安装用另一个解释器”导致的环境漂移。
3. 保留失败可诊断性：当 runner 缺少可用 Python 时，明确报错并停止。

## 2. 修复边界

本轮只覆盖 CI 运行时稳定性，不涉及：

1. 业务逻辑变更
2. 知识评估脚本语义变更
3. deploy / smoke 流程变更

## 3. 交付结果

交付文件：

- `/Users/xinran/Downloads/dev/mindsync/.github/workflows/aimandala-ci.yml`
- `/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-16-MIN-86-knowledge-quality-python-runtime-修复验证记录.md`
- `/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-16-MIN-86-knowledge-quality-python-runtime-修复交付记录.md`

## 4. 给 Test / QA 的验证输入

请优先验证下一次 `ci` run：

1. `backend-quality` 的 `Verify Python Runtime` 是否稳定通过。
2. `knowledge-quality` 的 `Verify Python Runtime` 是否稳定通过。
3. 若失败，失败日志是否已能明确区分为：
   - `setup-python` 输出不可用但 PATH 有可用 Python（应通过）
   - runner 完全缺 Python（应明确报错）

## 5. 残留风险

1. 当前环境未配置 `GH_TOKEN`，本地无法直接抓取 `run 24471801293` 失败日志作为附录证据。
2. 在线最终验收仍依赖下一次 GitHub Actions 实跑结果。
