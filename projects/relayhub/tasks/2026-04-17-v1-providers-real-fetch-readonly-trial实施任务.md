# RelayHub v1 Providers real-fetch readonly trial 实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/tasks/2026-04-17-v1-providers-real-fetch-readonly-trial实施任务.md
> 项目：RelayHub
> 阶段：implementation

## 1. 目标

- 停止继续新增 seam / wrapper。
- 基于现有推荐入口正式收口 Providers readonly real-fetch trial。
- 补齐推荐接入说明、最小入口注释与高信号 smoke 验证。

## 2. 实施项

- 新增 `projects/relayhub/specs/2026-04-17-v1-providers-real-fetch-readonly-trial接入说明.md`。
- 在 deployment/browser/runtime 相关入口文件顶部补简短推荐路径注释。
- 收敛 `console/src/test/consoleDataSource.test.ts` 中推荐路径 smoke：
  - deployment `env`
  - browser `browser-fetch`
  - browser `browser-fetch-source`
- 明确保留默认 mock 启动，不修改 `main.tsx`。

## 3. 不变项

- 不新增新的 app/runtime public wrapper。
- 不新增 auth env key。
- 不扩到 dashboard / environments / eval。
- 不引入 refresh、cache、expiry、credential store。

## 4. 验证要求

- `npm test`
- `npm run build`
- 误导表达全文搜索：
  - `保存策略`
  - `立即切流`
  - `发布到生产`
  - `启用自动路由`
  - `编辑生产白名单`
  - `立即应用配置`
