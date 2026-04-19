# RelayHub v1 Providers runtime bootstrap 交付说明

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/delivery/2026-04-17-v1-providers-runtime-bootstrap-交付说明.md
> 项目：RelayHub
> 阶段：delivery
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-runtime-bootstrap-验证记录.md

这份文档用于把 `RelayHub` 控制台当前这轮 `Providers` runtime bootstrap 最小装配层交给下一棒实现者。

## 1. 本轮已交付内容

当前新增内容包括：

- providers 独立 runtime bootstrap
- default bootstrap 与 default mock 行为对齐
- static / env sourceFactoryOptions 到 providers source 的 bootstrap 串接
- 默认 providers 拼装改经由 default bootstrap

## 2. 本轮仍明确不做

当前仍未实现：

- 读取真实环境变量
- 认证头字段决策
- runtime 自动切换
- 其他资源的 bootstrap
- 任何真实控制动作

## 3. 当前结构意图

当前控制台前端已经形成：

- providers runtime config 层
- providers runtime config source 层
- providers env runtime config parser
- providers runtime config source factory
- providers runtime datasource 层
- providers runtime bootstrap 层

这意味着下一棒如果要接正式部署配置，只需要把 runtime bootstrap 的输入接到更上层启动入口，而不需要改页面层或 `consoleData.ts` 对外接口。

## 4. 下一阶段建议切入点

下一棒建议按下面顺序继续：

1. 决定 runtime bootstrap 是否进入更高层 app startup / runtime bootstrap
2. 明确真实部署配置如何生成 `sourceFactoryOptions`
3. 再确认是否需要把 bootstrap 扩展到其他资源

## 5. 一句话结论

当前 `RelayHub` 控制台已经把 `Providers` 推进到“默认仍走 mock，但已有最小 runtime bootstrap 装配层”的阶段，下一棒可以直接进入真实 deployment wiring 与认证注入准备。
