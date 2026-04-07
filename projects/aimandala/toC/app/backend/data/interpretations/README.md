# Interpretations Runtime Data

这里是 `aimandala` 后端运行时生成的解读记录目录。

它的用途是：

- 本地联调时保存当前 `V2` 主链路生成的记录
- 支撑当前 `status / report / history` 的最小运行闭环

它不是：

- 正式样本目录
- 可长期引用的研究资产目录
- 应该提交到仓库的验收结果目录

如果需要保留可复查样本，应转移到：

- `/Users/xinran/Downloads/dev/mindsync/projects/aimandala/fixtures/`
- `/Users/xinran/Downloads/dev/mindsync/projects/aimandala/toC/data/`

默认要求：

- 运行时生成的 `*.json` 记录不进入 Git
- 需要做 QA 复盘时，记录样本结论到 `docs/qa/`，不要直接把运行时文件当 artifact
