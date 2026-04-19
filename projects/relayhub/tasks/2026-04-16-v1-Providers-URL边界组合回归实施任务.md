# RelayHub v1 Providers URL 边界组合回归实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-16-v1-Providers-URL边界组合回归实施任务.md
> 项目：RelayHub
> 阶段：implementation-plan
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/delivery/2026-04-16-v1-Providers筛选URL化与路由测试-交付说明.md, /Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-Providers-URL边界组合回归-qa-basis.md

这份任务文档用于把 `RelayHub` 控制台当前 `Providers` 页的 URL 状态能力，从“主流程可分享”继续推进到“边界组合可稳定回归”。

## 1. 任务目标

本轮目标是：

- 为 `Providers` URL 查询参数补边界组合测试
- 固化非法值回退、清除筛选、默认值省略与 `mock=error` 共存行为
- 保持 `Providers` 页面继续是只读浏览页，而不是控制台配置面

## 2. 当前固定决策

实现过程中必须沿用以下固定决策：

- 不新增新的查询参数名
- 不改变现有 `kind / environment / health / transparency / mock` 语义
- 非法值仍回退为 `全部`
- `mock=error` 继续作为本地调试错误注入参数
- provider 详情链接继续继承筛选参数，但不透传 `mock`

## 3. 本轮要做的实现

### 3.1 Providers URL 边界回归

至少覆盖：

- 非法 `kind` 值回退到 `全部`
- 非法 `environment` 值回退到 `全部`
- 点击 `全部` 后删除对应参数
- 多参数场景下仅删除目标参数，其他参数保留
- `mock=error` 与筛选参数共存时仍保留 `mock=error`
- provider 详情链接只继承当前合法筛选参数

### 3.2 测试辅助

允许继续使用当前 `LocationProbe` 观察当前路由，不额外引入浏览器 E2E 工具。

## 4. 本轮明确不做

本轮不做：

- 页面结构重写
- 数据层改造
- 真实 API
- Playwright / E2E
- 本地存储同步
- 任何真实控制动作

## 5. 完成标准

只有同时满足下面条件，才算本轮完成：

- `Providers` URL 边界组合测试已补齐
- `npm test` 通过
- `npm run build` 通过
- 已补新的验证记录与交付说明
