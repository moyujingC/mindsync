# Preference Memory

> 状态：current
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-05-06
> source_of_truth：projects/research-center/kb/preference-memory/README.md

这里放“创作者偏好记忆”的第一版文件式资产。

它不等同于正式知识库条目，也不等同于原始参考材料。

这里主要记录：

- review 反馈样本
- 稳定偏好模式
- hard constraints
- 最近显著变化
- 当前有效但可能过期的反模式约束

第一版目标不是做复杂记忆引擎，而是先提供：

1. 可持续写入的固定位置
2. 可被多个 skill 读取的共同入口
3. 可被 routine 持续整理的稳定目录

当前文件约定：

- `MEMORY.md`
  - 人类可读总结
- `review-patterns.yaml`
  - 结构化模式与样本

推荐放在这里的内容：

- 当前模型版本下高频出现的坏句式
- 当前阶段不希望继续出现的表达癖好
- 会随着时间漂移、需要定期淘汰的写作约束

不推荐直接放在正式 `wiki/` 里的内容：

- 只针对当前模型版本有效的“不要 XXX”
- 很可能几周后就失效的禁词或禁句
- 单次审阅里发现、但尚未跨多次重复的问题

后续如接入更复杂的记忆 provider，也应尽量保留这里作为可检查、可回溯的显式入口。
