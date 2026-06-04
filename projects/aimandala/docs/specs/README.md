# Specs

> 状态：current
> 版本：0.1.1
> owner：Product Spec Lead
> last_updated：2026-05-31
> source_of_truth：projects/aimandala/docs/specs/README.md

这里放 `一镜一梳` 当前仍作为正式入口的产品规格文档。

使用原则：

- 先看 `MVP-当前上线口径`，再看 `MVP-上线范围与-Go-No-Go-标准`、`ToC-MVP` 与页面状态总表
- `Lite / Pro` 的上线判断以 `MVP-当前上线口径.md` 为准
- 已被替代的旧窗口 spec 已删除，不再作为阅读入口

## 当前正式入口

按下面顺序阅读：

1. [MVP-当前上线口径.md](MVP-当前上线口径.md)
2. [MVP-上线范围与-Go-No-Go-标准.md](MVP-上线范围与-Go-No-Go-标准.md)
3. [2026-05-11-曼陀罗解读智能体-MVP实施规格.md](2026-05-11-曼陀罗解读智能体-MVP实施规格.md)
4. [ToC-MVP-产品规范.md](ToC-MVP-产品规范.md)
5. [2026-04-09-MVP页面状态机与页面映射总表.md](2026-04-09-MVP页面状态机与页面映射总表.md)

当前与 Paperclip execution routing（执行分流）和 automation 运维治理相关的历史 spec 证据链为：

- [2026-05-03-observe-only-checkout-治理规格.md](2026-05-03-observe-only-checkout-治理规格.md)
- [2026-04-26-历史任务全量关闭与新基线切换规格.md](2026-04-26-历史任务全量关闭与新基线切换规格.md)
- [2026-04-22-local-mac-automatic-execution-host-spec.md](2026-04-22-local-mac-automatic-execution-host-spec.md)
- [2026-04-21-local-mac-execution-host-pilot-spec.md](2026-04-21-local-mac-execution-host-pilot-spec.md)
- [2026-04-19-paperclip-native-execution-routing-spec.md](2026-04-19-paperclip-native-execution-routing-spec.md)
- [2026-04-19-server-automation-workspace-materialization-diagnosis-spec.md](2026-04-19-server-automation-workspace-materialization-diagnosis-spec.md)
- [2026-04-19-server-automation-blocking-sample-interpretation-spec.md](2026-04-19-server-automation-blocking-sample-interpretation-spec.md)
- [2026-04-19-服务器自动执行任务模板语义修复规格.md](2026-04-19-服务器自动执行任务模板语义修复规格.md)

这组文档只用于追溯 Paperclip execution routing、服务器执行宿主、本地 Mac execution host、历史任务新基线和 observe-only checkout 治理的阶段性判断；不再作为当前产品或运行治理的首轮默认入口。当前默认入口应先看 [../runbooks/README.md](../runbooks/README.md) 与本目录上方的正式产品规格。

旧 `stage_process_package / builder_v2 / placeholder renderer` 报告生成规格已归档到 [../archive/legacy-report-generation-2026-05-10/](../archive/legacy-report-generation-2026-05-10/)，只用于追溯旧链路。

## 使用规则

- 新增产品规则时，先确认是否影响 [MVP-当前上线口径.md](MVP-当前上线口径.md)，再改母规格、状态表或配套实现文档
- 页面状态、跳转和职责边界以 [2026-04-09-MVP页面状态机与页面映射总表.md](2026-04-09-MVP页面状态机与页面映射总表.md) 为准
- 若页面口径与 `2026-04-18` 母规格冲突，以 `2026-04-18` 母规格链为准
- 技术分层和运行时结构问题统一进入 [../architecture/README.md](../architecture/README.md)
- 知识来源、正式依据与运行时映射统一进入 [../疗愈体系知识库/README.md](../疗愈体系知识库/README.md)
