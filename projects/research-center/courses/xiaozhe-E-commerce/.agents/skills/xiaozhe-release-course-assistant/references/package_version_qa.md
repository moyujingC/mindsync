# Python 与依赖版本提示型 QA

## 目录

- 适配结论与最小证据
- QA 1-3：解释器、虚拟环境与 wheel
- QA 4-6：Pydantic、LangChain 与 LangGraph
- QA 7-8：Chroma、ONNX Runtime 与 MCP
- QA 9-11：pip 冲突、网络与其他教程版本
- 如何区分兼容性提示与实际故障信号
- 修复后的两级验证
- 回答学员时的结论格式

## 适配结论

- 课程当前验证主线是 64 位 CPython 3.13.x，仓库根目录 `.venv` 是优先推荐、便于复现的 Agent 运行环境。
- 根目录 `requirements.txt` 中的精确 `==` 版本构成一套共同验证过的依赖参考；其他组合可能工作，只是需要结合实际课程行为单独判断。
- Python 3.10-3.12 可能运行部分课程，Python 3.14+ 也可能正常工作；它们不在当前完整验证主线上，因此只提示额外关注语法、API 与二进制 wheel 情况，不因版本号本身阻止运行。
- 前端使用 Vite 8，要求 Node.js 20.19+ 或 22.12+；宿主机 Java/Maven 不是 Docker 启动路径的必需项。

当前公开仓锁定的关键 Python 依赖包括：FastAPI 0.136.1、Pydantic 2.11.4、LangChain 1.2.15、LangGraph 1.1.10、langchain-core 1.3.2、langchain-openai 1.2.1、ChromaDB 1.5.8 和 MCP 1.27.0。回答时优先查看学习者仓库根目录的实际 `requirements.txt`；仓库更新后不要只依赖这份快照数字。

核心原则：先看实际错误和运行结果，再看版本差异。只有版本差异、没有对应报错时，给出提醒即可；如果当前目标课程已经能启动并通过关键接口验证，不要求学员为了对齐数字重建环境。

## 如何区分兼容性提示与实际故障信号

| 观察层 | 兼容性提示，不单独判故障 | 实际故障信号，需要明确告诉学员 |
| --- | --- | --- |
| Python | 版本不是 3.13.x，或使用 conda/pyenv | `SyntaxError`、标准库 API 缺失、解释器无法启动 |
| 包版本 | 与 `requirements.txt` 数字不同 | `ModuleNotFoundError`、`ImportError`、`cannot import name`、`AttributeError`，且指向课程实际使用的 API |
| 安装过程 | 新版本 Python 可能缺 wheel | `No matching distribution found`、`ResolutionImpossible`、`Failed building wheel` 或编译进程非零退出 |
| 依赖一致性 | 仅看到包版本漂移 | `pip check` 明确报告依赖冲突；它是环境异常证据，还要结合目标课程是否受影响 |
| 课程启动 | 尚未运行 `/health` | 后端进程退出、Traceback、端口没有监听、目标 Agent `/health` 连接失败或返回 5xx |
| 网络下载 | 使用代理、镜像源或网络较慢 | `ReadTimeout`、TLS/证书错误、代理拒绝；这是网络故障信号，不应自动归因于包版本 |

回答时同时写两句话：`兼容性提示：……`；`实际故障信号：已观察到…… / 尚未观察到…… / 尚未验证……`。不要用“尚未验证”冒充“没有故障”。

## 先收集的最小证据

先确认学习者位于包含 `agent-course-versions/`、`requirements.txt` 和 `docker-compose.infra.yml` 的云效仓根目录。课程助手应直接运行自身的 `scripts/preflight.py <release-root>`。若让学习者手动预检，使用仓内真实路径：

```bash
python3 .agents/skills/xiaozhe-release-course-assistant/scripts/preflight.py .
# Trae 中也可使用：python3 .trae/skills/xiaozhe-release-course-assistant/scripts/preflight.py .
```

Windows PowerShell 可将 `python3` 换成当前可用的 Python launcher，例如 `py -3.13`。提醒学习者使用上面的真实内置路径，避免误执行不存在的仓库根目录 `scripts/preflight.py`。

macOS/Linux：

```bash
pwd
python3.13 --version
.venv/bin/python --version
.venv/bin/python -m pip --version
.venv/bin/python -m pip check
.venv/bin/python -m pip show pydantic langchain langgraph langchain-core langchain-openai chromadb mcp
```

Windows PowerShell：

```powershell
Get-Location
py -3.13 --version
.\.venv\Scripts\python --version
.\.venv\Scripts\python -m pip --version
.\.venv\Scripts\python -m pip check
.\.venv\Scripts\python -m pip show pydantic langchain langgraph langchain-core langchain-openai chromadb mcp
```

建议同时报告 Python 可执行文件和 `python -m pip` 的路径。裸 `pip --version` 可能指向另一个 Python，单独使用时证据较弱。

