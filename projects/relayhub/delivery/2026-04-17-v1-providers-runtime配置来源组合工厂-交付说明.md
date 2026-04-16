# RelayHub v1 Providers runtime 配置来源组合工厂交付说明

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/delivery/2026-04-17-v1-providers-runtime配置来源组合工厂-交付说明.md
> 项目：RelayHub
> 阶段：delivery
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-runtime配置来源组合工厂-验证记录.md

这份文档用于把 `RelayHub` 控制台当前这轮 `Providers` runtime 配置来源组合工厂交给下一棒实现者。

## 1. 本轮已交付内容

当前新增内容包括：

- providers 独立 runtime config source factory
- default mock、static、env 三类 source 创建入口
- 默认 providers 拼装改经由 factory 默认 source
- factory 到 datasource 的 real-fetch 串接验证

## 2. 本轮仍明确不做

当前仍未实现：

- 把 env parser 接入默认 source
- 读取真实环境变量
- 认证头字段决策
- runtime 自动切换
- 其他资源的 source factory
- 任何真实控制动作

## 3. 当前结构意图

当前控制台前端已经形成：

- providers runtime config 层
- providers runtime config source 层
- providers env runtime config parser
- providers runtime config source factory
- providers runtime datasource 层

这意味着下一棒如果要接正式部署配置，可以优先调整 source factory 的输入来源，而不需要改页面层或 `consoleData.ts` 对外接口。

## 4. 下一阶段建议切入点

下一棒建议按下面顺序继续：

1. 决定 source factory 是否暴露给更上层 runtime bootstrap
2. 明确真实部署配置如何生成 factory options
3. 再确认是否需要把 source factory 扩展到其他资源

## 5. 一句话结论

当前 `RelayHub` 控制台已经把 `Providers` 推进到“默认仍走 mock，但已有可选接线的 runtime config source 组合工厂”的阶段，下一棒可以直接进入真实 runtime bootstrap 与认证注入准备。
