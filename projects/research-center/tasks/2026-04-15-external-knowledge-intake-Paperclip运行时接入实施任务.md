# external-knowledge-intake Paperclip 运行时接入实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-15
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/research-center/tasks/2026-04-15-external-knowledge-intake-Paperclip运行时接入实施任务.md
> 项目：研究中心
> 阶段：task
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/research-center/specs/2026-04-15-external-knowledge-intake-Paperclip运行时接入-SPEC.md

## 1. 目标

让 Paperclip 运行时也直接识别并挂载 `external-knowledge-intake`，同时保留现有 `getnote` 恢复链和 agent env 注入方式。

## 2. 实施项

1. 运行时绑定清单扩展
   - 在 `company/paperclip-research-center-skill-bindings.yaml` 中为：
     - `Research & Knowledge Lead`
     - `Content Lead`
     - `Engineer`
   - 新增 `external-knowledge-intake` 的 `local_path` 绑定

2. 同步链路验证
   - 使用 `scan-projects` 刷新研究中心 repo-local skills
   - 使用 `sync-paperclip-research-center-skills.sh sync` 挂载 research-center skills
   - 使用 `sync-mindsync-skills.sh sync` 验证统一入口下的并存语义

3. 运行时文档更新
   - 明确 `external-knowledge-intake` 是业务层 skill
   - 明确 `getnote` 是底层工具层 skill
   - 明确 agent 在运行时会同时看到两者

4. QA 与交付
   - 记录并存挂载验证结果
   - 更新统一同步入口交付说明与 `Get笔记` 运维说明

## 3. 完成标准

- `external-knowledge-intake` 被 Paperclip company skills 识别为 repo-local skill
- `Research & Knowledge Lead`、`Content Lead`、`Engineer` 同时挂有：
  - `external-knowledge-intake`
  - 现有 `getnote`
- `sync-mindsync-skills.sh status` 能体现两层 skill 并存
