# MindSync Skill 统一同步入口交付说明

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-15
> source_of_truth：projects/research-center/delivery/2026-04-15-MindSync-Skill统一同步入口交付说明.md
> 项目：研究中心
> 阶段：delivery

## 1. 已交付内容

- 新增统一入口脚本：
  - `shared/tools/sync-mindsync-skills.sh`
- 该入口收束两条同步链：
  - `research-center` repo skill 扫描与 agent 挂载
  - `Get笔记` company skill / desiredSkills / agent env 同步

自第二阶段起，`research-center` repo skill 同步链中已包含 `external-knowledge-intake`，而 `Get笔记` 继续作为底层工具层 skill 由专项链恢复。

## 2. 标准用法

### 2.1 查看当前状态

```bash
PAPERCLIP_API_URL='http://vm-0-11-opencloudos.tail176582.ts.net:3100' \
PAPERCLIP_COMPANY_ID='be191a6e-7447-4821-a93d-9114214c4a64' \
PAPERCLIP_API_TOKEN='<CEO token>' \
bash shared/tools/sync-mindsync-skills.sh status
```

### 2.2 执行统一同步

```bash
PAPERCLIP_API_URL='http://vm-0-11-opencloudos.tail176582.ts.net:3100' \
PAPERCLIP_COMPANY_ID='be191a6e-7447-4821-a93d-9114214c4a64' \
PAPERCLIP_API_TOKEN='<CEO token>' \
bash shared/tools/sync-mindsync-skills.sh sync
```

## 3. 同步语义

执行 `sync` 时会按顺序：

1. 扫描服务器上研究中心项目工作区的 repo-local skill
2. 将研究中心 skill 按绑定清单挂到对应 agent
3. 再执行 `Get笔记` 的专项恢复
4. 保留 Paperclip 自带 required skills

执行完成后，目标 agent 当前应同时看到：

- 业务层 `external-knowledge-intake`
- 底层工具层 `getnote`

## 4. 后续维护方式

当研究中心 skill 有新增或更新时：

- 先提交 `projects/research-center/skills/*`
- 如有角色分配变化，同步更新：
  - `company/paperclip-research-center-skill-bindings.yaml`
- 然后重新执行：
  - `bash shared/tools/sync-mindsync-skills.sh sync`

若新增的是 `external-knowledge-intake` 这类正式业务层 skill，也按同一条 research-center repo-local 同步链处理，不进入 `Get笔记` 专项绑定清单。

当 `Get笔记` 的目标 agent 或来源规则变化时：

- 更新：
  - `company/paperclip-agent-skill-bindings.yaml`
- 然后重新执行同一条统一同步命令

## 5. 结论

后续不再需要通过 UI 手工逐个导入研究中心 skill，也不需要逐个 agent 手工勾选。

当前 `MindSync` 的常规 skill 运维入口已经收束为一条命令。
