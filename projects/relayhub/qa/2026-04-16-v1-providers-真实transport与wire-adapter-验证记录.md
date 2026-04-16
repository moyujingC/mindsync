# RelayHub v1 Providers 真实 transport 与 wire adapter 验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-providers-真实transport与wire-adapter-验证记录.md
> 项目：RelayHub
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-providers-真实transport与wire-adapter-qa-basis.md, /Users/xinran/Downloads/dev/mindsync/projects/relayhub/console

这份文档记录 `RelayHub` 控制台在为 `Providers` 试点抽出真实 transport 与 wire adapter 后的验证结果。

## 1. 本轮验证范围

本轮验证对象为：

- `services/realProvidersTransport.ts` 的 transport request / response 语义
- `services/realProvidersAdapter.ts` 的 collection / detail wire adapter
- `services/realProvidersDataSource.ts` 的 facade 编排与 contract 语义收口
- `consoleDataSource.test.ts`、`consoleData.test.ts`、`readonlyApiAdapters.test.ts` 与 `routes.test.tsx`

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

### 3.1 transport / adapter / facade 三层

结果：通过

说明：

- 已新增 providers 独立 transport 类型与文件
- 已新增 collection / detail wire adapter
- `realProvidersDataSource.ts` 已改为 transport + adapter + facade 编排

### 3.2 行为稳定

结果：通过

说明：

- collection 空结果仍返回 `status = empty`
- detail 缺失仍返回 `status = not-found`
- `meta.filters` 继续保留清洗后的合法筛选快照
- transport error 与 adapter error 均会继续向上抛出

### 3.3 自动化与构建

结果：通过

说明：

- `npm test` 已通过，共 `65` 条测试全部通过
- `consoleDataSource.test.ts` 已新增 transport / wire adapter / facade 编排验证
- `consoleData.test.ts`、`readonlyApiAdapters.test.ts` 与 `routes.test.tsx` 继续通过
- `npm run build` 已通过

### 3.4 边界表达

结果：通过

说明：

- 默认 datasource 仍继续使用 mock providers source
- 误导表达关键词搜索已确认命中只出现在“明确不提供 / 不做”的说明语境中
- 控制台只读边界与心理疗愈生产版“只允许国产模型”边界未被改写

## 4. 当前残留风险

1. 当前 transport 仍为前端测试 stub 驱动，尚未接入真实 base URL 与认证方式。
2. 当前 wire adapter 只覆盖最小 DTO 占位，尚未与真实后端返回字段做字段级校验。
3. 目前只有 providers 资源具备 transport / adapter 三层结构，其他资源仍保持 mock-only。

## 5. 结论

当前 `RelayHub` 控制台已经把 `Providers` 从“最小真实 fetch 形态”推进到“transport + wire adapter + facade”三层结构，为下一棒接真实只读 API 预留了更清晰的切换点。
