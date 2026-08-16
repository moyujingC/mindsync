# 一镜一梳项目工作区

> 状态：maintenance（维护 + 复用模式，2026-08-16 起）
> 版本：0.4.6
> owner：CEO / Orchestrator
> last_updated：2026-08-16
> source_of_truth：projects/aimandala/PROJECT.md
> 公司侧入口：[company/projects/一镜一梳/PROJECT.md](../../company/projects/一镜一梳/PROJECT.md)
> reviewers：CEO / Orchestrator, Architect, Engineer, Test / QA

这是 `一镜一梳` 在 Monorepo 中的项目工作区入口。

## 1. 项目是什么

`一镜一梳` 是当前面向 To C 用户的三圈识别与解读产品工作区。

这里承接：

- 当前正式产品范围与技术方案
- Web MVP 公开首发主线
- miniapp 渐进并入与灰度相关能力
- 与主链直接相关的任务、QA、交付和运维说明

## 2. 当前阶段

当前默认阶段门为：

1. `spec / problem`
2. `task / implementation plan`
3. `qa basis`
4. `implementation`
5. `verification`
6. `delivery`

### 2.1 2026-08-16 定位决策：维护 + 复用模式

经 CEO 决策，本项目自 2026-08-16 起从"主线增长产品"切换为"维护 + 展示 + 资产复用"模式。

**决策依据**：当前瓶颈是分发与真实用户流量，不是产品功能。在内容矩阵（`projects/content-matrix`）未跑通、没有稳定流量入口之前，继续投入 To C 功能迭代无法验证价值。

**三种姿态**：

- **停止**：To C 新功能迭代，包括 miniapp 并入推进、新报告类型、追问 / followup 扩展。除非有真实用户数据明确指出卡点，否则不启动。
- **维护**：线上可用性、支付链路、安全更新。目标是保持产品"随时可演示"，作为求职面试与 FDE 售前的在线展品（真实部署、带支付链路的 Agent + 知识库产品）。
- **抽取复用**：
  - [疗愈体系知识库](./docs/疗愈体系知识库/README.md) → 作为客服 Agent 项目与 AI 互动课程项目的内容底座种子，知识库相关经验统一沉淀到 `projects/ai-service-studio/capabilities/knowledge-base-delivery/`
  - 曼陀罗解读智能体的对话设计（意图识别、多轮、拒答护栏）→ 作为初访 / 转接客服 Agent 项目的技术预演参考

**重启条件**（满足才回到迭代模式）：

1. 内容矩阵跑通，能给一镜一梳稳定导入真实流量
2. 有真实转化数据（访问 → 测评 → 付费）指出具体卡点
3. 届时按数据决定迭代方向，并评估与 AI 互动课程线合并为"课程 + 测评工具"变现线的可能

**对外叙事口径**：一镜一梳是第一个生产级 Agent 产品；当前主动暂停功能迭代，用 FDE 方法定位瓶颈在分发，因此优先建设内容矩阵与知识库底座。这展示的是问题拆解能力，不是项目失败。

阶段门定义在维护模式下仅适用于维护类和复用类任务，不再默认触发完整六门流程。

当前阶段默认按目录入口判断，而不是继续依赖某个旧日期窗口：

- 项目处于维护 + 复用模式（见 2.1），To C 主产品不再作为增长主线投入新功能
- miniapp 能力维持“渐进并入、默认灰度关闭”的既有边界，不主动推进
- 当前项目已完成从旧仓迁移到新工作区的主链收口
- 报告生成链路已从旧保真重构文档链，切到 `曼陀罗解读智能体` 与疗愈体系知识库主入口

## 3. 长期 canonical 入口

当前长期真理源默认从这些目录入口进入：

- [specs/README.md](../../projects/aimandala/docs/specs/README.md)
- [architecture/README.md](../../projects/aimandala/docs/architecture/README.md)
- [docs/疗愈体系知识库/README.md](../../projects/aimandala/docs/疗愈体系知识库/README.md)
- [runbooks/README.md](../../projects/aimandala/docs/runbooks/README.md)

