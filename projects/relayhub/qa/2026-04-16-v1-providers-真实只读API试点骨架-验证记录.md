# RelayHub v1 Providers 真实只读 API 试点骨架验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：projects/relayhub/qa/2026-04-16-v1-providers-真实只读API试点骨架-验证记录.md
> 项目：RelayHub
> 阶段：verification
> depends_on：projects/relayhub/qa/2026-04-16-v1-providers-真实只读API试点骨架-qa-basis.md, projects/relayhub/console

这份文档记录 `RelayHub` 控制台在为 `Providers` 抽首个真实只读 API 试点骨架后的验证结果。

## 1. 本轮验证范围

本轮验证对象为：

- `services/mockConsoleDataSource.ts` 的 datasource 组合工厂
- `services/realProvidersDataSource.ts` 的 providers 试点 stub
- `consoleDataSource.test.ts` 的 providers source 替换验证
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

### 3.1 providers 试点骨架

结果：通过

说明：

- 已新增 providers 专用试点 datasource 落位
- datasource 层已支持按资源组合，并允许单独替换 providers source
- providers 试点 stub 保持 `filters / empty / not-found` 语义稳定

### 3.2 默认行为保持

结果：通过

说明：

- 默认 datasource 仍返回现有 mock providers 行为
- 除 providers 试点切换入口外，dashboard / environments / eval 均保持原有 mock 路径
- `consoleData.ts` 与页面 helper 对外接口未变化

### 3.3 自动化与构建

结果：通过

说明：

- `npm test` 已通过，共 `50` 条测试全部通过
- `consoleDataSource.test.ts` 已新增 providers 试点骨架验证
- `consoleData.test.ts`、`readonlyApiAdapters.test.ts` 与 `routes.test.tsx` 继续通过
- `npm run build` 已通过

### 3.4 边界表达

结果：通过

说明：

- providers 试点仍是本地 stub，不发真实 HTTP 请求
- 未引入真实只读 API
- 未新增任何真实控制动作
- 心理疗愈生产版“只允许国产模型”和只读运营台边界未被改写

## 4. 当前残留风险

1. 当前 providers 试点只完成了切换骨架，尚未验证未来真实 datasource 与该 contract 的字段兼容性。
2. providers stub 目前仍使用本地静态数据，后续需要决定真实实现的 URL、错误映射和认证方式。
3. 目前只有 providers 资源具备试点切换骨架，其他资源仍未进入真实只读 API 准备阶段。

## 5. 结论

当前 `RelayHub` 控制台已经把 `Providers` 推进为首个可替换 datasource 的真实只读 API 试点资源，下一棒更适合开始规划真实 providers datasource 的最小接入方式。
