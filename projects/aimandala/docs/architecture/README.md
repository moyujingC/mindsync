# Architecture

> 状态：current
> 版本：0.2.0
> owner：Architect
> last_updated：2026-05-17
> source_of_truth：projects/aimandala/docs/architecture/README.md

这里放 `一镜一梳 / aimandala` 当前仍生效的技术架构文档。

它回答的问题是：

- 当前系统按什么边界拆层
- 主链运行时现在实际怎么组织
- 哪些能力已经落地，哪些还只是下一阶段方向
- 某一块需要调整时，应该先看哪份文档

## 1. 适合放在这里的内容

- 总体技术结构
- 子系统架构方案
- 数据流、信息流和运行时分层
- 已落地能力与规划能力的边界
- 长期演进口径

## 2. 不适合放在这里的内容

- 产品功能定义
- 一次性任务拆解
- 验收记录
- 单机部署步骤和运维命令

这些内容应分别留在：

- `../specs/`
- `../tasks/`
- `../qa/`
- `../runbooks/`

## 3. 当前正式入口

总览入口：

- [架构总览.md](./架构总览.md)

当前建议优先阅读：

1. [ToC-MVP-技术方案.md](./ToC-MVP-技术方案.md)
2. [解读智能层-曼陀罗解读智能体架构.md](./解读智能层-曼陀罗解读智能体架构.md)
3. [CI-CD与自动修复架构.md](./CI-CD与自动修复架构.md)
4. [Paperclip-Automation-节点方案.md](./Paperclip-Automation-节点方案.md)

## 4. 当前架构阅读顺序

1. 先看 `ToC-MVP-技术方案`
   - 建立 To C 主产品当前目录、前后端和知识包边界
2. 再看 `解读智能层-曼陀罗解读智能体架构`
   - 理解报告生成为什么从 legacy report pipeline（旧报告流水线）切到 `mandala_interpretation_agent`
   - 理解当前已落地的是离线原型，API 旁路接入仍在后续阶段
3. 再看 `../疗愈体系知识库/README.md`
   - 理解三圈五行方法、知识源入口和知识包压缩依据
4. 最后看 CI/CD 与 Automation 两份专项架构
   - 理解 `mvp-ci`、增强链路、Paperclip Automation 节点和 heartbeat 治理边界

## 5. 当前文档使用规则

- `architecture/` 只保留当前 canonical（正式）架构入口
- 历史方案、旧报告链路和阶段性实现说明，默认从 `../archive/` 或 `../decisions/` 追溯
- `疗愈体系知识库/` 是方法、来源索引、产品适配和运行时知识包入口
- 报告生成当前正式链路，默认只从 `曼陀罗解读智能体` 文档链进入：
  - [解读智能层-曼陀罗解读智能体架构.md](./解读智能层-曼陀罗解读智能体架构.md)
  - [../specs/2026-05-11-曼陀罗解读智能体-MVP实施规格.md](../specs/2026-05-11-曼陀罗解读智能体-MVP实施规格.md)
  - [../tasks/2026-05-11-曼陀罗解读智能体-MVP实施计划.md](../tasks/2026-05-11-曼陀罗解读智能体-MVP实施计划.md)
  - [../qa/2026-05-12-曼陀罗解读智能体-MVP-离线原型验证记录.md](../qa/2026-05-12-曼陀罗解读智能体-MVP-离线原型验证记录.md)

## 6. 当前边界提醒

- `mandala_interpretation_agent` 已有离线原型、fixture runner（样例运行器）和质量门，不等于已经替换线上 API 主链
- `mvp-ci` 仍是日常最小可信质量门；`aimandala-ci`、deploy、nightly smoke、auto-repair 属于增强链路
- Automation 节点相关文档应与 `runbooks/README.md` 一起阅读，区分“架构边界”和“实际操作步骤”
