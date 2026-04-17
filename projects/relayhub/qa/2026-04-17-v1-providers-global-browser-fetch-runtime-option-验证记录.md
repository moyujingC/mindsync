# RelayHub v1 Providers global browser fetch runtime option 验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / QA
> last_updated：2026-04-17
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-17-v1-providers-global-browser-fetch-runtime-option-验证记录.md
> 项目：RelayHub
> 阶段：verification

## 1. 验证范围

验证 `RelayHub` 控制台当前新增的 `global-browser-fetch` runtime option 是否按预期工作，同时确认默认 mock 路径和既有页面行为未回归。

## 2. 执行记录

- `npm test`
  - 结果：通过
  - 汇总：`4` 个测试文件、`160` 条测试全部通过
- `npm run build`
  - 结果：通过
- 误导表达全文搜索
  - 结果：通过
  - 说明：源码与正式 artifact 中的命中继续只出现在“禁止 / 不提供 / 检查项”语境中；构建产物命中已在清理后排除

## 3. 预期结论

- `global-browser-fetch` 仅作为显式 runtime option 存在
- 默认启动仍不自动启用真实请求
- Providers real-fetch 仅在显式 runtime option 条件下进入
- 非 Providers 资源继续保持 mock-only
