# Paperclip 周检报告模板

> 状态：current
> 版本：0.1.0
> owner：Research & Knowledge Lead, Engineer
> last_updated：2026-04-27
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/company/knowledge-base/system/templates/Paperclip-周检报告模板.md

> 使用方式：
> - 这是 `Paperclip` 周检自动化与人工复盘共用模板
> - 填写时优先写“判断”和“动作”，不要只抄上游更新列表
> - 默认结果以 inbox（收件箱）为主，只有命中归档条件时才建议沉淀到周检历史目录
> - 英文术语首次出现时，建议补一句简短中文括注

## 1. 本次周检基本信息

- 周检日期：
- 覆盖时间窗：
- 检查人 / 执行链：
- 主要官方来源：

## 2. 本周最重要结论

- 一句话结论：
- 当前推荐升级版本：
- 当前是否建议立刻升级：`是 / 否`
- 若不立刻升级，主要原因：

## 3. 上游关键变化

按重要性列出，不按时间简单罗列。

### 3.1 安全与稳定性

- 变更：
- 日期：
- 版本：
- 为什么重要：

### 3.2 运行时能力

- 变更：
- 日期：
- 版本：
- 为什么重要：

### 3.3 部署与生态

- 变更：
- 日期：
- 版本：
- 为什么重要：

## 4. 对 MindSync 的影响判断

### 4.1 高影响

- 影响项：
- 命中的本地系统层：
- 若不处理的风险：

### 4.2 中影响

- 影响项：
- 命中的本地系统层：
- 建议处理窗口：

### 4.3 低影响或暂不影响

- 变化：
- 为什么当前可暂不处理：

## 5. 推荐升级版本判断

- 当前本地运行版本或可确认基线：
- 推荐升级目标：
- 选择这个版本的原因：
- 为什么不是更低版本：
- 为什么暂时不是更高版本：
- 当前是否存在更激进但暂不采用的 `optional` 路径：

## 6. 本周建议动作

### 6.1 must

- 动作：
- owner：
- 验证方式：

### 6.2 should

- 动作：
- owner：
- 验证方式：

### 6.3 optional

- 动作：
- owner：
- 备注：

## 7. 若执行升级，最小回归清单

- `Paperclip` UI / 登录与认证是否正常
- `CEO`、`Engineer`、`Test / QA` 是否还能正常起任务
- `local_manual_review` 是否仍落到本地 Mac
- `server_automation` 是否仍落到 automation 节点
- execution workspace / `git worktree` 是否正常 materialize
- 任务评论回写、`adapter / host` 标注是否正常
- heartbeat、maintenance、执行健康巡检是否正常
- `aimandala` 项目部署目录是否仍可构建和启动

## 8. 需要同步更新的本地 artifact

- 文档：
- 配置：
- 部署：
- 脚本：

## 9. 风险接受记录

- 本周明确接受但未处理的风险：
- 接受理由：
- 下次周检前的观察点：

## 10. 下轮建议关注

- 需要继续观察的上游方向：
- 可能在下轮升为 `must` 的信号：

## 11. 归档建议

- 本周是否建议归档到 `paperclip-weekly-reviews/`：`是 / 否`
- 若建议归档，命中的触发条件：
- 若不建议归档，保持 inbox-only（仅收件箱）的原因：