## QA 0：完全找不到可用 Python

**实际故障信号**：系统或托管环境中的 Python launcher 都无法运行，仓库 `.venv` 解释器也不存在或损坏，例如 `python: command not found`、`py is not recognized` 或 `bad interpreter`。

**当前判断**：这不是版本差异提示，而是 Agent 启动条件缺失；预检应输出 `FAIL`。如果没有启动 Agent 的需求，可以继续查阅代码，但不能输出“没有阻塞项”。

**建议**：先确认系统、已有 conda/pyenv 环境和仓库 `.venv` 是否至少有一个解释器能运行。全部不可用时，展示 CPython 3.13 安装与建环境计划，征得明确同意后再安装；不要静默修改学习者的基础环境。

## QA 1：明明安装过，仍然 `ModuleNotFoundError`

**常见原因**：安装包时用的是系统 `pip`、conda 或另一个虚拟环境，启动课程时却用了仓库 `.venv`；也可能反过来，包在 `.venv` 中，但启动命令用了裸 `python`。

**检查**：比较 `python -m pip --version` 输出路径与启动命令中的 Python 路径。两者都应指向仓库根目录 `.venv`。

**建议**：优先用 `.venv/bin/python -m pip ...` 或 `.venv\Scripts\python -m pip ...` 安装，并用同一个解释器启动课程。如果现有 conda/pyenv 环境已经工作，可以继续使用并记录实际路径。全局安装或 `sudo pip` 较难隔离，只需提示其风险。

## QA 2：`str | None`、类型语法或标准库报错

**典型现象**：旧 Python 出现语法错误、类型表达式错误，或某些新标准库 API 不存在。

**常见原因**：系统自带 Python 3.9/3.10 被误用，或者 `.venv` 是早期用旧解释器创建的；后来安装 Python 3.13 不会自动升级旧 `.venv`。

**建议**：如果旧 Python 已经导致语法或标准库错误，可以将旧 `.venv` 改名备份，用 CPython 3.13 重新创建。若当前环境没有出现这些错误，则只提示版本差异即可。

## QA 3：Python 3.14+ 安装 `onnxruntime`、Chroma 或其他 wheel 失败

**典型现象**：`No matching distribution found`、开始本地编译后失败、C/C++/Rust 构建工具错误。

**常见原因**：新 Python 发布后，二进制依赖尚未提供当前系统/架构的 wheel；这不等于课程要求学习者自行编译依赖。

**建议**：确认操作系统、架构与 Python 版本。如果确实缺少 wheel，可以另建 Python 3.13 `.venv` 做对照验证；不必先覆盖当前环境，也不建议为了适配 3.14 随意升降 Chroma、ONNX Runtime 相关包。若 3.14 已安装并能运行，则无需处理。

## QA 4：`model_dump`、`model_validate` 不存在，或 `BaseSettings` 导入失败

**常见原因**：Pydantic 1.x 与课程的 Pydantic 2.x 代码混用；Pydantic 2 将 Settings 能力拆到 `pydantic-settings`。

**课程依赖点**：逐课代码使用 `model_dump()`、`model_validate()`，配置使用 `pydantic-settings`。安装旧教程中的 `pydantic<2` 会破坏当前课程。

**建议**：先确认 traceback 是否确实来自 Pydantic 1/2 API 差异。若是，可以按根目录 `requirements.txt` 在独立环境中验证，并运行 `python -m pip check`；若现有代码和课程已正常运行，则不因版本号不同强制改动源码或环境。

## QA 5：`create_agent`、LangChain 消息或 Tool API 导入失败

**常见原因**：把 LangChain 0.x 教程的版本装进当前课程，或单独执行 `pip install -U langchain`，导致 `langchain`、`langchain-core`、`langchain-openai` 相互漂移。

**课程依赖点**：后期课程使用 LangChain 1.x 的 `create_agent`、`langchain_core.messages`、工具调用与结构化响应接口。

**建议**：把 LangChain 相关包作为一组观察，同时查看 `langchain`、`langchain-core` 与 `langchain-openai`。如果关键导入确实失败，可在新环境中恢复根目录参考版本；一般不建议只依据其他教程的一条升级命令修改当前课程环境。

## QA 6：`StateGraph`、checkpoint、resume 或 LangGraph 状态错误

**常见原因**：LangGraph 与 LangChain/core 版本不匹配，或者旧环境残留不同代的 checkpoint 依赖。

**课程依赖点**：第 27 课以后使用 `StateGraph`、HITL、checkpoint/resume 等逐步演进能力。

**建议**：检查 `langgraph`、`langgraph-checkpoint` 和 `langchain-core` 的实际版本及 `pip check`。只有实际出现状态、checkpoint 或导入错误时，再考虑用干净 `.venv` 对照；避免在已有环境里反复升降单包即可。

