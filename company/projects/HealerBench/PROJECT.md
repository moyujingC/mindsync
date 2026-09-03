# HealerBench 疗愈师 AI 工作台项目入口

> 状态：draft
> 版本：0.1.0
> owner：CEO / Orchestrator
> last_updated：2026-09-03
> source_of_truth：company/projects/HealerBench/PROJECT.md
> 对应项目工作区：[projects/healerbench](../../../projects/healerbench)

这份文档是 `HealerBench 疗愈师 AI 工作台` 的公司侧项目入口。

## 1. 项目定位

`HealerBench` 是面向身心灵疗愈从业者的 AI 工作台。

系统由两部分组成：

- 知识库底座（RAG，Retrieval-Augmented Generation，检索增强生成）：疗愈理论知识（曼陀罗、数字能量、灵性传讯等）、个案方法论（初访流程、解读框架、督导要点）、脱敏案例库
- 四个工作流应用：
  1. AI 客服助手：自动回复常见咨询、预约引导
  2. 初访 AI 助手：自动收集来访者信息、生成初访单
  3. 个案前 AI 准备：基于历史案例推荐解读方向
  4. 个案后 AI 督导：自动生成复盘报告、督导建议

项目同时承担一个公司级目的：作为 FDE（Forward Deployed Engineer，驻场交付工程师）能力的核心验证项目，沉淀「知识密集型服务业 AI 落地方法论」，后续可复制到心理咨询、营养顾问、职业教练等场景。

## 2. 公司侧边界

这里长期保留：

- 项目定位与阶段规划
- 与 ai-service-studio、aimandala、healing-courses、research-center 的边界
- 对外表达口径（作品集叙事、案例包装）

这里不承担：

- 知识库具体文档的逐条维护
- 工作流的具体技术实现与代码
- 简历成稿（归 `xinran-jobhunt`）

## 3. 与既有项目的关系

### 3.1 与 ai-service-studio

`ai-service-studio` 是企业 FDE 高客单服务 + 个人 AI 工作系统服务的收入验证项目。

`HealerBench` 是其中的能力验证样板：

- 它验证 FDE 的完整能力链：客户需求挖掘 → 端到端交付 → 量化业务价值
- 方法论沉淀回流 `ai-service-studio`，作为个人线服务的方法论资产
- 它不直接承接客户交付，收入验证仍归 `ai-service-studio`

### 3.2 与一镜一梳

`一镜一梳` 的疗愈体系知识库是 `HealerBench` RAG 底座的主要素材来源。

两者需要区分：

- `一镜一梳` 面向 C 端用户，交付曼陀罗解读报告
- `HealerBench` 面向疗愈师从业者，交付工作流工具

### 3.3 与疗愈课程体系

`疗愈课程体系` 面向普通用户卖课程；`HealerBench` 面向从业者卖工具与服务。两者共享行业 know-how，但交付对象和形态不混。

### 3.4 与研究中心

`HealerBench` 落地过程中产生的方法论、评估结论、用户反馈，作为研究输入回流 `research-center`，沉淀为「知识密集型服务业 AI 落地方法论」。

### 3.5 与馨冉求职

简历素材（场景识别、技术方案、量化数据、试用反馈）由本项目输出，`xinran-jobhunt` 负责成稿与投递口径。

## 4. 当前阶段

当前阶段为 `spec`。

第一阶段目标（知识库底座 + 一个工作流 MVP）：

1. 确定 RAG 知识库范围与来源（复用 aimandala 知识库 + 补充个案方法论）
2. 选定首个工作流：个案后 AI 督导复盘（决策者本人就是疗愈师，痛点最直接）
3. 跑通 MVP 并建立 Harness 验收体系

后续阶段见项目工作区内的 SPEC。

## 5. 当前工作区入口

- [projects/healerbench/PROJECT.md](../../../projects/healerbench/PROJECT.md)
