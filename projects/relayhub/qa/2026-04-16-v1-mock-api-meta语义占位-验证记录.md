# RelayHub v1 mock API meta 语义占位验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：projects/relayhub/qa/2026-04-16-v1-mock-api-meta语义占位-验证记录.md
> 项目：RelayHub
> 阶段：verification
> depends_on：projects/relayhub/qa/2026-04-16-v1-mock-api-meta语义占位-qa-basis.md, projects/relayhub/console

这份文档记录 `RelayHub` 控制台在扩展 mock API `meta` 语义占位后的验证结果。

## 1. 本轮验证范围

本轮验证对象为：

- `MockResponseMeta` 字段扩展
- `consoleApi` 中的 `meta.resource / scope / status / version / filters`
- `consoleData` 中保留 `meta` 的 raw helper
- 既有页面解包 service 与路由回归

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

### 3.1 meta 字段扩展

结果：通过

说明：

- `meta` 已补齐 `resource / scope / status / version`
- `Providers` 集合接口在需要时返回 `meta.filters`
- 页面消费模型未被改写

### 3.2 meta 语义覆盖

结果：通过

说明：

- `dashboard` 为 `overview + ready`
- `environments` 列表为 `collection + ready`
- 缺失环境详情为 `detail + not-found`
- 空 provider 列表为 `collection + empty`
- `eval` 为 `overview + ready`

### 3.3 service 与自动化

结果：通过

说明：

- `consoleData` 已新增 raw helper 保留 envelope 与 `meta`
- `npm test` 已通过，共 `26` 条测试全部通过
- `consoleData.test.ts` 已新增 `meta` 语义测试
- 既有路由测试继续通过
- `npm run build` 已通过

### 3.4 边界表达

结果：通过

说明：

- 页面层继续不直接消费 `meta`
- 未引入任何真实控制动作
- 生产边界与只读边界未被改写

## 4. 当前残留风险

1. 当前 `meta` 仍是 mock-only 契约占位，不代表未来真实后端会 1:1 复用。
2. `filters` 当前只覆盖 `Providers` 集合接口，还未抽象成更通用 contract 层。
3. 页面层目前不消费 `meta`，因此还没有真实 UI 依赖来反向证明字段长期稳定。

## 5. 结论

当前 `RelayHub` 控制台已经把 mock API 从“有 envelope”推进到“有最小语义化 meta”，并通过 raw helper 将契约层与页面层继续隔离，可作为下一阶段整理 contract 文件或接近真实只读 API 的稳定基础。
