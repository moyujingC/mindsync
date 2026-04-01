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
requirements:
  secrets:
    - OPENAI_API_KEY
---

# 墨予镜

`墨予镜` 是一个以中文协作为核心的混合型 AI 公司内核。

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

本仓库既是公司包，也是工作空间：

- `agents/` 保存角色定义
- `company/` 保存公司级原则与映射文档
- `shared/` 保存共享工具
- `.paperclip.yaml` 保存 Paperclip 运行时侧边配置

导入到 Paperclip 后，`COMPANY.md` 作为公司入口，`agents/*/AGENTS.md` 作为组织核心角色定义。
