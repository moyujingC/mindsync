# 排障参考

## 不在课程代码仓根目录

现象：命令找不到 `agent-course-versions`、`frontend/package.json`、`ecommerce-backend` 或 `docker-compose.infra.yml`。

处理：请学习者提供从云效/Codeup 克隆下来的公开代码仓根目录。在维护环境里，这个目录通常对应 `release-public-latest`。合格的公开代码仓根目录应包含 `agent-course-versions`、`frontend/package.json`、`ecommerce-backend`、`requirements.txt`、`docker-compose.infra.yml` 和 `doc/运行手册.md`。`courses/story`、`courses/basic` 不随小仓交付是正常的；环境、模型 Key、服务启动和访问地址优先参考仓内 `doc/运行手册.md`，再结合当前代码、Compose 与实际运行检查判断。若缺少 `doc/运行手册.md`，通常是旧版或不完整副本，应先更新云效/Codeup 代码仓。

## Docker 后端启动失败

先检查：

```bash
docker --version
docker compose version
docker compose -f docker-compose.infra.yml ps
```

常见处理：

- 确认 Docker Desktop 或 Docker Engine 已启动。
- 重新执行 `docker compose -f docker-compose.infra.yml up -d --build mysql ecommerce-service`。
- 如果 Maven 下载很慢，说明第一次构建可能受网络影响；可提示学习者等网络恢复后重试。

### 前端构建阶段 `npm ci` 报 npm/cli Exit Handler 错误

现象：第一次执行 `docker compose -f docker-compose.infra.yml up -d --build mysql ecommerce-service` 时，构建停在类似下面的位置：

```text
frontend-builder ... RUN npm ci
```

日志里如果出现 npm 自身的 Exit Handler、callback、tracker、signal、internal error 等字样，且不是明确的依赖版本冲突，通常不是课程代码或 `package-lock.json` 写错，而是 Node/npm 镜像环境与 Docker BuildKit 缓存组合触发的 npm/cli 竞态问题。

优先处理：

1. 先让学习者拉取最新课程代码，确认 `ecommerce-backend/Dockerfile` 的前端构建阶段使用 `node:22-bookworm-slim`，并且 `npm ci` 前没有 `--mount=type=cache,target=/root/.npm`。
2. 重新构建电商后端：

```bash
docker compose -f docker-compose.infra.yml build --no-cache ecommerce-service
docker compose -f docker-compose.infra.yml up -d mysql ecommerce-service
```

3. 如果仍然失败，再让学习者贴出从 `frontend-builder` 到 npm 报错结束的完整日志，不要让学习者删除课程文件、改依赖版本或切换离线模式。

维护侧判断：这个问题的规避方向是使用 glibc 系 Node 基础镜像并取消 npm cache mount；不要把它归因成学员没有安装宿主机 Node/npm，也不要要求学员安装 Java/Maven 来修 Docker 构建。

## 基础环境安装必须先征得同意

如果预检提示缺少 Docker、Python 或 Node/npm，不要直接安装。宿主机 Java/Maven 不是课程代码仓启动必需项，因为电商后端通过 Docker Compose 构建和运行；只有学习者明确要做源码级本地验证时，才单独检查或安装 Java/Maven。

先展示安装计划：

```bash
python3 scripts/install_prereqs.py --dry-run
```

Windows 可用：

```powershell
py -3.13 scripts/install_prereqs.py --dry-run
```

把计划展示给学习者，并获得明确同意后，才执行：

```bash
python3 scripts/install_prereqs.py --yes
```

Windows 可用：

```powershell
py -3.13 scripts/install_prereqs.py --yes
```

macOS 下脚本会给出 Homebrew 相关计划；如果没有 Homebrew，先让学习者安装 Homebrew 或按脚本输出手动处理。Windows 下优先使用 winget。Linux 下只给发行版相关的手动建议，因为 Docker、Python 3.13 和 Node.js 的安装来源会随发行版变化。

## Agent 后端启动失败

常见原因：

- 缺少 `course.env`。
- `AGENT_OPENAI_API_KEY` 还是占位值。
- Python 低于 3.13。
- 课程代码仓根目录缺少 `.venv` 虚拟环境，或没有安装 `requirements.txt`。
- 端口 8000 已被上一课或旧进程占用。

常见处理：

- 在公开代码仓根目录下，把 `agent-course-versions/course.env.example` 复制为 `agent-course-versions/course.env`。
- 在本地填写真实模型 API Key。
- 使用 Python 3.13+ 创建课程代码仓根目录的 `.venv`，并执行 `.venv/bin/python -m pip install -r requirements.txt`。Windows 使用 `.venv\Scripts\python -m pip install -r requirements.txt`。
- 启动 Agent 后端时优先使用 `.venv` 里的 Python。进入某课 `backend/` 后，macOS/Linux 通常执行 `PORT=8001 ../../../.venv/bin/python main.py`；Windows 使用 `..\..\..\.venv\Scripts\python main.py`。
- 如果 8000 被占用，可用 `PORT=8001 ../../../.venv/bin/python main.py` 启动 Agent，并在公开代码仓的 `frontend/.env.local` 中设置 `VITE_AGENT_BASE_URL=http://localhost:8001`。

## Python 或包版本不一致

如果错误包含 `ModuleNotFoundError`、`ImportError`、`ResolutionImpossible`、`model_dump`、`BaseSettings`、`create_agent`、`StateGraph`、`chromadb`、`onnxruntime` 或 MCP 相关导入失败，可以先把版本与环境错位作为一种可能原因，而不是直接断定“版本不兼容”。

