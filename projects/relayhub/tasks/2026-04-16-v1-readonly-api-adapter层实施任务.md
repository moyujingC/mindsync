# RelayHub v1 Readonly API adapter 层实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect / Test
> last_updated：2026-04-16
> source_of_truth：projects/relayhub/tasks/2026-04-16-v1-readonly-api-adapter层实施任务.md
> 项目：RelayHub
> 阶段：implementation-plan
> depends_on：projects/relayhub/delivery/2026-04-16-v1-contract-只读API命名对齐-交付说明.md

这份任务文档用于把 `RelayHub` 控制台当前 `ReadonlyApiResponse()` helper 的 envelope 适配逻辑，从 `consoleData.ts` 中抽成独立 adapter 层。

## 1. 任务目标

本轮目标是：

- 抽出独立的只读 adapter 文件，承接 `Contract*` 到 `ReadonlyApiResponse` 的转换
- 让 `consoleData.ts` 保持资源编排与页面解包职责，不再内嵌基础 envelope 适配函数
- 为后续真实只读 API 接入预留更清晰的替换点
- 保持页面 helper、raw helper 和 `ReadonlyApiResponse()` helper 的对外语义不变

## 2. 当前固定决策

实现过程中必须沿用以下固定决策：

- `ReadonlyApiResponse` 仍视为前端对齐层，而不是真实后端已定稿 contract
- mock API 继续返回当前 `Contract*` response
- 页面层继续不直接消费 `ReadonlyApiResponse`
- 不引入真实只读 API、不引入写操作、不改页面结构

## 3. 本轮要做的实现

### 3.1 adapter 文件落位

要求：

- 新增独立 adapter 文件，例如 `services/readonlyApiAdapters.ts`
- 至少抽出 overview / collection / detail 三类适配函数
- adapter 函数统一返回 `meta + data`

### 3.2 service 职责收束

要求：

- `consoleData.ts` 改为复用 adapter 层
- 移除内嵌在 `consoleData.ts` 内的基础 envelope 适配函数
- 保持现有 `*ReadonlyApiResponse()` helper 的函数名与返回语义不变

### 3.3 adapter 测试

要求：

- 新增 adapter 层测试
- 覆盖 overview / collection / detail 三类转换
- 至少验证 `meta.filters` 在 collection 适配中不丢失

## 4. 本轮明确不做

本轮不做：

- 真实只读 API
- payload 字段向后端 wire format 命名迁移
- 页面层消费 `ReadonlyApiResponse`
- `Contract*` 与 `ReadonlyApi*` 的收敛
- 任何真实控制动作

## 5. 完成标准

只有同时满足下面条件，才算本轮完成：

- 独立 adapter 层已落位
- `consoleData.ts` 已复用 adapter 层
- `npm test` 通过
- `npm run build` 通过
- 已补 QA 验证记录与交付说明
