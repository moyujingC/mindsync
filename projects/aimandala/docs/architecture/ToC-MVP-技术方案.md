# 一镜一梳 To C MVP 技术方案

> 状态：current
> 版本：0.1.1
> owner：Architect
> last_updated：2026-04-07
> source_of_truth：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/architecture/ToC-MVP-技术方案.md
> 项目：aimandala
> 阶段：architecture
> depends_on：/Users/xinran/Downloads/dev/mindsync/projects/aimandala/docs/specs/ToC-MVP-产品规范.md
> reviewers：CEO / Orchestrator, Engineer, Test / QA

## 1. 目标

为 `AI-Mandala / 一镜一梳` 当前 To C MVP 提供一个足够清晰、可迁移、可继续演进的最小技术结构。

这份技术方案重点回答三件事：

1. `V2` 生产主线在 `mindsync` 中如何收束。
2. To C 前后端在新工作区里的边界如何定义。
3. 多渠道前端如何共享业务逻辑而不共享整套 UI。

## 2. MVP 结构边界

当前 To C MVP 只需要支持：

1. 用户上传图片并提交必要描述
2. 三圈检测与确认
3. `一镜 Lite 版` 生成
4. `一梳 Pro 版` 生成
5. 报告读取与历史查看

本轮仍不包含：

- To B / Studio 工作台
- `V3` 实验线
- 内部知识库工具
- 完整部署收口与云端运维体系

## 3. 总体模块划分

当前建议把 To C 主线拆成三层：

1. `toC/app/backend/`
   - `V2` API 与服务主线
2. `toC/app/frontend/`
   - 用户端前端入口
3. `toC/domain/`
   - 随迁移逐步沉淀的项目级领域边界说明

其中前端进一步区分为：

1. `frontend/shared/`
   - 共享前端内核
2. `frontend/mobile-web/`
   - 当前唯一正式用户端入口
3. `frontend/miniapp/`
   - 未来渠道
4. `frontend/native-app/`
   - 未来渠道

## 4. 后端主链路

当前后端继续以 `V2` 为正式主线。

推荐的内部主链路如下：

1. `upload`
   - 接收图片、主题和用户描述
2. `detect`
   - 执行三圈检测，生成几何建议
3. `lite pipeline`
   - 生成 Layer 0、Layer 1、Layer 2
4. `pro generation`
   - 在当前应用流程中承接进入 `一梳 Pro 版` 后的较重解读生成
5. `report retrieval`
   - 返回 `一镜 Lite 版` / `一梳 Pro 版` 报告与历史记录

## 5. 数据模型边界

当前 To C MVP 继续沿用旧主线中最重要的五层数据模型：

1. `Layer 0`
   - 原始分析数据
   - 颜色分布
   - 三圈结构
   - 失衡候选
2. `Layer 1`
   - `一镜 Lite 版` 草稿
3. `Layer 2`
   - `一镜 Lite 版` 终稿
4. `Layer 3`
   - `一梳 Pro 版` 增量内容
5. `Layer 4`
   - `一梳 Pro 版` 终稿

这套分层仍有价值，因为它直接支撑：

- 两种解读层级之间的数据复用
- 历史记录保存
- 报告一致性验证
- 后续 QA 分层定位问题

## 6. API 边界

当前正式 API 以 `V2` 为准，To C 主路径优先依赖：

1. `POST /api/v2/interpretations`
2. `POST /api/v2/interpretations/{interpretation_id}/upgrade`
3. `GET /api/v2/interpretations/{interpretation_id}/report`
4. `GET /api/v2/users/{user_id}/interpretations`

辅助能力：

1. `POST /api/v2/detect-circles`
2. `GET /api/v2/pricing`

当前价格口径：

1. `一镜 Lite 版`：`9.9`
2. `一梳 Pro 版`：`39`
3. 优惠不通过动态改价处理，优先走优惠券 / 兑换码

当前明确不纳入：

1. `routes_v3`
2. `knowledge_v3`
3. To B 专用的 `therapist-notes` 作为首批主路径依赖

## 7. 前端架构

前端当前不应被设计成“一个 mobile-web 项目”，而应被设计成：

- 一个共享前端内核
- 多个用户端渠道实现

### 7.1 共享层

建议共享的只有三类内容：

1. `shared/core`
   - 流程状态机
   - 业务状态
   - 纯函数领域逻辑
2. `shared/api`
   - API service
   - 请求适配
   - 错误翻译
3. `shared/types`
   - 类型定义
   - DTO 镜像
   - 流程状态类型

### 7.2 渠道层

渠道层只负责：

1. 页面组件
2. 路由
3. 平台 API
4. 上传、支付、登录等平台适配

当前渠道优先级：

1. `mobile-web`
2. `miniapp`
3. `native-app`

## 8. 当前迁移建议

首批迁移时，建议按下面方式理解旧仓库落点：

### 8.1 后端

优先承接：

1. `app/api/main.py`
2. `app/api/routes_v2.py`
3. `app/api/dependencies.py`
4. `app/api/middleware.py`
5. `app/api/rate_limiter.py`
6. `app/core/pipeline/`
7. `app/core/analysis/`
8. `app/core/knowledge/`
9. `app/core/healing/`
10. `app/core/prompt/builder_v2.py`
11. `app/core/safety/protocol.py`
12. `app/infrastructure/repositories/`

这些内容迁入后，应优先挂在 `toC/app/backend/` 语义下，而不是继续维持旧仓库的混合布局。

### 8.2 前端

旧仓库当前用户端前端主要在 `app/ui/`。

但其中既包含：

- 当前仍可复用的共享内核
- 当前 mobile-web 入口
- 历史设计壳、兼容代码和杂项说明

因此迁移策略不应是整目录直接复制，而应先拆成：

1. 哪些属于 `shared/core + api + types`
2. 哪些属于 `mobile-web`
3. 哪些属于暂不迁或应废弃的历史壳

## 9. 目录建议

当前建议的 To C 结构如下：

```text
projects/aimandala/toC/
  app/
    backend/
    frontend/
      shared/
        core/
        api/
        types/
      mobile-web/
      miniapp/
      native-app/
  domain/
  tests/
  data/
```

当前阶段不要求一次建完全部空目录，但后续迁移时应按这套语义落位。

## 10. 阶段门

进入首批代码迁移前，至少要满足：

1. To C MVP spec 已存在
2. 当前迁移清单已确认
3. `toC/app/backend` 与 `toC/app/frontend` 边界已明确
4. 前端共享层与渠道层边界已明确

进入正式实现前，至少要满足：

1. 至少迁入一条完整的 `V2` 主链路
2. 至少有一份 QA 清单
3. 至少有一份可重复验证的样本路径

## 11. 风险点

1. 旧仓库前端里共享逻辑和渠道逻辑仍有混写。
2. 如果直接复制 `app/ui`，会把设计壳和正式逻辑一起带进来。
3. 如果共享层边界不严格，小程序和 App 后续仍会复制 mobile-web 逻辑。
4. 如果把 `V3` 或 To B 的能力一起迁入，会重新污染当前主线。

## 12. 当前建议

下一步优先做：

1. 为 To C 主路径补一份 QA 清单。
2. 开始第一批代码迁移时，优先从 `V2` 后端主链路入手。
3. 前端迁移时，优先先抽共享层，再承接 `mobile-web`。
4. 如果未来要改“先上传再选版本 / 先选版本再上传”，需要作为新一轮产品决策单独确认。
