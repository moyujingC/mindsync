# Skill 试跑记录：Claude Code 研究到个人号内容输入

> 状态：current
> 版本：0.1.0
> owner：Research & Knowledge Lead
> last_updated：2026-04-04
> source_of_truth：projects/research-center/delivery/2026-04-04-skill-试跑记录-Claude-Code到个人号内容输入.md
> 项目：研究中心
> 阶段：delivery

这份文档记录首轮 skill 试跑。

本轮目标不是测试所有 skill，而是验证一条真实协作链是否成立：

`task-routing -> artifact-readiness-check -> insight-handoff -> content-grounded-transform -> handoff-packaging`

## 1. 试跑任务

- 任务：
  - 基于现有 Claude Code 研究结论，产出一份可交给 `Content Lead` 的 `墨予镜` 个人号内容上游输入
- 来源项目：
  - `研究中心`
- 目标账号：
  - `墨予镜`
- 输出位置：
  - 历史内容输出目录已删除；如需继续承接，应回到 [company/projects/内容矩阵/PROJECT.md](company/projects/内容矩阵/PROJECT.md) 重新定义落点

## 2. 试跑前上下文

本轮读取了以下材料：

- [Claude Code 源码研究综合结论与 Skill 启发](projects/research-center/research/claude-code/07-Claude-Code源码研究综合结论与Skill启发.md)
- [内容矩阵项目入口](company/projects/内容矩阵/PROJECT.md)
- [个人真实信息与表达基线](company/projects/内容矩阵/个人真实信息与表达基线.md)
- [内容矩阵](company/内容矩阵.md)

## 3. 按 Skill 走的过程

### 3.1 `task-routing`

判断结果：

- 工作流类型：
  - 研究结果转内容输入
- 当前阶段：
  - handoff / content preparation
- 主责角色：
  - `Research & Knowledge Lead` 先交上游输入
- 下游角色：
  - `Content Lead`

### 3.2 `artifact-readiness-check`

判断结果：

- Claude Code 研究结论文档已经具备可转译条件
- 但还不能直接生成第一人称成稿
- 适合先进入“内容上游输入”阶段，而不是“成稿”阶段

### 3.3 `insight-handoff`

转译结果：

- 给内容侧最重要的输入不是源码细节
- 而是这次研究带来的组织判断：
  - 为什么真正要补的是 skill，而不是更多 prompt

### 3.4 `content-grounded-transform`

转译结果：

- 形成了可用选题角度
- 形成了可用结构和论点
- 同时显式保留了个人号边界，避免直接写出未确认的第一人称故事

### 3.5 `handoff-packaging`

最终交付：

- 已形成一份面向 `Content Lead` 的上游输入文档
- 已明确：
  - 来源项目
  - 发布账号
  - 可用素材
  - 推荐角度
  - 推荐结构
  - 不可越界内容

## 4. 试跑结果

### 4.1 成立的部分

- 这条链路可以真实产出 artifact，而不是只停留在 skill 说明层
- `research -> content upstream input` 这条线已经可以通过现有 skill 串起来
- skill 对“避免直接脑补成稿”很有帮助

### 4.2 暴露的问题

- 目前 `task-routing` 和 `artifact-readiness-check` 更像轻量判断 skill，适合作为辅助，不太适合单独产出大文档
- `insight-handoff` 和 `handoff-packaging` 有一定相邻性，后续可能要继续拉开边界：
  - 前者偏“按下游角色做转译”
  - 后者偏“正式交接包”
- `content-grounded-transform` 还缺更细的“账号类型差异模板”

### 4.3 当前结论

首轮试跑证明：

- 这批 skill 已经不只是“可阅读”
- 至少能支持一条真实内容协作链

## 5. 对 Skill 体系的修正建议

### 5.1 近期建议

- 给更多 skill 补“示例产物”
- 未来给 `Content Lead` 再补：
  - 个人号 / 产品号差异化模板

### 5.2 中期建议

- 再试跑一条：
  - `research -> product-framing-spec -> architecture-boundary-plan`

这样就能验证技能体系的另一条主链。

## 6. 一句话结论

这轮试跑说明，`墨予镜` 的 skill 体系已经可以支持真实任务推进，但下一阶段最值钱的工作已经不是继续铺骨架，而是沿着真实任务不断修 skill。