1. 读取 `references/package_version_qa.md`，按其中的典型 QA 区分解释器错误、pip/venv 错位、直接依赖版本漂移、传递依赖冲突和二进制 wheel 不兼容。
2. 让课程助手运行自身的 `scripts/preflight.py <release-root>`；预检会显示 `.venv` 对应的 pip 路径、比较根目录 `requirements.txt` 的参考版本、运行 `pip check`，并验证 `create_agent`、`StateGraph` 与 Pydantic 2 的关键导入。Python 和依赖差异只输出提示，不单独阻止运行。若学习者手动运行，从云效仓根目录执行 `python3 .agents/skills/xiaozhe-release-course-assistant/scripts/preflight.py .`；Trae 使用 `.trae/skills/...` 对应路径，Windows 可将 `python3` 换成当前可用的 launcher，例如 `py -3.13`。
3. 建议同时报告实际解释器路径和 `python -m pip --version`；裸 `python --version` 或裸 `pip --version` 只能作为补充信息。
4. 如果确实出现依赖冲突、关键导入失败或安装失败，可以把旧 `.venv` 改名备份，再用 CPython 3.13 新建仓库根目录 `.venv` 并完整安装 `requirements.txt`。变更后建议做框架导入烟测，再按 `lesson_card.py` 启动原报错课程并验证 `/health`。全局安装、`sudo pip` 或单独 `pip install -U langchain` 风险较高，通常只需提示风险，不要把重建环境作为所有版本差异的强制处理。

回答时同时列出：`兼容性提示`、`实际故障信号`、`当前判断`、`下一步`。版本号不同，或虽缺少仓库 `.venv` 但已有其他可用隔离解释器，只放在“兼容性提示”；系统/托管 Python 与仓库 `.venv` 都不能运行时，属于 Agent 启动故障并应判为 `FAIL`。安装命令明确失败、关键导入/语法错误、后端进程退出、目标课程 `/health` 连接失败或 5xx 也属于“实际故障信号”。相关检查没运行时写“尚未验证”，不能写“没有故障”。

## 调试台打不开

正常启动后，常用访问入口是：

- Agent 调试后台：`http://localhost:5173`
- Agent 健康检查：`http://localhost:8000/health`
- Agent API 文档：`http://localhost:8000/docs`
- 电商后端健康检查：`http://localhost:8081/actuator/health`
- 电商后台页面：`http://localhost:8081/admin/`

如果 Agent 或 Vite 改了端口，访问链接也要同步换成实际端口；如果 `localhost` 受代理影响，把链接里的 `localhost` 换成 `127.0.0.1` 再试。

先检查：

```bash
curl --noproxy '*' -I http://127.0.0.1:5173
```

常见处理：

- 在公开代码仓根目录下执行 `cd frontend && npm install && npm run dev`。
- 如果 Agent 不在 8000 端口，设置 `VITE_AGENT_BASE_URL`。
- 区分 8081 的小哲电商用户/管理站点和 5173 的 Agent 调试台。

## 第 41 课 RAG 或模型链路异常

先看响应里的 `session_state.model`、`session_state.rag.embedding` 和公开 Trace，不要只看最终回答：

- `openai_compatible_embedding:<model>`：真实 Embedding 路径。
- `local_token_embedding_for_explicit_offline_course`：显式离线 token embedding，不是线上语义检索证明。
- `fallback_reason=APITimeoutError`：模型服务超时，路由会在受控超时后回退；先检查模型平台连通性和 `course.env`，不要通过增加无限重试掩盖问题。
- 提示 RAG 需要 `AGENT_OPENAI_API_KEY`：当前是在线 RAG 模式但 Key 缺失。正常学习应配置真实 Key；只有学习者明确要求离线时才设置 `AGENT_COURSE_OFFLINE_RAG=1`。

三个离线开关彼此独立：`AGENT_COURSE_DISABLE_LLM=1` 不会自动启用离线 RAG，也不会授权业务事实镜像；`AGENT_COURSE_OFFLINE_FACTS=1` 只能证明课程种子镜像路径，不能证明 8081 业务接口联调成功。

## 调试台面板为空或置灰

面板为空不一定是故障。早期课程尚未引入后续能力：

- 01-07：RAG、Tool、Workflow、Trace、Eval 通常未启用。
- 08-16：RAG 逐步增强；引用通常在 citations 课程之后才出现。
- 17-24：Tool 信号开始重要。
- 26-31：Workflow/HITL/resume 信号开始重要。
- 37-41：Trace/Eval/Cost 信号成为核心。

## 第 42-44 课综合场景

读取对应 lesson 目录下的场景 JSON。判断时不要只看最终回答，还要看预期信号：

- 42：当前商品价格、活动价、库存应走 `search_products`；平台通用活动规则走 RAG 和 citations，回答还要保留“是否适用于当前商品以商品页和结算页为准”的边界。
- 43：退款应进入 Workflow/HITL，并出现 resume token/checkpoint 相关语义。
- 44：预设 `SERVICE_TIMEOUT` 是显式故障注入，应看到 `explicit_course_fault_injection`；安全场景应看到安全兜底、拒答或公开 Trace 证据。

## 学习者报错时的回答结构

建议按这个顺序回答：

- 当前使用的公开代码仓根目录。
- 课程编号或组件。
- 失败命令。
- 相关端口状态。
- 最可能原因。
- 具体修复步骤。
- 下一条验证命令。
