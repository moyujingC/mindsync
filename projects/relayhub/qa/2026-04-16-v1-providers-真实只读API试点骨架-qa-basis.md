# RelayHub v1 Providers 真实只读 API 试点骨架 QA Basis

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：projects/relayhub/qa/2026-04-16-v1-providers-真实只读API试点骨架-qa-basis.md
> 项目：RelayHub
> 阶段：verification-basis
> depends_on：projects/relayhub/tasks/2026-04-16-v1-providers-真实只读API试点骨架实施任务.md

这份文档定义 `RelayHub` 控制台在为 `Providers` 落真实只读 API 试点骨架时的最小验证口径。

## 1. 目标行为

本轮应满足以下目标行为：

1. datasource 层可以单独替换 providers source
2. 默认 datasource 仍保持现有 mock providers 行为
3. providers 试点 stub 保持 `filters / empty / not-found` 语义
4. 页面与 service 对外接口保持不变

## 2. 验收标准

### 2.1 providers 试点骨架

必须满足：

- 存在 providers 专用试点 datasource 落位
- 存在 datasource 组合工厂
- providers source 可以被单独替换

### 2.2 行为稳定

必须满足：

- 默认 providers 行为仍来自 mock
- providers 试点替换后只影响 providers 资源
- `consoleData.ts` 与页面 helper 返回值不变

### 2.3 边界保持

必须满足：

- 不引入真实 API
- 不新增真实控制动作
- 生产边界与只读边界不被改写

## 3. 验证方式

本轮至少执行：

1. `npm test`
2. `npm run build`
3. 误导表达全文搜索

## 4. 通过标准

只有同时满足下面条件，才允许宣布本轮完成：

- providers 试点骨架已落位
- 自动化测试通过
- 构建通过
- `RelayHub` 项目边界未被改写
