# CEO Hermes 容器运行时修复交付记录

> 状态：current
> 日期：2026-04-16
> owner：Engineer
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-16-ceo-hermes-container-runtime-fix-handoff.md
> 关联对象：一镜一梳 automation / Paperclip / CEO
> 关联任务：CEO bug

## 1. 本轮交付内容

本轮已将 CEO 的 Hermes 部署口径，从“宿主机注入 venv”切换为“容器原生 Hermes”。

已完成的正式改动包括：

1. 新增部署专用镜像文件：
   - `projects/aimandala/deploy/paperclip-automation/Dockerfile.paperclip-with-hermes`
2. 更新 compose：
   - `docker-compose.paperclip.yml`
   - `docker-compose.paperclip.yml.example`
3. 更新 automation runbook：
   - `projects/aimandala/deploy/paperclip-automation/README.md`
4. 补齐根因验证记录：
   - `projects/aimandala/docs/qa/2026-04-16-ceo-hermes-container-runtime-verification.md`

## 2. 当前正式结论

当前应把 CEO bug 理解为：

- 不是 `run-logs` 权限问题
- 而是 Hermes Python 运行时错配问题

具体来说：

- 宿主机 venv 用 Python 3.11 创建
- 容器内实际解释器为 Python 3.13
- 导致 `hermes` 能找到，但 `hermes_cli` 无法导入

因此当前正式推荐路径为：

- 不改 Paperclip 主仓源码
- 在部署层扩展镜像
- 让 Hermes 与 Paperclip 在同一个容器运行时中安装和执行

## 3. 当前残留动作

仓库侧配置与文档已经就位，且 automation 节点已完成下面动作：

1. 将本次改动同步到 automation 宿主
2. 使用新 Dockerfile 重建 `paperclip` 镜像
3. 强制替换运行中的 `paperclip-automation-paperclip-1`
4. 执行容器内 Hermes 健康检查并通过

当前真正剩余的动作变为：

5. 在 Paperclip 面板执行 `CEO -> Test environment`
6. 重新跑一次 CEO heartbeat
7. 若出现新错误，继续按“模型配置 / 凭证 / 业务逻辑”分层排查，而不是回到 Hermes 安装问题

## 4. 风险说明

当前剩余风险主要有两类：

1. Hermes 在容器内安装时仍可能受网络或 GitHub 源可达性影响，但本轮线上重建已成功通过
2. 即使 `hermes_cli` 恢复，CEO 后续仍可能暴露新的模型配置或鉴权问题

但这两类风险都属于“下一层运行时验证问题”，不再影响当前根因判断。

## 5. Handoff

下一步 owner 仍应为 `Engineer`，直接在 automation 节点执行部署与复验。

只有当下面两项同时通过，才应把本问题视为真正收口：

1. `CEO -> Test environment` 通过
2. CEO 实际 heartbeat run 成功启动且不再报 `hermes_cli` 导入错误

## 6. 当前线上状态

截至 2026-04-16，本轮已确认：

1. 运行中容器已切换到新镜像：
   - `sha256:e5a1147113a3d4effb3e7578985a7cd4c73383cee16495972c003d8632218def`
2. `/usr/local/bin/hermes` 已改为固定通过 `/opt/hermes/bin/python -m hermes_cli.main` 启动
3. `hermes --help` 在容器内可正常执行
4. `/opt/hermes/bin/python` 下可正常导入 `hermes_cli`

因此本次交付的收口状态应表述为：

- Hermes 容器运行时修复已完成
- CEO 的业务级可用性验证仍待最后一跳复跑

## 7. 最新补充结论

在 Hermes 容器运行时恢复、`auxiliary.compression` 补齐，以及 CEO `adapter_config.model` 热修为 `minimax-m2.5` 后，继续复跑又确认了新的真实阻塞：

- 旧 Hermes session 会污染新 provider 配置

线上证据链如下：

1. 最新失败 run 的 transcript 只显示：
   - `Resumed session 20260416_082421_0f1570 (...)`
2. 对应 request dump 已明确带上：
   - `model: minimax-m2.5`
3. 容器环境和 `/paperclip/.hermes/config.yaml` 已明确为 Ark：
   - `OPENAI_BASE_URL=https://ark.cn-beijing.volces.com/api/coding/v3`
   - `default_provider: main`
   - `providers.main`
   - `auxiliary.compression`
4. 但 Hermes 实际请求仍打到了：
   - `https://openrouter.ai/api/v1/chat/completions`
5. provider 返回：
   - `401 Missing Authentication header`

因此本轮新增结论是：

- 当前失败并不是“resume 文字本身失败”
- 也不是“Ark 环境变量未注入”
- 而是旧 session `20260416_082421_0f1570` 仍残留历史 OpenRouter provider 状态，被新 run 继续复用

## 8. 已执行止血

为避免 CEO 持续续跑被污染的旧 session，已在线执行：

1. 清空 CEO `agent_runtime_state.session_id`
2. 删除 CEO 的全部 `agent_task_sessions`

执行后已确认：

- CEO 当前 runtime session 为 `null`
- CEO 当前 task session 为空

这意味着下一次复跑将从全新 session 启动，而不是继续使用：

- `20260416_082421_0f1570`

## 9. 当前建议动作

当前 runbook 口径应升级为：

1. 当 `hermes_local` 的 provider / model / base_url 发生变化后，不要直接复跑旧 session
2. 应先 reset 对应 agent 的 runtime session / task session
3. 再执行：
   - `CEO -> Test environment`
   - 下一次 heartbeat

只有在“新 session 启动成功且不再访问历史 provider”之后，才应继续排查更上层业务逻辑。