其中：

- `specs/` 和 `architecture/` 继续承接当前正式产品与技术结论
- `docs/疗愈体系知识库/` 承接曼陀罗解读、疗愈来源、原始来源存档、产品适配和运行时知识包入口
- 既有来源材料如仍被新知识库依赖，应复制到 `docs/疗愈体系知识库/10-参考来源索引/00-原始来源存档/` 内部，不再依赖外部目录

## 4. 当前窗口入口

当前执行窗口默认从这些目录入口进入：

- [tasks/README.md](./docs/tasks/README.md)
- [qa/README.md](./docs/qa/README.md)
- [delivery/README.md](./docs/delivery/README.md)

当前如果要继续推进报告生成、报告陪读或追问相关工作，默认顺序固定为：

1. [docs/疗愈体系知识库/README.md](./docs/疗愈体系知识库/README.md)
2. [architecture/README.md](./docs/architecture/README.md)
3. [specs/README.md](./docs/specs/README.md)
4. [tasks/README.md](./docs/tasks/README.md)
5. [qa/README.md](./docs/qa/README.md)

## 5. 历史资料入口

如需追溯历史行为、旧实现细节或阶段性收口过程，可查：

- 历史仓库：`ai-mandala` 历史 checkout（本机路径以个人环境为准，不作为仓库真理源）
- 项目历史资料：[projects/aimandala/docs](./docs)
- 公司侧历史草案：[company/projects/一镜一梳/AI-Mandala-迁移范围与工作区草案.md](../../company/projects/一镜一梳/AI-Mandala-迁移范围与工作区草案.md)

这些材料仅作历史追溯，不再作为默认开发入口。

## 6. 当前正式状态

当前应把项目状态理解为：

- 项目自 2026-08-16 起处于维护 + 复用模式，定位决策与重启条件见 [2.1](#21-2026-08-16-定位决策维护--复用模式)
- `projects/aimandala` 已是唯一开发与发布主入口
- `main` 已吸收 batch E 的 `live-ready` 主线实现与 runbook
- `main` 已吸收 `miniapp-native` 原生灰度壳、灰度配置样例和对应文档链
- miniapp live 相关能力默认灰度关闭，不构成当前 Web 公开首发阻塞项
- 历史记录继续兼容读取，但不作为后续功能设计基线
- 当前 Aimandala 固定开发 worktree 为 `aimandala/dev`
- 本地路径按个人环境解析，不写入项目入口作为长期真理源
- `codex/aimandala-dual-channel-ui` 继续只作为临时并行实验 worktree
- 当前财富解读报告以 Lite 作为对外交付版本，Pro 作为内部预备形态暂不上线

## 7. 协作约束

当前默认约束是：

- `main` 继续承接 Web MVP 首发和生产稳定
- `aimandala/dev` 继续承接 AIMandala 默认本地开发与本地验证
- 小程序 worktree 可继续并行开发
- 小程序相关改动默认采用“分批摘入 main”，不整支直接合并
- 主工作区上的新改动，除非明确是 Web 宿主专属，否则应尽量保持 shared-friendly
- 批次 E 的 miniapp live 能力允许并入 `main`，但必须默认灰度关闭
- 后续继续摘入 miniapp 内容时，默认只从 `codex/aimandala-dual-channel-ui` 这条并行线继续
- 后续新知识库、新曼陀罗解读智能体和新报告链路默认采用硬切换，不为旧画面翻译、旧 stage 产物、旧主题名或旧测试保留兼容层；除非任务明确要求兼容，否则直接按新契约重做。
- 任何财富报告相关对外口径都应默认以 Lite 为准，Pro 仅保留内部评测和预备入口

## 8. 当前正式范围

当前默认只承接：

1. To C 主产品
2. 支撑 To C 主产品所必需的 `V2` 生产级能力
3. 对应的项目文档、最小实现和测试入口

当前默认不承接：

1. To B 产品
2. Studio 相关产品
3. `V3` 实验级 API
4. 内部工具
