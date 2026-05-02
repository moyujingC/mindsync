# RelayHub v1 Providers 筛选 URL 化与路由测试交付说明

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-16
> source_of_truth：projects/relayhub/delivery/2026-04-16-v1-Providers筛选URL化与路由测试-交付说明.md
> 项目：RelayHub
> 阶段：delivery
> depends_on：projects/relayhub/qa/2026-04-16-v1-Providers筛选URL化与路由测试-验证记录.md

这份文档用于把 `RelayHub` 控制台在 `Providers` URL 化与路由测试这一轮的结果交给下一棒实现者。

## 1. 本轮已交付内容

当前新增内容包括：

- `Providers` 页面筛选条件同步到 URL 查询参数
- `console/src/app/AppRoutes.tsx`
- `Vitest + Testing Library + jsdom` 最小测试基础设施
- `Dashboard` / `Providers` / `Eval` 路由级测试
- `Providers` 点击筛选后的 URL 更新回归
- `Providers` 详情深链保留查询参数回归
- `Providers?mock=error` 组合错误态回归

## 2. 本轮仍明确不做

当前仍未实现：

- 真实 API 集成测试
- E2E 浏览器测试
- 覆盖率门禁
- 真实控制动作

## 3. 当前结构意图

当前控制台已经具备两类稳定状态：

- 只读数据层与深链页面
- 可分享的 `Providers` 筛选 URL 与最小路由回归

这意味着下一棒如果继续接真实只读 API，可以先保持页面与测试结构不变，逐步替换数据源即可。

## 4. 下一阶段建议切入点

下一棒建议按下面顺序继续：

1. 为 `Providers` 查询参数补更细的边界组合测试，例如清除筛选与非法值回退
2. 继续扩展 `meta` 契约语义占位
3. 再决定是否引入更显式的只读 contract 文件

## 5. handoff 提醒

下一棒继续实现时，必须继续保持：

- 控制台是 `内部运营台`
- 数据层是 `只读`
- 不新增任何真实控制动作
- 心理疗愈生产版只允许国产模型

## 6. 一句话结论

当前控制台不仅能深链，还能分享 `Providers` 筛选状态并跑最小路由回归，已经从“只能人工点一点看”推进到“可以共享链接、可以自动回归”的阶段。
