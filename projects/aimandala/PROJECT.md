# 一镜一梳项目工作区

> 状态：current
> 版本：0.4.3
> owner：CEO / Orchestrator
> last_updated：2026-04-15
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/PROJECT.md
> 公司侧入口：[/Users/xinran/Downloads/dev/mindsync/company/projects/一镜一梳/PROJECT.md](/Users/xinran/Downloads/dev/mindsync/company/projects/一镜一梳/PROJECT.md)
> reviewers：CEO / Orchestrator, Architect, Engineer, Test / QA

这是 `一镜一梳` 在 Monorepo 中的项目工作区入口。

当前后续新功能应直接在这里继续推进：

- 项目实现代码
- 项目专属需求与设计文档
- 测试与脚本
- 项目运行说明

## 1. 当前工作方式

当前默认工作方式是受治理的直接开发，而不是依赖额外面板流程。

因此当前默认工作方式是：

- 在 `projects/aimandala/` 中建立正式项目工作区
- 使用 Codex / Claude Code 直接开发
- 如需接 Paperclip，以本工作区与公司入口文档为准对齐
- 所有新的 Lite / Pro 正式能力、部署配置与交付记录，都优先回写到这个工作区
- 重要工作默认遵守 `Harness Engineering + SDD + TDD`
- 计划模式结论应优先落到 `docs/tasks/`，再进入实现

### 1.0 当前阶段门

当前默认阶段门为：

1. `spec / problem`
2. `task / implementation plan`
3. `qa basis`
4. `implementation`
5. `verification`
6. `delivery`

当前围绕 `Web MVP` 公开首发与小程序渐进并入，默认入口是：

- [2026-04-14-mvp-公开首发收口与小程序渐进并入实施计划.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-14-mvp-公开首发收口与小程序渐进并入实施计划.md)
- [2026-04-15-miniapp-batch-e-真实微信宿主与独立购买收束实施计划.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-15-miniapp-batch-e-真实微信宿主与独立购买收束实施计划.md)
- [2026-04-13-miniapp-gray-checklist.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-13-miniapp-gray-checklist.md)
- [2026-04-14-mvp-公开首发收口与小程序渐进并入验证基线.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-14-mvp-公开首发收口与小程序渐进并入验证基线.md)
- [2026-04-14-mvp-公开首发收口与小程序渐进并入交付记录.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-14-mvp-公开首发收口与小程序渐进并入交付记录.md)
- [2026-04-15-miniapp-batch-e-真实微信宿主与独立购买收束交付记录.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/delivery/2026-04-15-miniapp-batch-e-真实微信宿主与独立购买收束交付记录.md)

### 1.1 当前正式状态

截至 `2026-04-12`，当前项目状态应理解为：

- `projects/aimandala` 已是唯一开发与发布主入口
- 新生成 Lite / Pro 已按正式主链在新工作区收口
- 历史 `interpretation` 继续兼容读取，不做全量回填
- 发布流固定为 `main -> dev`、`release -> prod`
- 公网业务链路已恢复可运行，可继续只在新工作区做后续开发
- 生产环境 LLM 已切到真实 `openai_compatible` provider
- 上传对象访问已切到 `COS` 私有读 + 签名 URL 主链

这不等于“所有内容质量都已经终局”，但意味着默认开发、发布、联调和文档入口都已经稳定。

更准确的口径是：

- 正式版主链收口完成
- 后续继续在新工作区做质量迭代
- 历史记录继续兼容读取，但不作为后续功能设计基线

截至 `2026-04-15`，应再补充理解为：

- `main` 已吸收 batch E 的 `live-ready` 主线实现与 runbook
- `main` 已吸收 `miniapp-native` 原生灰度壳、灰度配置样例和对应文档链
- miniapp live 相关能力默认灰度关闭，不构成当前 Web 公开首发阻塞项
- 当前 Aimandala 只保留 `codex/aimandala-dual-channel-ui` 作为并行开发 worktree

### 1.2 历史资料位置

