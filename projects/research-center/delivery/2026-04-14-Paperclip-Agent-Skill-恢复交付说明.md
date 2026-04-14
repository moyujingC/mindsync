# Paperclip Agent Skill 恢复交付说明

> 状态：current
> 版本：0.1.0
> owner：Engineer / Research & Knowledge Lead
> last_updated：2026-04-14
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/research-center/delivery/2026-04-14-Paperclip-Agent-Skill-恢复交付说明.md
> 项目：研究中心
> 阶段：delivery
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/research-center/qa/2026-04-14-Paperclip-Agent-Skill-恢复验证记录.md

## 1. 已交付内容

- 新增 skill 绑定治理源：
  - `/Users/xinran/Downloads/dev/mindsync/company/paperclip-agent-skill-bindings.yaml`
- 新增通用恢复脚本：
  - `/Users/xinran/Downloads/dev/mindsync/shared/tools/sync-paperclip-agent-skills.sh`
- 更新 `Get笔记` 运维脚本：
  - `/Users/xinran/Downloads/dev/mindsync/shared/tools/getnote-setup.sh`

## 2. 标准恢复顺序

当服务器端公司来自导出再导入，且 agent skill 丢失时，建议顺序：

1. `bash shared/tools/sync-paperclip-runtime-agents.sh status`
2. `bash shared/tools/sync-paperclip-runtime-agents.sh create-missing`
3. `bash shared/tools/sync-agents.sh import`
4. `bash shared/tools/sync-paperclip-agent-skills.sh status`
5. `bash shared/tools/sync-paperclip-agent-skills.sh sync`

如果是带鉴权的远端实例：

```bash
PAPERCLIP_API_URL='https://<server>' \
PAPERCLIP_API_TOKEN='<token>' \
bash shared/tools/sync-paperclip-agent-skills.sh sync
```

## 3. Get笔记 专项入口

若只关心 `Get笔记` 相关 skill 恢复，可继续使用：

```bash
bash shared/tools/getnote-setup.sh sync-paperclip
```

但现在它的职责是：

- 复用通用 `sync-paperclip-agent-skills.sh sync`
- 然后补写 `GETNOTE_*` 到目标 agent `adapterConfig.env`

它不再被视为“完整公司导入恢复”的唯一入口。

## 4. 当前残留风险

- 当前会话未完成在线恢复验证，因为 `Paperclip API` 不可连接
- 自动导入暂只覆盖 `local_path` 来源
- 若运行时出现同一来源被导入成多条 company skill，脚本会报冲突并停止自动挂载

## 5. 下一棒 handoff

- `Engineer`
  - 在服务器端执行一次真实 `status -> sync`，把结果补进交付记录
- `Test / QA`
  - 补跑“导入后 key 改变但来源不变”的真实验证
