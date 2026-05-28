# Skills

这里放 `研究中心` 主导沉淀的可复用 skill。

当前优先放：

- 可服务多个 Agent 的通用方法 skill
- 从研究到 handoff 的方法型 skill
- 能反复复用的 spec / checklist / template skill

每个 skill 使用目录格式：

```text
<skill-slug>/
  SKILL.md
  templates/
```

当前首批样例：

- `reference-intake-routing`
- `media-link-intake`
- `media-transcribe`
- `research-brief`
- `research-synthesis`
- `source-to-review`
- `handoff-packaging`
- `insight-extraction`
- `expression-extraction`
- `product-framing-spec`
- `knowledge-ingest`
- `fact-check-gate`
- `qa-gate-review`
- `doc-governance`
- `task-routing`
- `artifact-readiness-check`
- `business-diagnosis`
- `architecture-boundary-plan`
- `insight-handoff`
- `content-grounded-transform`
- `review-feedback-to-memory`
- `knowledge-relink-maintenance`
- `ui-ux-console-design`
- `cicd-check`
- `mvp-deploy-trigger`
- `prompt-pack-rebuild`

## 配套文档

- 技能清单与角色映射：
  - `projects/research-center/skills/技能清单与角色映射.md`
- 技能编写与维护规范：
  - `projects/research-center/skills/技能编写与维护规范.md`
- 技能评审清单：
  - `projects/research-center/skills/技能评审清单.md`
- 技能接入准备方案：
  - `projects/research-center/skills/技能接入准备方案.md`
- 技能统一索引：
  - `projects/research-center/skills/技能统一索引.md`

## 当前说明

当前这一层先完成：

- skill 目录骨架
- `SKILL.md` 内容骨架
- 基本模板
- 统一规范

当前已经完成：

- 7 个核心角色的基础 skill 引用接入
- 多条真实试跑链路验证
- 文档治理执行层 skill 已在仓库内落盘

当前还没有完成：

- skill 的运行时自动发现
- 每个 skill 的完整示例调用覆盖
- 统一接入后的执行结果校验

已额外提供：

- Claude Code 项目级 slash 命令示例：`/.claude/commands/source-to-review.md`
- Prompt pack 手动重包 slash 命令：`/.claude/commands/prompt-pack-rebuild.md`
- 本机 Claude 运行时同步脚本已包含 `source-to-review`

## 当前运行时策略

当前 skill 采用双层结构：

- 治理源：
  - `mindsync` 仓库内的 `projects/research-center/skills/`
- 运行时镜像：
  - 本机 `~/.claude/skills/`

这意味着：

- 仓库里的 skill 是 source of truth
- 如果希望 Claude 本地运行时直接识别这些 skill，需要额外做本机挂载
- 仅把 skill 写进角色 `AGENTS.md`，不会自动让 Paperclip 面板显示这些 skill

当前建议使用：

- `shared/tools/sync-local-skills.sh`

把仓库 skill 轻量同步到 `~/.claude/skills/`。

这套策略服务当前单人、单机开发阶段；它不等同于 Paperclip 已经提供了 company-managed skills runtime。
