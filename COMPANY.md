---
schema: agentcompanies/v1
kind: company
slug: mindsync
name: 墨予镜
description: 以墨予思，以镜观己
version: 0.1.0
goals:
  - 通过多角色 AI 协作推进产品、研究、内容与工程交付
  - 建立中文优先、文档优先、可持续演进的公司内核
---

# 墨予镜

`墨予镜` 是一个混合型 AI 公司内核。

这个公司包聚焦于一套最小但完整的组织操作系统：

- 清晰的角色分工
- 以 artifact 为中心的 handoff
- 产品、研究、内容、工程、测试之间的协同路径
- 文档即系统的治理方式

## 组织原则

- 中文优先
- Docs As System
- SDD
- TDD
- Harness Engineering

## 当前组织范围

当前公司至少覆盖以下职能：

- CEO / Orchestrator
- Business Lead
- Product Spec Lead
- Research & Knowledge Lead
- Architect
- Engineer
- Test / QA
- Content Lead

## 仓库说明

本仓库既是公司包，也是 Monorepo 工作空间：

- `agents/` 保存角色定义
- `company/` 保存公司级原则与映射文档
- `projects/` 保存项目级实现入口与项目工作区
- `shared/` 保存共享工具
- `.paperclip.yaml` 保存 Paperclip 运行时侧边配置

对象主数据以 [company/项目注册表.yaml](/Users/xinran/Downloads/dev/mindsync/company/项目注册表.yaml) 为唯一权威清单。
其他文档只解释结构、治理与协作方式，不重复维护对象主数据。

导入到 Paperclip 后，`COMPANY.md` 作为公司入口，`agents/*/AGENTS.md` 作为组织核心角色定义。

## 公司级必读文档

进入 `墨予镜` 公司系统后，除 `COMPANY.md` 本身外，默认还应优先读取以下公司级文档：

1. [company/公司蓝图.md](/Users/xinran/Downloads/dev/mindsync/company/公司蓝图.md)
2. [company/项目注册表.yaml](/Users/xinran/Downloads/dev/mindsync/company/项目注册表.yaml)
3. [company/内容矩阵.md](/Users/xinran/Downloads/dev/mindsync/company/内容矩阵.md)
4. [company/研发原则.md](/Users/xinran/Downloads/dev/mindsync/company/研发原则.md)
5. [company/任务审阅与状态流转规范.md](/Users/xinran/Downloads/dev/mindsync/company/任务审阅与状态流转规范.md)
6. [company/Paperclip任务系统优化方案.md](/Users/xinran/Downloads/dev/mindsync/company/Paperclip任务系统优化方案.md)
7. [MONOREPO.md](/Users/xinran/Downloads/dev/mindsync/MONOREPO.md)
8. [DOCS_GOVERNANCE.md](/Users/xinran/Downloads/dev/mindsync/DOCS_GOVERNANCE.md)
9. [company/项目与仓库映射.md](/Users/xinran/Downloads/dev/mindsync/company/项目与仓库映射.md)

其中：

- `公司蓝图` 定义公司整体设计、组织模型与工作流边界
- `项目注册表` 定义公司对象清单、对象类型与入口路径，是唯一权威注册表
- `内容矩阵` 定义个人号、产品号与 build in public 的内容定位
- `研发原则` 定义公司共享的工程与交付约束
- `任务审阅与状态流转规范` 定义 `in_review`、父子任务和 `done` 的默认解释规则
- `Paperclip任务系统优化方案` 定义当前阶段对任务语义、巡检和面板首屏的系统优化方向
- `MONOREPO` 定义仓库分层、对象类型与目录归属原则
- `DOCS_GOVERNANCE` 定义正式文档的状态、元数据和 artifact 规则
- `项目与仓库映射` 解释注册表中的对象如何映射到当前 Monorepo 与历史仓库

## 信息分层

为避免混层，默认按下面方式理解：

- 公司级：
  - `COMPANY.md`
  - `company/公司蓝图.md`
  - `company/项目注册表.yaml`
  - `company/内容矩阵.md`
  - `company/研发原则.md`
  - `MONOREPO.md`
  - `DOCS_GOVERNANCE.md`
- 项目级：
  - `company/projects/<项目名>/PROJECT.md`
  - 该项目在 `company/projects/<项目名>/` 下的研究、纪要、任务定义、内容资产
  - `projects/<project-slug>/PROJECT.md` 和项目专属文档

默认不要把其他材料当成公司级固定必读；如果某份文档只服务某个项目，就应留在项目级入口下，而不是提升为公司级入口。

## Paperclip 本地运维边界

`shared/tools/` 下可以保留少量 Paperclip 本地运维脚本，例如环境变量装配、`local-cli` key 复用与旧 key 清理。

这些能力只用于排障、调试与低频运维，不是公司的日常协作主路径。默认主路径应是：

1. 在 Paperclip 中由 CEO 或相应负责人分派任务
2. 直接在 `mindsync` 工作区完成文档治理、项目治理与实现工作
3. 仅在需要排查本地身份、API 调试或运行时异常时，再使用本地运维脚本
