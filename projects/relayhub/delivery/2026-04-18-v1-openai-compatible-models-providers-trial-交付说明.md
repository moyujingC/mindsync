# RelayHub v1 OpenAI-compatible models Providers trial 交付说明

> 状态：historical-reference
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-04-18
> source_of_truth：projects/relayhub/delivery/2026-04-18-v1-openai-compatible-models-providers-trial-交付说明.md
> 项目：RelayHub
> 阶段：delivery

## 1. 本轮交付

- 新增 OpenAI-compatible `/v1/models -> ProviderRecordContract` 适配链。
- 在现有 Providers real-fetch 主链上新增 `openai-models` wire contract。
- 让 release trial 能通过同源 `/api/models` 读取真实模型目录。

## 2. 保持不变

- 默认 `main.tsx` 继续保持 mock。
- 既有 `/providers` contract 继续保留。
- token 不进入前端构建与仓库代码。

## 3. 验证

- `npm test` 通过，`5` 个 test file、`325` 个测试全部通过。
- `npm run build` 通过。
- `openai-models` trial 构建通过，可显式生成同源 `/api` 的真实只读试用入口。
- release 线上已验证：
  - `/api/models` 返回真实 OpenAI-compatible 模型目录
  - `/providers` 列表页显示真实 model-derived provider
  - `/providers/gpt-5` 详情页显示真实 model-derived detail

## 4. 残留边界

- release 侧仍需由 nginx 固定注入 Bearer token。
- 本轮详情页仍通过 `/models` collection 派生，不要求上游提供 `/models/:id`。
- 默认主入口继续保持 mock，不自动切换真实链路。
