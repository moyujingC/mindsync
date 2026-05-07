# RelayHub v1 Providers env runtime 配置解析器交付说明

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/delivery/2026-04-17-v1-providers-env-runtime配置解析器-交付说明.md
> 项目：RelayHub
> 阶段：delivery
> depends_on：projects/relayhub/qa/2026-04-17-v1-providers-env-runtime配置解析器-验证记录.md

这份文档用于把 `RelayHub` 控制台当前这轮 `Providers` env runtime config 解析器交给下一棒实现者。

## 1. 本轮已交付内容

当前新增内容包括：

- providers 独立 env runtime config parser
- 缺失或非法 env 回退 mock 的默认行为
- valid headers JSON 到 `defaultHeaders` 的最小透传
- env source helper 到 real-fetch datasource 的串接验证

## 2. 本轮仍明确不做

当前仍未实现：

- 把 env parser 接入默认 source
- 读取真实环境变量
- 认证头字段决策
- runtime 自动切换
- 其他资源的 env parser
- 任何真实控制动作

## 3. 当前结构意图

当前控制台前端已经形成：

- providers runtime config 层
- providers runtime config source 层
- providers env runtime config parser
- providers runtime datasource 层

这意味着下一棒如果要接正式部署配置，可以先决定是否把 env parser 接到 `ProvidersRuntimeConfigSource`，而不需要改页面层或 `consoleData.ts` 对外接口。

## 4. 下一阶段建议切入点

下一棒建议按下面顺序继续：

1. 决定 env parser 是否进入默认 source 之外的正式 source 组合
2. 明确真实认证字段如何进入 env parser 或后续 source
3. 再确认是否需要把 env parser 扩展到其他资源

## 5. 一句话结论

当前 `RelayHub` 控制台已经把 `Providers` 推进到“默认仍走 mock，但已有显式 env runtime config 解析器”的阶段，下一棒可以直接进入真实部署配置接线与认证注入准备。
