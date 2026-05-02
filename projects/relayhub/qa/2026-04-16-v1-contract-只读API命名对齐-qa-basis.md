# RelayHub v1 contract 只读 API 命名对齐 QA Basis

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：projects/relayhub/qa/2026-04-16-v1-contract-只读API命名对齐-qa-basis.md
> 项目：RelayHub
> 阶段：verification-basis
> depends_on：projects/relayhub/tasks/2026-04-16-v1-contract-只读API命名对齐实施任务.md

这份文档定义 `RelayHub` 控制台在为前端只读 contract 引入 `ReadonlyApi` 并行命名层时的最小验证口径。

## 1. 目标行为

本轮应满足以下目标行为：

1. `contracts/` 同时具备现有 `Contract*` 与新增 `ReadonlyApi*` 命名层
2. `consoleData.ts` 同时具备旧 raw helper 与新增 `*ReadonlyApiResponse()` helper
3. 页面 helper 返回的 view model 形态保持不变
4. `providers` 的 `meta.filters` 等既有语义保持稳定

## 2. 验收标准

### 2.1 contract 命名层

必须满足：

- `base.ts` 存在 `ReadonlyApiMeta / ReadonlyApiResponse`
- 各资源存在 `*ReadonlyApiResponse` alias
- `contracts/index.ts` 同时导出现有与新增命名

### 2.2 service 行为

必须满足：

- 新 helper 返回 `meta + data`
- 旧 raw helper 返回原 contract response
- 页面 helper 返回值不变

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

- `ReadonlyApi` 并行命名层已落位
- 自动化测试通过
- 构建通过
- `RelayHub` 项目边界未被改写
