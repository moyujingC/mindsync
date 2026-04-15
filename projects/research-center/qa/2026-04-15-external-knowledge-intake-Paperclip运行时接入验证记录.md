# external-knowledge-intake Paperclip 运行时接入验证记录

> 状态：current
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-15
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/research-center/qa/2026-04-15-external-knowledge-intake-Paperclip运行时接入验证记录.md
> 项目：研究中心
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/research-center/tasks/2026-04-15-external-knowledge-intake-Paperclip运行时接入实施任务.md

## 1. 验证范围

- `external-knowledge-intake` 是否作为 repo-local skill 被 company skills 识别
- `Research & Knowledge Lead`、`Content Lead`、`Engineer` 是否同时挂有 `external-knowledge-intake` 与 `getnote`
- `sync-mindsync-skills.sh` 是否仍保持双轨并存语义
- research-center 链或 `getnote` 链单独执行时，是否不会把另一层 skill 冲掉

## 2. 验证口径

- `scan-projects` 后检查 company skills 列表
- `sync-paperclip-research-center-skills.sh status`
- `getnote-setup.sh status`
- `sync-mindsync-skills.sh status`
- 重复执行 `sync-mindsync-skills.sh sync` 两次观察结果是否稳定

## 3. 结论模板

验证完成后至少补齐：

- company skills 是否出现 `external-knowledge-intake`
- 三个目标 agent 的并存挂载结果
- 是否存在因 server workspace 未更新导致的阻塞
