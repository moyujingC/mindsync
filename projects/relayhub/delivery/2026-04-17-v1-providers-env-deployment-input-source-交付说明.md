# RelayHub v1 Providers env deployment input source 交付说明

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/delivery/2026-04-17-v1-providers-env-deployment-input-source-交付说明.md
> 项目：RelayHub
> 阶段：delivery
> depends_on：projects/relayhub/qa/2026-04-17-v1-providers-env-deployment-input-source-验证记录.md

这份文档用于把 `RelayHub` 控制台当前这轮 `Providers` env deployment input source 交给下一棒实现者。

## 1. 本轮已交付内容

当前新增内容包括：

- 独立真实 env deployment input source
- 默认 env 启动入口
- Vite env typing

## 2. 本轮仍明确不做

当前仍未实现：

- `process.env` 接线
- 认证头字段决策
- runtime 自动切换
- 其他资源 env source 化
- 任何真实控制动作

## 3. 当前结构意图

当前控制台前端已经形成：

- providers runtime config 层
- providers runtime config source 层
- providers env runtime config parser
- providers runtime config source factory
- providers runtime datasource 层
- providers runtime bootstrap 层
- console app runtime 启动层
- console deployment runtime input 层
- console env deployment input source

这意味着下一棒如果要接真实 `fetchImpl` 注入、认证注入契约或更正式的 env wiring，只需要继续往 env source 的输入来源或 real-fetch transport 输入层推进，而不需要改页面层、路由层、`consoleData.ts` 或 providers runtime 细层接口。

## 4. 下一阶段建议切入点

下一棒建议按下面顺序继续：

1. 决定真实 `fetchImpl` 与更高层运行时来源如何注入 env source
2. 明确认证注入契约如何进入 real-fetch transport
3. 再评估是否把 env source 扩展到其他资源

## 5. 一句话结论

当前 `RelayHub` 控制台已经把 `Providers` 推进到“默认仍走 mock，但 app startup 已有真实 env deployment input source”的阶段，下一棒可以直接进入真实 `fetchImpl` wiring 与认证注入准备。
