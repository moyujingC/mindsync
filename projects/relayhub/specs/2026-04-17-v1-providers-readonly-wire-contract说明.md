# RelayHub v1 Providers readonly wire contract 说明

> 状态：current
> 版本：0.1.0
> owner：Architect / Engineer
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/specs/2026-04-17-v1-providers-readonly-wire-contract说明.md
> 项目：RelayHub
> 阶段：spec

## 1. 目标

本说明用于固定 Providers readonly real-fetch 的默认 wire contract。

本轮只对齐默认返回 shape、路径、过滤参数和错误映射，不进入真实 base URL、真实认证或默认启动切换。

## 2. 默认 wire shape

Collection 默认返回：

```ts
{ items: ProviderRecordContract[] }
```

Detail 默认返回：

```ts
{ item: ProviderRecordContract | null }
```

默认 adapter 只接受以上 shape。其他后端 shape 必须通过显式 custom adapter 转换。

## 3. 路径与 query

- collection path：`/providers`
- detail path：`/providers/:id`
- collection query 只承接已允许的 Providers filters：
  - `kind`
  - `environment`
  - `health`
  - `transparency`

非法或不支持的 filter 不应进入请求 query。

## 4. 状态与错误

- collection `items.length > 0` 映射为 `ready`
- collection `items.length = 0` 映射为 `empty`
- detail `item` 存在映射为 `ready`
- detail `item = null` 映射为 `not-found`
- transport `404 + null` 映射为 detail `not-found`
- transport `204 + null` 保留为 null data，由 datasource / adapter 决定语义
- 非 `404` 的非 2xx 状态继续向上抛，不 fallback 到 mock

## 5. Custom adapters

`createRealProvidersReadonlyDataSource(...)` 继续支持 custom collection/detail adapter。

custom adapter 只作为后端 shape 过渡扩展点，不作为默认真实接入推荐路径。

## 6. 不提供

- 不提供真实 base URL 落位
- 不提供真实认证方式
- 不提供 auth env key
- 不提供 credential store
- 不提供默认启动自动切换到 real-fetch
