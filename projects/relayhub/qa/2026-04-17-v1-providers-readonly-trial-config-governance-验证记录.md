# RelayHub v1 Providers readonly trial config governance 验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / QA
> last_updated：2026-04-17
> source_of_truth：projects/relayhub/qa/2026-04-17-v1-providers-readonly-trial-config-governance-验证记录.md
> 项目：RelayHub
> 阶段：verification

## 1. 待验证项

- `npm test`
- `npm run build`
- 配置治理 parser / fallback 测试
- 默认 mock 启动行为
- 误导表达全文搜索

## 2. 结果

- `npm test` 通过，`4` 个 test file、`311` 个测试全部通过。
- `npm run build` 通过，类型检查与前端构建全部通过。
- 配置治理 parser / fallback 口径已通过自动化验证：
  - 默认配置继续解析为 mock。
  - 非法 mode、缺少 `baseUrl`、缺少 fetch 注入时继续回退 mock。
  - 合法 `RELAYHUB_PROVIDERS_READONLY_DEFAULT_HEADERS_JSON` 可进入 real-fetch config / transport。
  - 非法 JSON、非对象 JSON、空对象 JSON 会被忽略，不触发异常切换。
- deployment/browser 推荐入口的 trial 配置语义继续成立。
- 显式 `authHeadersResolver` 继续能进入 real-fetch 请求。
- 默认 bootstrap 路径继续保持 mock providers 行为。
- 误导表达全文搜索符合约束：
  - 当前新增命中位于 QA 检查项或任务文档语境。
  - `console/dist/` 为构建产物，不纳入源码交付边界。
