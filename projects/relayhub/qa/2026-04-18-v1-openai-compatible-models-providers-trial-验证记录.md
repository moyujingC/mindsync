# RelayHub v1 OpenAI-compatible models Providers trial 验证记录

> 状态：current
> 版本：0.1.0
> owner：Engineer / QA
> last_updated：2026-04-18
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/relayhub/qa/2026-04-18-v1-openai-compatible-models-providers-trial-验证记录.md
> 项目：RelayHub
> 阶段：verification

## 1. 待验证项

- `npm test`
- `npm run build`
- `npm run build:trial` with `RELAYHUB_PROVIDERS_READONLY_WIRE_CONTRACT=openai-models`
- `/relayhub-api/models` 同源代理
- `relayhub.jingshu.cc/providers` 与 detail smoke

## 2. 当前结果

- `npm test` 通过，`5` 个 test file、`325` 个测试全部通过。
- `npm run build` 通过，类型检查与生产构建通过。
- `RELAYHUB_CONSOLE_BASE_PATH=/ RELAYHUB_PROVIDERS_RUNTIME_MODE=real-fetch RELAYHUB_PROVIDERS_READONLY_BASE_URL=/relayhub-api RELAYHUB_PROVIDERS_READONLY_WIRE_CONTRACT=openai-models npm run build:trial` 通过。
- `openai-models` contract 本地验证通过：
  - 合法 `/models` payload 可映射为 Providers collection `ready`
  - 空数组可映射为 `empty`
  - detail 按 model id 命中时映射为 `ready`
  - detail 未命中 model id 时映射为 `not-found`
  - 非法 payload 抛出 `OpenAI-compatible models wire payload is invalid`
- 既有 `wireContract = "providers"` 测试继续通过，证明默认 Providers contract 未回归。
- release 线上验证已完成：
  - `https://relayhub.jingshu.cc/relayhub-api/models` 返回真实模型列表，当前样本数为 `19`
  - `https://relayhub.jingshu.cc/providers` 页面已显示真实 model-derived provider 列表
  - `https://relayhub.jingshu.cc/providers/gpt-5` 已显示真实 model-derived detail
  - nginx 通过固定 `Authorization: Bearer <token>` 注入上游认证头，token 未进入前端构建
