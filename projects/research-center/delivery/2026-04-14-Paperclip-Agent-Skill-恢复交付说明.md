# Paperclip Agent Skill 恢复交付说明

> 状态：current
> 版本：0.2.0
> owner：Engineer / Research & Knowledge Lead
> last_updated：2026-04-15
> source_of_truth：projects/research-center/delivery/2026-04-14-Paperclip-Agent-Skill-恢复交付说明.md
> 项目：研究中心
> 阶段：delivery
> depends_on：projects/research-center/qa/2026-04-14-Paperclip-Agent-Skill-恢复验证记录.md

## 1. 已交付内容

- 新增 skill 绑定治理源：
  - `company/paperclip-agent-skill-bindings.yaml`
- 新增通用恢复脚本：
  - `shared/tools/sync-paperclip-agent-skills.sh`
- 更新 `Get笔记` 运维脚本：
  - `shared/tools/getnote-setup.sh`
- 新增仓库受管底层 skill 包：
  - `shared/skills/getnote/`

## 2. 标准恢复顺序

当服务器端公司来自导出再导入，且 agent skill 丢失时，建议顺序：

1. `bash shared/tools/sync-paperclip-runtime-agents.sh status`
2. `bash shared/tools/sync-paperclip-runtime-agents.sh create-missing`
3. `bash shared/tools/sync-agents.sh import`
4. `bash shared/tools/sync-paperclip-agent-skills.sh status`
5. `bash shared/tools/sync-paperclip-agent-skills.sh sync`

如果是带鉴权的远端实例：

```bash
PAPERCLIP_API_URL='http://vm-0-11-opencloudos.tail176582.ts.net:3100' \
PAPERCLIP_COMPANY_ID='be191a6e-7447-4821-a93d-9114214c4a64' \
PAPERCLIP_API_TOKEN='<token>' \
bash shared/tools/sync-paperclip-agent-skills.sh sync
```

本次真实服务器恢复已按上述模式完成。

## 3. Get笔记 专项入口

若只关心 `Get笔记` 相关 skill 恢复，可继续使用：

```bash
bash shared/tools/getnote-setup.sh sync-paperclip
```

但现在它的职责是：

- 复用通用 `sync-paperclip-agent-skills.sh sync`
- 然后补写 `GETNOTE_*` 到目标 agent `adapterConfig.env`

它不再被视为“完整公司导入恢复”的唯一入口。

服务器端 `getnote` company skill 的标准导入源现已固定为：

```text
/opt/automation/app/mindsync/shared/skills/getnote
```

不要再把服务器恢复链建立在：

- `~/.codex/skills/getnote`
- `~/.claude/skills/getnote`

这类 IDE 私有目录上。

## 4. 本次真实恢复结果

- company skill 已成功导入：
  - `local/a40e6d0efe/getnote-codex-local`
- 以下 agent 已恢复底层 `getnote` skill：
  - `Research & Knowledge Lead`
  - `Content Lead`
  - `Engineer`
- 同时保留业务层 skill：
  - `external-knowledge-intake`
- 已验证统一状态输出为 aligned
- 已验证第二次重复执行恢复命令时：
  - `Research & Knowledge Lead` 为 `sync: no-op`
  - `Content Lead` 为 `sync: no-op`
  - `Engineer` 为 `sync: no-op`

## 5. automation 节点前置要求

- `python3`
- `ruby`
- `curl`

若 automation 节点缺少 `ruby`，`getnote` 恢复链不可用，应先补：

```bash
sudo dnf install -y ruby
```

## 6. 当前残留风险

- 自动导入暂只覆盖 `local_path` 来源
- 若运行时出现同一来源被导入成多条 company skill，脚本会报冲突并停止自动挂载

## 7. 下一棒 handoff

- `Engineer`
  - 后续若改动 `shared/skills/getnote`，执行一次服务器侧 `status -> sync`
- `Test / QA`
  - 补跑“重复执行两次 sync 结果不变”的回归验证
