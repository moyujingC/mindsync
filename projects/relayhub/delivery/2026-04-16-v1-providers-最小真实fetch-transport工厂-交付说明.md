# RelayHub v1 Providers 最小真实 fetch transport 工厂交付说明

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/delivery/2026-04-16-v1-providers-最小真实fetch-transport工厂-交付说明.md
> 项目：RelayHub
> 阶段：delivery
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-providers-最小真实fetch-transport工厂-验证记录.md

这份文档用于把 `RelayHub` 控制台当前这轮 `Providers` 最小真实 fetch transport 工厂交给下一棒实现者。

## 1. 本轮已交付内容

当前新增内容包括：

- providers 真实 fetch transport 工厂
- transport config 与 fetch-like 接口
- detail `404` 的 facade 归一化
- `createRealProvidersFetchDataSource(config)` 组合 helper

## 2. 本轮仍明确不做

当前仍未实现：

- 真实内网地址接入
- 环境变量与认证头字段决策
- runtime 自动切换
- payload 向后端正式 wire format 命名迁移
- 页面层感知真实 fetch transport
- 任何真实控制动作

## 3. 当前结构意图

当前控制台前端已经形成：

- 默认 datasource 组合
  - providers 继续来自 mock source
- providers 真实试点分层
  - fetch transport 工厂负责最小 HTTP 行为
  - wire adapter 负责 body 到 payload contract 的映射
  - facade 负责 `ready / empty / not-found` 语义
- `consoleData.ts`
  - 继续通过 datasource 读取 raw contract
  - 对页面层保持稳定 helper，不暴露 transport 工厂细节

这意味着下一棒如果要接真实 providers 只读 API，只需要补真实 base URL 与认证信息，而不需要先重写页面层、路由层或 `consoleData` 对外接口。

## 4. 下一阶段建议切入点

下一棒建议按下面顺序继续：

1. 明确真实 providers 列表与详情接口的 base URL 与认证方式
2. 决定是否把 fetch transport 组合 helper 接入一个默认关闭的 runtime 入口
3. 再确认真实返回字段到当前 wire adapter / payload contract 的映射关系

## 5. 一句话结论

当前 `RelayHub` 控制台已经把 `Providers` 推进到“默认仍走 mock，但已具备最小真实 fetch transport 工厂”的阶段，下一棒可以直接进入真实只读 API 的接入准备。
