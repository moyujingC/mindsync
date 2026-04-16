# RelayHub v1 mock API response shape 整理验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-mock-api-response-shape整理-验证记录.md
> 项目：RelayHub
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-mock-api-response-shape整理-qa-basis.md, /Users/xinran/Downloads/dev/mindsync/projects/relayhub/console

这份文档记录 `RelayHub` 控制台在整理 mock API response shape 之后的验证结果。

## 1. 本轮验证范围

本轮验证对象为：

- `console/src/models/console.ts`
- `console/src/mocks/consoleApi.ts`
- `console/src/services/consoleData.ts`
- `console/src/test/consoleData.test.ts`
- 既有 `routes.test.tsx` 路由回归

## 2. 验证方式

### 2.1 自动化验证

- 在 `projects/relayhub/console` 运行 `npm install --cache .npm-cache`
- 运行 `npm test`
- 运行 `npm run build`

### 2.2 边界搜索

全文搜索：

- `保存策略`
- `立即切流`
- `发布到生产`
- `启用自动路由`
- `编辑生产白名单`
- `立即应用配置`

确认命中仍只出现在“明确不提供 / 不做”的说明语境中。

## 3. 验证结果

### 3.1 response envelope

结果：通过

说明：

- mock API 已统一返回带 `meta` 的 envelope
- 列表接口返回 `items`
- 单项详情返回 `item`
- 聚合接口返回 `overview`

### 3.2 service 解包

结果：通过

说明：

- service 层已承担 response 解包职责
- 页面层继续消费稳定 view model
- 未命中环境详情时仍返回 `null`
- provider 过滤逻辑在解包后仍然生效

### 3.3 自动化与构建

结果：通过

说明：

- `npm test` 已通过，共 `11` 条测试全部通过
- 新增 `consoleData` service 级测试 `4` 条
- 既有路由测试 `7` 条继续通过
- `npm run build` 已通过

### 3.4 边界表达

结果：通过

说明：

- 误导表达搜索命中仍只在“禁止 / 不提供”的说明语境中出现
- 心理疗愈生产版“只允许国产模型”的边界未被改写
- 未引入真实网络请求或任何写操作

## 4. 当前残留风险

1. 当前 mock envelope 是前端本地约定，不代表未来真实后端会直接复用同名字段。
2. 页面层目前仍未直接验证 `meta` 字段消费，因为本轮刻意把 envelope 隔离在 service 之下。
3. 当前测试重点在 service 和路由回归，还没有继续扩展到更细的筛选交互断言。

## 5. 结论

当前 `RelayHub` 控制台已经把 mock API shape 稍微向未来只读接口方向收束，同时保持页面层 view model 稳定，可继续推进更细的数据契约整理，而不需要回退页面实现。
