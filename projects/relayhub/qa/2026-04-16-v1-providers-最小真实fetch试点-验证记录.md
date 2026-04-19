# RelayHub v1 Providers 最小真实 fetch 试点验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-providers-最小真实fetch试点-验证记录.md
> 项目：RelayHub
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-providers-最小真实fetch试点-qa-basis.md, /Users/xinran/Downloads/dev/mindsync/projects/relayhub/console

这份文档记录 `RelayHub` 控制台在把 `Providers` 试点骨架推进到“最小真实 fetch 方案”后的验证结果。

## 1. 本轮验证范围

本轮验证对象为：

- `services/realProvidersDataSource.ts` 的 request input、URL builder 与 datasource facade
- `services/mockConsoleDataSource.ts` 的 providers source 组合能力
- `consoleDataSource.test.ts` 的 providers 最小真实 fetch 方案验证
- 现有 `consoleData.test.ts`、`readonlyApiAdapters.test.ts` 与 `routes.test.tsx`

## 2. 验证方式

### 2.1 自动化验证

- 在 `projects/relayhub/console` 运行 `npm install --cache .npm-cache`
- 运行 `npm test`
- 运行 `npm run build`

### 2.2 误导表达搜索

全文搜索：

- `保存策略`
- `立即切流`
- `发布到生产`
- `启用自动路由`
- `编辑生产白名单`
- `立即应用配置`

确认命中仍只出现在“明确不提供 / 不做”的说明语境中。

## 3. 验证结果

### 3.1 最小真实 request 形态

结果：通过

说明：

- 已新增 `ProvidersReadonlyRequest`
- 已新增 collection / detail 的 URL builder
- request input 已固定 `resource / scope / path / providerId? / filters? / forceError?`

### 3.2 contract 语义保持

结果：通过

说明：

- collection 命中时返回 `status = ready`
- collection 空结果时返回 `status = empty`
- detail 缺失时返回 `status = not-found` 且 `item = null`
- `meta.filters` 继续保留清洗后的合法筛选快照

### 3.3 筛选与调试参数边界

结果：通过

说明：

- 真实 request 只透传合法 `kind / environment / health / transparency`
- `全部` 与非法值不会进入 query string
- `mock=error` 没有进入真实 request input
- `forceError` 继续作为前端调试选项使用

### 3.4 自动化与构建

结果：通过

说明：

- `npm test` 已通过，共 `58` 条测试全部通过
- `consoleDataSource.test.ts` 已补齐 providers 最小真实 fetch 方案测试
- `consoleData.test.ts`、`readonlyApiAdapters.test.ts` 与 `routes.test.tsx` 继续通过
- `npm run build` 已通过

### 3.5 边界表达

结果：通过

说明：

- 默认 datasource 仍使用 mock providers source
- 未接入真实内网地址或真实网络请求
- 未新增任何写操作或真实控制动作
- 心理疗愈生产版“只允许国产模型”和只读运营台边界未被改写

## 4. 当前残留风险

1. 当前真实 providers datasource 仍停留在“请求形态 + adapter”阶段，尚未验证真实接口字段兼容性。
2. URL 规则已经落位，但 base URL、认证与错误协议仍未定义。
3. 目前只有 providers 资源进入最小真实 fetch 准备阶段，其他资源仍保持 mock-only。

## 5. 结论

当前 `RelayHub` 控制台已经把 `Providers` 推进到“最小真实 fetch 方案”阶段，下一棒可以在不改页面与 `consoleData` 对外接口的前提下，继续接入真实只读 providers API。
