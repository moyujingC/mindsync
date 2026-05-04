# RelayHub v1 mock API meta 语义占位交付说明

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-16
> source_of_truth：projects/relayhub/delivery/2026-04-16-v1-mock-api-meta语义占位-交付说明.md
> 项目：RelayHub
> 阶段：delivery
> depends_on：projects/relayhub/qa/2026-04-16-v1-mock-api-meta语义占位-验证记录.md

这份文档用于把 `RelayHub` 控制台当前这轮 mock API `meta` 语义占位结果交给下一棒实现者。

## 1. 本轮已交付内容

当前新增内容包括：

- `MockResponseMeta` 扩展为带 `resource / scope / status / version / filters`
- `consoleApi` 为各类 response 填充最小语义化 `meta`
- `consoleData` 新增保留 `meta` 的 raw helper
- `consoleData.test.ts` 新增 `meta` 语义测试

## 2. 本轮仍明确不做

当前仍未实现：

- 单独的 contract 文件
- 页面层消费 `meta`
- 真实只读 API
- 真实控制动作
- E2E 浏览器测试

## 3. 当前结构意图

当前前端契约层已经形成：

- `mocks/`
  - 返回带最小语义化 `meta` 的 envelope
- `services/`
  - 默认继续解包给页面
  - 同时保留 raw helper 给测试与契约演进
- `pages/`
  - 继续只消费稳定 view model

这意味着下一棒如果要继续整理 contract 文件，不需要先回头拆页面或重做 service。

## 4. 下一阶段建议切入点

下一棒建议按下面顺序继续：

1. 抽出更显式的只读 contract 文件
2. 再评估页面层未来是否需要少量消费 `meta`
3. 再决定是否开始接真实只读 API

## 5. 一句话结论

当前 `RelayHub` 控制台已经把 mock API 契约推进到“带最小语义化 meta”的阶段，下一棒更适合继续整理 contract 层，而不是再补基础 URL 或路由稳定性。
