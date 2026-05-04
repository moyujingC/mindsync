# RelayHub v1 OpenAI-compatible models Providers trial QA Basis

> 状态：current
> 版本：0.1.0
> owner：QA
> last_updated：2026-04-18
> source_of_truth：projects/relayhub/qa/2026-04-18-v1-openai-compatible-models-providers-trial-qa-basis.md
> 项目：RelayHub
> 阶段：qa

## 1. 核心验收

- `GET /v1/models` 合法 payload 可映射为 Providers collection `ready`。
- `/v1/models` 空数组可映射为 Providers collection `empty`。
- detail 查询通过 collection 复用按 `id` 命中时映射为 `ready`。
- detail 未命中 model id 时映射为 `not-found`。
- 非法 `/v1/models` payload 抛出清晰错误。
- 非 `2xx` 错误继续向上抛，不 fallback 到 mock。
- `wireContract = "providers"` 既有 contract 不回归。
- deployment/browser 推荐入口在 `wireContract = "openai-models"` 下继续可用。

## 2. release 验收

- `/api/models` 经 nginx 固定认证头后返回真实模型列表。
- `https://relayhub.jingshu.cc/providers` 显示真实 model-derived 列表。
- `https://relayhub.jingshu.cc/providers/:id` 可显示真实 model-derived detail。
- 默认 mock 主入口语义不变。

## 3. 回归范围

- `openAICompatibleModelsAdapter.test.ts`
- `consoleDataSource.test.ts`
- `consoleData.test.ts`
- `routes.test.tsx`
- `npm run build`
- `npm run build:trial`

## 4. 误导表达检查

- `保存策略`
- `立即切流`
- `发布到生产`
- `启用自动路由`
- `编辑生产白名单`
- `立即应用配置`

命中只能出现在“不提供 / 禁止 / QA检查项”语境中。
