# Codex + Hermes + 飞书运营分诊试点

> 状态：working
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-08-23
> source_of_truth：projects/ai-service-studio/agent-pilot/README.md
> 对应 SPEC：[Codex + Hermes + 飞书运营分诊试点 SPEC](../specs/2026-08-23-Codex-Hermes-飞书运营分诊试点-SPEC.md)

这是“墨予镜企业 AI 服务”内部运营分诊的最小试点。目标是验证三者分工：

- Codex：开发、测试和迭代这套系统。
- Hermes Agent：长期运行的受控分诊 Agent（智能体）。
- 飞书 CLI：飞书多维表格和消息等实际工作数据的连接器。

当前状态是**离线演练已实现**，并不表示 Hermes Gateway 或飞书已真实接入。

## 目录

```text
agent-pilot/
├── bin/pilot.py                         # 本地安全入口
├── config/pilot.example.json            # 无凭证配置模板
├── hermes/skills/ai-service-operations/ # Hermes 受控 Skill
└── tests/                               # 离线样本与自动化测试
```

## 快速验证

在仓库根目录运行：

```bash
python3 projects/ai-service-studio/agent-pilot/bin/pilot.py check
python3 projects/ai-service-studio/agent-pilot/bin/pilot.py route
python3 -m unittest discover -s projects/ai-service-studio/agent-pilot/tests -v
```

第二条命令只会读取 `tests/fixtures.json`，输出建议 JSON；不会调用模型、Hermes 或飞书。

要写入本地建议文件：

```bash
python3 projects/ai-service-studio/agent-pilot/bin/pilot.py route \
  --output /tmp/ai-service-operations-suggestions.json
```

## Hermes 接入（下一阶段）

本机安装 Hermes 后，把 [Skill](hermes/skills/ai-service-operations/SKILL.md) 放入该 Hermes 实例的私有 skills 目录，再在私有配置文件中开启 `hermes_gateway.enabled`。`pilot.py route` 会向 Hermes 的 OpenAI 兼容端点 `POST /v1/chat/completions` 发送已脱敏任务；Gateway 异常、缺失密钥或输出不符合合同都会回退到本地确定性规则，并在 `hermes_status` 中注明。敏感输入在本地阻断，绝不发送给 Gateway。

Hermes 的 API Server 会暴露所使用 profile 的工具集。因此必须先创建一个独立的**无工具/只读 profile**：关闭终端、浏览器和文件写入工具，Gateway 只监听 `127.0.0.1`，启用 `API_SERVER_KEY`。不要依靠 Skill 里的文字限制来代替权限配置。

不要把仓库里的 `.env`、飞书凭证或模型密钥复制进 Skill。Hermes 的工作目录也不应包含真实客户资料。

## 飞书 CLI 接入（下一阶段）

推荐评估 [`riba2534/feishu-cli`](https://github.com/riba2534/feishu-cli)：它支持多维表格、消息、文档等命令，并提供 `--dry-run` 与幂等键等安全能力。安装和授权只在本机私有环境完成，例如：

```bash
feishu-cli config create-app --save
feishu-cli doctor
```

随后复制 `config/pilot.example.json` 到仓库外的私有路径，填入**环境变量名称**和只读命令模板。第一轮真实演练只能读取一张包含模拟任务的飞书多维表格，最多 5 条；建议仍输出到本地 JSON 供人工检查。

`write` 命令当前有意不实现实际写回。即使传入 `--approved --confirm`，也只会在满足所有安全前置条件后明确提示“尚未实现”。这能避免“配置好了就顺手写入”的风险。

## 状态解释

| 观察到的结果 | 含义 |
| --- | --- |
| `offline_simulation` | 只跑本地确定性规则，未访问外部系统 |
| `hermes: missing` | 未安装 Hermes；离线演练仍可正常进行 |
| `feishu_cli: missing` | 未安装飞书 CLI；未发生飞书调用 |
| `feishu_enabled: false` | 默认安全状态，任何写回都会被拒绝 |
| `blocked_sensitive_data` | 输入疑似含凭证、联系方式或身份信息，必须人工脱敏 |

## 运行边界

本试点不自动发送、创建、修改或发布。涉及客户联系、项目方案、报价、预约、状态更新和飞书写回时，只能生成 `proposal_only` 建议，并由人工确认。真实飞书写回需要单独完成阶段 B 的只读验收和阶段 C 的权限审阅。
