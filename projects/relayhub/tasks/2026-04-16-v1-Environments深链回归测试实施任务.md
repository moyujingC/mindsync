# RelayHub v1 Environments 深链回归测试实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-16-v1-Environments深链回归测试实施任务.md
> 项目：RelayHub
> 阶段：implementation-plan
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/delivery/2026-04-16-v1-Providers筛选URL化与路由测试-交付说明.md, /Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-Environments深链回归测试-qa-basis.md

这份任务文档用于把 `RelayHub` 控制台现有最小路由回归，从 `Dashboard / Providers / Eval` 扩展到 `Environments`。

## 1. 任务目标

本轮目标是：

- 为 `Environments` 补齐深链回归测试
- 稳定断言 `overview / policies / runs / not-found / mock-error`
- 保持当前页面结构不变，只增强回归覆盖

## 2. 当前固定决策

实现过程中必须沿用以下固定决策：

- 不重写 `Environments` 页面结构
- 不改动信息架构与页面导航顺序
- 测试栈继续使用 `Vitest + Testing Library + MemoryRouter`
- `mock=error` 继续作为统一错误注入方式

## 3. 本轮要做的实现

### 3.1 Environments 路由测试

至少覆盖：

- `/environments/prod-aimandala/policies`
- `/environments/prod-aimandala/runs`
- `/environments/missing-environment/overview`
- `/environments/dev-relay/overview?mock=error`

### 3.2 断言目标

至少断言：

- 心理疗愈生产版“只允许国产模型”
- 生产版 runs 空态
- 环境 not-found 提示
- 环境详情错误态提示

### 3.3 测试辅助

如有必要，可轻量抽公共 helper，但不重构整体测试结构。

## 4. 本轮明确不做

本轮不做：

- mock API response shape 重构
- 真实 API 接入
- Playwright / E2E
- 页面结构重写

## 5. 完成标准

只有同时满足下面条件，才算本轮完成：

- `Environments` 深链测试已补齐
- `npm run build` 通过
- `npm test` 通过
- 已补新的验证记录与交付说明