## QA 7：Chroma、`langchain-chroma` 或 ONNX Runtime 报错

**先区分两件事**：依赖被安装，不等于当前课程正在连接 Chroma 服务。当前公开课程的部分 RAG 路径使用本地/内存实现，仅凭安装了 `chromadb` 或 Compose 中存在 Chroma，无法判断实际运行链路。

**版本类错误**：导入失败、wheel 不匹配、NumPy/ONNX 冲突时，可以另建 3.13 + 根目录参考版本环境做对照；先保留当前环境，验证后再决定是否切换。

**数据类错误**：Embedding 模型变更、`.chroma` 数据不兼容更像索引状态问题。建议先确认具体课程是否真的使用该持久化目录，再决定是否需要重建索引。

## QA 8：MCP 或 `langchain-mcp-adapters` 导入/协议错误

**常见原因**：只升级 `mcp` 或只升级适配器，导致协议对象、会话接口或类型定义不一致。

**建议**：同时核对 `mcp` 与 `langchain-mcp-adapters` 的参考版本，并先区分 MCP 服务连接错误和包 API 差异。只有证据指向依赖漂移时，再建议用完整参考组合做对照。

## QA 9：pip 报 `ResolutionImpossible`、依赖冲突或安装后仍不一致

**常见原因**：在已经装过其他 AI 项目的环境中继续安装课程依赖；全局/conda 预装包给 resolver 增加了冲突；学习者手动改过 `requirements.txt`。

**可选处理顺序（仅在确实出现冲突时）**：

1. 保留原始报错，先不急于改版本号。
2. 确认根目录 `requirements.txt` 未被手工修改。
3. 将旧 `.venv` 改名到一个尚不存在的备份目录。
4. 用 CPython 3.13 创建全新 `.venv`。
5. 完整执行 `python -m pip install -r requirements.txt`。
6. 执行 `python -m pip check`，再让课程助手运行自身的 `scripts/preflight.py <release-root>`；手动运行时使用上面的 `.agents` 或 `.trae` 实际路径。

`--break-system-packages`、`--no-deps`、`sudo pip` 或单包强制降级风险较高，通常只提示风险，不作为课程默认建议。

## QA 10：下载超时、证书或代理错误是不是版本不兼容

不一定。`ReadTimeout`、TLS/证书、代理拒绝、镜像源连接失败属于下载/网络层；`No matching distribution`、导入符号不存在、`pip check` 冲突才更像版本或平台适配问题。

先记录失败 URL、包名、Python 版本、操作系统与架构。网络失败可以在网络恢复后重试同一条参考安装命令；没有版本证据时，不急于通过改包版本处理下载问题。

## QA 11：能否直接复制其他教程的 requirements 或升级到最新版

可以研究，但建议与课程环境隔离。课程代码、测试和讲解围绕公开仓自己的精确依赖集合验证；第三方教程可能基于 LangChain 0.x、Pydantic 1.x 或不同的 MCP/LangGraph API。

如果要研究新版本，建议复制到独立实验环境，保留课程 `.venv` 作为对照，并明确实验结果与课程当前验证结果的区别。

## 修复后的两级验证

第一层验证关键框架符号，确认不是“版本看似正确、导入仍然失败”：

macOS/Linux：

```bash
.venv/bin/python -c "from langchain.agents import create_agent; from langgraph.graph import StateGraph; from pydantic import BaseModel; from pydantic_settings import BaseSettings; print('course framework imports OK')"
```

Windows PowerShell：

```powershell
.\.venv\Scripts\python -c "from langchain.agents import create_agent; from langgraph.graph import StateGraph; from pydantic import BaseModel; from pydantic_settings import BaseSettings; print('course framework imports OK')"
```

第二层建议回到原报错课程：用 `scripts/lesson_card.py <release-root> <lesson>` 生成该课实际启动命令，启动后访问对应 Agent `/health`。导入烟测和真实课程后端都通过时，修复证据更完整；如果暂时只能完成其中一项，说明验证边界即可，不需要阻止后续排查。

## 回答学员时的结论格式

按以下顺序给出：

1. `兼容性提示`：与课程参考环境有什么差异。
2. `实际故障信号`：精确错误或“尚未观察到 / 尚未验证”。
3. `当前判断`：可以继续，还是已有故障需要处理。
4. 当前云效仓根目录和课程编号。
5. 实际 Python 可执行文件、版本与 pip 所属环境。
6. 与根目录 `requirements.txt` 不一致的直接包及 `pip check` 结果。
7. 判断属于解释器、环境错位、直接版本漂移、传递依赖、二进制 wheel 还是网络问题。
8. `下一步`：最小验证或可选修复动作，包括关键导入烟测与原报错课程 `/health`。

尽量不要只说“版本不兼容”；优先指出哪一层、哪个包、参考版本、实际版本和已有证据。版本不同但当前功能正常时，明确说明“这是提示，不是故障结论”。
