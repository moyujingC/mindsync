# Paperclip Agent Skill 恢复实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-14
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/research-center/tasks/2026-04-14-Paperclip-Agent-Skill-恢复实施任务.md
> 项目：研究中心
> 阶段：implementation-plan
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/research-center/specs/2026-04-14-Paperclip-Agent-Skill-恢复与迁移-SPEC.md

## 1. 目标行为

让 Paperclip 服务器在公司导入后，可以基于仓库治理源恢复 agent 的 `desiredSkills`，而不是依赖手工在 UI 里重新挂载。

## 2. 实施项

1. 绑定治理源
   - 新增 `company/paperclip-agent-skill-bindings.yaml`
   - 收束首批托管的 agent 与 skill 来源
2. 通用恢复脚本
   - 新增 `shared/tools/sync-paperclip-agent-skills.sh`
   - 支持 `status` 与 `sync`
3. Get笔记 运维链路
   - 让 `shared/tools/getnote-setup.sh sync-paperclip` 复用通用恢复脚本
   - 继续保留 `GETNOTE_*` 注入逻辑
4. 文档与运维说明
   - 补 `spec`
   - 补 `qa`
   - 补 `delivery`
   - 更新既有 `Get笔记` 交付说明

## 3. 验收口径

- 绑定清单可明确表达 `agent -> source locator` 关系
- 脚本能解析 company skill key，而不写死旧 key
- 同步时保留非托管 skill
- 两条 `Get笔记` 来源可被分别识别
- 带 `PAPERCLIP_API_TOKEN` 的远端实例可以执行

## 4. 当前限制

- 当前会话内本机 `Paperclip API` 不可连接，无法直接完成在线恢复
- `status` 与 `sync` 的真实运行态验证需在服务可连接时补跑
- 当前自动导入仅覆盖 `local_path` 来源
