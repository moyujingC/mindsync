# CEO Hermes 容器运行时验证记录

> 状态：current
> 日期：2026-04-16
> owner：Engineer
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-16-ceo-hermes-container-runtime-verification.md
> 关联对象：一镜一梳 automation / Paperclip / CEO
> 关联任务：CEO bug

## 1. 背景

本轮排障起点是 CEO 在 Paperclip 中运行失败。

用户给出的截图显示旧报错为：

- `EACCES: permission denied, mkdir '/paperclip/instances/default/data/run-logs'`

但实际复核当前 automation 宿主与容器后，`run-logs` 目录权限正常、宿主与容器均可写，因此该报错不再构成当前主阻塞。

进一步复跑 CEO heartbeat 后，当前可稳定复现的真实错误为：

- `ModuleNotFoundError: No module named 'hermes_cli'`

## 2. 本轮验证目标

验证当前 CEO 失败是否由 Hermes 运行时安装方式错误导致，并给出可作为部署修复基线的正式结论。

## 3. 已验证事实

### 3.1 `run-logs` 权限不是当前根因

已确认：

- 宿主机 `/data/paperclip/instances/default/data/run-logs` 可写
- 容器内 `/paperclip/instances/default/data/run-logs` 可写
- 当前 `PAPERCLIP_HOME=/paperclip`
- 当前 `HOME=/paperclip`

结论：

- 截图中的 `EACCES` 更接近历史失败记录
- 它不是本轮 CEO 持续失败的当前主因

### 3.2 当前真实失败是 `hermes_cli` 缺失

通过恢复 CEO agent 并手动执行 heartbeat，当前实际错误稳定为：

- `ModuleNotFoundError: No module named 'hermes_cli'`

这说明：

- `hermes` 命令链路被找到了
- 但 Hermes 所依赖的 Python 包并未在当前解释器环境中被正确解析

### 3.3 宿主机注入 venv 存在 Python 主版本错配

已验证：

- 宿主机 `/opt/hermes-agent/venv/pyvenv.cfg` 对应 `Python 3.11`
- 宿主机 `pip show hermes-agent` 成功，版本为 `0.9.0`
- `hermes` 启动脚本 shebang 为：
  - `#!/opt/hermes-agent/venv/bin/python3`
- Paperclip 容器内执行 `/opt/hermes-agent/venv/bin/python` 实际返回：
  - `Python 3.13.5`

结论：

- 宿主机创建的 venv 进入容器后，解释器实际落到了容器自己的 Python 3.13
- 但 site-packages 仍位于宿主机 venv 的 Python 3.11 布局下
- 因此最终出现：
  - 可执行文件存在
  - 但 `import hermes_cli` 失败

## 4. 结论

当前 CEO bug 的正式根因是：

- `hermes_local` 采用了“宿主机 Python venv 注入容器”的部署方式
- 该方式在当前 automation 节点上产生了 Python 主版本不一致
- 最终导致 Hermes CLI 入口存在，但运行时依赖解析失败

因此当前正式修复方向应为：

- 采用容器原生 Hermes 安装
- 不再把宿主机 venv 作为 CEO 的默认运行时来源

## 5. 本轮修复基线

本仓库已将部署基线更新为：

- 新增 `Dockerfile.paperclip-with-hermes`
- `docker-compose.paperclip.yml` 与 `.example` 改为使用该 Dockerfile
- 停止挂载宿主机 `/opt/hermes-agent`
- 改为在 Paperclip 容器内创建 `/opt/hermes` 并安装 `hermes-agent`

## 6. 已完成线上复验

2026-04-16 已在 automation 节点完成重建与运行时复验，结果如下：

1. 新镜像已重建并生效：
   - `paperclip-automation-paperclip:latest`
   - image id：`sha256:e5a1147113a3d4effb3e7578985a7cd4c73383cee16495972c003d8632218def`
2. 运行中的 `paperclip-automation-paperclip-1` 已切换到新镜像
3. 容器内 `/usr/local/bin/hermes` 已不再依赖 pip 生成的 shebang，而是显式 wrapper：
   - `#!/bin/sh`
   - `exec /opt/hermes/bin/python -m hermes_cli.main "$@"`
4. 容器内执行 `command -v hermes` 正常返回 `/usr/local/bin/hermes`
5. 容器内执行 `hermes --help` 正常返回 Hermes CLI 帮助信息
6. 容器内执行 `/opt/hermes/bin/python - <<'PY'` 导入 `hermes_cli` 成功，输出：
   - `opt hermes import ok`
