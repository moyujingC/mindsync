# Architecture

> 状态：current
> 版本：0.1.0
> owner：Architect
> last_updated：2026-05-10
> source_of_truth：projects/aimandala/docs/architecture/README.md

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

## 3. 当前正式入口

总览入口：

- [架构总览.md](架构总览.md)

优先阅读：

1. [ToC-MVP-技术方案.md](ToC-MVP-技术方案.md)
2. [CI-CD与自动修复架构.md](CI-CD与自动修复架构.md)
3. [Paperclip-Automation-节点方案.md](Paperclip-Automation-节点方案.md)

如需追溯 `V2 knowledge runtime` 背后的源资料、流派出处和原始主题特化文档，请进入：

- [../sources/知识库构建/README.md](../sources/知识库构建/README.md)

这里的使用规则是：

- 架构文档默认只把 `sources/知识库构建` 当成源资料入口
- 不把 `原始镜像/` 整体提升为当前架构规则入口
- 需要引用具体资料时，应先经过 [../sources/知识库构建/当前正式依据与使用说明.md](../sources/知识库构建/当前正式依据与使用说明.md)
- 报告生成方法不再从旧 `Layer0`、`projection` 或 `knowledge_skeleton` 架构文档进入；应从 [../sources/知识库构建/三圈五行流派解读方法与步骤.md](../sources/知识库构建/三圈五行流派解读方法与步骤.md) 进入

## 4. 当前建议的架构阅读顺序

1. 先看 `ToC-MVP-技术方案`
   - 建立主系统边界
2. 再看 [../sources/知识库构建/README.md](../sources/知识库构建/README.md)
   - 理解报告方法和知识源当前入口
3. 最后看 CI/CD 与 Automation 专项架构
   - 理解配套基础设施边界

## 5. 使用规则

- `architecture/` 只暴露当前保留的 canonical 文档
- 历史决策文档仍可保留在 `../decisions/`，但不作为默认主入口
- 需要追溯知识源时，先回到 [../sources/知识库构建/README.md](../sources/知识库构建/README.md)
