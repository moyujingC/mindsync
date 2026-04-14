# Paperclip Agent Skill 恢复验证记录

> 状态：current
> 版本：0.1.0
> owner：Test / QA
> last_updated：2026-04-14
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/research-center/qa/2026-04-14-Paperclip-Agent-Skill-恢复验证记录.md
> 项目：研究中心
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/research-center/tasks/2026-04-14-Paperclip-Agent-Skill-恢复实施任务.md

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

### 2.3 两条 Get笔记 来源建模

- 结果：通过
- 证据：
  - 绑定清单中分别登记：
    - `${HOME}/.codex/skills/getnote`
    - `${HOME}/.claude/skills/getnote`
  - 脚本优先使用 `source_type + source_locator` 做解析

### 2.4 远端认证入口

- 结果：通过
- 证据：
  - `sync-paperclip-agent-skills.sh` 支持 `PAPERCLIP_API_TOKEN`
  - `getnote-setup.sh` 已将 bearer token 透传给通用同步逻辑

## 3. 未完成验证

### 3.1 在线运行态恢复

- 结果：未执行
- 原因：
  - 当前会话内 `http://localhost:3100` 不可连接
  - 无法直接调用在线 `Paperclip API` 验证真实 company skills 与 agent `desiredSkills`

## 4. 建议补跑场景

- 本地导出的公司导入到服务器后，company skills 存在但 agent `desiredSkills` 为空
- 两条 `Get笔记` company skill 同时存在
- 导入后 runtime skill key 改变，但来源标识不变
- agent 额外挂了其他非 `Get笔记` skill
- 某一条 `Get笔记` company skill 缺失
- 重复执行两次 `sync`

## 5. 结论

本次提交已完成仓库侧恢复机制与运维入口收束。

当前剩余工作主要是：

- 在服务器 `Paperclip API` 可连通时补跑在线恢复
- 把真实恢复结果追加回交付记录
