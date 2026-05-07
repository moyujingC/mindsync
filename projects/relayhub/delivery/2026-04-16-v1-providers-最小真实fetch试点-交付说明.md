# RelayHub v1 Providers 最小真实 fetch 试点交付说明

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-16
> source_of_truth：projects/relayhub/delivery/2026-04-16-v1-providers-最小真实fetch试点-交付说明.md
> 项目：RelayHub
> 阶段：delivery
> depends_on：projects/relayhub/qa/2026-04-16-v1-providers-最小真实fetch试点-验证记录.md

这份文档用于把 `RelayHub` 控制台当前这轮 `Providers` 最小真实 fetch 试点交给下一棒实现者。

## 1. 本轮已交付内容

当前新增内容包括：

- `ProvidersReadonlyRequest` 与最小 request input 语义
- providers collection / detail URL builder
- `createRealProvidersReadonlyDataSource(request)` facade
- providers request payload 到现有 contract 的适配逻辑
- datasource 组合工厂下的 providers source 可替换验证

## 2. 本轮仍明确不做

当前仍未实现：

- 真实 base URL 与环境变量配置
- 真实 HTTP 请求接入
- 认证头、鉴权或运行时自动切换
- payload 向后端 wire format 命名迁移
- 页面层感知真实 providers datasource
- 任何真实控制动作

## 3. 当前结构意图

当前控制台前端已经形成：

- 默认 datasource 组合
  - providers 继续来自 mock source
- providers 真实试点落位
  - 通过注入 request 构造真实 datasource
- `consoleData.ts`
  - 继续通过 datasource 读取 raw contract
  - 继续向页面暴露稳定 helper，不暴露 request 细节

这意味着下一棒如果要接真实 providers 只读 API，只需要实现 request 并注入 `createRealProvidersReadonlyDataSource(request)`，而不需要先重写页面层、路由层或 `consoleData` 对外接口。

## 4. 下一阶段建议切入点

下一棒建议按下面顺序继续：

1. 明确真实 providers 列表与详情接口的 base URL 和认证方式
2. 确认真实响应字段到当前 providers contract 的映射关系
3. 再决定是否为 providers 增加可控但默认关闭的 runtime 切换入口

## 5. 一句话结论

当前 `RelayHub` 控制台已经把 `Providers` 推进到“默认仍走 mock、但真实 fetch 形态已具备接缝”的阶段，下一棒可以直接进入真实只读 API 接入准备。
