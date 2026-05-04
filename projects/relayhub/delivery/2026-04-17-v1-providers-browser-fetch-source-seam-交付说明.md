# RelayHub v1 Providers browser fetch source seam 交付说明

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/delivery/2026-04-17-v1-providers-browser-fetch-source-seam-交付说明.md
> 项目：RelayHub
> 阶段：delivery
> depends_on：projects/relayhub/qa/2026-04-17-v1-providers-browser-fetch-source-seam-验证记录.md

这份文档用于把 `RelayHub` 控制台当前这轮 `Providers` browser fetch source seam 交给下一棒实现者。

## 1. 本轮已交付内容

当前新增内容包括：

- 独立 browser fetch source seam
- browser runtime input source 对 source 模式的支持
- 默认 mock 行为不变的前提下，可显式装配 static/global browser fetch source

## 2. 本轮仍明确不做

当前仍未实现：

- 默认启动自动读取 `globalThis.fetch`
- 认证头字段决策
- runtime 自动切换
- 其他资源 browser fetch source 化
- 任何真实控制动作

## 3. 当前结构意图

当前控制台前端已经形成：

- browser fetch adapter
- browser fetch source seam
- browser deployment runtime input source
- env deployment input source
- providers runtime datasource / bootstrap / app runtime

这意味着下一棒如果要接更正式的 browser source 选择、认证注入或更高层 deployment 输入统一，只需要继续沿 source seam 与 runtime 输入层推进，而不需要改页面层、路由层、`consoleData.ts` 或 providers runtime 细层接口。

## 4. 下一阶段建议切入点

下一棒建议按下面顺序继续：

1. 决定是否需要把 global source 以显式 runtime option 形式提升到更高层启动输入
2. 明确认证注入契约如何进入 real-fetch transport
3. 再评估 browser source seam 是否需要与 deployment input 层进一步合并

## 5. 一句话结论

当前 `RelayHub` 控制台已经把 `Providers` 推进到“默认仍走 mock，但 app 层已有集中可选的 browser fetch source seam”的阶段，下一棒可以直接进入更正式的 browser source wiring 或认证注入准备。
