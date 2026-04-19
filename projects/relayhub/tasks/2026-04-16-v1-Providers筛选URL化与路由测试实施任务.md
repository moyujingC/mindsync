# RelayHub v1 Providers 筛选 URL 化与路由测试实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer / Test / QA
> last_updated：2026-04-16
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/tasks/2026-04-16-v1-Providers筛选URL化与路由测试实施任务.md
> 项目：RelayHub
> 阶段：implementation-plan
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/delivery/2026-04-16-v1-控制台只读数据化-交付说明.md, /Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-16-v1-Providers筛选URL化与路由测试-qa-basis.md

这份任务文档用于把 `RelayHub` 控制台继续从“可深链的只读运营台”推进到“筛选状态可分享、核心路由有自动化回归”的状态。

## 1. 任务目标

本轮目标是：

- 将 `Providers` 筛选条件同步到 URL 查询参数
- 保证刷新、复制链接、返回前进后筛选状态不丢失
- 为 `Dashboard`、`Providers`、`Eval` 补路由级自动化测试
- 保持控制台仍为只读运营台，不引入任何写操作

## 2. 当前固定决策

实现过程中必须沿用以下固定决策：

- 筛选状态仅进入 URL 查询参数，不写本地存储
- 查询参数只覆盖 `Providers` 页面，不外溢到其他模块
- 自动化测试只做路由 / 页面渲染与核心边界表达，不引入 E2E 浏览器测试
- 测试栈优先使用 `Vitest + Testing Library`
- mock 数据仍通过本地 TypeScript mock API 提供

## 3. 本轮要做的实现

### 3.1 Providers 查询参数

至少同步以下条件：

- `kind`
- `environment`
- `health`
- `transparency`

要求：

- 无筛选时尽量保持 URL 简洁
- URL 变化后页面重新取数
- 页面首次加载会从 URL 恢复筛选状态

### 3.2 路由测试

至少覆盖：

- `/dashboard`
- `/providers/freebridge-sandbox`
- `/providers/freebridge-sandbox?kind=免费国外%20API&environment=开发版`
- `/eval/recommendations`

测试目标：

- 页面能正确进入指定上下文
- 关键边界文案存在
- 空态 / 推荐态能被稳定断言

### 3.3 测试基础设施

新增最小测试基础设施，至少包括：

- `vitest` 配置
- `jsdom` 环境
- React Testing Library 基础 setup

本轮不要求：

- Playwright
- 截图测试
- 覆盖率门禁

## 4. 本轮明确不做

本轮不做：

- 真实 API 集成测试
- 真实后端契约校验
- E2E 浏览器自动化
- 筛选条件写入本地缓存
- 任何真实控制面动作

## 5. 实施顺序

建议按下面顺序推进：

1. 补 task / qa artifact
2. 改造 `Providers` 查询参数同步
3. 跑构建验证
4. 接入 `Vitest + Testing Library`
5. 编写 `Dashboard` / `Providers` / `Eval` 路由测试
6. 跑测试与边界检查
7. 补验证记录与交付说明

## 6. 完成标准

只有同时满足下面条件，才算本轮完成：

- `Providers` 筛选状态可通过 URL 分享与恢复
- 核心路由测试已存在并可运行
- `npm run build` 与测试命令通过
- 不新增任何真实控制动作
- 已补新的验证记录与交付说明
