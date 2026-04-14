# Architecture

> 状态：current
> 版本：0.1.0
> owner：Architect
> last_updated：2026-04-15
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/architecture/README.md

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

当前 `aimandala` 其实已经有正式架构内容，只是历史上放在 `specs/` 里。

优先阅读：

1. [../specs/2026-04-04-toc-mvp-architecture.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-04-toc-mvp-architecture.md)
2. [../specs/2026-04-11-报告生成分层与信息流说明.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-11-报告生成分层与信息流说明.md)
3. [../specs/2026-04-10-V2知识库长期架构方案.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-10-V2知识库长期架构方案.md)
4. [../decisions/2026-04-12-dual-channel-shared-ui-architecture-decision.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/decisions/2026-04-12-dual-channel-shared-ui-architecture-decision.md)

## 4. 当前建议的架构阅读顺序

1. 先看 `toc-mvp-architecture`
   - 建立主系统边界
2. 再看 `报告生成分层与信息流说明`
   - 理解主链信息如何流转
3. 再看 `V2知识库长期架构方案`
   - 理解长期演进方向
4. 最后看具体 architecture decision
   - 理解局部结构为什么这么选

## 5. 当前治理判断

现阶段更稳的做法不是立刻大规模搬文档，而是先把“架构是一类独立 artifact”这件事显式化。

后续新增架构文档，应优先直接落到本目录；
历史文档再按需要逐步迁入，而不是一次性大搬家。
