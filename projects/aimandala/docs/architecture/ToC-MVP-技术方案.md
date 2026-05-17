# 一镜一梳 To C MVP 技术方案

> 状态：current
> 版本：0.2.0
> owner：Architect
> last_updated：2026-05-17
> source_of_truth：projects/aimandala/docs/architecture/ToC-MVP-技术方案.md
> 项目：aimandala
> 阶段：architecture
> depends_on：projects/aimandala/docs/specs/ToC-MVP-产品规范.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 目标

这份方案用于描述 `一镜一梳` 当前 To C MVP 的正式技术边界。

它重点回答三件事：

1. 当前 To C 主代码在 `projects/aimandala/toC/` 里怎么组织。
2. 现有主链和新报告链如何并存，而不互相污染。
3. 多端前端如何共享业务内核，但保持各自宿主壳。

## 2. 当前范围

当前 To C MVP 仍围绕这几条用户主路径组织：

1. 用户上传图片并填写必要输入
2. 三圈识别与必要的人工确认
3. Lite 报告生成与查看
4. Pro 报告生成与查看
5. 历史记录查看

当前默认不承接：

1. To B / Studio 工作台
2. `V3` 实验 API
3. 内部知识库工具台
4. 报告追问能力的正式产品化接入

## 3. 当前目录与子系统边界

当前 To C 正式代码目录是：

```text
projects/aimandala/toC/
```

当前主要分成三层：

1. `toC/app/backend/`
   - FastAPI（后端 Web 框架）接口与后端运行时
2. `toC/app/frontend/`
   - 多端前端实现与共享前端内核

配套数据与测试目录：

1. `toC/data/`
   - 当前知识包构建产物、candidate（候选版）与 build（构建结果）
2. `toC/tests/`
   - 项目级测试说明入口

## 4. 后端当前结构

后端当前不是一条“纯新链”或“纯旧链”，而是并存结构。

当前主要模块包括：

1. `app/api/`
   - 当前 API 入口
2. `app/core/analysis/`
   - 三圈识别与分析能力
3. `app/core/llm/`
   - 大模型运行时（LLM runtime，大语言模型运行层）
4. `app/core/wealth_report/`
   - 当前仍在使用的既有报告主链能力
5. `app/core/mandala_interpretation_agent/`
   - 新的曼陀罗解读智能体离线原型
6. `app/core/uploads/`
   - 上传存储相关能力
7. `app/core/safety/`
   - 安全协议与保护规则

当前正式理解应是：

- `wealth_report` 代表现有 API 主链仍依赖的报告实现
- `mandala_interpretation_agent` 代表正在重建的新报告链
- 两者暂时并存，新链先通过 fixture runner（样例运行器）和离线验证推进

## 5. 报告生成链当前边界

当前报告生成相关能力分成两层：

### 5.1 现有产品主链

- 仍在当前 API 与部分测试中承担默认行为
- 代码入口主要仍在 `wealth_report` 和现有 API 路由

### 5.2 新报告重建链

- 代码入口在 `app/core/mandala_interpretation_agent/`
- 当前已落地：
  - 输入 / 输出合同
  - 知识包构建器
  - 16 个 `stage-*` 输出
  - 5 个 execution block（执行块）trace
  - `Report Context Package`（报告上下文包）
  - 质量门
  - fixture runner
- 当前未完成：
  - API 旁路 feature flag（功能开关）接入
  - 线上默认替换
  - 报告追问能力

这部分详细架构看：

- [解读智能层-曼陀罗解读智能体架构.md](./解读智能层-曼陀罗解读智能体架构.md)

## 6. 前端当前结构

前端当前已经按“共享内核 + 多宿主壳”组织，而不是单一 mobile-web 项目。

当前目录包括：

1. `frontend/shared/`
   - 共享业务内核、API、类型、设计 token（设计变量）和共享 UI
2. `frontend/mobile-web/`
   - 当前默认正式 Web 用户端
3. `frontend/miniapp/`
   - 小程序跨端运行时与页面壳
4. `frontend/miniapp-native/`
   - 原生微信小程序宿主壳
5. `frontend/native-app/`
   - 预留原生 App 宿主入口

共享层当前实际已存在：

1. `shared/core/`
   - 流程状态、报告结构、主题和展示逻辑
2. `shared/api/`
   - 请求配置、HTTP client（HTTP 客户端）和服务层
3. `shared/types/`
   - 类型与 API 合同镜像
4. `shared/ui/`
   - 跨端可复用页面部件
5. `shared/design-system/`
   - 设计 token 和设计系统导出

## 7. 知识包与方法真值源边界

当前知识源不再按“完整 Markdown 直接塞给模型”来组织。

当前边界是：

1. 方法真值源在 `docs/sources/知识库构建/`
2. 运行时知识包在 `toC/data/knowledge/packs/`
3. build 产物在 `toC/data/knowledge/builds/`

这意味着：

- `sources/` 负责“方法和知识原文”
- `packs/` 负责“运行时可消费的压缩知识包”
- `mandala_interpretation_agent` 和其他运行时只消费压缩后的结构化知识，不直接把全部 Markdown 当 prompt（提示词）正文

## 8. API 当前口径

当前正式 API 仍以现有 `app/api/routes.py` 为入口，不应在架构文档里写成已经完成 `v2/v3` 重切。

当前更准确的理解是：

1. API 主链仍服务现有 To C MVP 上传、识别、报告和历史流程
2. `mandala_interpretation_agent` 先以离线脚本和 QA 样本方式验证
3. 等 API 旁路 feature flag 接入完成后，再让新链进入后端正式运行时

## 9. 当前演进方向

当前 To C MVP 的主要演进方向有三条：

1. 报告生成从 legacy chain（旧链）渐进切到 `mandala_interpretation_agent`
2. 前端继续保持 shared-friendly（对共享层友好）的多宿主结构
3. 知识源继续从文档真值源压缩到 schema 化知识包，而不是回到手写 prompt 拼接时代

## 10. 当前最重要的判断口径

如果你现在要判断某个改动放哪里，可以先按下面规则：

1. 用户端页面、路由、样式、跨端 UI
   - 看 `frontend/`
2. 当前 API、上传、识别、现有报告主链
   - 看 `backend/app/api`、`analysis`、`wealth_report`
3. 新报告生成链与中间交付物
   - 看 `backend/app/core/mandala_interpretation_agent`
4. 方法真值源、知识原文和主题资料
   - 看 `docs/sources/知识库构建/`
5. 运行时知识包和 build
   - 看 `toC/data/knowledge/`
