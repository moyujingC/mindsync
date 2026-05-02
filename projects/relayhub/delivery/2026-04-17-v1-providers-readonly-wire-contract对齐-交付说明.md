# RelayHub v1 Providers readonly wire contract 对齐 交付说明

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/delivery/2026-04-17-v1-providers-readonly-wire-contract对齐-交付说明.md
> 项目：RelayHub
> 阶段：delivery

## 1. 本轮交付

- 新增 Providers readonly wire contract 说明。
- 明确默认 collection/detail wire shape、路径与错误映射。
- 补充 real-fetch adapter / datasource / transport contract 注释。
- 增强默认 wire contract 自动化验证。

## 2. 保持不变

- 默认启动继续保持 mock。
- 不新增 seam / wrapper。
- 不新增 env key。
- 不接真实 base URL 或真实认证。

## 3. 验证

- `npm test` 通过，`4` 个 test file、`314` 个测试全部通过。
- `npm run build` 通过，类型检查与前端构建全部通过。
- 默认 wire contract、adapter seam、deployment/browser 推荐 real-fetch smoke 全部继续通过。
- 误导表达全文搜索符合约束，新增命中仅位于 QA 检查项或任务文档语境；`console/dist/` 继续排除在源码交付边界外。

## 4. 残留边界

- 后续若继续推进，应在默认 wire contract 基础上进入真实后端接入与认证落位。
- `console/dist/` 为构建产物，不属于本轮源码交付边界。
