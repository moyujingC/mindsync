# Frontend

这里放 `一镜一梳` To C 主产品的用户端前端入口。

当前已知事实：

- 当前主入口是手机端 Web 版
- 后续预计还会有小程序版
- 如果用户规模继续增长，未来可能再做原生 App 版

当前优先承接：

- 当前仍在使用的移动端 Web 入口
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
    design-system/
    ui/
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
- `shared/design-system/`
  - 多渠道共享的设计令牌、视觉语义和主题基线
- `shared/ui/`
  - 尽早开始共享的展示 UI 主体
- `mobile-web/`
  - 手机端 Web 版实现
- `miniapp/`
  - 小程序端后续实现入口
- `native-app/`
  - 原生 App 端实现

默认原则是：

- 共享“业务决策和流程语义”
- 尽早共享“展示主体与高复用 UI”
- 不强行共享“平台能力”

当前阶段不必提前把空目录都建出来，但目录设计与文档命名应默认兼容这种扩展方式。

## 当前前端基线

当前已经开始按“共享内核 + 渠道实现”方向建立最小骨架，优先承接：

- `shared/types/`
  - 对齐当前 To C `V2` 后端接口的 DTO
- `shared/api/`
  - 多渠道可复用的请求封装和 service
- `shared/core/`
  - 不依赖平台能力的流程状态定义与纯函数
- `shared/design-system/`
  - 共享设计令牌与视觉基线
- `shared/ui/`
  - 报告页、历史页、上传页等可复用展示主体
- `mobile-web/`
  - 当前主入口的页面层骨架、路由装配和运行时层
- `miniapp/`
  - 未来小程序渠道入口，当前不作为 Web 上线阻塞项
- `native-app/`
  - 原生 App 端正式占位入口

当前这一步的目标不是直接复刻任何历史 UI，而是先把：

- 接口契约
- 共享语义层
- 共享设计系统
- 第一批共享展示 UI

立住。

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

- 上传、登录、支付、分享等平台强依赖能力的共享化
- 小程序原生宿主与支付 live 运行时
- 任何会提高当前 Web 主线部署复杂度的渠道配置

## 当前渠道落位

现在三个渠道都已经有正式落点：

- `mobile-web/`
  - 当前正式主入口，已开始消费 `shared/core + shared/ui`
- `miniapp/`
  - 继续保留为未来渠道入口，不进入这次 Web 上线主线
- `native-app/`
  - 已有目录入口与说明

这意味着后续扩展渠道时，不需要再重新决定目录语义，只需要沿着共享层继续往下接。

## 当前工程化落点

当前已经补上最小工作区配置：

- `package.json`
- `tsconfig.json`
- `mobile-web/main.tsx`
- `index.html`
- `vite.config.ts`
- `mobile-web/browser-entry.tsx`
- `shared/design-system/*`
- `shared/ui/*`

这意味着现在 `frontend/` 已经是一个明确的 TypeScript 前端工作区入口，而不只是文档目录。

当前脚本：

- `npm run typecheck`
- `npm run check:shared`
- `npm run check:shared-ui`
- `npm run dev:mobile-web`
- `npm run build:mobile-web`
- `npm run preview:mobile-web`

当前已经先锁定一个最小运行壳：

- `mobile-web` 先用 `Vite` 承接浏览器运行时
- 这只是开发壳，不代表未来渠道必须被同一个宿主框架锁死
- `main.tsx` 仍然保留为宿主无关示例入口

这样后续继续长真实页面时，可以直接在当前壳上推进，而不用重新整理共享层目录。

## 下一步建议

前端后续建议顺序：

1. 继续在 `shared/*` 上修 Web 上线前发现的共性 bug
2. 让 Web 主线先进入测试、修 bug、准备上线
3. Web 上线后，再把 miniapp 宿主、支付与灰度链按独立 worktree 继续推进
