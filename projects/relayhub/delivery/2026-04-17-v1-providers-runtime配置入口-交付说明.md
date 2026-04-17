# RelayHub v1 Providers runtime 配置入口交付说明

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/delivery/2026-04-17-v1-providers-runtime配置入口-交付说明.md
> 项目：RelayHub
> 阶段：delivery
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-runtime配置入口-验证记录.md

这份文档用于把 `RelayHub` 控制台当前这轮 `Providers` runtime 配置入口交给下一棒实现者。

## 1. 本轮已交付内容

当前新增内容包括：

- providers 独立 runtime config 解析入口
- 默认 config 固定为 mock
- `real-fetch` 显式 config 到 datasource options 的映射
- `baseUrl / fetchImpl / defaultHeaders` 透传验证
- `ProvidersRuntimeConfig` 公开接口未吸收 auth/token/security app 层输入

## 2. 本轮仍明确不做

当前仍未实现：

- 环境变量接入
- runtime 自动切换
- 把认证头、token provider 或 security input 纳入 runtime config 公开接口
- 其他资源的 runtime config
- 页面层感知 runtime config
- 任何真实控制动作

## 3. 当前结构意图

当前控制台前端已经形成：

- providers runtime config 层
  - 表达 mock 或 real-fetch 的显式配置形态
- providers runtime datasource 层
  - 接收解析后的 datasource options 并构造 providers source
- 默认 datasource 组合
  - providers 默认仍来自 mock

这意味着下一棒如果要接正式 runtime 配置来源，可以先连接 `ProvidersRuntimeConfig`，而不需要改页面层或 `consoleData.ts` 对外接口。

## 4. 下一阶段建议切入点

下一棒建议按下面顺序继续：

1. 决定 providers runtime config 的正式来源
2. 明确真实 base URL 与认证方式如何进入 `ProvidersRuntimeConfig`
3. 再确认是否需要把 runtime config 扩展到其他资源

## 5. 一句话结论

当前 `RelayHub` 控制台已经把 `Providers` 推进到“默认仍走 mock，但已有显式 runtime 配置解析入口”的阶段，下一棒可以直接进入真实 runtime 配置来源与认证注入准备。
