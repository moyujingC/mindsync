# RelayHub v1 Providers URL 边界组合回归 QA Basis

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-Providers-URL边界组合回归-qa-basis.md
> 项目：RelayHub
> 阶段：verification-basis
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-16-v1-Providers-URL边界组合回归实施任务.md

这份文档定义 `RelayHub` 控制台在补齐 `Providers` URL 边界组合回归时的最小验证口径。

## 1. 目标行为

本轮应满足以下目标行为：

1. 非法查询参数不会污染页面当前筛选状态
2. 点击 `全部` 后 URL 会删除对应参数
3. `mock=error` 不会被筛选交互误删
4. provider 详情深链只继承当前合法筛选参数

## 2. 验收标准

### 2.1 查询参数回退与清洗

必须满足：

- 非法 `kind / environment / health / transparency` 会回退到 `全部`
- 非法参数场景下，后续任一合法筛选交互会产出清洗后的 URL
- 单参数场景点击 `全部` 后 URL 保持简洁，不写入 `全部`

### 2.2 查询参数保留与删除

必须满足：

- 多参数场景点击某组 `全部` 时，仅删除该组参数
- `mock=error` 在筛选交互后仍保留
- provider 详情链接不透传 `mock`

### 2.3 边界表达

必须满足：

- 页面仍是只读浏览页
- 不出现真实控制动作文案
- 生产边界与国产模型约束不被改写

## 3. 验证方式

本轮至少执行：

1. `npm test`
2. `npm run build`
3. 误导表达全文搜索

## 4. 通过标准

只有同时满足下面条件，才允许宣布本轮完成：

- `Providers` URL 边界组合测试通过
- 原有路由与 service 测试继续通过
- 构建通过
- 只读边界未被改写
