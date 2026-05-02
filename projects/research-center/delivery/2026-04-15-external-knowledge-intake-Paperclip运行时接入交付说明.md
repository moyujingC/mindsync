# external-knowledge-intake Paperclip 运行时接入交付说明

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-15
> source_of_truth：projects/research-center/delivery/2026-04-15-external-knowledge-intake-Paperclip运行时接入交付说明.md
> 项目：研究中心
> 阶段：delivery
> depends_on：projects/research-center/qa/2026-04-15-external-knowledge-intake-Paperclip运行时接入验证记录.md

## 1. 已交付内容

- `external-knowledge-intake` 已接入 research-center repo-local 运行时绑定清单
- `Research & Knowledge Lead`、`Content Lead`、`Engineer` 已被纳入该 skill 的目标角色
- 统一同步入口继续保持：
  - 研究中心 repo-local skills
  - `getnote` 专项恢复

## 2. 当前运行时语义

Paperclip 运行时中：

- `external-knowledge-intake`
  - 代表正式业务层 skill
- `getnote`
  - 代表底层工具层 skill

二者当前并存，不做替换。

## 3. 运维入口

- 统一入口：
  - `shared/tools/sync-mindsync-skills.sh`
- research-center repo-local skill 专项入口：
  - `shared/tools/sync-paperclip-research-center-skills.sh`
- `getnote` 专项入口：
  - `shared/tools/getnote-setup.sh`

## 4. 当前残留风险

- 若 server workspace 尚未同步到包含 `external-knowledge-intake` 的仓库版本，`scan-projects` 不会识别该 skill
- 若后续希望 UI 中只保留业务层 skill，需要单独开第三阶段
