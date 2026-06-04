---
name: prompt-pack-rebuild
description: 手动重新打包 Aimandala 某个议题的 prompt pack；当疗愈体系知识库、议题目录、报告模板或 prompt cache 预算需要同步到 generated_prompt_packs 时使用。
owner: Engineer / Knowledge Base Owner
status: draft
version: 0.1.0
skill_type: project
applies_to:
  - engineer
  - ceo
  - knowledge-base-owner
when_to_use: >
  当用户要求“重新打包某个议题 prompt pack”“同步知识库到 prompt pack”“检查 prompt cache 是否够用”，
  或需要手动刷新 Aimandala 生成式报告用长上下文知识包时使用。
inputs:
  - topic：foundation / wealth-relationship / intimate-relationship / father-relationship / mother-relationship / parent-child-relationship / interpersonal-relationship / career-development / body-health / all
  - 知识库源目录与报告模板
  - 输出目录 generated_prompt_packs
outputs:
  - 更新后的 generated prompt pack
  - manifest.json
  - Prompt Pack Rebuild Report
handoff_to:
  - engineer
  - test_qa
---

# Prompt Pack Rebuild

## 目标

把 Aimandala 疗愈体系知识库中的指定议题材料重新打包成运行时使用的 generated prompt pack。

这个 skill 当前只有手动入口：

- 人工触发：开发者手动执行脚本，生成报告并检查 diff。
- Codex：同步到 `~/.codex/skills/prompt-pack-rebuild` 后，在新会话或重载后用 `/prompt-pack-rebuild`。
- Claude：项目命令文件为 `.claude/commands/prompt-pack-rebuild.md`。
- 部署链路：当前不接入，部署时仍保持只 copy backend 的既有方式。

## 当前支持的 topic

- `foundation`：曼陀罗基础视觉层长上下文知识包。
- `wealth-relationship`：财富关系议题报告生成长上下文知识包。
- `intimate-relationship`：亲密关系议题报告生成长上下文知识包。
- `father-relationship`：父亲关系议题报告生成长上下文知识包。
- `mother-relationship`：母亲关系议题报告生成长上下文知识包。
- `parent-child-relationship`：亲子关系议题报告生成长上下文知识包。
- `interpersonal-relationship`：人际关系议题报告生成长上下文知识包。
- `career-development`：事业发展议题报告生成长上下文知识包。
- `body-health`：身体健康议题报告生成长上下文知识包。
- `all`：全量重包选项，依次重包 `foundation` 和全部 8 个主议题。

## 议题 pack 配置化打包规则

8 个主议题共用同一个配置化 builder：

- 配置表：`projects/aimandala/toC/app/backend/app/core/mandala_interpretation_agent/topic_prompt_pack_registry.py`
- 通用 builder：`projects/aimandala/toC/app/backend/app/core/mandala_interpretation_agent/topic_prompt_pack_builder.py`

每个议题会打包：

- `projects/aimandala/docs/疗愈体系知识库/20-疗愈体系/10-议题层/30-主议题报告包/<议题目录>/`
  - 目录下全部 Markdown 文件，按路径排序。
- `projects/aimandala/docs/疗愈体系知识库/30-应用适配/10-aimandala/`
  - `01-解读与个案沟通流程.md`
  - `02-解读报告组织规范.md`
  - `03-解读报告生成最小规则.md`
  - `04-Lite-Pro报告分流与交付口径.md`
  - `05-报告任务定义.md`
  - 当前议题对应的 `06*议题解读报告模板.md`
  - `07-报告语言风格指南.md`

当前议题配置：

| topic | pack_id | 议题目录 | 报告模板 |
| --- | --- | --- | --- |
| `wealth-relationship` | `wealth-reasoning-v1.0.0` | `10-财富关系` | `06-财富关系议题解读报告模板.md` |
| `intimate-relationship` | `intimate-relationship-reasoning-v1.0.0` | `20-亲密关系` | `06b-亲密关系议题解读报告模板.md` |
| `father-relationship` | `father-relationship-reasoning-v1.0.0` | `30-父亲关系` | `06c-父亲关系议题解读报告模板.md` |
| `mother-relationship` | `mother-relationship-reasoning-v1.0.0` | `40-母亲关系` | `06d-母亲关系议题解读报告模板.md` |
| `parent-child-relationship` | `parent-child-relationship-reasoning-v1.0.0` | `50-亲子关系` | `06e-亲子关系议题解读报告模板.md` |
| `interpersonal-relationship` | `interpersonal-relationship-reasoning-v1.0.0` | `60-人际关系` | `06f-人际关系议题解读报告模板.md` |
| `career-development` | `career-development-reasoning-v1.0.0` | `70-事业发展` | `06g-事业发展议题解读报告模板.md` |
| `body-health` | `body-health-reasoning-v1.0.0` | `80-身体健康` | `06h-身体健康议题解读报告模板.md` |

