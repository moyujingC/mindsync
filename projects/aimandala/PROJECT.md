# 一镜一梳项目工作区

> 状态：current
> 版本：0.4.1
> owner：CEO / Orchestrator
> last_updated：2026-04-13
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
5. [2026-04-10-服务器部署与运维手册.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-10-服务器部署与运维手册.md)
6. [2026-04-12-ci-cd-实施计划.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-12-ci-cd-实施计划.md)
7. [2026-04-12-ci-cd-验证记录.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-12-ci-cd-验证记录.md)
8. [2026-04-13-paperclip-automation-节点实施计划.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-13-paperclip-automation-节点实施计划.md)
9. [2026-04-13-paperclip-automation-节点验证记录.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-13-paperclip-automation-节点验证记录.md)
10. [2026-04-12-v22-knowledge-workbench-execution-plan.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-12-v22-knowledge-workbench-execution-plan.md)
11. [2026-04-12-v22-knowledge-workbench-verification.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-12-v22-knowledge-workbench-verification.md)

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
  - 正式 spec、tasks、qa、decisions、delivery
- `toC/`
  - To C 主产品实现主线
  - 当前用户端以前手机端 Web 为主，后续应兼容小程序和 App 版扩展
  - 用户端前端应采用“共享内核 + 渠道实现”的结构
- `fixtures/`
  - 测试样本和模拟输入
- `notes/`
  - 临时笔记

后续如需扩展 To B、Studio 或其他能力，应在新的边界定义明确后再决定是否增设新目录。
