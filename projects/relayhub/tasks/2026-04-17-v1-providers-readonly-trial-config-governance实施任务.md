# RelayHub v1 Providers readonly trial config governance 实施任务

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/tasks/2026-04-17-v1-providers-readonly-trial-config-governance实施任务.md
> 项目：RelayHub
> 阶段：implementation

## 1. 目标

- 收口 Providers readonly real-fetch trial 的配置治理口径。
- 明确推荐配置入口、最小必需项、可选项与回退规则。
- 不新增 seam / wrapper / env key。

## 2. 实施项

- 新增 `projects/relayhub/specs/2026-04-17-v1-providers-readonly-trial-config-governance说明.md`。
- 在 env/config/runtime 入口补配置治理注释。
- 增强 `consoleDataSource.test.ts` 中 env/config parser 断言：
  - mock / invalid mode / 缺 baseUrl / 缺 fetchImpl
  - 合法 default headers JSON
  - 非法、非对象、空对象 default headers JSON
- 同步验证记录与交付说明。

## 3. 不变项

- 不修改 `main.tsx`。
- 不接真实内网地址。
- 不定义真实认证方式。
- 不新增 auth env key。
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
