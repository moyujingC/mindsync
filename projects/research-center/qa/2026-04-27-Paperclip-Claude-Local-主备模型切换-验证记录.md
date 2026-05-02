# Paperclip claude_local 主备模型切换验证记录

> 状态：current
> 版本：0.1.0
> owner：QA / Engineer
> last_updated：2026-04-27
> source_of_truth：projects/research-center/qa/2026-04-27-Paperclip-Claude-Local-主备模型切换-验证记录.md
> depends_on：projects/research-center/tasks/2026-04-27-Paperclip-Claude-Local-主备模型切换-实施任务.md

## 1. 验证目标

确认 `Paperclip` 中 `claude_local` 这组 agent 已统一切到 `PPChat / gpt-5.4` 主链路，并保留 `AITechFlux / Claude混合版` 备用口径。

## 2. 最低验证项

- 读取 `Paperclip` runtime agent 列表
- 逐个抽查 `claude_local` agent 的 `adapterConfig.env`
- 确认：
  - `ANTHROPIC_BASE_URL=https://code.ppchat.vip/v1`
  - `ANTHROPIC_MODEL=gpt-5.4`
  - 默认 `OPUS / SONNET / HAIKU` 均跟随 `gpt-5.4`
- 确认仓库文档已写清 `AITechFlux / Claude混合版` 为备用口径

## 3. 风险提示

- 若 `Paperclip` 当前版本不支持跨不同 `base URL` 的自动模型回退，本轮备用口径仅作为显式切换配置，不代表自动失效转移已实现

## 4. 本次验证结果

- 已通过 `Paperclip` runtime API 逐个读取全部 `claude_local` agent
- 当前已确认以下 agent 生效为：
  - `Architect`
  - `Research & Knowledge Lead`
  - `Business Lead`
  - `CEO`
  - `Content Lead`
  - `UI / UX`
  - `Product Spec Lead`
- 上述 agent 当前运行值一致为：
  - `ANTHROPIC_BASE_URL=https://code.ppchat.vip/v1`
  - `ANTHROPIC_MODEL=gpt-5.4`
  - `ANTHROPIC_DEFAULT_OPUS_MODEL=gpt-5.4`
  - `ANTHROPIC_DEFAULT_SONNET_MODEL=gpt-5.4`
  - `ANTHROPIC_DEFAULT_HAIKU_MODEL=gpt-5.4`
- 备用元数据已写入：
  - `provider=AITechFlux`
  - `baseUrl=https://aitechflux.com/v1`
  - `model=Claude混合版`
  - `note=备用口径，当前未声明为自动回退。`
