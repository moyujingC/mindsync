# Skill 试跑记录：research-brief 与 knowledge-ingest

> 状态：current
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-04-04
> source_of_truth：projects/research-center/delivery/2026-04-04-skill-试跑记录-research-brief与knowledge-ingest.md
> 项目：研究中心
> 阶段：delivery

这份文档记录第四轮 skill 试跑。

本轮目标是补齐两个此前尚未有真实案例的通用 skill：

- `research-brief`
- `knowledge-ingest`

## 1. 试跑任务

- 任务一：
  - 为 “skill 体系商业化与产品化边界研究” 生成正式 research brief
- 任务二：
  - 将 Claude Code 研究中的稳定方法结论转为长期知识条目

## 2. 输出位置

- [Skill 体系商业化与产品化边界研究 Brief](../tasks/2026-04-04-Skill体系商业化与产品化边界研究-brief.md)
- Claude Code 启发下的 Skill 与协作方法知识条目

## 3. 按 Skill 走的过程

### 3.1 `research-brief`

收束结果：

- 把“skill 体系是否值得进一步产品化或服务化”从一个模糊方向收束成正式研究任务
- 明确了：
  - 服务对象
  - 研究问题
  - 范围与边界
  - 预期交付物
- 同时避免了直接跳进 `Business Lead` 做商业判断

### 3.2 `knowledge-ingest`

入库结果：

- 从 Claude Code 研究结论中筛出真正具备长期复用价值的部分：
  - skill 是方法层对象
  - role prompt 只保留入口
  - artifact 与 handoff 比聊天更重要
  - 轻量接入、重试跑比重型 runtime 更适合当前阶段
- 把这些结论正式写入 `kb/`，并补上来源与适用范围

## 4. 试跑结果

### 4.1 成立的部分

- `research-brief` 已经可以独立把模糊议题收束成正式研究任务，而不是停留在聊天层
- `knowledge-ingest` 已经不再只是“建议入库”，而是能真正产出结构化知识条目
- `kb/` 目录现在有了第一份正式知识条目样例

### 4.2 暴露的问题

- `knowledge-ingest` 还缺更细的“条目类型命名规范”
- `research-brief` 目前更适合研究中心内部任务，未来还可以补一版更偏产品/内容协作的变体

### 4.3 当前结论

- 这两个此前没有真实案例的 skill 已经具备最小可运行性
- 当前仍然缺真实案例的 skill 主要剩：
  - `research-synthesis`
  - `business-diagnosis`

## 5. 一句话结论

这轮试跑说明，`research-brief` 和 `knowledge-ingest` 已经从“有定义”推进到了“有正式 artifact”，skill 体系的空白面正在缩小。