# Mobile Web

这里放 `一镜一梳` 当前手机端 Web 版的实现入口。

当前阶段这里还没有恢复页面层实现，但默认应按下面方式接共享层：

- 从 `../shared/types` 读取 DTO 和流程类型
- 从 `../shared/api` 调用当前 `V2` 后端接口
- 从 `../shared/core` 读取流程状态与纯函数

当前建议的接入顺序：

1. 上传页
   - 选择图片
   - 调用 `detect-circles`
2. 加载页
   - 调用 `createInterpretation`
   - 轮询 `status`
3. Lite 结果页
   - 调用 `report`
   - 渲染结构化 Lite 占位字段
4. 历史页
   - 调用用户历史列表
5. Upgrade 页
   - 当前只接兼容占位接口

当前不建议在这里直接复制旧仓库 `app/ui` 的整套结构，而是优先按共享层边界重组。

## 当前已提供的页面层骨架

当前这里已经补了一层不依赖具体框架的页面控制器：

- `controller.ts`
  - `bootstrapMobileWebFlow`
  - `runMobileWebLiteFlow`
  - `refreshMobileWebReport`
- `state.ts`
  - `MobileWebUploadDraft`
  - `toStartCreatePayload`
  - `getMobileWebPrimaryAction`
- `view-model.ts`
  - `createMobileWebPageViewModel`
- `examples/basic-flow-example.ts`
  - 最小接入示例
- `examples/*-page-shell.tsx`
  - 最小 React 风格页面壳示例
- `pages/`
  - 上传页、结果页、历史页的最小页面描述器

这意味着后续如果接 React 页面，可以直接：

1. 页面收集上传草稿
2. 转成 `StartCreatePayload`
3. 调 `runMobileWebLiteFlow`
4. 用返回的 `state` 和 `report` 渲染页面

这样页面层只负责 UI，不需要自己重新拼后端调用顺序。

## 当前推荐页面接线方式

建议页面层按下面的顺序接：

1. `bootstrapMobileWebFlow`
   - 初始化页面状态
2. `toStartCreatePayload`
   - 把上传表单草稿转成共享 payload
3. `runMobileWebLiteFlow`
   - 顺序完成检测、创建、状态、报告拉取
4. `getMobileWebPrimaryAction`
   - 决定当前主按钮文案
5. `createMobileWebPageViewModel`
   - 转成适合页面直接渲染的 title / subtitle / report 结构

如果需要更接近页面层的数据结构，还可以继续走：

6. `createUploadPageDescriptor`
7. `createReportPageDescriptor`
8. `createHistoryPageDescriptor`

这样真正的 React 组件只需要消费页面描述器，而不是自己从原始接口结果里抽字段。

## 最小页面壳说明

当前 `examples/` 里额外放了三种极简页面壳：

- `upload-page-shell.tsx`
- `report-page-shell.tsx`
- `history-page-shell.tsx`

它们不是正式 UI，只是为了说明：

- 页面如何消费 descriptor
- 页面如何尽量不直接依赖原始 API 返回
- 页面如何把业务决策留在共享层和 controller 中

## 当前正式入口骨架

除了示例文件，当前 `mobile-web/` 里也已经补了最小正式入口骨架：

- `routes.ts`
  - 当前 mobile-web 的最小路由定义
- `app-shell.tsx`
  - 最小应用壳
- `entry.tsx`
  - 把 controller、descriptor、view-model 串起来的入口示例

当前这些文件仍然是轻量骨架，不代表正式 UI 已完成，但已经足够作为后续 React 页面接入的落点。

## 当前页面壳落点

除了示例和入口文件，当前还补了可直接挂路由的页面壳：

- `page-shells/upload-page.tsx`
- `page-shells/report-page.tsx`
- `page-shells/history-page.tsx`

这些页面壳默认只做三件事：

- 从 descriptor / state 读取数据
- 交给 `MobileWebAppShell` 承载
- 保持页面层尽量薄，不重新实现业务流程

## 当前应用装配点

现在还补了一个 `app.tsx`：

- 根据 `route` 选择 upload / report / history 页面壳
- 作为后续真实路由框架接入前的最小宿主层

这样后面如果接 React Router 或其他路由层，优先把真实路由结果映射到 `MobileWebApp`，而不是在页面里重新分发业务状态。

## 当前页面 loader

现在还新增了一层 `loaders.ts`，把页面壳真正接到 controller 上：

- `loadUploadPage`
- `loadLiteReportPage`
- `loadExistingReportPage`
- `loadHistoryPage`

这样后续不管是 React Router、Next App Router，还是别的页面框架，都可以先把 loader 接进去，再把结果交给页面壳渲染。

## 当前路由装配器

现在还补了 `router-plan.ts`，用于把：

- route id
- route params
- loader
- app props

串成同一条装配链。

当前推荐的接线顺序是：

1. 路由层产出 `route + params`
2. `resolveMobileWebRouteProps`
3. 把返回结果交给 `MobileWebApp`

这样后续接真实框架时，路由层和页面层之间会更干净。

## 当前宿主适配入口

现在还补了 `host.tsx`：

- `renderMobileWebRoute`
  - 输入 `route + params`
  - 内部调用 `resolveMobileWebRouteProps`
  - 最终返回 `MobileWebApp`

这意味着外部宿主框架如果要接这套骨架，最小只需要调用一个入口函数。

## 当前运行时层

现在还补了 `runtime.tsx`：

- `useMobileWebRouteLoader`
  - 负责异步 route props 加载
- `MobileWebRuntime`
  - 负责 loading / error / app 渲染分发

这样如果后面接 React 宿主，可以直接先挂 `MobileWebRuntime`，不需要每个页面自己写一套异步加载状态管理。

## 当前浏览器开发壳

现在已经补上一个最小浏览器宿主层：

- `../index.html`
- `../vite.config.ts`
- `browser-entry.tsx`
- `browser-shell.tsx`
- `styles.css`

当前这个壳的目标很明确：

- 用 `Vite` 把 `MobileWebRuntime` 正式挂到浏览器里
- 提供一个简单控制面板，用来切换 `upload / loading / report / history / upgrade`
- 保持 `runtime -> router-plan -> app` 这条装配链不变

它不是正式 UI，也不是最终路由方案，但已经足够承担：

1. 本地跑通 mobile-web 骨架
2. 继续往上传页、结果页、历史页长真实组件
3. 在不改共享层边界的前提下继续接后端接口

当前本地启动方式：

1. 在 `frontend/` 目录安装依赖
2. 运行 `npm run dev:mobile-web`
3. 浏览器打开 `Vite` 提供的本地地址

当前开发壳还补了一层本地预览模式：

- 默认开启
- 不请求后端
- 可以直接切换 `upload / loading / report / history / upgrade`
- 用固定 fixture 支撑页面结构开发

当需要真实联调时，再关闭预览模式，切回 `MobileWebRuntime` 走当前 loader 与后端接口。
