# RelayHub v1 Readonly API adapter 层验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-readonly-api-adapter层-验证记录.md
> 项目：RelayHub
> 阶段：verification
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-readonly-api-adapter层-qa-basis.md, /Users/xinran/Downloads/dev/mindsync/projects/relayhub/console

这份文档记录 `RelayHub` 控制台在抽出独立 `Readonly API adapter` 层后的验证结果。

## 1. 本轮验证范围

本轮验证对象为：

- `services/readonlyApiAdapters.ts`
- `services/consoleData.ts` 对 adapter 层的复用
- `readonlyApiAdapters.test.ts`
- 现有 `consoleData.test.ts` 与 `routes.test.tsx`

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

### 3.1 adapter 层落位

结果：通过

说明：

- 已新增独立 `readonlyApiAdapters.ts`
- overview / collection / detail 三类适配函数均已独立落位
- collection 适配对 `meta.filters` 保持透传

### 3.2 service 职责收束

结果：通过

说明：

- `consoleData.ts` 已不再内嵌基础 envelope 适配函数
- 现有 `*ReadonlyApiResponse()` helper 均改为复用 adapter 层
- 页面 helper 与 raw helper 的对外语义保持不变

### 3.3 自动化与构建

结果：通过

说明：

- `npm test` 已通过，共 `38` 条测试全部通过
- 新增 `readonlyApiAdapters.test.ts` 共 `3` 条测试
- `consoleData.test.ts` 与 `routes.test.tsx` 继续通过
- `npm run build` 已通过

### 3.4 边界表达

结果：通过

说明：

- 未引入真实只读 API
- 未新增任何真实控制动作
- 心理疗愈生产版“只允许国产模型”和只读运营台边界未被改写

## 4. 当前残留风险

1. 当前 adapter 层已独立，但仍位于 `services/` 下，后续若开始接真实 API，可能需要再评估是否单独提升为 `adapters/` 或 `contracts/adapters/`。
2. `Contract*` 与 `ReadonlyApi*` 仍并行存在，长期收敛策略尚未确定。
3. 当前 adapter 行为仍基于 mock contract 与前端测试验证，尚未与真实只读 API 做兼容性验证。

## 5. 结论

当前 `RelayHub` 控制台已经把 `ReadonlyApiResponse` 的基础 envelope 适配逻辑从 `consoleData.ts` 中抽离成独立 adapter 层，下一棒更适合开始评估真实只读 API 的接入边界与替换点。
