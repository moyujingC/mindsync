# 一镜一梳项目工作区

> 状态：draft
> 版本：0.2.0
> owner：CEO / Orchestrator
> last_updated：2026-04-04
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/PROJECT.md
> 公司侧入口：[/Users/xinran/Downloads/dev/mindsync/company/projects/一镜一梳/PROJECT.md](/Users/xinran/Downloads/dev/mindsync/company/projects/一镜一梳/PROJECT.md)
> 历史来源仓库：[/Users/xinran/Downloads/dev/ai-mandala](/Users/xinran/Downloads/dev/ai-mandala)

这是 `一镜一梳` 在 Monorepo 中的项目工作区入口。

当前阶段先建立稳定目录锚点，后续在这里逐步承接：

- 项目实现代码
- 项目专属需求与设计文档
- 测试与脚本
- 项目运行说明

## 1. 当前工作方式

当前把 `AI-Mandala` 迁入 `mindsync`，是为了恢复受治理的直接开发，而不是立即切到 Paperclip 面板流程。

因此当前默认工作方式是：

- 在 `projects/aimandala/` 中建立正式项目工作区
- 使用 Codex / Claude Code 直接开发
- 暂缓把 `AI-Mandala` 作为 Paperclip 面板开发试点

## 2. 固定必读

任何 Agent 第一次进入 `一镜一梳` 项目工作区时，默认优先读取以下材料：

1. [本项目 PROJECT.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/PROJECT.md)
2. [公司侧项目入口](/Users/xinran/Downloads/dev/mindsync/company/projects/一镜一梳/PROJECT.md)
3. [AI-Mandala-迁移范围与工作区草案.md](/Users/xinran/Downloads/dev/mindsync/company/projects/一镜一梳/AI-Mandala-迁移范围与工作区草案.md)
4. [2026-04-04-首批迁移清单.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/tasks/2026-04-04-首批迁移清单.md)
5. [2026-04-04-toc-mvp-spec.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-04-toc-mvp-spec.md)
6. [2026-04-04-toc-mvp-architecture.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/2026-04-04-toc-mvp-architecture.md)
7. [2026-04-04-toc-mvp-qa-checklist.md](/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/qa/2026-04-04-toc-mvp-qa-checklist.md)

## 3. 当前迁移范围

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
