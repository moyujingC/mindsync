# RelayHub v1 Providers global browser fetch runtime option 交付说明

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/delivery/2026-04-17-v1-providers-global-browser-fetch-runtime-option-交付说明.md
> 项目：RelayHub
> 阶段：delivery
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-global-browser-fetch-runtime-option-验证记录.md

这份文档用于把 `RelayHub` 控制台当前这轮 `Providers` global browser fetch runtime option 交给下一棒实现者。

## 1. 本轮已交付内容

当前新增内容包括：

- `global-browser-fetch` browser runtime input 模式
- 显式使用 `globalThis.fetch` 的 runtime option
- 默认 mock 行为不变的前提下，可显式装配 global browser fetch

## 2. 本轮仍明确不做

当前仍未实现：

- 默认启动自动读取 `globalThis.fetch`
- 认证头字段决策
- runtime 自动切换
- 其他资源 global browser fetch 化
- 任何真实控制动作

## 3. 当前结构意图

当前控制台前端已经形成：

- browser fetch adapter
- browser fetch source seam
- explicit global browser fetch runtime option
- browser deployment runtime input source
- env deployment input source
- providers runtime datasource / bootstrap / app runtime

这意味着下一棒如果要接更正式的认证注入或更高层 deployment 输入统一，只需要继续沿 runtime option 与 source seam 推进，而不需要改页面层、路由层、`consoleData.ts` 或 providers runtime 细层接口。

## 4. 下一阶段建议切入点

下一棒建议按下面顺序继续：

1. 明确认证注入契约如何进入 real-fetch transport
2. 决定是否需要把 global browser fetch option 映射到更高层 deployment input
3. 再评估是否允许真实部署默认启用 real-fetch

## 5. 一句话结论

当前 `RelayHub` 控制台已经把 `Providers` 推进到“默认仍走 mock，但 app 层已有显式 global browser fetch runtime option”的阶段，下一棒可以进入认证注入或更高层部署输入统一准备。
