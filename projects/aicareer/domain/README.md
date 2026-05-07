# Domain
> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/aicareer/domain/README.md


这里放 `aicareer` 的领域模型和核心流程定义。

第一版优先包含：

- `profile`
- `conversation_turn`
- `experience_item`
- `timeline_summary`
- `narrative_draft`
- `career_asset`

当前已落地：

- `career-asset.js`
- `types.js`

当前主链路：

- `workflow snapshot -> career asset input -> markdown output`
- `review feedback -> updated career asset input -> markdown output`

这里应保持尽量纯净，不耦合具体 UI 或外部平台细节。
