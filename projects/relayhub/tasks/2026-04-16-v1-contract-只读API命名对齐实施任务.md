# RelayHub v1 contract 只读 API 命名对齐实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer / Architect / Test
> last_updated：2026-04-16
> source_of_truth：projects/relayhub/tasks/2026-04-16-v1-contract-只读API命名对齐实施任务.md
> 项目：RelayHub
> 阶段：implementation-plan
> depends_on：projects/relayhub/delivery/2026-04-16-v1-contract-脱离页面模型-交付说明.md

这份任务文档用于把 `RelayHub` 控制台当前前端只读 contract，继续以 `ReadonlyApi` 并行命名层推进到更接近未来真实只读 API 的语义。

## 1. 任务目标

本轮目标是：

- 在不打断现有页面 helper 与 raw helper 的前提下，引入 `ReadonlyApi*` 并行命名层
- 为各资源补 `meta + data` 语义的只读 response alias
- 在 service 层新增 `*ReadonlyApiResponse()` helper，承接当前 contract envelope 到只读 API 语义的适配
- 保持页面信息架构、只读边界与 mock API 行为稳定

## 2. 当前固定决策

实现过程中必须沿用以下固定决策：

- 采用并行别名，不做原地替换
- mock API 继续返回当前 `Contract*` response
- 页面层继续不直接消费 `ReadonlyApiResponse`
- 不引入真实只读 API、不引入写操作、不改页面结构

## 3. 本轮要做的实现

### 3.1 contract 基础别名

要求：

- 在 `base.ts` 新增 `ReadonlyApiMeta / ReadonlyApiResponse / ReadonlyApiResource / ReadonlyApiScope / ReadonlyApiStatus`
- `ReadonlyApiResponse` 统一表达为 `meta + data`
- 旧 `Contract*` 类型继续保留

### 3.2 资源级 response alias

要求：

- 为 `dashboard / environments / providers / eval` 增加 `*ReadonlyApiResponse` alias
- `data` 分别对齐当前 `overview / items / item`
- payload contract 本轮不改字段名

### 3.3 service 适配 helper

要求：

- 在 `consoleData.ts` 新增 `*ReadonlyApiResponse()` helper
- helper 只做 envelope 适配，不做页面 model 映射
- 页面 helper 与旧 raw helper 的函数名和语义保持不变

## 4. 本轮明确不做

本轮不做：

- 真实只读 API
- 更接近后端 wire format 的 payload 字段改名
- 页面层消费 `ReadonlyApiResponse`
- mock API 直接切到 `data`
- 任何真实控制动作

## 5. 完成标准

只有同时满足下面条件，才算本轮完成：

- `ReadonlyApi` 并行命名层已落位
- `*ReadonlyApiResponse()` helper 已可用
- `npm test` 通过
- `npm run build` 通过
- 已补 QA 验证记录与交付说明
