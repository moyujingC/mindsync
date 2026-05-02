# RelayHub v1 Providers deployment runtime input 交付说明

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/delivery/2026-04-17-v1-providers-deployment-runtime-input-交付说明.md
> 项目：RelayHub
> 阶段：delivery
> depends_on：projects/relayhub/qa/2026-04-17-v1-providers-deployment-runtime-input-验证记录.md

这份文档用于把 `RelayHub` 控制台当前这轮 `Providers` deployment runtime input 装配层交给下一棒实现者。

## 1. 本轮已交付内容

当前新增内容包括：

- 独立 deployment runtime input 装配层
- deployment input 到 console app runtime options 的显式映射
- `main.tsx` 默认启动改经由 deployment runtime input

## 2. 本轮仍明确不做

当前仍未实现：

- 读取真实环境变量
- 认证头字段决策
- runtime 自动切换
- 其他资源 deployment runtime 化
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

这意味着下一棒如果要接正式 deployment wiring 或真实 env，只需要把 deployment input 的显式输入来源继续向上接，而不需要改页面层、路由层、`consoleData.ts` 或 providers runtime 细层接口。

## 4. 下一阶段建议切入点

下一棒建议按下面顺序继续：

1. 决定 deployment input 的显式输入来源如何接真实 env 或更高层运行时配置
2. 明确认证注入契约如何进入 real-fetch transport
3. 再评估是否把 deployment input 扩展到其他资源

## 5. 一句话结论

当前 `RelayHub` 控制台已经把 `Providers` 推进到“默认仍走 mock，但 app startup 已有 deployment runtime input 装配层”的阶段，下一棒可以直接进入真实 env wiring 与认证注入准备。
