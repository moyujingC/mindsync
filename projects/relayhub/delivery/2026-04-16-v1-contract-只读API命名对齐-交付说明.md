# RelayHub v1 contract 只读 API 命名对齐交付说明

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-16
> source_of_truth：projects/relayhub/delivery/2026-04-16-v1-contract-只读API命名对齐-交付说明.md
> 项目：RelayHub
> 阶段：delivery
> depends_on：projects/relayhub/qa/2026-04-16-v1-contract-只读API命名对齐-验证记录.md

这份文档用于把 `RelayHub` 控制台当前这轮 `ReadonlyApi` 并行命名对齐结果交给下一棒实现者。

## 1. 本轮已交付内容

当前新增内容包括：

- `contracts/` 基础层新增 `ReadonlyApiMeta / ReadonlyApiResponse`
- 各资源新增 `*ReadonlyApiResponse` alias
- `consoleData.ts` 新增 `*ReadonlyApiResponse()` helper
- 现有 `Contract*`、raw helper 与页面 helper 全部保留

## 2. 本轮仍明确不做

当前仍未实现：

- 真实只读 API
- payload 字段向后端 wire format 命名迁移
- 页面层直接消费 `ReadonlyApiResponse`
- mock API 直接输出 `data`
- 任何真实控制动作

## 3. 当前结构意图

当前控制台前端已经形成更明确的双层 raw 语义：

- `Contract*`
  - 当前 mock response 契约
- `ReadonlyApi*`
  - 面向未来真实只读 API 的前端对齐语义
- `services/consoleData.ts`
  - 同时承接 raw contract helper
  - 与 `ReadonlyApiResponse` 适配 helper
  - 页面 view model 解包 helper

这意味着下一棒如果开始做真实只读 API 接入准备，可以优先替换 `ReadonlyApiResponse()` helper 的数据源，而不需要先动页面层。

## 4. 下一阶段建议切入点

下一棒建议按下面顺序继续：

1. 评估 `ReadonlyApiResponse()` helper 是否可以抽出成独立 adapter 层
2. 评估真实只读 API 接入时，哪些资源先接、哪些继续保留 mock
3. 再决定是否收敛 `Contract*` 与 `ReadonlyApi*` 的长期共存策略

## 5. 一句话结论

当前 `RelayHub` 控制台已经把前端只读 contract 推进到“当前 contract 与未来只读 API 语义并行存在”的状态，下一棒更适合开始做真实只读 API 接入准备，而不是再补命名基础层。
