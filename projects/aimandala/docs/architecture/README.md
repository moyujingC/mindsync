# Architecture

> 状态：current
> 版本：0.1.0
> owner：Architect
> last_updated：2026-04-18
> source_of_truth：/Users/xinran/.codex/worktrees/0aa2/mindsync/projects/aimandala/docs/architecture/README.md

这里放 `一镜一梳 / aimandala` 的技术架构文档。

它回答的问题不是“产品要做什么”，而是：

- 系统怎么分层
- 模块边界怎么切
- 信息流怎么走
- 为什么采用当前结构
- 哪些是当前架构边界，哪些是后续演进方向

## 1. 适合放在这里的内容

- 总体技术架构
- 子系统架构方案
- 信息流 / 数据流说明
- 运行时分层说明
- 长期演进架构方案

## 2. 不适合放在这里的内容

- 页面功能定义
- 用户链路和交互文案
- 一次性实现任务拆解
- 验收记录
- 单台服务器运维步骤

这些内容应分别放在：

- `../specs/`
- `../tasks/`
- `../qa/`
- `../runbooks/`

## 3. 当前已存在但尚未迁目录的架构文档

当前 `aimandala` 其实已经有正式架构内容，现已开始收口到本目录。

总览入口：

- [架构总览.md](/Users/xinran/.codex/worktrees/0aa2/mindsync/projects/aimandala/docs/architecture/架构总览.md)

优先阅读：

1. [2026-04-18-报告链路保真重构技术方案.md](/Users/xinran/.codex/worktrees/0aa2/mindsync/projects/aimandala/docs/architecture/2026-04-18-报告链路保真重构技术方案.md)
2. [ToC-MVP-技术方案.md](/Users/xinran/.codex/worktrees/0aa2/mindsync/projects/aimandala/docs/architecture/ToC-MVP-技术方案.md)
3. [报告生成分层与信息流说明.md](/Users/xinran/.codex/worktrees/0aa2/mindsync/projects/aimandala/docs/architecture/报告生成分层与信息流说明.md)
4. [V2知识库长期架构方案.md](/Users/xinran/.codex/worktrees/0aa2/mindsync/projects/aimandala/docs/architecture/V2知识库长期架构方案.md)
5. [CI-CD与自动修复架构.md](/Users/xinran/.codex/worktrees/0aa2/mindsync/projects/aimandala/docs/architecture/CI-CD与自动修复架构.md)
6. [Paperclip-Automation-节点方案.md](/Users/xinran/.codex/worktrees/0aa2/mindsync/projects/aimandala/docs/architecture/Paperclip-Automation-节点方案.md)
7. [../decisions/2026-04-12-dual-channel-shared-ui-architecture-decision.md](/Users/xinran/.codex/worktrees/0aa2/mindsync/projects/aimandala/docs/decisions/2026-04-12-dual-channel-shared-ui-architecture-decision.md)

如需追溯 `V2 knowledge runtime` 背后的源资料、流派出处和原始主题特化文档，请进入：

- [../sources/知识库构建/README.md](/Users/xinran/.codex/worktrees/0aa2/mindsync/projects/aimandala/docs/sources/知识库构建/README.md)

这里的使用规则是：

- 架构文档默认只把 `sources/知识库构建` 当成源资料入口
- 不把 `原始镜像/` 整体提升为当前架构规则入口
- 需要引用具体资料时，应先经过 [../sources/知识库构建/当前正式依据与使用说明.md](/Users/xinran/.codex/worktrees/0aa2/mindsync/projects/aimandala/docs/sources/知识库构建/当前正式依据与使用说明.md)

## 4. 当前建议的架构阅读顺序

1. 先看 `ToC-MVP-技术方案`
   - 建立主系统边界
2. 再看 `2026-04-18-报告链路保真重构技术方案`
   - 建立这轮 evidence-first 重构边界
3. 再看 `报告生成分层与信息流说明`
   - 理解主链信息如何流转
4. 再看 `V2知识库长期架构方案`
   - 理解长期演进方向
5. 最后看具体 architecture decision
   - 理解局部结构为什么这么选

## 5. 当前治理判断

现阶段更稳的做法不是立刻大规模搬文档，而是先把“架构是一类独立 artifact”这件事显式化。

后续新增架构文档，应优先直接落到本目录；
历史文档再按需要逐步迁入，而不是一次性大搬家。
