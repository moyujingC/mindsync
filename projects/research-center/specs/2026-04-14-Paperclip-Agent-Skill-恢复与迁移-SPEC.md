# Paperclip Agent Skill 恢复与迁移 SPEC

> 状态：current
> 版本：0.1.0
> owner：Engineer / Research & Knowledge Lead
> last_updated：2026-04-14
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/research-center/specs/2026-04-14-Paperclip-Agent-Skill-恢复与迁移-SPEC.md
> 项目：研究中心
> 阶段：spec

## 1. 目标

为 `墨予镜` 补齐一条可重复执行的 Paperclip agent skill 恢复链路，用于处理：

- 本地公司导出后再导入服务器公司
- runtime agent 仍在，但 `desiredSkills` 丢失
- company skill key 在导入后发生变化

## 2. 非目标

- 不改写 Paperclip 底层数据库结构
- 不要求所有公司 skill 都进入自动恢复
- 不把运行时 `skill key` 回写为治理源

## 3. 问题定义

当前仓库已有：

- `.paperclip.yaml`
  - 管理公司、agent 和项目的基础映射
- `shared/tools/sync-agents.sh`
  - 只同步已有 agent 的 instructions
- `shared/tools/sync-paperclip-runtime-agents.sh`
  - 只补建缺失 runtime agent

上述链路不会恢复 `agent -> desiredSkills` 关系，因此公司导入后会出现：

- company skill 仍然存在
- agent 记录仍然存在
- agent 面板上的 skill 挂载丢失

## 4. 设计要求

### 4.1 绑定治理源

新增仓库内 skill 绑定清单，最小字段包括：

- `agent_name`
- `skill_alias`
- `source_type`
- `source_locator`
- `env_patch_required`

其中：

- `source_type + source_locator` 是主匹配键
- `skill_alias` 仅作为回退或人工诊断辅助
- 不把运行时 `skill key` 作为权威数据

### 4.2 恢复顺序

恢复脚本默认执行以下顺序：

1. 拉取 runtime agents
2. 拉取 company skills
3. 用 `source_type + source_locator` 解析当前 company skill key
4. 若 company skill 缺失且来源仍可导入，则尝试导入
5. 读取 agent 当前 `desiredSkills`
6. 仅替换托管 skill，保留非托管 skill
7. 调用 `/api/agents/:id/skills/sync`

### 4.3 多条 Get笔记 skill 兼容

必须支持两条独立 `Get笔记` company skill 同时存在。

默认判断规则：

1. 优先按 `source_type + source_locator` 精确匹配
2. 精确匹配失败时，再尝试 `skill_alias`
3. 若同一规则命中多条 company skill，直接报冲突并停止自动挂载

### 4.4 幂等约束

`sync` 必须满足：

- 重复执行不会重复导入同一 skill
- 不会误删 agent 上的非托管 skill
- 托管 skill 漂移时可被纠正回绑定清单定义

## 5. 当前首批纳入范围

首批纳入自动恢复的 skill 绑定为：

- `Research & Knowledge Lead`
- `Content Lead`
- `Engineer`

每个目标 agent 当前都托管两条 `Get笔记` skill 来源：

- `${HOME}/.codex/skills/getnote`
- `${HOME}/.claude/skills/getnote`

## 6. 验收标准

- 仓库内存在正式的 skill 绑定治理清单
- 存在通用 `status` / `sync` 运维脚本
- `status` 能区分：
  - runtime agent 缺失
  - company skill 缺失
  - company skill 来源冲突
  - agent 缺失托管 skill
  - agent 挂了错误的托管 skill
- `sync` 能在保留非托管 skill 的前提下恢复托管 skill
- bearer token 模式可用于远端服务器
