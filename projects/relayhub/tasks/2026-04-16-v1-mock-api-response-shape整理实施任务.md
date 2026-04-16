# RelayHub v1 mock API response shape 整理实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-16-v1-mock-api-response-shape整理实施任务.md
> 项目：RelayHub
> 阶段：implementation-plan
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/delivery/2026-04-16-v1-Environments深链回归测试-交付说明.md, /Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-控制台只读数据化-qa-basis.md

这份任务文档用于把 `RelayHub` 控制台当前的前端本地 mock API，从“直接返回页面 view model”整理到“更接近未来只读接口的 response envelope”。

本轮目标不是接真实后端，而是在不改页面信息架构和只读边界的前提下，让 `mocks/` 与 `services/` 的职责边界更清楚。

## 1. 任务目标

本轮目标是：

- 为 mock API 增加统一的 response envelope
- 让 service 层承担解包职责，而不是让页面感知 mock response shape
- 保持页面层继续消费稳定 view model
- 补一层 service 级自动化测试，验证解包与过滤逻辑

## 2. 当前固定决策

实现过程中必须沿用以下固定决策：

- 控制台仍是 `内部运营台`
- 数据链路仍是 `只读`
- mock API 仍然只用本地 TypeScript 模块实现
- 页面层不新增真实控制能力
- 不改变 `Dashboard / Environments / Providers / Eval` 的现有页面结构

## 3. 本轮要做的实现

### 3.1 mock API envelope

至少补齐以下统一结构：

- `meta`
- `items` 或 `item`
- 对于聚合页使用明确的 `overview`

要求：

- `Dashboard` 与 `Eval` 返回聚合 overview envelope
- `Environments`、`Providers` 列表返回 collection envelope
- 单个环境与单个 provider 返回 detail envelope

### 3.2 service 解包

`console/src/services/consoleData.ts` 负责：

- 调用 mock API
- 解包 envelope
- 向页面继续返回稳定 view model

页面层不直接读取 envelope 字段。

### 3.3 测试补齐

新增 service 级测试，至少验证：

- dashboard overview 可被正确解包
- environment not-found 仍返回 `null`
- provider filter 仍然生效
- eval overview 可被正确解包

## 4. 本轮明确不做

本轮不做：

- 真实 API client
- schema codegen
- 页面结构重写
- 新的交互测试栈
- Playwright / E2E
- 任何写操作能力

## 5. 完成标准

只有同时满足下面条件，才算本轮完成：

- mock API 已有统一 response envelope
- service 层已承担解包职责
- 页面层无需感知新 shape
- `npm test` 通过
- `npm run build` 通过
- 已补验证记录与交付说明
