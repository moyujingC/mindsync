# PaperClip Agent Configuration 5 分钟面板操作顺序

> 状态：current
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-04-06
> source_of_truth：projects/research-center/delivery/2026-04-06-PaperClip-Agent-Configuration-5分钟面板操作顺序.md
> 项目：研究中心
> 阶段：delivery

如果你现在就要打开 PaperClip 面板，按下面顺序操作。

## 1. 第一轮只做 3 件事

1. 把组织关系补清楚
2. 把职责文案补清楚
3. 把工程型 agent 的超时和权限边界收住

## 2. 优先处理顺序

1. `CEO`
2. `Engineer`
3. `Test / QA`
4. 其余 6 个角色批量处理

## 3. 每个 agent 都按这个顺序检查

1. `Identity`
2. `Permissions & Configuration`
3. `Run Policy`
4. `Permissions`

## 4. 每个页面只优先看这 6 项

1. `Reports to`
2. `Capabilities`
3. `Agent instructions file`
4. `Timeout`
5. `Max concurrent runs`
6. `Can create new agents / Can assign tasks`

## 5. 第一轮验收条件

只要下面 5 条成立，这一轮就算完成：

1. 只有 `CEO` 拥有 `Can create new agents`
2. 所有非 CEO agent 都有 `Reports to = CEO`
3. 所有 agent 都补了 `Capabilities`
4. `Engineer` 和 `Test / QA` 的 `Timeout` 都不是 `0`
5. 所有 agent 的 `Max concurrent runs = 1`