7. 容器内系统 `python3` 仍然无法直接 `import hermes_cli`
   - 这是符合预期的，因为 Hermes 现已固定通过 `/opt/hermes/bin/python` 运行

## 7. 当前结论

当前已确认：

- 根因已定位
- 线上新镜像已部署
- Hermes 容器运行时已恢复
- `ModuleNotFoundError: hermes_cli` 这一层阻塞已解除

后续复跑又进一步确认了一层新的真实阻塞：

- Hermes 在触发 context compression 时，如果没有可用的 `auxiliary.compression` provider，会报：
  - `No auxiliary LLM provider configured`

本轮线上已确认：

1. 仅设置容器环境变量 `OPENAI_API_KEY` / `OPENAI_BASE_URL` / `OPENAI_MODEL`，不足以让 Hermes 的 compression auxiliary client 自动可用
2. Hermes 当前这条链路默认优先认：
   - `OPENROUTER_API_KEY`
   - 或 `config.yaml` 中显式配置的 `auxiliary.compression`
3. 将 `/paperclip/.hermes/config.yaml` 补为现有 Ark/OpenAI 兼容 provider 后，
   - `get_text_auxiliary_client("compression")` 已可返回有效 client
   - model 为 `minimax-m2.5`
4. 因此本问题当前的正式修复口径应升级为：
   - 不仅要修 Hermes CLI 运行时
   - 还要在容器启动时自动写入 `providers.main` 与 `auxiliary.compression`

仍待补的只剩业务级验证：

1. Paperclip 面板 `CEO -> Test environment`
2. 手动触发一次 CEO heartbeat，确认不再出现新的模型配置或鉴权错误

## 8. 新一轮复跑的最新根因

在修复下面两层后：

- `ModuleNotFoundError: hermes_cli`
- `No auxiliary LLM provider configured`

继续复跑 `CEO -> Test environment`，又确认了一层新的真实阻塞：

- Paperclip UI 显示 run transcript 只有：
  - `Resumed session 20260416_082421_0f1570 (...)`
- failure details 为：
  - `Error: Adapter failed`

进一步查看 automation 容器内 Hermes session dump 后，已确认：

1. 当前 run 已不再是“model 空值”问题
   - 最新 request dump 中 `model` 已为：
     - `minimax-m2.5`
2. 当前 run 也不是“容器环境变量没注入”问题
   - 容器内已存在：
     - `OPENAI_API_KEY`
     - `OPENAI_BASE_URL=https://ark.cn-beijing.volces.com/api/coding/v3`
     - `OPENAI_MODEL=minimax-m2.5`
   - `/paperclip/.hermes/config.yaml` 也已正确写入：
     - `default_provider: main`
     - `providers.main`
     - `auxiliary.compression`
3. 但 Hermes 实际请求仍发到了：
   - `https://openrouter.ai/api/v1/chat/completions`
4. provider 返回的真实错误为：
   - `401 Missing Authentication header`

结论：

- 当前这轮失败不是因为 Ark 配置无效
- 而是因为 Hermes 在 `--resume 20260416_082421_0f1570` 时复用了旧 session 中残留的 provider / base_url 状态
- 该旧 session 仍指向历史的 OpenRouter 链路
- 所以即使容器和 config 已切到 Ark，新 run 仍会被旧 session 污染

## 9. 当前止血动作

为避免 CEO 继续复用这条已污染的 Hermes session，2026-04-16 已在 automation 节点执行线上止血：

1. 清空 `agent_runtime_state.session_id`
2. 删除 CEO 对应的 `agent_task_sessions`

执行后已确认：

- CEO 当前 runtime session 为 `null`
- CEO 当前 task session 列表为空

因此下一次 `CEO -> Test environment` / heartbeat 应从全新 session 启动，不再续用：

- `20260416_082421_0f1570`

## 10. 当前正式口径

截至本轮，`CEO bug` 的分层结论应更新为：

1. Hermes 容器运行时修复已完成
2. Hermes compression auxiliary provider 修复已完成
3. CEO 的 `adapter_config.model` 空值问题已完成线上热修
4. 当前新增的真实运行时风险是：
   - 当 Hermes provider / model / base_url 已变更，但 Paperclip 仍续跑旧 session 时，旧 session 可能携带历史 provider 状态，导致新配置不生效

因此当前默认复验动作不应再只是“直接重跑”，而应改为：

1. 先 reset CEO 的 runtime session
2. 再触发 `CEO -> Test environment`
3. 再看是否还有新的业务级错误