维护入口：

- `projects/aimandala/toC/app/backend/app/core/mandala_interpretation_agent/topic_prompt_pack_registry.py`
- `projects/aimandala/toC/app/backend/app/core/mandala_interpretation_agent/topic_prompt_pack_builder.py`
- `projects/aimandala/toC/app/backend/scripts/build_mandala_prompt_packs.py`
- 兼容包装：
  - `projects/aimandala/toC/app/backend/app/core/mandala_interpretation_agent/wealth_prompt_pack_builder.py`
  - `projects/aimandala/toC/app/backend/app/core/mandala_interpretation_agent/intimate_relationship_prompt_pack_builder.py`

## 结构更新机制

当知识库目录、文件命名、报告模板或议题名变化时，同步更新：

1. `topic_prompt_pack_registry.py`
   - topic 名称
   - theme alias
   - pack id
   - 议题目录
   - 对应报告模板
2. `build_mandala_prompt_packs.py`
   - topic 参数是否需要新增别名
   - 报告输出字段，如果新增预算或校验项
3. 本 skill 的“明确打包清单”
   - 源目录
   - 应用适配文件
   - 输出 pack id 与生成路径
4. 相关测试
   - `tests/unit/test_mandala_e2e_agent.py`

结构变化后必须重新运行打包脚本，并检查 generated pack diff 是否只来自预期源文档变化。

## 手动执行

在仓库根目录运行：

也可以在支持 slash command 的客户端里输入：

```text
/prompt-pack-rebuild
```

Codex 需要先确保本地链接存在：

```bash
shared/tools/sync-codex-research-center-skills.sh install
```

如果 `/` 菜单没有刷新，重开 Codex 会话或重载应用。默认重包 `wealth-relationship`。如果需要别的 topic，在命令后补充说明，例如“重包 foundation”“重包亲密关系”“重包父亲关系”或“重包 all”。

```bash
cd projects/aimandala/toC/app/backend
python3 scripts/build_mandala_prompt_packs.py \
  --topic wealth-relationship \
  --report-path /tmp/wealth-relationship-prompt-pack-report.md
```

需要重包其他单个议题时，把 `--topic` 换成对应 topic，例如：

```bash
cd projects/aimandala/toC/app/backend
python3 scripts/build_mandala_prompt_packs.py \
  --topic father-relationship \
  --report-path /tmp/father-relationship-prompt-pack-report.md
```

需要全量重包时运行：

```bash
cd projects/aimandala/toC/app/backend
python3 scripts/build_mandala_prompt_packs.py \
  --topic all \
  --report-path /tmp/aimandala-prompt-pack-report.md
```

## 结项报告要求

脚本运行结束必须产出 `Prompt Pack Rebuild Report`，至少包含：

- 这次打包的 topic、输出目录、pack 数量。
- 每个 pack 的 `pack_id`、源文件数量、字符数、hash。
- 每个 pack 的 source file 列表。
- Prompt Cache 信息：
  - estimator
  - estimated_tokens
  - context_limit_tokens
  - remaining_tokens
  - usage_percent
  - warning_level

判断口径：

- `warning_level: none`：Prompt Cache 预算充足。
- `warning_level: soft`：可以继续部署，但需要评估是否拆包或裁剪。
- `warning_level: hard`：不要直接上线，应先拆包、缩减源文件或调整模型上下文策略。

## 验证

每次修改 skill、构建脚本或 pack builder 后，至少运行：

```bash
cd projects/aimandala/toC/app/backend
python3 scripts/build_mandala_prompt_packs.py \
  --topic all \
  --report-path /tmp/aimandala-prompt-pack-report.md
python3 -m pytest tests/unit/test_mandala_e2e_agent.py
```

如果未来把脚本接入 deploy，再额外检查相关 shell / workflow 语法。

## 输出给用户

最小交付说明包含：

- 已重包 topic：
- 更新的 pack id：
- 源文件数量：
- pack hash：
- Prompt Cache warning level：
- 报告路径：
- 验证命令与结果：
