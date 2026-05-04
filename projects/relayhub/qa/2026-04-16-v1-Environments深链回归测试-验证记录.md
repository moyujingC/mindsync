# RelayHub v1 Environments 深链回归测试验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：projects/relayhub/qa/2026-04-16-v1-Environments深链回归测试-验证记录.md
> 项目：RelayHub
> 阶段：verification
> depends_on：projects/relayhub/qa/2026-04-16-v1-Environments深链回归测试-qa-basis.md, projects/relayhub/console

这份文档记录 `RelayHub` 控制台在补齐 `Environments` 深链回归测试后的验证结果。

## 1. 本轮验证范围

本轮验证对象为：

- `Environments` 深链路由测试
- 生产版 policy 文案断言
- runs 空态断言
- not-found 与 mock-error 断言

## 2. 验证方式

### 2.1 构建与测试

- 在 `projects/relayhub/console` 运行 `npm install --cache .npm-cache`
- 运行 `npm run build`
- 运行 `npm test`

### 2.2 误导表达搜索

全文搜索：

- `保存策略`
- `立即切流`
- `发布到生产`
- `启用自动路由`
- `编辑生产白名单`
- `立即应用配置`

确认命中仍只在“明确不做”语境中出现。

## 3. 验证结果

### 3.1 Environments 深链覆盖

结果：通过

说明：

- `npm test` 已通过，`src/test/routes.test.tsx` 共 `7` 条测试全部通过
- 已新增 `policies` 深链测试
- 已新增 `runs` 空态测试
- 已新增 `missing-environment` not-found 测试
- 已新增 `mock=error` 错误态测试

### 3.2 生产边界表达

结果：通过

说明：

- 测试已稳定断言“当前生产版只允许国产模型。”
- 未引入任何真实控制动作

### 3.3 构建与误导表达搜索

结果：通过

说明：

- `npm run build` 已通过
- 全文搜索命中仍只出现在“明确不提供 / 不做”的说明语境中

## 4. 当前残留风险

1. 当前 `Environments` 测试仍是路由级渲染，不覆盖更细交互事件。
2. 其他环境子页如 `routes` / `usage` 目前尚未单独做自动化回归。

## 5. 结论

当前 `RelayHub` 控制台的 `Environments` 已加入核心深链回归测试，核心只读页面的最小路由级自动化覆盖更加完整。
