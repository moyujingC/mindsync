# Claude Workspace Note

此目录的统一协作说明以 `AGENTS.md` 为准。

进入本工作区后，请按下面顺序读取：

1. `AGENTS.md`
2. `COMPANY.md`
3. `.paperclip.yaml`
4. `MONOREPO.md`
5. `DOCS_GOVERNANCE.md`
6. 相关角色目录下的 `agents/*/AGENTS.md`

除非任务明确要求，否则不要把本仓库当作单应用仓库处理；应先判断任务属于公司内核、共享资源还是 `projects/` 下的具体项目。

另外，本仓库在 `Claude Code` 中默认采用与 `AGENTS.md` 一致的“双轨规则”：

- 重要工作走 `Harness Engineering + SDD + TDD`
- 轻量编辑任务可直接读取并修改，不强制先补完整 `spec / task / qa`

轻量任务通常包括：文案替换、局部改写、单文件小修、链接修复、格式整理、已经明确指出目标文件的直接编辑。

提交纪律仍默认生效，但以“完成一个适合独立提交的最小闭环”为准，不要求每次极小改动都单独提交。

- 只要本次会话产生了可交付改动，就应直接在当前分支、当前 worktree 提交
- 不等待用户追加提醒
- 若未手写提交说明，可使用仓库内已配置的自动提交辅助机制
