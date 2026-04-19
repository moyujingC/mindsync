# RelayHub v1 Providers readonly wire contract 对齐 实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-17-v1-providers-readonly-wire-contract对齐实施任务.md
> 项目：RelayHub
> 阶段：implementation

## 1. 目标

- 固定 Providers readonly real-fetch 的默认 wire contract。
- 明确默认 collection/detail shape、路径、状态映射与错误语义。
- 不新增配置层、wrapper、env key 或真实接入信息。

## 2. 实施项

- 新增 `projects/relayhub/specs/2026-04-17-v1-providers-readonly-wire-contract说明.md`。
- 在 `realProvidersAdapter.ts`、`realProvidersDataSource.ts`、`realProvidersFetchTransport.ts` 补默认 contract 注释。
- 增强 `consoleDataSource.test.ts` 中 wire adapter / datasource contract 断言：
  - empty collection payload
  - null detail payload
  - transport `404 + null` detail 不调用 adapter，直接映射 `not-found`
- 同步验证记录与交付说明。

## 3. 不变项

- 不修改 `main.tsx`。
- 不新增 env key。
- 不接真实内网地址或真实认证。
- 不修改 deployment/browser 推荐入口。
- 不扩到 dashboard / environments / eval。

## 4. 验证要求

- `npm test`
- `npm run build`
- 误导表达全文搜索：
  - `保存策略`
  - `立即切流`
  - `发布到生产`
  - `启用自动路由`
  - `编辑生产白名单`
  - `立即应用配置`
