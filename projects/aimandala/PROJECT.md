# 一镜一梳项目工作区

> 状态：current
> 版本：0.4.3
> owner：CEO / Orchestrator
> last_updated：2026-04-18
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/PROJECT.md
> 公司侧入口：[/Users/xinran/Downloads/dev/mindsync/company/projects/一镜一梳/PROJECT.md](/Users/xinran/Downloads/dev/mindsync/company/projects/一镜一梳/PROJECT.md)
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

截至 `2026-04-15`，当前阶段可理解为：

- Web MVP 公开首发收口仍是默认主线
- miniapp 能力以“渐进并入、默认灰度关闭”为边界继续推进
- 当前项目已完成从旧仓迁移到新工作区的主链收口
- 报告链路保真重构已进入 `spec / architecture / task / qa basis` 正式收口阶段，尚未进入各批次实现

## 3. 长期 canonical 入口

当前长期真理源默认从这些目录入口进入：

- [specs/README.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/README.md)
- [architecture/README.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/architecture/README.md)
- [docs/sources/README.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/sources/README.md)
- [runbooks/README.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/runbooks/README.md)

其中：

- `specs/` 和 `architecture/` 继续承接当前正式产品与技术结论
- `docs/sources/` 承接项目级知识源资料、原始镜像和运行时映射
- `docs/sources/` 默认不是正式规则替代入口，而是源资料追溯入口

## 4. 当前窗口入口

当前执行窗口默认从这些目录入口进入：

- [tasks/README.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/README.md)
- [qa/README.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/README.md)
- [delivery/README.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/README.md)

当前如果要继续推进“报告链路保真重构”，默认顺序固定为：

1. [2026-04-18-报告链路保真重构总规格.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-18-报告链路保真重构总规格.md)
2. [2026-04-18-报告链路保真重构技术方案.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/architecture/2026-04-18-报告链路保真重构技术方案.md)
3. [2026-04-18-报告链路保真重构实施总计划.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-18-报告链路保真重构实施总计划.md)
4. [2026-04-18-报告链路保真重构验证基线.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-18-报告链路保真重构验证基线.md)

## 5. 历史资料入口

如需追溯历史行为、旧实现细节或阶段性收口过程，可查：

- 历史仓库：[/Users/xinran/Downloads/dev/ai-mandala](/Users/xinran/Downloads/dev/ai-mandala)
- 项目历史资料：[/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs)
- 公司侧历史草案：[/Users/xinran/Downloads/dev/mindsync/company/projects/一镜一梳/AI-Mandala-迁移范围与工作区草案.md](/Users/xinran/Downloads/dev/mindsync/company/projects/一镜一梳/AI-Mandala-迁移范围与工作区草案.md)

这些材料仅作历史追溯，不再作为默认开发入口。

## 6. 当前正式状态

截至 `2026-04-15`，当前应把项目状态理解为：

- `projects/aimandala` 已是唯一开发与发布主入口
- `main` 已吸收 batch E 的 `live-ready` 主线实现与 runbook
- `main` 已吸收 `miniapp-native` 原生灰度壳、灰度配置样例和对应文档链
- miniapp live 相关能力默认灰度关闭，不构成当前 Web 公开首发阻塞项
- 历史记录继续兼容读取，但不作为后续功能设计基线
- 当前 Aimandala 固定开发 worktree 为 `aimandala/dev`
- 固定本地路径为 `/Users/xinran/Downloads/dev/mindsync-worktrees/aimandala-dev`
- `codex/aimandala-dual-channel-ui` 继续只作为临时并行实验 worktree

## 7. 协作约束

当前默认约束是：

- `main` 继续承接 Web MVP 首发和生产稳定
- `aimandala/dev` 继续承接 AIMandala 默认本地开发与本地验证
- 小程序 worktree 可继续并行开发
- 小程序相关改动默认采用“分批摘入 main”，不整支直接合并
- 主工作区上的新改动，除非明确是 Web 宿主专属，否则应尽量保持 shared-friendly
- 批次 E 的 miniapp live 能力允许并入 `main`，但必须默认灰度关闭
- 后续继续摘入 miniapp 内容时，默认只从 `codex/aimandala-dual-channel-ui` 这条并行线继续

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