如需追溯历史行为、旧实现细节或阶段性收口过程，可查：

- 历史仓库：[/Users/xinran/Downloads/dev/ai-mandala](/Users/xinran/Downloads/dev/ai-mandala)
- 项目历史资料：[/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs)
- 公司侧历史草案：[/Users/xinran/Downloads/dev/mindsync/company/projects/一镜一梳/AI-Mandala-迁移范围与工作区草案.md](/Users/xinran/Downloads/dev/mindsync/company/projects/一镜一梳/AI-Mandala-迁移范围与工作区草案.md)

这些材料仅作历史追溯，不再作为默认开发入口。

## 2. 固定必读

任何 Agent 第一次进入 `一镜一梳` 项目工作区时，默认优先读取以下材料：

1. [本项目 PROJECT.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/PROJECT.md)
2. [公司侧项目入口](/Users/xinran/Downloads/dev/mindsync/company/projects/一镜一梳/PROJECT.md)
3. [2026-04-04-toc-mvp-spec.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-04-toc-mvp-spec.md)
4. [2026-04-04-toc-mvp-architecture.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-04-toc-mvp-architecture.md)
5. [docs/architecture/README.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/architecture/README.md)
6. [docs/runbooks/README.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/runbooks/README.md)
7. [docs/runbooks/本地联调手册.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/runbooks/本地联调手册.md)
8. [2026-04-10-服务器部署与运维手册.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-10-服务器部署与运维手册.md)
9. [2026-04-12-ci-cd-实施计划.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-12-ci-cd-实施计划.md)
10. [2026-04-12-ci-cd-验证记录.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-12-ci-cd-验证记录.md)
11. [2026-04-13-paperclip-automation-节点实施计划.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-13-paperclip-automation-节点实施计划.md)
12. [2026-04-13-paperclip-automation-节点验证记录.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-13-paperclip-automation-节点验证记录.md)
13. [2026-04-12-v22-knowledge-workbench-execution-plan.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-12-v22-knowledge-workbench-execution-plan.md)
14. [2026-04-12-v22-knowledge-workbench-verification.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-12-v22-knowledge-workbench-verification.md)
15. [2026-04-14-mvp-公开首发收口与小程序渐进并入实施计划.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-14-mvp-公开首发收口与小程序渐进并入实施计划.md)
16. [2026-04-14-mvp-公开首发收口与小程序渐进并入验证基线.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-14-mvp-公开首发收口与小程序渐进并入验证基线.md)

## 2.1 双端并行约束

当前默认约束是：

- `main` 继续承接 Web MVP 首发和生产稳定
- 小程序 worktree 可继续并行开发
- 小程序相关改动默认采用“分批摘入 main”，不整支直接合并
- 主工作区上的新改动，除非明确是 Web 宿主专属，否则应尽量保持 shared-friendly
- 批次 E 的 miniapp live 能力允许并入 `main`，但必须默认灰度关闭
- 后续继续摘入 miniapp 内容时，默认只从 `codex/aimandala-dual-channel-ui` 这条并行线继续

## 3. 当前正式范围

当前默认只承接：

1. To C 主产品
2. 支撑 To C 主产品所必需的 `V2` 生产级能力
3. 对应的项目文档、最小实现和测试入口

当前默认不承接：

1. To B 产品
2. Studio 相关产品
3. `V3` 实验级 API
4. 内部工具

## 4. 推荐目录方向

当前不建议按历史仓库结构直接平移。

推荐逐步收束为：

- `docs/`
  - 正式 spec、architecture、runbooks、tasks、qa、decisions、delivery
- `toC/`
  - To C 主产品实现主线
  - 当前用户端以前手机端 Web 为主，后续应兼容小程序和 App 版扩展
  - 用户端前端应采用“共享内核 + 渠道实现”的结构
- `fixtures/`
  - 测试样本和模拟输入
- `notes/`
  - 临时笔记

后续如需扩展 To B、Studio 或其他能力，应在新的边界定义明确后再决定是否增设新目录。
