# RelayHub v1 Providers readonly 最小接入验证 实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-18
> source_of_truth：projects/relayhub/tasks/2026-04-18-v1-providers-readonly-最小接入验证实施任务.md
> 项目：RelayHub
> 阶段：implementation

## 1. 目标

- 在现有 readonly trial、config governance、wire contract 基础上补一轮最小接入验证。
- 通过本地契约夹具收口推荐入口 request/response 验证。
- 不新增 seam / wrapper / stub server。

## 2. 实施项

- 新增 `projects/relayhub/specs/2026-04-18-v1-providers-readonly-最小接入验证说明.md`。
- 在 `console/src/test/` 下新增私有 readonly contract fixture/helper。
- 收敛 `consoleDataSource.test.ts` 中的推荐入口 smoke 与默认 contract 样例，复用该 helper。
- 同步 QA basis、验证记录与交付说明。

## 3. 固定边界

- 不修改 `main.tsx`。
- 不新增 env key。
- 不接真实内网地址或真实认证。
- 不新增本地 HTTP stub 服务。
- 不扩到 dashboard / environments / eval。

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
