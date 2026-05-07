# Specs

> 状态：current
> 版本：0.1.0
> owner：Product Spec Lead
> last_updated：2026-05-06
> source_of_truth：projects/aimandala/docs/specs/README.md

这里放 `一镜一梳` 当前仍作为正式入口的产品规格文档。

使用原则：

- 先看 `2026-04-18` 母规格链，再看 `ToC-MVP` 与页面状态总表
- `Lite / Pro` 的当前定义只以保留文档为准
- 已被替代的旧窗口 spec 已删除，不再作为阅读入口

## 当前正式入口

按下面顺序阅读：

1. [2026-04-18-报告链路保真重构总规格.md](2026-04-18-报告链路保真重构总规格.md)
2. [2026-04-19-解读教程算法保真修复规格.md](2026-04-19-解读教程算法保真修复规格.md)
3. [2026-04-19-固定样本人工-golden-审阅规格.md](2026-04-19-固定样本人工-golden-审阅规格.md)
4. [2026-04-19-报告内容偏差回灌修复规格.md](2026-04-19-报告内容偏差回灌修复规格.md)
5. [2026-04-19-报告表达保真与可读性压缩规格.md](2026-04-19-报告表达保真与可读性压缩规格.md)
6. [2026-04-18-Lite-Pro-报告定位与内容边界.md](2026-04-18-Lite-Pro-报告定位与内容边界.md)
7. [2026-04-18-知识源资料重评估与报告链路判断.md](2026-04-18-知识源资料重评估与报告链路判断.md)
8. [ToC-MVP-产品规范.md](ToC-MVP-产品规范.md)
9. [2026-04-09-MVP页面状态机与页面映射总表.md](2026-04-09-MVP页面状态机与页面映射总表.md)

当前与 Paperclip execution routing（执行分流）和 automation 运维治理最相关的 spec 入口补充为：

- [2026-05-03-observe-only-checkout-治理规格.md](2026-05-03-observe-only-checkout-治理规格.md)
- [2026-04-26-历史任务全量关闭与新基线切换规格.md](2026-04-26-历史任务全量关闭与新基线切换规格.md)
- [2026-04-22-local-mac-automatic-execution-host-spec.md](2026-04-22-local-mac-automatic-execution-host-spec.md)
- [2026-04-21-local-mac-execution-host-pilot-spec.md](2026-04-21-local-mac-execution-host-pilot-spec.md)
- [2026-04-19-paperclip-native-execution-routing-spec.md](2026-04-19-paperclip-native-execution-routing-spec.md)
- [2026-04-19-server-automation-workspace-materialization-diagnosis-spec.md](2026-04-19-server-automation-workspace-materialization-diagnosis-spec.md)
- [2026-04-19-server-automation-blocking-sample-interpretation-spec.md](2026-04-19-server-automation-blocking-sample-interpretation-spec.md)
- [2026-04-19-服务器自动执行任务模板语义修复规格.md](2026-04-19-服务器自动执行任务模板语义修复规格.md)

这组文档回答：

- 当前报告链路重构的正式目标是什么
- `Lite / Pro` 为什么是两种报告模式
- `General / 主题` 为什么是议题 SKU
- 当前主链路如何收束
- 当前知识源为何必须回到 `docs/sources/知识库构建/`
- 当前解读教程算法为何必须按四步法进入 runtime evidence
- 当前固定样本为何必须进入人工 golden 审阅与偏差回灌闭环
- 当前报告表达为何必须在保留 trace 的前提下压缩为用户可读解读
- 当前 Paperclip direct routing（直接路由）、服务器执行宿主和本地 Mac execution host（执行宿主机）如何分工
- 当前为什么应该把 `2026-04-26` 之前的历史普通任务与历史 automation 任务统一收口，并把后续观察窗口切到新基线
- 当前为什么要把 `/opt/automation/app/mindsync` 与 `/opt/automation/app/mindsync-heartbeat` 固定治理成 observe-only checkout，而不是继续作为可写升级入口

## 使用规则

- 新增产品规则时，先改母规格，再补状态表或配套实现文档
- 页面状态、跳转和职责边界以 [2026-04-09-MVP页面状态机与页面映射总表.md](2026-04-09-MVP页面状态机与页面映射总表.md) 为准
- 若页面口径与 `2026-04-18` 母规格冲突，以 `2026-04-18` 母规格链为准
- 技术分层和运行时结构问题统一进入 [../architecture/README.md](../architecture/README.md)
- 知识来源、正式依据与运行时映射统一进入 [../sources/知识库构建/README.md](../sources/知识库构建/README.md)
