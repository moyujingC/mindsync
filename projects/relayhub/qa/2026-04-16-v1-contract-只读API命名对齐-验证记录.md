# RelayHub v1 contract 只读 API 命名对齐验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-contract-只读API命名对齐-验证记录.md
> 项目：RelayHub
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-contract-只读API命名对齐-qa-basis.md, /Users/xinran/Downloads/dev/mindsync/projects/relayhub/console

这份文档记录 `RelayHub` 控制台在为前端只读 contract 引入 `ReadonlyApi` 并行命名层后的验证结果。

## 1. 本轮验证范围

本轮验证对象为：

- `contracts/base.ts` 的 `ReadonlyApiMeta / ReadonlyApiResponse`
- `contracts/dashboard.ts / environments.ts / providers.ts / eval.ts` 的 `*ReadonlyApiResponse` alias
- `contracts/index.ts` 的并行导出
- `services/consoleData.ts` 的 `*ReadonlyApiResponse()` helper
- `consoleData.test.ts` 的 `meta + data` 适配验证

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

### 3.1 contract 并行命名层

结果：通过

说明：

- `base.ts` 已新增 `ReadonlyApiMeta / ReadonlyApiResponse`
- 各资源已新增 `*ReadonlyApiResponse` alias
- `contracts/index.ts` 已同时导出现有 `Contract*` 与新增 `ReadonlyApi*`

### 3.2 service helper 适配

结果：通过

说明：

- `consoleData.ts` 已新增 `*ReadonlyApiResponse()` helper
- 新 helper 均返回 `meta + data`
- 旧 raw helper 与页面 helper 保持原语义不变

### 3.3 自动化与构建

结果：通过

说明：

- `npm test` 已通过，共 `35` 条测试全部通过
- `consoleData.test.ts` 已新增 `ReadonlyApiResponse` 适配验证
- `routes.test.tsx` 继续通过，页面行为未受影响
- `npm run build` 已通过

### 3.4 边界表达

结果：通过

说明：

- mock API 继续输出当前 `Contract*` response
- 未引入真实只读 API
- 未新增任何真实控制动作
- 心理疗愈生产版“只允许国产模型”和只读运营台边界未被改写

## 4. 当前残留风险

1. 当前 `ReadonlyApiResponse` 仍是 service 层适配出来的前端对齐语义，尚未与真实只读 API 做字段级校验。
2. `contracts/` 现在同时承载 `Contract*` 与 `ReadonlyApi*` 两套命名，后续若长期共存，需要再评估收敛策略。
3. `consoleData.ts` 继续累积多组 helper，后续若资源继续增长，可能需要把 adapter / mapper 按资源拆分。

## 5. 结论

当前 `RelayHub` 控制台已经把前端只读 contract 推进到“具备并行 `ReadonlyApi` 命名层”的状态，下一棒更适合开始评估真实只读 API 接入前的适配边界，而不是再回头补基础 contract 语义。
