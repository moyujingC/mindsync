# Frontend

这里放 `一镜一梳` To C 主产品的用户端前端入口。

当前已知事实：

- 当前主入口是手机端 Web 版
- 后续预计还会有小程序版
- 如果用户规模继续增长，未来可能再做原生 App 版

首批迁移时优先承接：

- 旧仓库 `app/ui` 中真正仍在使用的移动端 Web 入口
- 运行依赖说明
- 必要的构建与验证脚本

当前不放：

- To B / Studio 前端
- 纯设计稿导出的无效壳项目
- 与 `V3` 实验线强绑定的前端逻辑

建议后续按渠道逐步收束，例如：

```text
frontend/
  shared/
    core/
    api/
    types/
  mobile-web/
  miniapp/
  native-app/
```

其中各层默认职责如下：

- `shared/core/`
  - 多渠道共享的前端业务逻辑、状态机和纯函数流程
- `shared/api/`
  - 多渠道共享的 API service、请求封装和错误翻译
- `shared/types/`
  - 多渠道共享的类型定义和 DTO 镜像
- `mobile-web/`
  - 手机端 Web 版实现
- `miniapp/`
  - 小程序端实现
- `native-app/`
  - 原生 App 端实现

默认原则是：

- 共享“业务决策和流程语义”
- 不强行共享“页面组件和平台能力”

当前阶段不必提前把空目录都建出来，但目录设计与文档命名应默认兼容这种扩展方式。

## 当前前端迁移基线

当前已经开始按“共享内核 + 渠道实现”方向建立最小骨架，优先承接：

- `shared/types/`
  - 对齐当前 To C `V2` 后端接口的 DTO
- `shared/api/`
  - 多渠道可复用的请求封装和 service
- `shared/core/`
  - 不依赖平台能力的流程状态定义与纯函数

当前这一步的目标不是直接恢复 mobile-web UI，而是先把“接口契约”和“共享语义层”立住。

## 当前共享层重点

当前共享层优先围绕这些后端接口建立：

- `POST /api/v2/detect-circles`
- `POST /api/v2/interpretations`
- `GET /api/v2/interpretations/{interpretation_id}`
- `GET /api/v2/interpretations/{interpretation_id}/status`
- `GET /api/v2/interpretations/{interpretation_id}/report`
- `POST /api/v2/interpretations/{interpretation_id}/upgrade`
- `GET /api/v2/users/{user_id}/interpretations`
- `GET /api/v2/pricing`

当前明确不在这一批里做：

- React 页面
- mobile-web 路由
- 小程序适配
- 原生 App 适配
- 文件上传 UI / 支付 UI / 登录 UI

## 当前工程化落点

当前已经补上最小工作区配置：

- `package.json`
- `tsconfig.json`
- `mobile-web/main.tsx`

这意味着现在 `frontend/` 已经是一个明确的 TypeScript 前端工作区入口，而不只是文档目录。

当前脚本：

- `npm run typecheck`
- `npm run check:shared`

当前还没有锁定具体运行壳，所以：

- 没有直接绑定 Vite
- 没有直接绑定 Next
- 没有直接绑定某个 UI 框架脚手架

后续只需要在这个基础上补具体运行壳，而不用重新整理共享层目录。

## 下一步建议

前端后续建议顺序：

1. 先让 `mobile-web` 接共享 `api + types + core`
2. 再补最小上传页 / 结果页 / 历史页
3. 后续如需接小程序或 App，优先复用共享层，不复制业务决策
