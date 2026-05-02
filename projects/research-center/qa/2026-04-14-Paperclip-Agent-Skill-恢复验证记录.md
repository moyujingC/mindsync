# Paperclip Agent Skill 恢复验证记录

> 状态：current
> 版本：0.2.0
> owner：Test / QA
> last_updated：2026-04-15
> source_of_truth：projects/research-center/qa/2026-04-14-Paperclip-Agent-Skill-恢复验证记录.md
> 项目：研究中心
> 阶段：verification
> depends_on：projects/research-center/tasks/2026-04-14-Paperclip-Agent-Skill-恢复实施任务.md

## 1. 验证范围

- 绑定清单是否存在且字段完整
- 通用恢复脚本是否支持 `status` / `sync`
- 同步逻辑是否保留非托管 skill
- 是否支持按来源标识识别两条独立 `Get笔记` skill
- bearer token 相关入口是否已保留

## 2. 已完成验证

### 2.1 结构验证

- 结果：通过
- 证据：
  - 已新增 `company/paperclip-agent-skill-bindings.yaml`
  - 已新增 `shared/tools/sync-paperclip-agent-skills.sh`
  - 已更新 `shared/tools/getnote-setup.sh`

### 2.2 脚本语义验证

- 结果：通过
- 证据：
  - `sync-paperclip-agent-skills.sh` 同时提供 `status` / `sync`
  - 同步时先读取 agent 当前 `desiredSkills`
  - 仅移除托管 skill 集中的旧值，再追加目标值
  - 非托管 skill 不在删除范围内

### 2.3 服务器导入来源建模

- 结果：通过
- 证据：
  - 绑定清单已切换为服务器可见路径：
    - `/opt/automation/app/mindsync/shared/skills/getnote`
  - 仓库内已新增受管底层 skill 包：
    - `shared/skills/getnote/SKILL.md`
  - 脚本优先使用 `source_type + source_locator` 做解析

### 2.4 Ruby / Psych 兼容性

- 结果：通过
- 证据：
  - `sync-paperclip-agent-skills.sh` 与 `getnote-setup.sh` 已改为 `File.read + YAML.safe_load`
  - 已避免不同 Ruby / Psych 版本下 `safe_load_file` / `load_file` 行为不一致导致的崩溃
  - automation 节点已安装 `ruby`

### 2.5 远端认证入口

- 结果：通过
- 证据：
  - `sync-paperclip-agent-skills.sh` 支持 `PAPERCLIP_API_TOKEN`
  - `getnote-setup.sh` 已将 bearer token 透传给通用同步逻辑

### 2.6 在线运行态恢复

- 结果：通过
- 证据：
  - 已在 automation 节点执行：
    - `bash /opt/automation/app/mindsync/shared/tools/getnote-setup.sh sync-paperclip`
  - 已确认 company skill 成功导入为：
    - `local/a40e6d0efe/getnote-codex-local`
  - 已确认以下 agent 均完成恢复：
    - `Research & Knowledge Lead`
    - `Content Lead`
    - `Engineer`
  - 已确认恢复后保留业务层 skill：
    - `external-knowledge-intake`
  - 已确认 `status` 最终显示三位 agent 均解析到：
    - `local/a40e6d0efe/getnote-codex-local`

### 2.7 幂等回归验证

- 结果：通过
- 证据：
  - 已在 automation 节点再次执行：
    - `bash /opt/automation/app/mindsync/shared/tools/getnote-setup.sh sync-paperclip`
  - 第二次执行对以下 agent 均返回：
    - `sync: no-op`
  - 覆盖对象：
    - `Research & Knowledge Lead`
    - `Content Lead`
    - `Engineer`
  - 再次执行统一状态检查后，research-center 链与 getnote 链均保持：
    - `status: aligned`

## 3. 建议补跑场景

- 本地导出的公司导入到服务器后，company skills 存在但 agent `desiredSkills` 为空
- 导入后 runtime skill key 改变，但来源标识不变
- agent 额外挂了其他非 `Get笔记` skill
- 某一条 `Get笔记` company skill 缺失

## 4. 结论

本次提交已完成仓库侧恢复机制、服务器导入来源收束与在线恢复验证。

当前剩余工作主要是：

- 后续若新增底层 skill 包，默认也走仓库受管路径，而不是 IDE 私有目录
- 若需要支持除 `local_path` 外的自动导入策略，再单开下一阶段
