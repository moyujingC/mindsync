# RelayHub v1 Providers real-fetch readonly trial 交付说明

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/delivery/2026-04-17-v1-providers-real-fetch-readonly-trial-交付说明.md
> 项目：RelayHub
> 阶段：delivery

## 1. 本轮交付

- 正式补齐 Providers readonly real-fetch trial 接入说明。
- 在 deployment/browser/runtime 推荐入口补最小收口注释。
- 把推荐路径 smoke 收敛为更明确的 deployment/browser trial 验证。

## 2. 保持不变

- 默认启动继续保持 mock。
- 不新增 seam / wrapper。
- 不新增 auth env key。
- 不扩到 Providers readonly 之外的资源域。

## 3. 验证

- `npm test` 通过，`4` 个 test file、`310` 个测试全部通过。
- `npm run build` 通过，类型检查与前端构建全部通过。
- 推荐 deployment/browser real-fetch smoke 已形成正式 trial 验证口径。
- 误导表达全文搜索符合约束；新增命中仅位于 QA 检查项与任务文档语境。

## 4. 残留边界

- compatibility-only 入口继续保留，但不再作为试点文档主路径。
- 若后续继续推进，应优先围绕真实接入和治理闭环，而不是继续扩 seam。
- `console/dist/` 为构建产物，不属于本轮交付源码边界。
