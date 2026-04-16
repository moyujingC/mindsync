# RelayHub v1 Readonly API adapter 层 QA Basis

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-readonly-api-adapter层-qa-basis.md
> 项目：RelayHub
> 阶段：verification-basis
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-16-v1-readonly-api-adapter层实施任务.md

这份文档定义 `RelayHub` 控制台在抽出独立 `Readonly API adapter` 层时的最小验证口径。

## 1. 目标行为

本轮应满足以下目标行为：

1. 基础 envelope 适配逻辑从 `consoleData.ts` 中抽离
2. adapter 层统一承接 `Contract* -> ReadonlyApiResponse`
3. 现有 `*ReadonlyApiResponse()` helper 行为不变
4. 页面 helper 与路由行为保持不变

## 2. 验收标准

### 2.1 adapter 层

必须满足：

- 存在独立 adapter 文件
- overview / collection / detail 三类转换均有显式函数
- collection 适配不丢失 `meta.filters`

### 2.2 service 行为

必须满足：

- `consoleData.ts` 不再内嵌基础 envelope 适配函数
- 现有 `*ReadonlyApiResponse()` helper 继续可用
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

- adapter 层已独立落位
- 自动化测试通过
- 构建通过
- `RelayHub` 项目边界未被改写
