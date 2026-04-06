# 墨予镜现有 9 个 Agent 的 PaperClip 配置核对清单

> 状态：current
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-04-06
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/research-center/delivery/2026-04-06-墨予镜现有9个Agent的PaperClip配置核对清单.md
> 项目：研究中心
> 阶段：delivery

本文面向 `墨予镜` 当前 9 个核心 agent，给出第一轮配置核对口径。

## 1. 全局默认口径

- 非 CEO 角色都 `Reports to = CEO`
- 所有 agent 都补 `Capabilities`
- 所有 agent `Max concurrent runs = 1`
- 第一轮默认关闭 `Heartbeat on interval`
- 只有 `CEO`：
  - `Can create new agents = 开`
  - `Can assign tasks = 开`
- 其他 8 个 agent：
  - `Can create new agents = 关`
  - `Can assign tasks = 关`

## 2. 逐角色建议

### `CEO`

- adapter：`claude_local`
- `Reports to`：留空
- `Timeout`：建议 `900-1200`
- `Heartbeat on interval`：按需

### `Business Lead`

- adapter：`claude_local`
- `Reports to`：`CEO`
- `Timeout`：建议 `900`
- `Heartbeat on interval`：关

### `Product Spec Lead`

- adapter：`claude_local`
- `Reports to`：`CEO`
- `Timeout`：建议 `900`
- `Heartbeat on interval`：关

### `UI / UX`

- adapter：`claude_local`
- `Reports to`：`CEO`
- `Timeout`：建议 `900`
- `Heartbeat on interval`：关

### `Research & Knowledge Lead`

- adapter：`claude_local`
- `Reports to`：`CEO`
- `Timeout`：建议 `1200`
- `Heartbeat on interval`：可低频按需开启

### `Architect`

- adapter：`claude_local`
- `Reports to`：`CEO`
- `Timeout`：建议 `1200`
- `Heartbeat on interval`：关

### `Engineer`

- adapter：`codex_local`
- `Reports to`：`CEO`
- `Timeout`：建议 `1200`
- `Enable search`：第一轮关
- `Bypass sandbox`：谨慎开

### `Test / QA`

- adapter：`codex_local`
- `Reports to`：`CEO`
- `Timeout`：建议 `1200`
- `Enable search`：第一轮关
- `Bypass sandbox`：比 Engineer 更保守

### `Content Lead`

- adapter：`claude_local`
- `Reports to`：`CEO`
- `Timeout`：建议 `900`
- `Heartbeat on interval`：关

## 3. 第一轮最值得先改的项

1. 给所有 agent 补齐 `Capabilities`
2. 给所有非 CEO agent 补齐 `Reports to = CEO`
3. 给 `Engineer` 和 `Test / QA` 显式设置非零 `Timeout`
4. 确认只有 `CEO` 拥有管理权限
5. 确认所有 agent 的 `Max concurrent runs = 1`
