# L00 环境自检记录（2026-09-16）

> 课程要求：记录真实版本与输出，不抄示例数字。本机为 macOS（zsh）。
> 参考仓库：`/Users/xinran/Downloads/dev/mindsync/projects/research-center/courses/2026-08-17-Codex AI 工程交付行动营/CodexFDE`

## 检查点 A：工具能用

| 工具 | 实际版本 | 说明 |
|---|---|---|
| Python | 3.11.12（/opt/homebrew/bin/python3.11） | 课程基线 3.11.x ✓ |
| Git | 2.39.3（Apple Git-145） | 低于课程建议 2.40+，记录偏差；clone/status/diff 等本课操作功能满足，暂不重装 |
| VS Code | 3.7.27（code 命令在 PATH） | ✓ |
| Codex CLI | codex-cli 0.147.0-alpha.1.2 | ✓；桌面入口已在使用 |

## 检查点 B：项目能找到

- `.venv` 创建于参考仓库根目录（python3.11 -m venv .venv），`pip install -e .` 成功（flwerp-fde-camp 0.1.0，零第三方运行时依赖）。
- 自检命令实际输出：

```
$ .venv/bin/python -X utf8 -c "import sys, sqlite3; print(sys.version); print(sys.executable); print('sqlite', sqlite3.sqlite_version)"
3.11.12 (main, Apr  8 2025, 14:15:29) [Clang 16.0.0 (clang-1600.0.26.6)]
/Users/xinran/…/CodexFDE/.venv/bin/python
sqlite 3.49.2
exit=0

$ .venv/bin/python -X utf8 -c "import workbench, eval; print('imports-ok')"
imports-ok
exit=0

$ .venv/bin/python -X utf8 -m workbench.cli --help
usage: cli.py [-h] {workbench-init,workbench-project-add,workbench-task-create,workbench-evidence-add,workbench-status,…}
（帮助正常加载，不启动产品）
exit=0
```

- `git status --short` 与 `git diff --stat` 均无输出（工作区干净）。

## 检查点 C：四个小练习

1. **我在哪里**：`pwd` 确认在仓库根目录；`pyproject.toml` 的 `requires-python = ">=3.10"`。区别：仓库声明最低 3.10，课堂统一基线 3.11.x。
2. **先预测再运行**：预测 12，实际 `print(20 - 8)` 输出 12（exit=0）。换成 5 时输出 15。这条命令只验证了一段算式，不能证明 FlowERP 库存功能完成。
3. **失败不一定是电脑坏了**：`assert available == 12`（available=13）→ `AssertionError`，exit=1；修正计算 `available = 20 - 8` 保持 assert 不变 → 无输出，exit=0。认识"先失败、修正后通过"。
4. **核验 AI 回答**：亲自打开 `pyproject.toml`（支持"最低 3.10"结论）与 `docs/课程大纲-Codex-FDE行动营-个人研发自动化工作台.md`（支持"课程大纲位置"结论），均一致。
   - 变化题：Codex 说"文件已修改"而 `git diff` 无输出，不能断定没改——未跟踪新文件（`git status` 显示 `??`）不出现在普通 diff 中，已暂存修改也要区别检查。
   - 可选题：30 − 9 = 21；找不到 .venv Python 先查路径与环境（环境问题），AssertionError 要同时核对计算与检查要求（逻辑问题），不能为过测改要求。

## 练习 8：只读仓库检查（5 问，已附证据路径，待人工抽验）

1. 仓库根目录：`…/2026-08-17-Codex AI 工程交付行动营/CodexFDE`
2. Python 最低版本：`pyproject.toml` 的 `requires-python = ">=3.10"`
3. 课程大纲：`docs/课程大纲-Codex-FDE行动营-个人研发自动化工作台.md`（课表另在 `docs/课表｜Codex AI 工程交付行动营.md`）
4. L01 为什么不能假设工作台已存在：L01 在隔离练习区从零构造五个命令，参考仓库实现仅作对照（`docs/courses/L01/实践操作手册.md` §1.2 以 `invalid choice: 'workbench-status'` 为预期起点）
5. 仅凭当前证据无法确认：讲师参考实现当前是否全量测试通过；FlowERP 独立仓库环境是否就绪（本机未安装）；课程 Git 标签声称的基线是否重新验证过

## 待解问题

- Git 2.39.3 低于课程建议 2.40+，是否需要升级（暂判断不影响本课操作）。
