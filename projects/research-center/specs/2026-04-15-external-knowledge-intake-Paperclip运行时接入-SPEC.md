# external-knowledge-intake Paperclip 运行时接入 SPEC

> 状态：current
> 版本：0.1.0
> owner：Engineer / Research & Knowledge Lead
> last_updated：2026-04-15
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/research-center/specs/2026-04-15-external-knowledge-intake-Paperclip运行时接入-SPEC.md
> 项目：研究中心
> 阶段：spec
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/research-center/specs/2026-04-15-外部知识采集统一能力-SPEC.md

## 1. 目标

在不破坏现有 `getnote` 恢复链的前提下，让 Paperclip 运行时也直接识别并挂载 `external-knowledge-intake`。

## 2. 非目标

- 不重写 `getnote` 底层 skill
- 不删除现有 `getnote` company skill 绑定
- 不将运行时切成仅保留业务层 skill

## 3. 接入策略

### 3.1 并存模型

目标 agent 在运行时同时挂载：

- `external-knowledge-intake`
- `getnote`

其中：

- `external-knowledge-intake` 通过 research-center repo-local skill 链接入
- `getnote` 继续通过现有专项恢复链接入

### 3.2 目标 agent

- `Research & Knowledge Lead`
- `Content Lead`
- `Engineer`

### 3.3 来源类型

`external-knowledge-intake` 使用：

- `source_type: local_path`
- `source_locator: /opt/automation/app/mindsync/projects/research-center/skills/external-knowledge-intake`

## 4. 同步链路

### 4.1 研究中心链

- `scan-projects`
- `sync-paperclip-research-center-skills.sh`

负责：

- 导入 repo-local `external-knowledge-intake`
- 按 research-center 绑定清单挂到目标 agent

### 4.2 Get笔记专项链

- `getnote-setup.sh`
- `company/paperclip-agent-skill-bindings.yaml`

继续负责：

- `getnote` company skill 恢复
- `desiredSkills` 修复
- `GETNOTE_*` env 注入

### 4.3 统一入口

- `sync-mindsync-skills.sh`

执行顺序保持不变：

1. 先同步 research-center repo-local skills
2. 再同步 `getnote`

## 5. 约束

- 不修改 `company/paperclip-agent-skill-bindings.yaml` 的职责边界
- 不让 research-center repo-local 链覆盖掉现有 `getnote` 绑定
- `Engineer` 本阶段只做最小接入，不扩展其他 research-center skills

## 6. 验收标准

- `scan-projects` 后 company skills 可见 `external-knowledge-intake`
- `Research & Knowledge Lead`、`Content Lead`、`Engineer` 运行时同时挂有 `external-knowledge-intake` 与 `getnote`
- 重复执行统一同步命令两次结果不变
- 单独执行 research-center 链或 `getnote` 链都不会冲掉另一层 skill
